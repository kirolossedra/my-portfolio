#!/usr/bin/env python3
"""
Portfolio GitHub RAG pipeline — Step 4 v1: FREE LOCAL exact retrieval validation.

This script is intentionally ZERO-ARGUMENT and runs from the project root.
Place it beside the existing `rag-corpus/` directory and run:

    python build-rag-retrieval-v1-local.py

NO PAID API IS USED.
NO API KEY IS REQUIRED.
NO MODEL TRAINING IS PERFORMED.

The script validates the Step 3 embedding artifacts, loads the exact same pinned
Nomic embedding model, embeds employer-style questions with the required
`search_query: ` prefix, and performs exact cosine similarity against all stored
11,642 document vectors. Since the Step 3 vectors are L2-normalized, exact cosine
similarity is simply the matrix-vector dot product.

INPUT
-----
    rag-corpus/embeddings/embeddings.npy
    rag-corpus/embeddings/embedding-records.jsonl
    rag-corpus/embeddings/embedding-manifest.json

OUTPUT
------
    rag-corpus/retrieval/retrieval-config.json
    rag-corpus/retrieval/retrieval-validation-report.txt
    rag-corpus/retrieval/test-results/
        retrieval-session-YYYYMMDD-HHMMSS.jsonl   (created when questions are asked)
        latest-results.json                       (updated after each question)

FIXED RETRIEVAL SPACE
---------------------
Model:            nomic-ai/nomic-embed-text-v1.5
Pinned revision:  e9b6763023c676ca8431644204f50c2b100d9aab
Native dimension: 768
Stored dimension: 512
Query prefix:     search_query: 
Transform:        layer_norm -> first 512 dimensions -> L2 normalize
Similarity:       exact cosine similarity
Top K:            10

The vector-space identity is validated against Step 3's manifest. If any of the
model/revision/dimension/prefix/similarity assumptions differ, this script FAILS
rather than silently searching incompatible vectors.

REQUIRED PYTHON PACKAGES
------------------------
    numpy
    sentence-transformers
    torch

These should already be installed from Step 3.
"""

from __future__ import annotations

import hashlib
import importlib.metadata
import json
import os
import shutil
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


# ---------------------------------------------------------------------------
# Fixed paths / vector-space identity
# ---------------------------------------------------------------------------

SCRIPT_NAME = Path(__file__).name
BASE_DIR = Path(__file__).resolve().parent
RAG_DIR = BASE_DIR / "rag-corpus"
EMBEDDINGS_DIR = RAG_DIR / "embeddings"
MATRIX_PATH = EMBEDDINGS_DIR / "embeddings.npy"
RECORDS_PATH = EMBEDDINGS_DIR / "embedding-records.jsonl"
MANIFEST_PATH = EMBEDDINGS_DIR / "embedding-manifest.json"

OUTPUT_DIR = RAG_DIR / "retrieval"
TEMP_OUTPUT_DIR = RAG_DIR / ".retrieval.tmp"
TEST_RESULTS_DIR = OUTPUT_DIR / "test-results"
CONFIG_PATH = OUTPUT_DIR / "retrieval-config.json"
REPORT_PATH = OUTPUT_DIR / "retrieval-validation-report.txt"
LATEST_RESULTS_PATH = TEST_RESULTS_DIR / "latest-results.json"

RETRIEVAL_SCHEMA_VERSION = "1.0.0"
EXPECTED_STEP3_SCHEMA_MAJOR = "2"
EXPECTED_PIPELINE_STEP = 3

PROVIDER = "local-sentence-transformers"
EMBEDDING_MODEL = "nomic-ai/nomic-embed-text-v1.5"
EMBEDDING_MODEL_REVISION = "e9b6763023c676ca8431644204f50c2b100d9aab"
NATIVE_DIMENSIONS = 768
EMBEDDING_DIMENSIONS = 512
MAX_SEQUENCE_LENGTH = 8192
QUERY_PREFIX = "search_query: "
DOCUMENT_PREFIX = "search_document: "
SIMILARITY = "cosine"
DTYPE_NAME = "float32"
TOP_K = 10
DISPLAY_TEXT_CHARS = 850
UNIT_NORM_TOLERANCE = 1e-4
SELF_TEST_SAMPLE_COUNT = 32
MIN_SENTENCE_TRANSFORMERS_VERSION = (5, 3, 0)
MIN_TRANSFORMERS_VERSION = (5, 5, 0)

np = None
torch = None
F = None
SentenceTransformer = None


class PipelineError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def local_stamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(BASE_DIR))
    except ValueError:
        return str(path)


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


def append_jsonl(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")))
        f.write("\n")
        f.flush()
        try:
            os.fsync(f.fileno())
        except OSError:
            pass


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError as exc:
        raise PipelineError(f"Invalid JSON in {rel(path)}: {exc}") from exc
    if not isinstance(value, dict):
        raise PipelineError(f"Expected JSON object in {rel(path)}.")
    return value


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
                    f"Expected JSON object on {rel(path)} line {line_number}."
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


def parse_version_tuple(version: str) -> tuple[int, ...]:
    parts: list[int] = []
    for piece in version.split("."):
        digits = "".join(ch for ch in piece if ch.isdigit())
        if not digits:
            break
        parts.append(int(digits))
    return tuple(parts)


def require_min_version(name: str, minimum: tuple[int, ...]) -> str:
    version = package_version(name)
    if version == "unknown":
        raise PipelineError(f"Required package is not installed: {name}")
    parsed = parse_version_tuple(version)
    width = max(len(parsed), len(minimum))
    parsed_cmp = parsed + (0,) * (width - len(parsed))
    minimum_cmp = minimum + (0,) * (width - len(minimum))
    if parsed_cmp < minimum_cmp:
        wanted = ".".join(str(x) for x in minimum)
        raise PipelineError(
            f"{name} {version} is too old; require >= {wanted}. "
            "Run: python -m pip install -U numpy sentence-transformers torch transformers"
        )
    return version


def section_label(record: dict[str, Any]) -> str:
    section = record.get("section")
    if not isinstance(section, dict):
        return "(unknown section)"
    path = section.get("path")
    if isinstance(path, list) and path:
        return " > ".join(str(x) for x in path)
    title = section.get("title")
    return str(title or "(repository introduction)")


def provenance_label(record: dict[str, Any]) -> str:
    provenance = record.get("provenance")
    if not isinstance(provenance, dict):
        return "source unavailable"
    source_file = provenance.get("analysis_source_file") or "unknown"
    start = provenance.get("analysis_source_line_start")
    end = provenance.get("analysis_source_line_end")
    if start is not None and end is not None:
        return f"{source_file} lines {start}-{end}"
    return str(source_file)


# ---------------------------------------------------------------------------
# Dependencies and model
# ---------------------------------------------------------------------------


def load_dependencies() -> dict[str, str]:
    global np, torch, F, SentenceTransformer

    missing: list[str] = []
    try:
        import numpy as numpy_module
    except ImportError:
        numpy_module = None
        missing.append("numpy")

    try:
        import torch as torch_module
        import torch.nn.functional as functional_module
    except ImportError:
        torch_module = None
        functional_module = None
        missing.append("torch")

    try:
        from sentence_transformers import SentenceTransformer as ST
    except ImportError:
        ST = None
        missing.append("sentence-transformers")

    if missing:
        raise PipelineError(
            "Missing required package(s): " + ", ".join(missing) + "\n"
            "Install with:\n"
            "  python -m pip install -U numpy sentence-transformers torch"
        )

    np = numpy_module
    torch = torch_module
    F = functional_module
    SentenceTransformer = ST

    st_version = require_min_version(
        "sentence-transformers", MIN_SENTENCE_TRANSFORMERS_VERSION
    )
    transformers_version = require_min_version("transformers", MIN_TRANSFORMERS_VERSION)

    return {
        "python": sys.version.split()[0],
        "numpy": package_version("numpy"),
        "torch": package_version("torch"),
        "sentence-transformers": st_version,
        "transformers": transformers_version,
    }


def choose_device() -> tuple[str, str]:
    if bool(torch.cuda.is_available()):
        try:
            return "cuda", str(torch.cuda.get_device_name(0))
        except Exception:
            return "cuda", "CUDA GPU"
    # MPS is useful on Apple hardware but irrelevant on Windows; keep it safe.
    mps = getattr(torch.backends, "mps", None)
    if mps is not None and bool(mps.is_available()):
        return "mps", "Apple Metal (MPS)"
    return "cpu", "CPU"


def load_pinned_model(device: str) -> Any:
    try:
        model = SentenceTransformer(
            EMBEDDING_MODEL,
            revision=EMBEDDING_MODEL_REVISION,
            device=device,
            trust_remote_code=False,
        )
    except Exception as exc:
        raise PipelineError(
            "Could not load the pinned local embedding model. Step 3 should have "
            "already downloaded it into the Hugging Face cache. No API key is needed.\n"
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
            f"Loaded model native dimension {model_dim}; expected {NATIVE_DIMENSIONS}."
        )

    max_seq = int(getattr(model, "max_seq_length", 0) or 0)
    if max_seq != MAX_SEQUENCE_LENGTH:
        raise PipelineError(
            f"Loaded model max_seq_length={max_seq}; expected {MAX_SEQUENCE_LENGTH}."
        )

    if not hasattr(model, "tokenizer") or model.tokenizer is None:
        raise PipelineError("Loaded SentenceTransformer has no tokenizer.")

    return model


def apply_nomic_matryoshka(full_embeddings: Any) -> Any:
    if full_embeddings.ndim != 2:
        raise PipelineError(
            f"Model returned rank-{full_embeddings.ndim}; expected rank 2."
        )
    if int(full_embeddings.shape[1]) != NATIVE_DIMENSIONS:
        raise PipelineError(
            f"Model returned {int(full_embeddings.shape[1])} dimensions; "
            f"expected {NATIVE_DIMENSIONS}."
        )
    x = F.layer_norm(full_embeddings, normalized_shape=(full_embeddings.shape[1],))
    x = x[:, :EMBEDDING_DIMENSIONS]
    x = F.normalize(x, p=2, dim=1)
    return x


def embed_query(model: Any, query: str) -> Any:
    query = query.strip()
    if not query:
        raise PipelineError("Query cannot be empty.")

    model_input = QUERY_PREFIX + query
    # Refuse silent truncation. Employer questions should be far below this limit.
    tokenized = model.tokenizer(
        model_input,
        add_special_tokens=True,
        truncation=False,
        return_attention_mask=False,
        return_token_type_ids=False,
    )
    ids = tokenized.get("input_ids", [])
    token_count = len(ids) if isinstance(ids, list) else 0
    if token_count > MAX_SEQUENCE_LENGTH:
        raise PipelineError(
            f"Query is {token_count} tokens; maximum is {MAX_SEQUENCE_LENGTH}. "
            "Refusing silent truncation."
        )

    try:
        with torch.inference_mode():
            full = model.encode(
                [model_input],
                batch_size=1,
                show_progress_bar=False,
                convert_to_tensor=True,
                normalize_embeddings=False,
            )
            transformed = apply_nomic_matryoshka(full)
            vector = transformed.detach().cpu().to(torch.float32).numpy()[0]
    except Exception as exc:
        raise PipelineError(f"Local query embedding failed: {exc}") from exc

    vector = np.asarray(vector, dtype=np.float32)
    if vector.shape != (EMBEDDING_DIMENSIONS,):
        raise PipelineError(f"Query vector shape {vector.shape} is invalid.")
    if not np.isfinite(vector).all():
        raise PipelineError("Query vector contains NaN or Inf.")
    norm = float(np.linalg.norm(vector.astype(np.float64)))
    if abs(norm - 1.0) > UNIT_NORM_TOLERANCE:
        raise PipelineError(f"Query vector is not L2-normalized; norm={norm:.8f}.")

    return vector, token_count


# ---------------------------------------------------------------------------
# Step 3 artifact validation
# ---------------------------------------------------------------------------


def validate_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    schema = str(manifest.get("embedding_schema_version", ""))
    if not schema.startswith(EXPECTED_STEP3_SCHEMA_MAJOR + "."):
        raise PipelineError(
            f"Unsupported Step 3 embedding schema {schema!r}; expected major "
            f"{EXPECTED_STEP3_SCHEMA_MAJOR}."
        )
    if int(manifest.get("pipeline_step", -1)) != EXPECTED_PIPELINE_STEP:
        raise PipelineError("embedding-manifest.json is not a Step 3 manifest.")

    cost = manifest.get("cost")
    if not isinstance(cost, dict) or cost.get("paid_api_used") is not False:
        raise PipelineError("Step 3 manifest does not confirm paid_api_used=false.")

    embedding = manifest.get("embedding")
    if not isinstance(embedding, dict):
        raise PipelineError("Step 3 manifest missing embedding configuration.")

    expected = {
        "provider": PROVIDER,
        "model": EMBEDDING_MODEL,
        "model_revision": EMBEDDING_MODEL_REVISION,
        "native_dimensions": NATIVE_DIMENSIONS,
        "stored_dimensions": EMBEDDING_DIMENSIONS,
        "document_prefix": DOCUMENT_PREFIX,
        "runtime_query_prefix": QUERY_PREFIX,
        "similarity": SIMILARITY,
        "dtype": DTYPE_NAME,
    }
    mismatches: list[str] = []
    for key, wanted in expected.items():
        actual = embedding.get(key)
        if actual != wanted:
            mismatches.append(f"{key}: got {actual!r}, expected {wanted!r}")
    if mismatches:
        raise PipelineError(
            "Step 3 vector-space configuration is incompatible:\n  - "
            + "\n  - ".join(mismatches)
        )

    artifacts = manifest.get("artifacts")
    if not isinstance(artifacts, dict):
        raise PipelineError("Step 3 manifest missing artifact metadata.")

    matrix_meta = artifacts.get("embeddings.npy")
    records_meta = artifacts.get("embedding-records.jsonl")
    if not isinstance(matrix_meta, dict) or not isinstance(records_meta, dict):
        raise PipelineError("Step 3 manifest missing primary artifact entries.")

    return {
        "embedding_schema_version": schema,
        "expected_rows": int(matrix_meta.get("rows", -1)),
        "expected_columns": int(matrix_meta.get("columns", -1)),
        "matrix_sha256": str(matrix_meta.get("sha256", "")),
        "expected_records": int(records_meta.get("records", -1)),
        "records_sha256": str(records_meta.get("sha256", "")),
    }


def load_and_validate_artifacts(manifest_info: dict[str, Any]) -> tuple[Any, list[dict[str, Any]], dict[str, Any]]:
    try:
        matrix = np.load(MATRIX_PATH, mmap_mode="r", allow_pickle=False)
    except Exception as exc:
        raise PipelineError(f"Could not load {rel(MATRIX_PATH)}: {exc}") from exc

    expected_shape = (
        manifest_info["expected_rows"],
        manifest_info["expected_columns"],
    )
    if matrix.shape != expected_shape:
        raise PipelineError(
            f"Matrix shape {matrix.shape} does not match manifest {expected_shape}."
        )
    if matrix.shape[1] != EMBEDDING_DIMENSIONS:
        raise PipelineError(
            f"Matrix has {matrix.shape[1]} dimensions; expected {EMBEDDING_DIMENSIONS}."
        )
    if matrix.dtype != np.float32:
        raise PipelineError(f"Matrix dtype {matrix.dtype}; expected float32.")

    matrix_hash = sha256_file(MATRIX_PATH)
    records_hash = sha256_file(RECORDS_PATH)
    if matrix_hash != manifest_info["matrix_sha256"]:
        raise PipelineError("embeddings.npy SHA-256 does not match Step 3 manifest.")
    if records_hash != manifest_info["records_sha256"]:
        raise PipelineError(
            "embedding-records.jsonl SHA-256 does not match Step 3 manifest."
        )

    records = load_jsonl(RECORDS_PATH)
    if len(records) != matrix.shape[0]:
        raise PipelineError(
            f"Embedding record count {len(records)} != matrix rows {matrix.shape[0]}."
        )
    if len(records) != manifest_info["expected_records"]:
        raise PipelineError("Embedding record count does not match Step 3 manifest.")

    seen_ids: set[str] = set()
    repos: set[int] = set()
    invalid_vectors = 0
    zero_vectors = 0
    max_norm_error = 0.0

    # Validate the matrix in blocks so mmap stays memory-efficient.
    for start in range(0, matrix.shape[0], 512):
        block = np.asarray(matrix[start : start + 512], dtype=np.float32)
        finite = np.isfinite(block)
        if not finite.all():
            invalid_vectors += int(np.size(finite) - np.count_nonzero(finite))
        norms = np.linalg.norm(block.astype(np.float64), axis=1)
        zero_vectors += int(np.count_nonzero(norms <= 0.0))
        if norms.size:
            max_norm_error = max(max_norm_error, float(np.max(np.abs(norms - 1.0))))

    if invalid_vectors:
        raise PipelineError(f"Embedding matrix contains {invalid_vectors} NaN/Inf values.")
    if zero_vectors:
        raise PipelineError(f"Embedding matrix contains {zero_vectors} zero vectors.")
    if max_norm_error > UNIT_NORM_TOLERANCE:
        raise PipelineError(
            f"Stored vectors are not unit-normalized; max error={max_norm_error:.8f}."
        )

    required_record_fields = {
        "vector_index",
        "chunk_id",
        "repository_index",
        "repository_name",
        "text",
        "section",
        "provenance",
        "embedding_model",
        "embedding_model_revision",
        "embedding_dimensions",
        "embedding_query_prefix",
    }

    for i, record in enumerate(records):
        missing = sorted(required_record_fields - set(record.keys()))
        if missing:
            raise PipelineError(f"Embedding record {i} missing fields: {missing}")
        if int(record["vector_index"]) != i:
            raise PipelineError(f"vector_index mismatch at embedding record {i}.")
        cid = str(record["chunk_id"])
        if cid in seen_ids:
            raise PipelineError(f"Duplicate chunk_id in embedding records: {cid}")
        seen_ids.add(cid)
        repos.add(int(record["repository_index"]))
        if record.get("embedding_model") != EMBEDDING_MODEL:
            raise PipelineError(f"Record {cid}: embedding model mismatch.")
        if record.get("embedding_model_revision") != EMBEDDING_MODEL_REVISION:
            raise PipelineError(f"Record {cid}: model revision mismatch.")
        if int(record.get("embedding_dimensions", -1)) != EMBEDDING_DIMENSIONS:
            raise PipelineError(f"Record {cid}: embedding dimension mismatch.")
        if record.get("embedding_query_prefix") != QUERY_PREFIX:
            raise PipelineError(f"Record {cid}: query prefix mismatch.")

    repo_total_values = Counter(int(r.get("repository_total", 0)) for r in records)
    repo_total = repo_total_values.most_common(1)[0][0] if repo_total_values else 0
    if repo_total <= 0:
        raise PipelineError("Could not determine repository_total from records.")
    expected_repos = set(range(1, repo_total + 1))
    if repos != expected_repos:
        raise PipelineError(
            "Repository coverage mismatch: "
            f"missing={sorted(expected_repos - repos)}, extra={sorted(repos - expected_repos)}"
        )

    stats = {
        "vector_count": int(matrix.shape[0]),
        "dimensions": int(matrix.shape[1]),
        "dtype": str(matrix.dtype),
        "record_count": len(records),
        "repository_count": len(repos),
        "repository_total": repo_total,
        "duplicate_chunk_ids": 0,
        "invalid_vector_values": 0,
        "zero_vectors": 0,
        "max_unit_norm_error": max_norm_error,
        "matrix_sha256": matrix_hash,
        "records_sha256": records_hash,
    }
    return matrix, records, stats


# ---------------------------------------------------------------------------
# Exact retrieval
# ---------------------------------------------------------------------------


def exact_search(matrix: Any, query_vector: Any, top_k: int = TOP_K) -> tuple[list[int], Any]:
    if query_vector.shape != (EMBEDDING_DIMENSIONS,):
        raise PipelineError("Invalid query vector shape for exact search.")
    # Step 3 and query vectors are unit-normalized, therefore dot product == cosine.
    scores = np.asarray(matrix @ query_vector, dtype=np.float32)
    if scores.ndim != 1 or scores.shape[0] != matrix.shape[0]:
        raise PipelineError("Exact cosine search produced an invalid score vector.")
    if not np.isfinite(scores).all():
        raise PipelineError("Exact cosine search produced NaN/Inf scores.")

    k = min(max(1, int(top_k)), int(scores.shape[0]))
    if k == scores.shape[0]:
        top = np.argsort(-scores, kind="stable")
    else:
        candidate = np.argpartition(scores, -k)[-k:]
        top = candidate[np.argsort(-scores[candidate], kind="stable")]
    return [int(i) for i in top], scores


def mathematical_self_test(matrix: Any) -> dict[str, Any]:
    """Verify exact-search mechanics using stored vectors as synthetic queries."""
    count = int(matrix.shape[0])
    if count <= 0:
        raise PipelineError("Cannot self-test an empty matrix.")

    sample_count = min(SELF_TEST_SAMPLE_COUNT, count)
    if sample_count == 1:
        sample_indices = [0]
    else:
        sample_indices = [
            int(round(i * (count - 1) / (sample_count - 1)))
            for i in range(sample_count)
        ]

    failures: list[dict[str, Any]] = []
    min_self_similarity = 1.0
    for row_index in sample_indices:
        q = np.asarray(matrix[row_index], dtype=np.float32)
        top_indices, scores = exact_search(matrix, q, top_k=1)
        self_similarity = float(scores[row_index])
        min_self_similarity = min(min_self_similarity, self_similarity)
        top_score = float(scores[top_indices[0]])
        # Identical vectors can legitimately tie. We require that the sampled row's
        # similarity is ~1 and no result exceeds it materially.
        if abs(self_similarity - 1.0) > 2e-4 or top_score > self_similarity + 2e-5:
            failures.append(
                {
                    "row": row_index,
                    "self_similarity": self_similarity,
                    "top_row": top_indices[0],
                    "top_similarity": top_score,
                }
            )

    if failures:
        raise PipelineError(
            f"Exact-search mathematical self-test failed for {len(failures)} sample(s): "
            f"{failures[:3]}"
        )

    return {
        "sample_count": len(sample_indices),
        "failures": 0,
        "minimum_self_similarity": min_self_similarity,
    }


def result_from_record(rank: int, score: float, record: dict[str, Any]) -> dict[str, Any]:
    return {
        "rank": rank,
        "score": score,
        "vector_index": int(record["vector_index"]),
        "chunk_id": record["chunk_id"],
        "repository_index": int(record["repository_index"]),
        "repository_name": record["repository_name"],
        "repository_url": record.get("repository_url"),
        "chunk_type": record.get("chunk_type"),
        "primary_category": record.get("primary_category"),
        "section": record.get("section"),
        "section_label": section_label(record),
        "text": record.get("text", ""),
        "retrieval_tags": record.get("retrieval_tags", []),
        "related_skill_ratings": record.get("related_skill_ratings", []),
        "chronology_summary": record.get("chronology_summary", {}),
        "classification_summary": record.get("classification_summary", {}),
        "provenance": record.get("provenance", {}),
        "provenance_label": provenance_label(record),
    }


def retrieve(matrix: Any, records: list[dict[str, Any]], query_vector: Any) -> list[dict[str, Any]]:
    indices, scores = exact_search(matrix, query_vector, top_k=TOP_K)
    results: list[dict[str, Any]] = []
    for rank, idx in enumerate(indices, start=1):
        results.append(result_from_record(rank, float(scores[idx]), records[idx]))
    return results


def print_results(results: list[dict[str, Any]]) -> None:
    print()
    print(f"TOP {len(results)} EXACT COSINE RESULTS")
    print("=" * 92)
    for result in results:
        text = str(result.get("text") or "").strip().replace("\r", "")
        if len(text) > DISPLAY_TEXT_CHARS:
            display_text = text[:DISPLAY_TEXT_CHARS].rstrip() + " ..."
        else:
            display_text = text

        print(
            f"#{result['rank']:02d}  score={result['score']:.6f}  "
            f"repo={result['repository_index']:03d}  {result['repository_name']}"
        )
        print(f"     Section: {result['section_label']}")
        print(f"     Chunk:   {result['chunk_id']}")
        print(f"     Source:  {result['provenance_label']}")
        if result.get("primary_category"):
            print(f"     Category:{' ' if result['primary_category'] else ''}{result['primary_category']}")
        print("     Evidence:")
        for line in display_text.splitlines() or [""]:
            print(f"       {line}")
        print("-" * 92)


# ---------------------------------------------------------------------------
# Output publication / report
# ---------------------------------------------------------------------------


def publish_validation_outputs(
    manifest_info: dict[str, Any],
    artifact_stats: dict[str, Any],
    self_test: dict[str, Any],
    dependency_versions: dict[str, str],
    device: str,
    device_name: str,
) -> None:
    if TEMP_OUTPUT_DIR.exists():
        shutil.rmtree(TEMP_OUTPUT_DIR)
    TEMP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    temp_test_dir = TEMP_OUTPUT_DIR / "test-results"
    temp_test_dir.mkdir(parents=True, exist_ok=True)

    config = {
        "retrieval_schema_version": RETRIEVAL_SCHEMA_VERSION,
        "pipeline_step": 4,
        "generated_at_utc": utc_now(),
        "script": SCRIPT_NAME,
        "cost": {
            "paid_api_used": False,
            "api_key_required": False,
            "model_training": False,
            "retrieval_cost_usd": 0,
        },
        "input": {
            "vectors": rel(MATRIX_PATH),
            "records": rel(RECORDS_PATH),
            "manifest": rel(MANIFEST_PATH),
            "vectors_sha256": artifact_stats["matrix_sha256"],
            "records_sha256": artifact_stats["records_sha256"],
            "step3_embedding_schema_version": manifest_info["embedding_schema_version"],
        },
        "retrieval": {
            "algorithm": "exact cosine similarity over complete matrix",
            "approximate_index": False,
            "top_k": TOP_K,
            "document_vectors_unit_normalized": True,
            "query_vectors_unit_normalized": True,
            "cosine_implementation": "matrix dot query_vector",
            "model": EMBEDDING_MODEL,
            "model_revision": EMBEDDING_MODEL_REVISION,
            "native_dimensions": NATIVE_DIMENSIONS,
            "stored_dimensions": EMBEDDING_DIMENSIONS,
            "query_prefix": QUERY_PREFIX,
            "document_prefix": DOCUMENT_PREFIX,
            "matryoshka_transform": "layer_norm -> first 512 dimensions -> L2 normalize",
            "similarity": SIMILARITY,
            "dtype": DTYPE_NAME,
        },
        "corpus": {
            "vector_count": artifact_stats["vector_count"],
            "record_count": artifact_stats["record_count"],
            "repository_count": artifact_stats["repository_count"],
            "repository_total": artifact_stats["repository_total"],
        },
        "validation": {
            "step3_artifact_hashes": "PASS",
            "matrix_record_alignment": "PASS",
            "repository_coverage": "PASS",
            "finite_vectors": "PASS",
            "zero_vectors": 0,
            "unit_normalization": "PASS",
            "exact_search_mathematical_self_test": "PASS",
            "self_test_samples": self_test["sample_count"],
            "self_test_minimum_similarity": self_test["minimum_self_similarity"],
        },
        "runtime": {
            "query_embedding_device": device,
            "query_embedding_device_name": device_name,
            "network_needed_after_model_cached": False,
        },
        "dependencies": dependency_versions,
        "interactive_commands": {
            ":help": "show instructions",
            ":quit": "save session and exit",
            ":exit": "save session and exit",
        },
        "next_pipeline_input": {
            "retrieval_configuration": "rag-corpus/retrieval/retrieval-config.json",
            "validated_vectors": "rag-corpus/embeddings/embeddings.npy",
            "evidence_records": "rag-corpus/embeddings/embedding-records.jsonl",
            "human_evaluation_results": "rag-corpus/retrieval/test-results/",
        },
    }

    config_path = TEMP_OUTPUT_DIR / "retrieval-config.json"
    report_path = TEMP_OUTPUT_DIR / "retrieval-validation-report.txt"
    write_json(config_path, config)

    report_lines = [
        "Portfolio GitHub RAG pipeline — Step 4 exact retrieval validation report",
        "",
        "STATUS: PASS",
        "",
        "INPUT",
        f"  {rel(MATRIX_PATH)}",
        f"  {rel(RECORDS_PATH)}",
        f"  {rel(MANIFEST_PATH)}",
        "",
        "OUTPUT",
        "  rag-corpus/retrieval/retrieval-config.json",
        "  rag-corpus/retrieval/retrieval-validation-report.txt",
        "  rag-corpus/retrieval/test-results/",
        "",
        "COST / EXECUTION",
        "  Paid API used: NO",
        "  API key required: NO",
        "  Model training: NO",
        "  Retrieval cost: $0",
        f"  Query embedding device: {device} ({device_name})",
        "",
        "VECTOR SPACE",
        f"  Model: {EMBEDDING_MODEL}",
        f"  Revision: {EMBEDDING_MODEL_REVISION}",
        f"  Dimensions: {EMBEDDING_DIMENSIONS}",
        f"  Query prefix: {QUERY_PREFIX!r}",
        f"  Similarity: exact {SIMILARITY}",
        "",
        "CORPUS",
        f"  Vectors: {artifact_stats['vector_count']:,}",
        f"  Evidence records: {artifact_stats['record_count']:,}",
        f"  Repositories: {artifact_stats['repository_count']}/{artifact_stats['repository_total']}",
        "",
        "VALIDATION",
        "  Step 3 artifact hashes: PASS",
        "  Matrix <-> record alignment: PASS",
        "  Repository coverage: PASS",
        "  NaN/Inf vectors: 0",
        "  Zero vectors: 0",
        f"  Maximum unit-norm error: {artifact_stats['max_unit_norm_error']:.10f}",
        f"  Exact-search self-test samples: {self_test['sample_count']}",
        "  Exact-search self-test failures: 0",
        f"  Minimum sampled self-similarity: {self_test['minimum_self_similarity']:.8f}",
        "",
        "INTERACTIVE TESTING",
        f"  Top K: {TOP_K}",
        "  Full evidence is saved in test-results; terminal evidence is previewed.",
        "  Type :quit or :exit to save the current session and finish.",
    ]
    report_path.write_text("\n".join(report_lines) + "\n", encoding="utf-8", newline="\n")

    # Re-read temporary outputs before publication.
    reloaded_config = load_json(config_path)
    if reloaded_config.get("validation", {}).get("exact_search_mathematical_self_test") != "PASS":
        raise PipelineError("Temporary retrieval-config.json failed re-read validation.")
    if "STATUS: PASS" not in report_path.read_text(encoding="utf-8"):
        raise PipelineError("Temporary retrieval validation report does not contain PASS.")

    # Keep existing human test results across reruns. Replace only configuration/report.
    existing_results_backup: Path | None = None
    if OUTPUT_DIR.exists() and TEST_RESULTS_DIR.exists():
        existing_results_backup = RAG_DIR / ".retrieval-test-results.backup"
        if existing_results_backup.exists():
            shutil.rmtree(existing_results_backup)
        shutil.copytree(TEST_RESULTS_DIR, existing_results_backup)

    backup_dir = RAG_DIR / ".retrieval.backup"
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    had_existing = OUTPUT_DIR.exists()
    if had_existing:
        os.replace(OUTPUT_DIR, backup_dir)

    try:
        os.replace(TEMP_OUTPUT_DIR, OUTPUT_DIR)
        if existing_results_backup is not None and existing_results_backup.exists():
            # Merge preserved historical sessions into the fresh test-results dir.
            for item in existing_results_backup.iterdir():
                destination = TEST_RESULTS_DIR / item.name
                if destination.exists():
                    continue
                if item.is_dir():
                    shutil.copytree(item, destination)
                else:
                    shutil.copy2(item, destination)
    except Exception:
        if OUTPUT_DIR.exists():
            shutil.rmtree(OUTPUT_DIR)
        if had_existing and backup_dir.exists():
            os.replace(backup_dir, OUTPUT_DIR)
        raise
    finally:
        if existing_results_backup is not None and existing_results_backup.exists():
            shutil.rmtree(existing_results_backup)
    if backup_dir.exists():
        shutil.rmtree(backup_dir)

    # Verify published artifacts.
    published_config = load_json(CONFIG_PATH)
    if published_config.get("input", {}).get("vectors_sha256") != artifact_stats["matrix_sha256"]:
        raise PipelineError("Published retrieval config vector hash mismatch.")
    if published_config.get("input", {}).get("records_sha256") != artifact_stats["records_sha256"]:
        raise PipelineError("Published retrieval config record hash mismatch.")
    if "STATUS: PASS" not in REPORT_PATH.read_text(encoding="utf-8"):
        raise PipelineError("Published retrieval validation report does not contain PASS.")
    TEST_RESULTS_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Interactive evaluation session
# ---------------------------------------------------------------------------


def print_interactive_help() -> None:
    print()
    print("INTERACTIVE RETRIEVAL TEST")
    print("  Enter an employer-style question and press Enter.")
    print("  The script embeds it locally and returns the top 10 exact cosine matches.")
    print("  Full results and provenance are saved automatically.")
    print("  Commands: :help  :quit  :exit")
    print()
    print("Suggested first questions:")
    print("  What evidence shows experience with authorization architecture?")
    print("  How has the candidate's testing discipline evolved over time?")
    print("  Which projects provide the strongest evidence of backend engineering?")
    print("  What are the candidate's weakest engineering areas?")
    print("  Which repositories demonstrate product ownership rather than only coding?")
    print()


def run_interactive_session(model: Any, matrix: Any, records: list[dict[str, Any]], device: str) -> None:
    session_started = utc_now()
    session_path = TEST_RESULTS_DIR / f"retrieval-session-{local_stamp()}.jsonl"
    query_count = 0

    print_interactive_help()
    print(f"Session results will be saved to: {rel(session_path)}")
    print()

    while True:
        try:
            raw = input("Employer question> ")
        except EOFError:
            print()
            break
        except KeyboardInterrupt:
            print("\nInterrupt received. Saving completed query results before exit.")
            break

        query = raw.strip()
        if not query:
            print("  No question entered. Type a question, :help, or :quit.")
            continue
        command = query.casefold()
        if command in {":quit", ":exit", "quit", "exit"}:
            break
        if command in {":help", "help"}:
            print_interactive_help()
            continue

        query_count += 1
        print(f"\n[QUERY {query_count}] Embed with pinned local model ...", end=" ", flush=True)
        started = time.perf_counter()
        try:
            query_vector, token_count = embed_query(model, query)
        except PipelineError as exc:
            print("FAILED")
            print(f"Reason: {exc}")
            query_count -= 1
            continue
        embed_seconds = time.perf_counter() - started
        print(f"SUCCESS ({token_count} tokens; {embed_seconds:.3f}s; local:{device})")

        print(f"[QUERY {query_count}] Exact cosine search over {matrix.shape[0]:,} vectors ...", end=" ", flush=True)
        search_started = time.perf_counter()
        try:
            results = retrieve(matrix, records, query_vector)
        except PipelineError as exc:
            print("FAILED")
            print(f"Reason: {exc}")
            query_count -= 1
            continue
        search_seconds = time.perf_counter() - search_started
        print(f"SUCCESS ({search_seconds:.4f}s; top {len(results)})")

        event = {
            "retrieval_schema_version": RETRIEVAL_SCHEMA_VERSION,
            "session_started_at_utc": session_started,
            "queried_at_utc": utc_now(),
            "query_number": query_count,
            "question": query,
            "query_token_count": token_count,
            "embedding_seconds": embed_seconds,
            "search_seconds": search_seconds,
            "top_k": TOP_K,
            "retrieval_algorithm": "exact cosine similarity",
            "embedding_model": EMBEDDING_MODEL,
            "embedding_model_revision": EMBEDDING_MODEL_REVISION,
            "query_prefix": QUERY_PREFIX,
            "results": results,
        }

        append_jsonl(session_path, event)
        write_json(LATEST_RESULTS_PATH, event)
        print(f"[QUERY {query_count}] Persist full evidence/provenance ... SUCCESS")
        print_results(results)

    print()
    if query_count:
        print("INTERACTIVE SESSION COMPLETE: SUCCESS")
        print(f"Questions tested: {query_count}")
        print(f"Session output:   {rel(session_path)}")
        print(f"Latest result:    {rel(LATEST_RESULTS_PATH)}")
    else:
        print("INTERACTIVE SESSION COMPLETE: SUCCESS (no questions submitted)")
    print()
    print("NEXT PIPELINE INPUT")
    print("  rag-corpus/retrieval/retrieval-config.json")
    print("  rag-corpus/retrieval/test-results/")
    print()
    print("Next decision: evaluate whether exact semantic retrieval is good enough before")
    print("adding reranking, metadata filters, website packaging, or an answer-generation layer.")


# ---------------------------------------------------------------------------
# User-facing pipeline
# ---------------------------------------------------------------------------


def print_header() -> None:
    print("Portfolio GitHub RAG pipeline — Step 4 v1: FREE LOCAL exact retrieval validation")
    print(f"Working directory: {BASE_DIR}")
    print()
    print("COST / EXECUTION")
    print("  Paid API:       NONE")
    print("  API key:        NOT REQUIRED")
    print("  Model training: NONE")
    print("  Retrieval cost: $0")
    print()
    print("INPUT")
    print("  rag-corpus/embeddings/embeddings.npy")
    print("  rag-corpus/embeddings/embedding-records.jsonl")
    print("  rag-corpus/embeddings/embedding-manifest.json")
    print()
    print("OUTPUT")
    print("  rag-corpus/retrieval/retrieval-config.json")
    print("  rag-corpus/retrieval/retrieval-validation-report.txt")
    print("  rag-corpus/retrieval/test-results/")
    print()
    print("RETRIEVAL CONFIGURATION")
    print(f"  Model:       {EMBEDDING_MODEL}")
    print(f"  Revision:    {EMBEDDING_MODEL_REVISION}")
    print(f"  Dimensions:  {EMBEDDING_DIMENSIONS}")
    print(f"  Query prefix:{' ' if QUERY_PREFIX else ''}{QUERY_PREFIX!r}")
    print(f"  Search:      exact {SIMILARITY}, top {TOP_K}")
    print()


def main() -> int:
    print_header()

    try:
        print("[1/10] Validate zero-argument invocation and dependencies ...", end=" ", flush=True)
        if len(sys.argv) != 1:
            raise PipelineError(
                f"This script takes no arguments. Run only: python {SCRIPT_NAME}"
            )
        dependency_versions = load_dependencies()
        print(
            "SUCCESS (numpy {numpy}, torch {torch}, sentence-transformers {sentence-transformers})".format(
                **dependency_versions
            )
        )

        print("[2/10] Locate Step 3 input artifacts ...", end=" ", flush=True)
        missing = [p for p in (MATRIX_PATH, RECORDS_PATH, MANIFEST_PATH) if not p.is_file()]
        if missing:
            raise PipelineError(
                "Missing Step 3 input artifact(s): " + ", ".join(rel(p) for p in missing)
            )
        print(
            f"SUCCESS (matrix {MATRIX_PATH.stat().st_size:,} bytes; "
            f"records {RECORDS_PATH.stat().st_size:,} bytes)"
        )

        print("[3/10] Load Step 3 manifest and validate vector-space identity ...", end=" ", flush=True)
        manifest = load_json(MANIFEST_PATH)
        manifest_info = validate_manifest(manifest)
        print(
            f"SUCCESS ({EMBEDDING_MODEL}; revision {EMBEDDING_MODEL_REVISION[:12]}...; "
            f"{EMBEDDING_DIMENSIONS}D)"
        )

        print("[4/10] Load matrix/evidence records and verify artifact hashes ...", end=" ", flush=True)
        matrix, records, artifact_stats = load_and_validate_artifacts(manifest_info)
        print(
            f"SUCCESS ({artifact_stats['vector_count']:,} vectors; "
            f"{artifact_stats['record_count']:,} records)"
        )

        print("[5/10] Validate repository coverage and vector integrity ...", end=" ", flush=True)
        print(
            f"SUCCESS ({artifact_stats['repository_count']}/{artifact_stats['repository_total']} repositories; "
            f"NaN/Inf 0; zero vectors 0; unit normalized)"
        )

        print("[6/10] Run exact-search mathematical self-test ...", end=" ", flush=True)
        self_test = mathematical_self_test(matrix)
        print(
            f"SUCCESS ({self_test['sample_count']} sampled vectors; failures 0; "
            f"min self-similarity {self_test['minimum_self_similarity']:.8f})"
        )

        print("[7/10] Select local query-embedding device ...", end=" ", flush=True)
        device, device_name = choose_device()
        print(f"SUCCESS ({device}: {device_name})")

        print("[8/10] Load and validate the exact pinned local embedding model ...", end=" ", flush=True)
        model = load_pinned_model(device)
        print(
            f"SUCCESS ({EMBEDDING_MODEL}; {NATIVE_DIMENSIONS}D native -> "
            f"{EMBEDDING_DIMENSIONS}D retrieval space)"
        )

        print("[9/10] Validate runtime query embedding path ...", end=" ", flush=True)
        smoke_vector, smoke_tokens = embed_query(
            model, "software engineering evidence across the candidate's repositories"
        )
        if smoke_vector.shape != (EMBEDDING_DIMENSIONS,):
            raise PipelineError("Runtime smoke query produced wrong vector dimensions.")
        smoke_indices, smoke_scores = exact_search(matrix, smoke_vector, top_k=3)
        if len(smoke_indices) != 3 or not all(np.isfinite(smoke_scores[i]) for i in smoke_indices):
            raise PipelineError("Runtime smoke query exact-search validation failed.")
        print(
            f"SUCCESS ({smoke_tokens} tokens -> {EMBEDDING_DIMENSIONS}D; exact top-3 returned)"
        )

        print("[10/10] Write, re-read, and publish retrieval validation artifacts ...", end=" ", flush=True)
        publish_validation_outputs(
            manifest_info=manifest_info,
            artifact_stats=artifact_stats,
            self_test=self_test,
            dependency_versions=dependency_versions,
            device=device,
            device_name=device_name,
        )
        print("SUCCESS")

        print()
        print("STEP 4 INITIALIZATION COMPLETE: SUCCESS")
        print(f"Vectors searchable:             {artifact_stats['vector_count']:,}")
        print(f"Evidence records:               {artifact_stats['record_count']:,}")
        print(
            f"Repositories covered:            {artifact_stats['repository_count']}/"
            f"{artifact_stats['repository_total']}"
        )
        print(f"Embedding model:                {EMBEDDING_MODEL}")
        print(f"Pinned model revision:          {EMBEDDING_MODEL_REVISION}")
        print(f"Stored dimensions:              {EMBEDDING_DIMENSIONS}")
        print(f"Search algorithm:               exact cosine similarity")
        print(f"Approximate vector index:       NONE")
        print(f"Top K:                          {TOP_K}")
        print(f"Paid API requests:              0")
        print(f"API keys required:              0")
        print(f"Model training performed:       NO")
        print(f"Retrieval cost:                 $0")
        print(f"Query embedding device:         {device} ({device_name})")
        print()
        print("OUTPUT")
        print("  rag-corpus/retrieval/retrieval-config.json")
        print("  rag-corpus/retrieval/retrieval-validation-report.txt")
        print("  rag-corpus/retrieval/test-results/")
        print()

        run_interactive_session(model, matrix, records, device)
        return 0

    except PipelineError as exc:
        print("FAILED")
        print()
        print("STEP 4 COMPLETE: FAILED")
        print(f"Reason: {exc}")
        return 1
    except KeyboardInterrupt:
        print("\n\nSTEP 4 COMPLETE: INTERRUPTED")
        return 130
    except Exception as exc:
        print("FAILED")
        print()
        print("STEP 4 COMPLETE: FAILED")
        print(f"Unexpected error: {type(exc).__name__}: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
