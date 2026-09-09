#!/usr/bin/env python3
"""
Portfolio GitHub RAG pipeline — Step 3 v3: FREE LOCAL evidence-document embedding generation.

This script is intentionally ZERO-ARGUMENT and can be run from any working directory.
It discovers the enclosing `rag/` root from its own location:

    python rag/scripts/03-embeddings/nomic/generate-rag-embeddings-v3-documents-local.py

NO PAID API IS USED.
NO API KEY IS REQUIRED.
NO CREDENTIAL FILE IS READ.

The embedding model is downloaded from Hugging Face on the first run if it is
not already cached locally. The model is public and Apache-2.0 licensed. After
that download, embedding generation itself runs locally on this computer.

INPUT
-----
    rag-corpus/retrieval-documents-v2/documents.jsonl

The script embeds ONLY each Step 2 v2 retrieval document's `embedding_text` field, with the
model-required RAG document prefix added at embedding time:

    search_document: <embedding_text>

The original `embedding_text`, authoritative `text`, `source_fragments`, and every
Step 2 v2 metadata field are preserved unchanged in the output evidence records.

OUTPUT
------
    rag-corpus/embeddings-v2/embeddings.npy
    rag-corpus/embeddings-v2/embedding-records.jsonl
    rag-corpus/embeddings-v2/embedding-manifest.json
    rag-corpus/embeddings-v2/embedding-validation-report.txt

A resumable private checkpoint directory may exist while the step is running:

    rag-corpus/.embedding-v2-checkpoint/

It is removed only after final publication succeeds.

FIXED LOCAL EMBEDDING CONFIGURATION
-----------------------------------
Provider/runtime: local Sentence Transformers / PyTorch
Model:            nomic-ai/nomic-embed-text-v1.5
Pinned revision:  e9b6763023c676ca8431644204f50c2b100d9aab
Model license:    Apache-2.0
Native dimension: 768
Stored dimension: 512 (documented Matryoshka representation)
Max sequence:     8192 tokens
Document prefix:  search_document: 
Future query prefix: search_query: 
Similarity:       cosine (vectors are L2-normalized)
Stored dtype:     float32

The model/revision/dimension/prefix pair is fixed in source code. Do not change
one without rebuilding every vector and treating that as a new embedding-space
version.

REQUIRED PYTHON PACKAGES
------------------------
    numpy
    sentence-transformers
    torch

Install with:

    python -m pip install -U numpy sentence-transformers torch

NOTES FOR THE WEBSITE STAGE
---------------------------
The employer's query MUST later be embedded with the same model revision,
Matryoshka transformation, 512 dimensions, and `search_query: ` prefix before
comparison with this matrix.
"""

from __future__ import annotations

import hashlib
import importlib.metadata
import json
import math
import os
import re
import shutil
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Sequence


# ---------------------------------------------------------------------------
# Fixed pipeline paths and embedding-space identity
# ---------------------------------------------------------------------------

SCRIPT_NAME = Path(__file__).name
SCRIPT_DIR = Path(__file__).resolve().parent

def find_rag_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if candidate.name == "rag" and (candidate / "scripts").is_dir() and (candidate / "rag-corpus").is_dir():
            return candidate
    raise RuntimeError(
        "Could not locate the enclosing rag/ root. Expected this script to live under rag/scripts/."
    )

RAG_ROOT = find_rag_root(SCRIPT_DIR)
BASE_DIR = RAG_ROOT
RAG_DIR = RAG_ROOT / "rag-corpus"
INPUT_PATH = RAG_DIR / "retrieval-documents-v2" / "documents.jsonl"
OUTPUT_DIR = RAG_DIR / "embeddings-v2"
TEMP_OUTPUT_DIR = RAG_DIR / ".embeddings-v2.tmp"
CHECKPOINT_DIR = RAG_DIR / ".embedding-v2-checkpoint"

EMBEDDING_SCHEMA_VERSION = "3.0.0"
EXPECTED_DOCUMENT_SCHEMA_MAJOR = "2"

PROVIDER = "local-sentence-transformers"
EMBEDDING_MODEL = "nomic-ai/nomic-embed-text-v1.5"
# Pin the exact upstream revision so future rebuilds do not silently move to a
# changed model/configuration while keeping the same model name.
EMBEDDING_MODEL_REVISION = "e9b6763023c676ca8431644204f50c2b100d9aab"
MODEL_LICENSE = "Apache-2.0"
NATIVE_DIMENSIONS = 768
EMBEDDING_DIMENSIONS = 512
MAX_SEQUENCE_LENGTH = 8192
DOCUMENT_PREFIX = "search_document: "
QUERY_PREFIX = "search_query: "
DTYPE_NAME = "float32"
SIMILARITY = "cosine"

# A logical checkpoint batch is intentionally larger than the model's encode
# micro-batch. This keeps checkpoint count reasonable while bounding inference
# memory. If a device runs out of memory the micro-batch is reduced
# automatically down to 1 without changing vector order.
LOGICAL_BATCH_SIZE = 64
INITIAL_ENCODE_BATCH_SIZE = 8
MIN_SENTENCE_TRANSFORMERS_VERSION = (5, 3, 0)
MIN_TRANSFORMERS_VERSION = (5, 5, 0)

# Tolerance is only used to verify final L2 normalization. The vectors are
# generated with explicit normalization and should sit extremely close to 1.0.
UNIT_NORM_TOLERANCE = 1e-4

# Populated by load_dependencies() so dependency failures can be reported as a
# pipeline-stage failure rather than a traceback before the header prints.
np = None
torch = None
F = None
SentenceTransformer = None


class PipelineError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(BASE_DIR))
    except ValueError:
        return str(path)


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")))
            f.write("\n")
            count += 1
    return count


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8-sig") as f:
        for line_number, line in enumerate(f, start=1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as exc:
                raise PipelineError(
                    f"Invalid JSON on {rel(path)} line {line_number}: {exc}"
                ) from exc
            if not isinstance(value, dict):
                raise PipelineError(
                    f"Expected JSON object on {rel(path)} line {line_number}, "
                    f"got {type(value).__name__}."
                )
            rows.append(value)
    if not rows:
        raise PipelineError(f"Input file is empty: {rel(path)}")
    return rows


def package_version(name: str) -> str:
    try:
        return importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:
        return "unknown"


# ---------------------------------------------------------------------------
# Dependencies / local device
# ---------------------------------------------------------------------------


def load_dependencies() -> dict[str, str]:
    global np, torch, F, SentenceTransformer

    missing: list[str] = []

    try:
        import numpy as numpy_module
    except ImportError:
        missing.append("numpy")
        numpy_module = None

    try:
        import torch as torch_module
        import torch.nn.functional as functional_module
    except ImportError:
        missing.append("torch")
        torch_module = None
        functional_module = None

    try:
        from sentence_transformers import SentenceTransformer as ST
    except ImportError:
        missing.append("sentence-transformers")
        ST = None

    if missing:
        raise PipelineError(
            "Missing required Python package(s): "
            + ", ".join(missing)
            + "\nInstall the local embedding dependencies with:\n"
            + "  python -m pip install -U numpy sentence-transformers torch"
        )

    np = numpy_module
    torch = torch_module
    F = functional_module
    SentenceTransformer = ST

    versions = {
        "numpy": package_version("numpy"),
        "torch": package_version("torch"),
        "sentence-transformers": package_version("sentence-transformers"),
        "transformers": package_version("transformers"),
        "huggingface-hub": package_version("huggingface-hub"),
    }

    def numeric_version(value: str) -> tuple[int, int, int]:
        match = re.match(r"^(\d+)\.(\d+)\.(\d+)", value)
        if not match:
            return (0, 0, 0)
        return tuple(int(x) for x in match.groups())

    if numeric_version(versions["sentence-transformers"]) < MIN_SENTENCE_TRANSFORMERS_VERSION:
        raise PipelineError(
            "sentence-transformers is too old for the pinned Nomic model to load "
            "without executing remote model code. Required >= 5.3.0.\n"
            "Upgrade with:\n  python -m pip install -U sentence-transformers transformers"
        )
    if numeric_version(versions["transformers"]) < MIN_TRANSFORMERS_VERSION:
        raise PipelineError(
            "transformers is too old for the pinned Nomic model to load without "
            "executing remote model code. Required >= 5.5.0.\n"
            "Upgrade with:\n  python -m pip install -U sentence-transformers transformers"
        )

    return versions


def choose_device() -> tuple[str, str]:
    if torch.cuda.is_available():
        try:
            name = torch.cuda.get_device_name(0)
        except Exception:
            name = "CUDA GPU"
        return "cuda", name

    # MPS is mainly relevant on Apple Silicon. Keeping the branch makes this
    # script portable while Windows machines naturally fall through to CPU.
    mps = getattr(torch.backends, "mps", None)
    if mps is not None and mps.is_available():
        return "mps", "Apple Metal Performance Shaders"

    return "cpu", "CPU"


# ---------------------------------------------------------------------------
# Step 2 input validation
# ---------------------------------------------------------------------------


def validate_documents(documents: list[dict[str, Any]]) -> dict[str, Any]:
    required = {
        "document_schema_version",
        "document_id",
        "repository_index",
        "repository_total",
        "repository_name",
        "text",
        "embedding_text",
        "provenance",
    }

    document_ids: list[str] = []
    repo_indexes: list[int] = []
    declared_totals: Counter[int] = Counter()
    embedding_hashes: list[str] = []
    total_embedding_chars = 0
    total_authoritative_chars = 0

    for line_number, document in enumerate(documents, start=1):
        missing = sorted(required - set(document))
        if missing:
            raise PipelineError(f"Document record {line_number} missing fields: {missing}")

        schema = str(document.get("document_schema_version", ""))
        if schema.split(".", 1)[0] != EXPECTED_DOCUMENT_SCHEMA_MAJOR:
            raise PipelineError(
                f"Document {document.get('document_id', line_number)!r}: unsupported Step 2 "
                f"schema version {schema!r}; expected major "
                f"{EXPECTED_DOCUMENT_SCHEMA_MAJOR}."
            )

        document_id = str(document["document_id"]).strip()
        if not document_id:
            raise PipelineError(f"Document record {line_number}: document_id is empty.")
        document_ids.append(document_id)

        text = document["text"]
        embedding_text = document["embedding_text"]
        if not isinstance(text, str) or not text.strip():
            raise PipelineError(f"Document {document_id}: authoritative text is empty.")
        if not isinstance(embedding_text, str) or not embedding_text.strip():
            raise PipelineError(f"Document {document_id}: embedding_text is empty.")

        source_fragments = document.get("source_fragments")
        if not isinstance(source_fragments, list):
            raise PipelineError(f"Document {document_id}: source_fragments must be a list.")
        for frag_index, fragment in enumerate(source_fragments, start=1):
            if not isinstance(fragment, dict):
                raise PipelineError(
                    f"Document {document_id}: source_fragments[{frag_index}] is not an object."
                )
            frag_text = fragment.get("text")
            if not isinstance(frag_text, str) or not frag_text.strip():
                raise PipelineError(
                    f"Document {document_id}: source_fragments[{frag_index}].text is empty."
                )
            frag_hash = fragment.get("text_sha256")
            if frag_hash and sha256_text(frag_text) != frag_hash:
                raise PipelineError(
                    f"Document {document_id}: source fragment {frag_index} SHA-256 mismatch."
                )

        try:
            repo_index = int(document["repository_index"])
            repo_total = int(document["repository_total"])
        except (TypeError, ValueError) as exc:
            raise PipelineError(f"Document {document_id}: invalid repository index/total.") from exc

        repo_indexes.append(repo_index)
        declared_totals[repo_total] += 1

        provenance = document["provenance"]
        if not isinstance(provenance, dict):
            raise PipelineError(f"Document {document_id}: provenance is not an object.")
        expected_text_hash = provenance.get("document_text_sha256")
        if not expected_text_hash:
            raise PipelineError(f"Document {document_id}: provenance.document_text_sha256 missing.")
        if sha256_text(text) != expected_text_hash:
            raise PipelineError(f"Document {document_id}: authoritative text SHA-256 mismatch.")

        embedding_hashes.append(sha256_text(embedding_text))
        total_embedding_chars += len(embedding_text)
        total_authoritative_chars += len(text)

    duplicates = sorted(cid for cid, count in Counter(document_ids).items() if count > 1)
    if duplicates:
        raise PipelineError(f"Duplicate document IDs in Step 2 input: {duplicates[:20]}")

    if len(declared_totals) != 1:
        raise PipelineError(
            f"Conflicting repository_total values in Step 2 input: {dict(declared_totals)}"
        )

    expected_repo_total = next(iter(declared_totals))
    actual_repo_indexes = set(repo_indexes)
    expected_repo_indexes = set(range(1, expected_repo_total + 1))
    missing_repos = sorted(expected_repo_indexes - actual_repo_indexes)
    extra_repos = sorted(actual_repo_indexes - expected_repo_indexes)
    if missing_repos or extra_repos:
        raise PipelineError(
            "Repository coverage mismatch in Step 2 v2 documents: "
            f"missing={missing_repos or 'none'}, extra={extra_repos or 'none'}"
        )

    return {
        "document_count": len(documents),
        "repository_count": len(actual_repo_indexes),
        "repository_total": expected_repo_total,
        "embedding_text_character_total": total_embedding_chars,
        "authoritative_text_character_total": total_authoritative_chars,
        "embedding_text_sha256_order_digest": sha256_text("\n".join(embedding_hashes)),
        "document_id_order_digest": sha256_text("\n".join(document_ids)),
    }


# ---------------------------------------------------------------------------
# Model loading and exact Nomic transformation
# ---------------------------------------------------------------------------


def load_local_model(device: str) -> Any:
    # No API client, token, or credential is involved. Hugging Face may perform
    # a public model download the first time this exact revision is requested.
    # Modern Transformers has native Nomic model support, so remote repository
    # Python code execution is explicitly disabled.
    try:
        model = SentenceTransformer(
            EMBEDDING_MODEL,
            revision=EMBEDDING_MODEL_REVISION,
            device=device,
            trust_remote_code=False,
        )
    except Exception as exc:
        raise PipelineError(
            "Could not load the free local embedding model. On the first run, "
            "an internet connection is required to download the public Hugging "
            "Face model files. No API key is required.\n"
            f"Model: {EMBEDDING_MODEL}\n"
            f"Revision: {EMBEDDING_MODEL_REVISION}\n"
            f"Underlying error: {exc}"
        ) from exc

    try:
        model.eval()
    except Exception:
        pass

    model_dim = int(model.get_sentence_embedding_dimension())
    if model_dim != NATIVE_DIMENSIONS:
        raise PipelineError(
            f"Loaded model reports native dimension {model_dim}; expected "
            f"{NATIVE_DIMENSIONS}. Refusing to build an unexpected vector space."
        )

    max_seq = int(getattr(model, "max_seq_length", 0) or 0)
    if max_seq != MAX_SEQUENCE_LENGTH:
        raise PipelineError(
            f"Loaded model reports max_seq_length={max_seq}; expected "
            f"{MAX_SEQUENCE_LENGTH} from the pinned embedding-space definition. "
            "Refusing to silently change truncation behavior."
        )

    if not hasattr(model, "tokenizer") or model.tokenizer is None:
        raise PipelineError("Loaded SentenceTransformer has no tokenizer.")

    return model


def model_input(raw_embedding_text: str) -> str:
    return DOCUMENT_PREFIX + raw_embedding_text


def apply_nomic_matryoshka(full_embeddings: Any) -> Any:
    """Apply Nomic's documented layer-norm -> truncate -> L2-normalize path."""
    if full_embeddings.ndim != 2:
        raise PipelineError(
            f"Model returned rank-{full_embeddings.ndim} embeddings; expected rank 2."
        )
    if int(full_embeddings.shape[1]) != NATIVE_DIMENSIONS:
        raise PipelineError(
            f"Model returned dimension {int(full_embeddings.shape[1])}; expected "
            f"native dimension {NATIVE_DIMENSIONS}."
        )

    x = F.layer_norm(full_embeddings, normalized_shape=(full_embeddings.shape[1],))
    x = x[:, :EMBEDDING_DIMENSIONS]
    x = F.normalize(x, p=2, dim=1)
    return x


def is_oom_exception(exc: BaseException) -> bool:
    oom_type = getattr(torch.cuda, "OutOfMemoryError", RuntimeError)
    if isinstance(exc, oom_type):
        return True
    text = str(exc).lower()
    return "out of memory" in text or "not enough memory" in text


def clear_device_cache(device: str) -> None:
    if device == "cuda":
        try:
            torch.cuda.empty_cache()
        except Exception:
            pass


def embed_local_batch(
    model: Any,
    texts: Sequence[str],
    device: str,
    preferred_batch_size: int = INITIAL_ENCODE_BATCH_SIZE,
) -> tuple[Any, int]:
    """Return float32 normalized vectors plus the micro-batch size actually used."""
    if not texts:
        return np.empty((0, EMBEDDING_DIMENSIONS), dtype=np.float32), preferred_batch_size

    batch_size = min(preferred_batch_size, len(texts))
    while batch_size >= 1:
        try:
            with torch.inference_mode():
                full = model.encode(
                    list(texts),
                    batch_size=batch_size,
                    show_progress_bar=False,
                    convert_to_tensor=True,
                    normalize_embeddings=False,
                )
                transformed = apply_nomic_matryoshka(full)
                vectors = transformed.detach().cpu().to(torch.float32).numpy()
            vectors = np.asarray(vectors, dtype=np.float32)
            return vectors, batch_size
        except (RuntimeError, MemoryError) as exc:
            if not is_oom_exception(exc) or batch_size == 1:
                raise PipelineError(f"Local model inference failed: {exc}") from exc
            clear_device_cache(device)
            next_size = max(1, batch_size // 2)
            print(
                f"\n        Memory pressure detected; retrying local encode with "
                f"micro-batch {next_size} ...",
                flush=True,
            )
            batch_size = next_size

    raise PipelineError("Local inference could not find a viable micro-batch size.")


# ---------------------------------------------------------------------------
# Token-length validation: fail rather than silently truncate evidence
# ---------------------------------------------------------------------------


def validate_token_lengths(model: Any, documents: list[dict[str, Any]]) -> dict[str, Any]:
    token_counts: list[int] = []
    too_long: list[tuple[str, int]] = []

    tokenizer = model.tokenizer
    total = len(documents)
    # Tokenize in groups to avoid one Python tokenizer call per document while not
    # holding token IDs for the entire corpus at once.
    TOKENIZE_BATCH = 128

    for start in range(0, total, TOKENIZE_BATCH):
        end = min(start + TOKENIZE_BATCH, total)
        texts = [model_input(str(c["embedding_text"])) for c in documents[start:end]]
        try:
            encoded = tokenizer(
                texts,
                add_special_tokens=True,
                padding=False,
                truncation=False,
                return_attention_mask=False,
                return_token_type_ids=False,
            )
        except Exception as exc:
            raise PipelineError(f"Tokenizer failed during length validation: {exc}") from exc

        ids_batch = encoded.get("input_ids")
        if not isinstance(ids_batch, list) or len(ids_batch) != len(texts):
            raise PipelineError("Tokenizer returned an unexpected input_ids structure.")

        for offset, ids in enumerate(ids_batch):
            count = len(ids)
            token_counts.append(count)
            if count > MAX_SEQUENCE_LENGTH:
                too_long.append((str(documents[start + offset]["document_id"]), count))

        # Print bounded progress so a large corpus never appears frozen.
        if end == total or end % 1024 == 0:
            print(f"\r      Token validation: {end:,}/{total:,} documents", end="", flush=True)

    print()

    if too_long:
        preview = ", ".join(f"{cid}={count}" for cid, count in too_long[:20])
        raise PipelineError(
            f"{len(too_long)} document(s) exceed the fixed {MAX_SEQUENCE_LENGTH}-token "
            "model limit. Step 3 refuses to silently truncate evidence. Return to "
            f"Step 2 v2 and split those documents. First examples: {preview}"
        )

    ordered = sorted(token_counts)
    median = ordered[len(ordered) // 2]
    return {
        "min_tokens": min(token_counts),
        "median_tokens": median,
        "max_tokens": max(token_counts),
        "over_limit_count": 0,
        "limit": MAX_SEQUENCE_LENGTH,
    }


# ---------------------------------------------------------------------------
# Resumable checkpoints
# ---------------------------------------------------------------------------


def checkpoint_identity(input_sha256: str, documents: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "checkpoint_schema_version": "2.0.0",
        "input_path": rel(INPUT_PATH),
        "input_sha256": input_sha256,
        "document_count": len(documents),
        "document_id_order_digest": sha256_text(
            "\n".join(str(document["document_id"]) for document in documents)
        ),
        "provider": PROVIDER,
        "embedding_model": EMBEDDING_MODEL,
        "embedding_model_revision": EMBEDDING_MODEL_REVISION,
        "native_dimensions": NATIVE_DIMENSIONS,
        "embedding_dimensions": EMBEDDING_DIMENSIONS,
        "max_sequence_length": MAX_SEQUENCE_LENGTH,
        "document_prefix": DOCUMENT_PREFIX,
        "matryoshka_transform": "layer_norm->first_512->l2_normalize",
        "logical_batch_size": LOGICAL_BATCH_SIZE,
        "dtype": DTYPE_NAME,
    }


def prepare_checkpoint(identity: dict[str, Any]) -> dict[str, int]:
    state_path = CHECKPOINT_DIR / "checkpoint.json"
    stale_removed = 0

    if CHECKPOINT_DIR.exists():
        remove = False
        if not state_path.is_file():
            remove = True
        else:
            try:
                existing = json.loads(state_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                remove = True
            else:
                if existing != identity:
                    remove = True

        if remove:
            shutil.rmtree(CHECKPOINT_DIR)
            stale_removed = 1

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    write_json(state_path, identity)

    existing_batches = len(list(CHECKPOINT_DIR.glob("batch-*.npz")))
    return {
        "existing_checkpoint_files": existing_batches,
        "stale_checkpoint_sets_removed": stale_removed,
    }


def batch_checkpoint_path(start: int, end: int) -> Path:
    return CHECKPOINT_DIR / f"batch-{start:06d}-{end - 1:06d}.npz"


def save_batch_checkpoint(
    path: Path,
    start: int,
    end: int,
    document_ids: Sequence[str],
    vectors: Any,
    token_counts: Sequence[int],
    encode_batch_size: int,
) -> None:
    temp_path = path.with_suffix(".tmp.npz")
    np.savez(
        temp_path,
        start=np.asarray([start], dtype=np.int64),
        end=np.asarray([end], dtype=np.int64),
        document_ids=np.asarray(list(document_ids), dtype=np.str_),
        vectors=np.asarray(vectors, dtype=np.float32),
        token_counts=np.asarray(list(token_counts), dtype=np.int32),
        encode_batch_size=np.asarray([encode_batch_size], dtype=np.int32),
    )
    os.replace(temp_path, path)


def load_batch_checkpoint(
    path: Path,
    start: int,
    end: int,
    expected_document_ids: Sequence[str],
) -> tuple[Any, list[int], int]:
    try:
        with np.load(path, allow_pickle=False) as data:
            stored_start = int(data["start"][0])
            stored_end = int(data["end"][0])
            stored_ids = [str(x) for x in data["document_ids"].tolist()]
            vectors = np.asarray(data["vectors"], dtype=np.float32)
            token_counts = [int(x) for x in data["token_counts"].tolist()]
            encode_batch_size = int(data["encode_batch_size"][0])
    except Exception as exc:
        raise PipelineError(f"Checkpoint file is unreadable: {rel(path)}: {exc}") from exc

    expected_rows = end - start
    if stored_start != start or stored_end != end:
        raise PipelineError(f"Checkpoint range mismatch: {rel(path)}")
    if stored_ids != list(expected_document_ids):
        raise PipelineError(f"Checkpoint document ordering mismatch: {rel(path)}")
    if vectors.shape != (expected_rows, EMBEDDING_DIMENSIONS):
        raise PipelineError(
            f"Checkpoint vector shape mismatch in {rel(path)}: {vectors.shape}; "
            f"expected {(expected_rows, EMBEDDING_DIMENSIONS)}"
        )
    if len(token_counts) != expected_rows:
        raise PipelineError(f"Checkpoint token-count length mismatch: {rel(path)}")
    if not np.isfinite(vectors).all():
        raise PipelineError(f"Checkpoint contains NaN/Inf: {rel(path)}")

    norms = np.linalg.norm(vectors.astype(np.float64), axis=1)
    if np.any(norms <= 0.0):
        raise PipelineError(f"Checkpoint contains zero vector: {rel(path)}")
    if np.max(np.abs(norms - 1.0)) > UNIT_NORM_TOLERANCE:
        raise PipelineError(f"Checkpoint vectors are not L2-normalized: {rel(path)}")

    return vectors, token_counts, encode_batch_size


def tokenize_counts_for_texts(model: Any, raw_texts: Sequence[str]) -> list[int]:
    texts = [model_input(text) for text in raw_texts]
    encoded = model.tokenizer(
        texts,
        add_special_tokens=True,
        padding=False,
        truncation=False,
        return_attention_mask=False,
        return_token_type_ids=False,
    )
    return [len(ids) for ids in encoded["input_ids"]]


def assemble_from_checkpoints(
    documents: list[dict[str, Any]],
    model: Any,
    device: str,
) -> tuple[Any, dict[str, Any]]:
    vector_parts: list[Any] = []
    logical_batch_count = math.ceil(len(documents) / LOGICAL_BATCH_SIZE)
    new_batches = 0
    resumed_batches = 0
    smallest_encode_batch = INITIAL_ENCODE_BATCH_SIZE

    for logical_no, start in enumerate(
        range(0, len(documents), LOGICAL_BATCH_SIZE), start=1
    ):
        end = min(start + LOGICAL_BATCH_SIZE, len(documents))
        batch_documents = documents[start:end]
        batch_ids = [str(document["document_id"]) for document in batch_documents]
        checkpoint_path = batch_checkpoint_path(start, end)
        prefix = (
            f"      Batch {logical_no:03d}/{logical_batch_count:03d} "
            f"documents {start + 1:05d}-{end:05d}"
        )

        loaded = False
        if checkpoint_path.is_file():
            try:
                vectors, token_counts, encode_batch = load_batch_checkpoint(
                    checkpoint_path, start, end, batch_ids
                )
            except PipelineError as exc:
                print(f"{prefix} ... invalid checkpoint removed ({exc})")
                checkpoint_path.unlink(missing_ok=True)
            else:
                loaded = True
                resumed_batches += 1
                smallest_encode_batch = min(smallest_encode_batch, encode_batch)
                print(f"{prefix} ... SUCCESS [checkpoint]")

        if not loaded:
            raw_texts = [str(document["embedding_text"]) for document in batch_documents]
            prefixed_texts = [model_input(text) for text in raw_texts]
            token_counts = tokenize_counts_for_texts(model, raw_texts)
            if any(count > MAX_SEQUENCE_LENGTH for count in token_counts):
                raise PipelineError(
                    f"Token limit changed unexpectedly inside batch {logical_no}."
                )

            vectors, encode_batch = embed_local_batch(
                model,
                prefixed_texts,
                device,
                preferred_batch_size=INITIAL_ENCODE_BATCH_SIZE,
            )
            save_batch_checkpoint(
                checkpoint_path,
                start,
                end,
                batch_ids,
                vectors,
                token_counts,
                encode_batch,
            )
            # Immediately prove the checkpoint is durable and internally valid.
            vectors, reread_tokens, reread_batch = load_batch_checkpoint(
                checkpoint_path, start, end, batch_ids
            )
            if reread_tokens != token_counts or reread_batch != encode_batch:
                raise PipelineError(f"Checkpoint accounting mismatch: {rel(checkpoint_path)}")

            new_batches += 1
            smallest_encode_batch = min(smallest_encode_batch, encode_batch)
            print(f"{prefix} ... SUCCESS [local:{device}, micro-batch={encode_batch}]")

        vector_parts.append(vectors)

    matrix = np.concatenate(vector_parts, axis=0).astype(np.float32, copy=False)
    return matrix, {
        "logical_batch_count": logical_batch_count,
        "new_logical_batches": new_batches,
        "resumed_logical_batches": resumed_batches,
        "smallest_encode_micro_batch_used": smallest_encode_batch,
        "paid_api_requests": 0,
        "credentials_required": False,
    }


# ---------------------------------------------------------------------------
# Evidence mapping and vector validation
# ---------------------------------------------------------------------------


def build_embedding_records(documents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for vector_index, document in enumerate(documents):
        record = dict(document)
        raw_embedding_text = str(document["embedding_text"])
        record.update(
            {
                "embedding_schema_version": EMBEDDING_SCHEMA_VERSION,
                "vector_index": vector_index,
                "embedding_provider": PROVIDER,
                "embedding_model": EMBEDDING_MODEL,
                "embedding_model_revision": EMBEDDING_MODEL_REVISION,
                "embedding_dimensions": EMBEDDING_DIMENSIONS,
                "embedding_native_dimensions": NATIVE_DIMENSIONS,
                "embedding_dtype": DTYPE_NAME,
                "embedding_similarity": SIMILARITY,
                "embedding_document_prefix": DOCUMENT_PREFIX,
                "embedding_query_prefix": QUERY_PREFIX,
                "embedding_text_sha256": sha256_text(raw_embedding_text),
                "model_input_sha256": sha256_text(model_input(raw_embedding_text)),
            }
        )
        rows.append(record)
    return rows


def validate_matrix_and_records(
    matrix: Any,
    documents: list[dict[str, Any]],
    records: list[dict[str, Any]],
) -> dict[str, Any]:
    expected_shape = (len(documents), EMBEDDING_DIMENSIONS)
    if matrix.shape != expected_shape:
        raise PipelineError(
            f"Embedding matrix shape {matrix.shape} does not match expected {expected_shape}."
        )
    if matrix.dtype != np.float32:
        raise PipelineError(f"Embedding matrix dtype is {matrix.dtype}; expected float32.")
    if not np.isfinite(matrix).all():
        raise PipelineError("Embedding matrix contains NaN or Inf values.")

    norms = np.linalg.norm(matrix.astype(np.float64), axis=1)
    if np.any(norms <= 0.0):
        bad = np.flatnonzero(norms <= 0.0)[:20].tolist()
        raise PipelineError(f"Embedding matrix contains zero vectors at rows: {bad}")

    max_norm_error = float(np.max(np.abs(norms - 1.0)))
    if max_norm_error > UNIT_NORM_TOLERANCE:
        raise PipelineError(
            f"Embedding vectors are not correctly L2-normalized; max norm error "
            f"is {max_norm_error:.8f}."
        )

    if len(records) != len(documents):
        raise PipelineError(
            f"Embedding record count {len(records)} != document count {len(documents)}."
        )

    seen_ids: set[str] = set()
    repo_indexes: set[int] = set()
    for index, (document, record) in enumerate(zip(documents, records)):
        if int(record.get("vector_index", -1)) != index:
            raise PipelineError(f"Vector index mismatch at row {index}.")
        if record.get("document_id") != document.get("document_id"):
            raise PipelineError(f"Document mapping mismatch at vector row {index}.")

        cid = str(record["document_id"])
        if cid in seen_ids:
            raise PipelineError(f"Duplicate document ID in embedding records: {cid}")
        seen_ids.add(cid)
        repo_indexes.add(int(record["repository_index"]))

        if record.get("text") != document.get("text"):
            raise PipelineError(f"Authoritative text changed for document {cid}.")
        if record.get("embedding_text") != document.get("embedding_text"):
            raise PipelineError(f"Embedding text changed for document {cid}.")
        if record.get("source_fragments") != document.get("source_fragments"):
            raise PipelineError(f"Source-fragment provenance changed for document {cid}.")
        if record.get("embedding_text_sha256") != sha256_text(document["embedding_text"]):
            raise PipelineError(f"Embedding text hash mismatch for document {cid}.")
        if record.get("model_input_sha256") != sha256_text(
            model_input(document["embedding_text"])
        ):
            raise PipelineError(f"Prefixed model-input hash mismatch for document {cid}.")

    declared_total = int(documents[0]["repository_total"])
    expected_repos = set(range(1, declared_total + 1))
    if repo_indexes != expected_repos:
        raise PipelineError(
            "Embedding record repository coverage mismatch: "
            f"missing={sorted(expected_repos - repo_indexes)}, "
            f"extra={sorted(repo_indexes - expected_repos)}"
        )

    ordered_norms = np.sort(norms)
    return {
        "matrix_shape": [int(matrix.shape[0]), int(matrix.shape[1])],
        "dtype": str(matrix.dtype),
        "vector_count": int(matrix.shape[0]),
        "dimension": int(matrix.shape[1]),
        "repository_count": len(repo_indexes),
        "duplicate_document_ids": 0,
        "invalid_vector_count": 0,
        "zero_vector_count": 0,
        "l2_norm_min": float(norms.min()),
        "l2_norm_median": float(ordered_norms[len(ordered_norms) // 2]),
        "l2_norm_max": float(norms.max()),
        "l2_norm_max_error_from_one": max_norm_error,
    }


# ---------------------------------------------------------------------------
# Atomic output publication
# ---------------------------------------------------------------------------


def write_temp_outputs(
    matrix: Any,
    records: list[dict[str, Any]],
    documents: list[dict[str, Any]],
    input_sha256: str,
    input_stats: dict[str, Any],
    token_stats: dict[str, Any],
    vector_stats: dict[str, Any],
    run_stats: dict[str, Any],
    dependency_versions: dict[str, str],
    device: str,
    device_name: str,
) -> dict[str, Any]:
    if TEMP_OUTPUT_DIR.exists():
        shutil.rmtree(TEMP_OUTPUT_DIR)
    TEMP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    matrix_path = TEMP_OUTPUT_DIR / "embeddings.npy"
    records_path = TEMP_OUTPUT_DIR / "embedding-records.jsonl"
    manifest_path = TEMP_OUTPUT_DIR / "embedding-manifest.json"
    report_path = TEMP_OUTPUT_DIR / "embedding-validation-report.txt"

    np.save(matrix_path, matrix, allow_pickle=False)
    written = write_jsonl(records_path, records)
    if written != len(documents):
        raise PipelineError(f"Wrote {written} embedding records; expected {len(documents)}.")

    # Re-read the two primary data artifacts before declaring them valid.
    reloaded = np.load(matrix_path, mmap_mode="r", allow_pickle=False)
    if reloaded.shape != matrix.shape or reloaded.dtype != np.float32:
        raise PipelineError("Re-read validation failed for embeddings.npy.")
    for start in range(0, reloaded.shape[0], 512):
        block = np.asarray(reloaded[start : start + 512])
        if not np.isfinite(block).all():
            raise PipelineError(f"Re-read embeddings.npy contains NaN/Inf near row {start}.")

    reloaded_records = load_jsonl(records_path)
    if len(reloaded_records) != len(records):
        raise PipelineError(
            f"Re-read record count {len(reloaded_records)} != expected {len(records)}."
        )
    for index, row in enumerate(reloaded_records):
        if int(row.get("vector_index", -1)) != index:
            raise PipelineError(
                f"Re-read embedding-records.jsonl vector_index mismatch at row {index}."
            )
        if row.get("document_id") != documents[index].get("document_id"):
            raise PipelineError(
                f"Re-read embedding-records.jsonl document mapping mismatch at row {index}."
            )

    artifact_hashes = {
        "embeddings.npy": sha256_file(matrix_path),
        "embedding-records.jsonl": sha256_file(records_path),
    }

    manifest = {
        "embedding_schema_version": EMBEDDING_SCHEMA_VERSION,
        "pipeline_step": 3,
        "generated_at_utc": utc_now(),
        "script": SCRIPT_NAME,
        "cost": {
            "paid_api_used": False,
            "api_key_required": False,
            "paid_api_requests": 0,
            "embedding_generation_cost_usd": 0,
            "first_run_model_download": "public Hugging Face model; no API key required",
        },
        "input": {
            "path": rel(INPUT_PATH),
            "sha256": input_sha256,
            **input_stats,
        },
        "embedding": {
            "provider": PROVIDER,
            "model": EMBEDDING_MODEL,
            "model_revision": EMBEDDING_MODEL_REVISION,
            "model_license": MODEL_LICENSE,
            "native_dimensions": NATIVE_DIMENSIONS,
            "stored_dimensions": EMBEDDING_DIMENSIONS,
            "max_sequence_length_tokens": MAX_SEQUENCE_LENGTH,
            "document_prefix": DOCUMENT_PREFIX,
            "runtime_query_prefix": QUERY_PREFIX,
            "matryoshka_transform": "layer_norm -> first 512 dimensions -> L2 normalize",
            "similarity": SIMILARITY,
            "dtype": DTYPE_NAME,
            "field_embedded": "embedding_text",
            "authoritative_evidence_field": "text",
            "logical_checkpoint_batch_size": LOGICAL_BATCH_SIZE,
            "initial_encode_micro_batch_size": INITIAL_ENCODE_BATCH_SIZE,
        },
        "runtime": {
            "device": device,
            "device_name": device_name,
            "network_needed_after_model_cached": False,
            "credentials_required": False,
        },
        "token_validation": token_stats,
        "matrix": vector_stats,
        "run": run_stats,
        "dependencies": dependency_versions,
        "artifacts": {
            "embeddings.npy": {
                "sha256": artifact_hashes["embeddings.npy"],
                "rows": len(documents),
                "columns": EMBEDDING_DIMENSIONS,
                "dtype": DTYPE_NAME,
            },
            "embedding-records.jsonl": {
                "sha256": artifact_hashes["embedding-records.jsonl"],
                "records": len(records),
            },
        },
        "integrity": {
            "matrix_row_equals_record_vector_index": "PASS",
            "document_id_order_preserved": "PASS",
            "authoritative_text_preserved": "PASS",
            "source_fragments_preserved": "PASS",
            "embedding_text_preserved": "PASS",
            "no_silent_token_truncation": "PASS",
            "repository_coverage": "PASS",
            "duplicate_document_ids": 0,
            "invalid_vectors": 0,
            "nan_or_inf_vectors": 0,
            "zero_vectors": 0,
            "unit_normalized_vectors": "PASS",
        },
        "next_pipeline_input": {
            "vectors": "rag-corpus/embeddings-v2/embeddings.npy",
            "records": "rag-corpus/embeddings-v2/embedding-records.jsonl",
            "configuration": "rag-corpus/embeddings-v2/embedding-manifest.json",
        },
    }
    write_json(manifest_path, manifest)

    report_lines = [
        "Portfolio GitHub RAG pipeline — Step 3 v3 evidence-document embedding validation report",
        "",
        "STATUS: PASS",
        "",
        "COST / PRIVACY",
        "  Paid API used: NO",
        "  API key required: NO",
        "  Paid API requests: 0",
        "  Embedding generation cost: $0",
        "  Embedding inference: local on this machine",
        "",
        "INPUT",
        f"  {rel(INPUT_PATH)}",
        f"  SHA-256: {input_sha256}",
        f"  Documents: {len(documents)}",
        f"  Repositories: {input_stats['repository_count']}/{input_stats['repository_total']}",
        "",
        "LOCAL EMBEDDING CONFIGURATION",
        f"  Provider/runtime: {PROVIDER}",
        f"  Model: {EMBEDDING_MODEL}",
        f"  Pinned revision: {EMBEDDING_MODEL_REVISION}",
        f"  License: {MODEL_LICENSE}",
        f"  Native dimensions: {NATIVE_DIMENSIONS}",
        f"  Stored dimensions: {EMBEDDING_DIMENSIONS}",
        f"  Max sequence length: {MAX_SEQUENCE_LENGTH} tokens",
        f"  Document prefix: {DOCUMENT_PREFIX}",
        f"  Future query prefix: {QUERY_PREFIX}",
        "  Matryoshka: layer_norm -> first 512 -> L2 normalize",
        f"  Similarity: {SIMILARITY}",
        f"  Matrix dtype: {DTYPE_NAME}",
        f"  Device: {device} ({device_name})",
        "",
        "TOKEN VALIDATION",
        f"  Token min/median/max: {token_stats['min_tokens']}/"
        f"{token_stats['median_tokens']}/{token_stats['max_tokens']}",
        f"  Limit: {token_stats['limit']}",
        "  Documents over limit: 0",
        "  Silent truncation permitted: NO",
        "",
        "VECTOR VALIDATION",
        f"  Matrix shape: {tuple(vector_stats['matrix_shape'])}",
        f"  Valid vectors: {vector_stats['vector_count']}/{len(documents)}",
        "  Missing vectors: 0",
        "  Duplicate document IDs: 0",
        "  NaN/Inf vectors: 0",
        "  Zero vectors: 0",
        f"  L2 norm min/median/max: {vector_stats['l2_norm_min']:.6f}/"
        f"{vector_stats['l2_norm_median']:.6f}/"
        f"{vector_stats['l2_norm_max']:.6f}",
        "",
        "CHECKPOINT / LOCAL-INFERENCE ACCOUNTING",
        f"  Logical batches: {run_stats['logical_batch_count']}",
        f"  Newly embedded batches: {run_stats['new_logical_batches']}",
        f"  Resumed batches: {run_stats['resumed_logical_batches']}",
        f"  Smallest encode micro-batch used: "
        f"{run_stats['smallest_encode_micro_batch_used']}",
        "  Paid API requests: 0",
        "",
        "OUTPUT",
        "  rag-corpus/embeddings-v2/embeddings.npy",
        "  rag-corpus/embeddings-v2/embedding-records.jsonl",
        "  rag-corpus/embeddings-v2/embedding-manifest.json",
        "  rag-corpus/embeddings-v2/embedding-validation-report.txt",
        "",
        "REFERENTIAL INTEGRITY",
        "  embeddings.npy row N <-> embedding-records.jsonl vector_index N: PASS",
        "  Step 2 v2 retrieval-document ordering preserved: PASS",
        "  authoritative `text` preserved: PASS",
        "  `source_fragments` provenance preserved: PASS",
        "  original `embedding_text` preserved: PASS",
        "  repository coverage: PASS",
        "  no silent token truncation: PASS",
        "",
        "NEXT PIPELINE INPUT",
        "  rag-corpus/embeddings-v2/embeddings.npy",
        "  rag-corpus/embeddings-v2/embedding-records.jsonl",
        "  rag-corpus/embeddings-v2/embedding-manifest.json",
        "",
        "Runtime employer queries MUST use the same pinned model/revision and",
        f"the `{QUERY_PREFIX}` prefix before cosine similarity search.",
        "",
    ]
    report_path.write_text("\n".join(report_lines), encoding="utf-8", newline="\n")

    # Re-read final metadata/report before publication.
    loaded_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if loaded_manifest.get("input", {}).get("sha256") != input_sha256:
        raise PipelineError("Re-read embedding-manifest.json input hash mismatch.")
    if loaded_manifest.get("cost", {}).get("paid_api_used") is not False:
        raise PipelineError("Manifest cost guard failed: paid_api_used is not false.")
    if "STATUS: PASS" not in report_path.read_text(encoding="utf-8"):
        raise PipelineError("Re-read validation report does not contain PASS status.")
    if sha256_file(matrix_path) != artifact_hashes["embeddings.npy"]:
        raise PipelineError("embeddings.npy changed during validation.")
    if sha256_file(records_path) != artifact_hashes["embedding-records.jsonl"]:
        raise PipelineError("embedding-records.jsonl changed during validation.")

    return {
        "matrix_bytes": matrix_path.stat().st_size,
        "records_bytes": records_path.stat().st_size,
        "manifest_sha256": sha256_file(manifest_path),
        "report_sha256": sha256_file(report_path),
    }


def publish_temp_output() -> None:
    backup_dir = RAG_DIR / ".embeddings-v2.previous"
    if backup_dir.exists():
        shutil.rmtree(backup_dir)

    had_existing = OUTPUT_DIR.exists()
    if had_existing:
        os.replace(OUTPUT_DIR, backup_dir)

    try:
        os.replace(TEMP_OUTPUT_DIR, OUTPUT_DIR)
    except Exception:
        if had_existing and backup_dir.exists() and not OUTPUT_DIR.exists():
            os.replace(backup_dir, OUTPUT_DIR)
        raise
    else:
        if backup_dir.exists():
            shutil.rmtree(backup_dir)


def verify_published_output(expected_input_sha256: str, expected_document_count: int) -> None:
    matrix_path = OUTPUT_DIR / "embeddings.npy"
    records_path = OUTPUT_DIR / "embedding-records.jsonl"
    manifest_path = OUTPUT_DIR / "embedding-manifest.json"
    report_path = OUTPUT_DIR / "embedding-validation-report.txt"

    for path in (matrix_path, records_path, manifest_path, report_path):
        if not path.is_file():
            raise PipelineError(f"Published output is missing: {rel(path)}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("input", {}).get("sha256") != expected_input_sha256:
        raise PipelineError("Published manifest input hash mismatch.")
    if manifest.get("matrix", {}).get("vector_count") != expected_document_count:
        raise PipelineError("Published manifest vector count mismatch.")
    if manifest.get("embedding", {}).get("model_revision") != EMBEDDING_MODEL_REVISION:
        raise PipelineError("Published manifest model revision mismatch.")
    if manifest.get("cost", {}).get("paid_api_used") is not False:
        raise PipelineError("Published manifest unexpectedly indicates paid API use.")

    matrix = np.load(matrix_path, mmap_mode="r", allow_pickle=False)
    if matrix.shape != (expected_document_count, EMBEDDING_DIMENSIONS):
        raise PipelineError("Published embeddings.npy shape mismatch.")
    if matrix.dtype != np.float32:
        raise PipelineError("Published embeddings.npy dtype mismatch.")

    count = 0
    with records_path.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            record = json.loads(line)
            if int(record.get("vector_index", -1)) != count:
                raise PipelineError(f"Published vector_index mismatch at record {count}.")
            count += 1
    if count != expected_document_count:
        raise PipelineError(
            f"Published embedding record count {count} != {expected_document_count}."
        )

    if "STATUS: PASS" not in report_path.read_text(encoding="utf-8"):
        raise PipelineError("Published validation report does not contain PASS status.")


# ---------------------------------------------------------------------------
# User-facing stage output
# ---------------------------------------------------------------------------


def print_header() -> None:
    print("Portfolio GitHub RAG pipeline — Step 3 v3: FREE LOCAL evidence-document embedding generation")
    print(f"RAG root: {RAG_ROOT}")
    print()
    print("COST / CREDENTIALS")
    print("  Paid API:        NONE")
    print("  API key:         NOT REQUIRED")
    print("  Embedding cost:  $0")
    print("  Inference:       LOCAL on this computer")
    print("  First run:       public model may download from Hugging Face")
    print()
    print("INPUT")
    print("  rag-corpus/retrieval-documents-v2/documents.jsonl")
    print("  Field embedded: embedding_text")
    print(f"  Model input prefix added: {DOCUMENT_PREFIX}")
    print("  Evidence retained: text + source_fragments + original embedding_text + all Step 2 v2 metadata")
    print()
    print("OUTPUT")
    print("  rag-corpus/embeddings-v2/embeddings.npy")
    print("  rag-corpus/embeddings-v2/embedding-records.jsonl")
    print("  rag-corpus/embeddings-v2/embedding-manifest.json")
    print("  rag-corpus/embeddings-v2/embedding-validation-report.txt")
    print()
    print("LOCAL EMBEDDING CONFIGURATION")
    print(f"  Provider/runtime: {PROVIDER}")
    print(f"  Model:            {EMBEDDING_MODEL}")
    print(f"  Revision:         {EMBEDDING_MODEL_REVISION}")
    print(f"  License:          {MODEL_LICENSE}")
    print(f"  Native dims:      {NATIVE_DIMENSIONS}")
    print(f"  Stored dims:      {EMBEDDING_DIMENSIONS}")
    print(f"  Max sequence:     {MAX_SEQUENCE_LENGTH} tokens")
    print(f"  Similarity:       {SIMILARITY}")
    print(f"  Runtime query prefix later: {QUERY_PREFIX}")
    print()


def main() -> int:
    print_header()
    matrix = None

    try:
        print("[1/11] Validate zero-argument invocation and local dependencies ... ", end="", flush=True)
        if len(sys.argv) != 1:
            raise PipelineError(
                f"{SCRIPT_NAME} accepts no command-line arguments. Run: python {SCRIPT_NAME}"
            )
        versions = load_dependencies()
        print(
            "SUCCESS "
            f"(numpy {versions['numpy']}, torch {versions['torch']}, "
            f"sentence-transformers {versions['sentence-transformers']})"
        )

        print("[2/11] Locate Step 2 v2 document input ... ", end="", flush=True)
        if not INPUT_PATH.is_file():
            raise PipelineError(
                f"Required input not found: {rel(INPUT_PATH)}\n"
                "Run Step 2 v2 successfully before this script."
            )
        input_sha256 = sha256_file(INPUT_PATH)
        print(f"SUCCESS ({INPUT_PATH.stat().st_size:,} bytes)")

        print("[3/11] Load and validate document corpus ... ", end="", flush=True)
        documents = load_jsonl(INPUT_PATH)
        input_stats = validate_documents(documents)
        print(
            f"SUCCESS ({input_stats['document_count']:,} documents; "
            f"{input_stats['repository_count']}/{input_stats['repository_total']} repositories)"
        )

        print("[4/11] Select local compute device ... ", end="", flush=True)
        device, device_name = choose_device()
        print(f"SUCCESS ({device}: {device_name})")

        print("[5/11] Load pinned free local embedding model ... ", end="", flush=True)
        model = load_local_model(device)
        print(
            f"SUCCESS ({EMBEDDING_MODEL} @ {EMBEDDING_MODEL_REVISION[:12]}, "
            f"{NATIVE_DIMENSIONS}D native, max {MAX_SEQUENCE_LENGTH} tokens)"
        )

        print("[6/11] Validate model token lengths without truncation ...", flush=True)
        token_stats = validate_token_lengths(model, documents)
        print(
            "      SUCCESS "
            f"(min/median/max {token_stats['min_tokens']}/"
            f"{token_stats['median_tokens']}/{token_stats['max_tokens']} tokens; "
            f"over limit: {token_stats['over_limit_count']})"
        )

        print("[7/11] Prepare resumable local checkpoint state ... ", end="", flush=True)
        checkpoint_stats = prepare_checkpoint(checkpoint_identity(input_sha256, documents))
        print(
            "SUCCESS "
            f"(existing batches: {checkpoint_stats['existing_checkpoint_files']}; "
            f"stale sets removed: {checkpoint_stats['stale_checkpoint_sets_removed']})"
        )

        print("[8/11] Generate or resume FREE LOCAL embedding batches ...", flush=True)
        matrix, run_stats = assemble_from_checkpoints(documents, model, device)
        print(
            "      SUCCESS "
            f"({run_stats['logical_batch_count']} logical batches; "
            f"new {run_stats['new_logical_batches']}; "
            f"resumed {run_stats['resumed_logical_batches']}; paid API requests 0)"
        )

        print("[9/11] Build evidence mapping and validate vector integrity ... ", end="", flush=True)
        records = build_embedding_records(documents)
        vector_stats = validate_matrix_and_records(matrix, documents, records)
        print(
            "SUCCESS "
            f"(shape {tuple(vector_stats['matrix_shape'])}; NaN/Inf 0; "
            "zero vectors 0; unit normalized)"
        )

        print("[10/11] Write and re-read temporary output artifacts ... ", end="", flush=True)
        artifact_stats = write_temp_outputs(
            matrix,
            records,
            documents,
            input_sha256,
            input_stats,
            token_stats,
            vector_stats,
            run_stats,
            versions,
            device,
            device_name,
        )
        print(
            "SUCCESS "
            f"(matrix {artifact_stats['matrix_bytes']:,} bytes; "
            f"records {artifact_stats['records_bytes']:,} bytes)"
        )

        print("[11/11] Publish validated embedding corpus atomically ... ", end="", flush=True)
        publish_temp_output()
        verify_published_output(input_sha256, len(documents))
        # Only after the final published artifacts pass do we discard resume data.
        if CHECKPOINT_DIR.exists():
            shutil.rmtree(CHECKPOINT_DIR)
        print("SUCCESS")

        print()
        print("STEP 3 COMPLETE: SUCCESS")
        print(f"Documents expected:              {len(documents):,}")
        print(f"Documents embedded:              {vector_stats['vector_count']:,}")
        print(
            f"Repositories covered:         {input_stats['repository_count']}/"
            f"{input_stats['repository_total']}"
        )
        print(f"Embedding model:              {EMBEDDING_MODEL}")
        print(f"Pinned model revision:        {EMBEDDING_MODEL_REVISION}")
        print(f"Stored dimensions:            {EMBEDDING_DIMENSIONS}")
        print(f"Vector matrix shape:          {tuple(vector_stats['matrix_shape'])}")
        print(f"Vector dtype:                 {vector_stats['dtype']}")
        print(
            f"Token min/median/max:         {token_stats['min_tokens']}/"
            f"{token_stats['median_tokens']}/{token_stats['max_tokens']}"
        )
        print("Missing embeddings:           0")
        print("Duplicate document IDs:          0")
        print("Invalid / NaN / Inf vectors:  0")
        print("Zero vectors:                 0")
        print("Paid API requests:            0")
        print("API keys required:            0")
        print("Embedding API cost:           $0")
        print(f"Local compute device:         {device} ({device_name})")
        print()
        print("OUTPUT")
        print("  rag-corpus/embeddings-v2/embeddings.npy")
        print("  rag-corpus/embeddings-v2/embedding-records.jsonl")
        print("  rag-corpus/embeddings-v2/embedding-manifest.json")
        print("  rag-corpus/embeddings-v2/embedding-validation-report.txt")
        print()
        print("NEXT PIPELINE INPUT")
        print("  rag-corpus/embeddings-v2/embeddings.npy")
        print("  rag-corpus/embeddings-v2/embedding-records.jsonl")
        print("  rag-corpus/embeddings-v2/embedding-manifest.json")
        print()
        print("Runtime query rule:")
        print(
            f"  same pinned model + {EMBEDDING_DIMENSIONS}D Matryoshka transform + "
            f"'{QUERY_PREFIX}' prefix"
        )
        return 0

    except KeyboardInterrupt:
        print()
        print("INTERRUPTED")
        print("Completed local embedding batches remain checkpointed.")
        print(f"Rerun: python {SCRIPT_NAME}")
        print("The script will resume only if the exact input/model identity still matches.")
        return 130
    except PipelineError as exc:
        print()
        print("FAILED")
        print()
        print("STEP 3 COMPLETE: FAILED")
        print(f"Reason: {exc}")
        print()
        print("No paid API was used by this script.")
        print("Existing validated rag-corpus/embeddings-v2/ output, if any, was not replaced")
        print("unless every publication validation step had already succeeded.")
        return 1
    except Exception as exc:
        print()
        print("FAILED")
        print()
        print("STEP 3 COMPLETE: FAILED")
        print(f"Unexpected error: {type(exc).__name__}: {exc}")
        print("No paid API was used by this script.")
        return 1
    finally:
        # Give GPU memory back promptly if the process is embedded in a longer
        # shell session; harmless on CPU.
        try:
            if matrix is not None:
                del matrix
            if torch is not None and torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
