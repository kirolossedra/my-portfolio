#!/usr/bin/env python3
"""
Generate validated embedding vectors for the portfolio GitHub RAG corpus.

THIS IS PIPELINE STEP 3.

USAGE
-----
1. Place this script in the project root, beside the existing `rag-corpus/`
   directory produced by Steps 1 and 2.

2. Provide an OpenAI API key either:

       - as environment variable OPENAI_API_KEY, or
       - in project-root `.env.local`, or
       - in project-root `.env`

   Example `.env.local` line:

       OPENAI_API_KEY=sk-...

   Never commit the key to Git.

3. Run the script with NO arguments:

       python generate-rag-embeddings.py

INPUT
-----
Exactly one required corpus input file:

    rag-corpus/chunks/chunks.jsonl

The script embeds ONLY each record's `embedding_text` field. It preserves the
record's authoritative `text` field and metadata for later evidence citation.
The Step 2 file is never modified.

OUTPUT
------
A generated directory:

    rag-corpus/embeddings/
      embeddings.npy
      embedding-records.jsonl
      embedding-manifest.json
      embedding-validation-report.txt

`embeddings.npy` is a float32 matrix whose row number is the `vector_index` in
`embedding-records.jsonl`.

A private resumable work directory may exist while this step is running:

    rag-corpus/.embedding-checkpoint/

It is validated against the exact Step 2 input hash, embedding model,
dimensions, and chunk ordering before reuse, and is removed after successful
publication.

FIXED EMBEDDING CONFIGURATION
-----------------------------
Provider:   OpenAI
Model:      text-embedding-3-large
Dimensions: 3072 (the model's full default dimensionality)
Encoding:   float

The model/dimension pair is intentionally fixed in source code rather than
controlled by an environment variable. A corpus rebuild must not silently move
existing records into a different vector space. If the model is changed later,
make it a deliberate pipeline version change and rebuild every vector.

REQUIRED PYTHON PACKAGES
------------------------
    openai
    numpy

If either package is missing, the script prints the exact installation command
and exits without modifying corpus outputs.

WHAT THIS STEP DOES
-------------------
- validates zero-argument invocation and Python dependencies;
- validates the complete Step 2 chunk corpus and chunk provenance hashes;
- finds the API key without printing or storing it;
- embeds `embedding_text` in deterministic chunk order using batched requests;
- retries transient API failures with bounded exponential backoff;
- recursively splits an API batch if a provider-side size rejection occurs;
- checkpoints successful batches so an interrupted run can resume safely;
- validates response ordering, dimensions, NaN/Inf, zero vectors, duplicate
  IDs, repository coverage, and exact chunk-to-vector referential integrity;
- writes final artifacts to a temporary directory and re-reads them before
  publication;
- atomically replaces only the generated Step 3 output after every validation
  succeeds.

IMPORTANT FOR LATER STEPS
-------------------------
- Use `embeddings.npy` for vector data.
- Use `embedding-records.jsonl` for vector-index -> evidence mapping.
- Cite/display `text`, not `embedding_text`.
- Runtime query embeddings MUST use the same model and dimensions recorded in
  `embedding-manifest.json`.
- Do not expose OPENAI_API_KEY to browser/client-side code.
"""

from __future__ import annotations

import hashlib
import json
import math
import importlib.metadata
import os
import random
import shutil
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Sequence


SCRIPT_NAME = Path(__file__).name
BASE_DIR = Path(__file__).resolve().parent
RAG_DIR = BASE_DIR / "rag-corpus"
INPUT_PATH = RAG_DIR / "chunks" / "chunks.jsonl"
OUTPUT_DIR = RAG_DIR / "embeddings"
TEMP_OUTPUT_DIR = RAG_DIR / ".embeddings.tmp"
CHECKPOINT_DIR = RAG_DIR / ".embedding-checkpoint"

EMBEDDING_SCHEMA_VERSION = "1.0.0"
EXPECTED_CHUNK_SCHEMA_MAJOR = "1"
PROVIDER = "openai"
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSIONS = 3072
ENCODING_FORMAT = "float"
DTYPE_NAME = "float32"

# A conservative request size for this corpus. Step 2 caps source chunks at
# 900 words, so this keeps requests comfortably bounded while avoiding one API
# request per chunk. Provider-side size rejections are split recursively.
BATCH_SIZE = 128
MAX_RETRIES = 7
INITIAL_BACKOFF_SECONDS = 1.5
MAX_BACKOFF_SECONDS = 30.0
REQUEST_TIMEOUT_SECONDS = 90.0

# Optional local credential files. Environment always wins.
ENV_FILES = (BASE_DIR / ".env.local", BASE_DIR / ".env")

# These are populated by load_dependencies() so missing packages can be
# reported cleanly instead of failing before the pipeline prints its stages.
np = None
OpenAI = None
openai_module = None


class PipelineError(RuntimeError):
    pass


class ProviderBatchTooLarge(PipelineError):
    pass


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


def stable_json_dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


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
    records: list[dict[str, Any]] = []
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
            records.append(value)
    if not records:
        raise PipelineError(f"Input file is empty: {rel(path)}")
    return records


def load_dependencies() -> tuple[str, str]:
    global np, OpenAI, openai_module

    missing: list[str] = []
    try:
        import numpy as numpy_module
    except ImportError:
        missing.append("numpy")
        numpy_module = None

    try:
        import openai as imported_openai
        from openai import OpenAI as ImportedOpenAI
    except ImportError:
        missing.append("openai")
        imported_openai = None
        ImportedOpenAI = None

    if missing:
        packages = " ".join(missing)
        raise PipelineError(
            "Missing required Python package(s): "
            + ", ".join(missing)
            + "\nInstall them with:\n  python -m pip install "
            + packages
        )

    np = numpy_module
    openai_module = imported_openai
    OpenAI = ImportedOpenAI
    try:
        openai_version = importlib.metadata.version("openai")
    except importlib.metadata.PackageNotFoundError:
        openai_version = str(getattr(imported_openai, "__version__", "unknown"))
    return str(numpy_module.__version__), openai_version


def parse_env_value(raw: str) -> str:
    value = raw.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        value = value[1:-1]
    return value.strip()


def find_api_key() -> tuple[str, str]:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if key:
        return key, "environment variable OPENAI_API_KEY"

    for env_path in ENV_FILES:
        if not env_path.is_file():
            continue
        try:
            lines = env_path.read_text(encoding="utf-8-sig").splitlines()
        except OSError as exc:
            raise PipelineError(f"Could not read credential file {rel(env_path)}: {exc}") from exc

        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            name, raw_value = stripped.split("=", 1)
            if name.strip() == "OPENAI_API_KEY":
                value = parse_env_value(raw_value)
                if value:
                    return value, rel(env_path)

    raise PipelineError(
        "OPENAI_API_KEY was not found. Set it as an environment variable or put "
        "OPENAI_API_KEY=... in project-root .env.local or .env. The script will "
        "never write the key into generated corpus artifacts."
    )


def validate_chunks(chunks: list[dict[str, Any]]) -> dict[str, Any]:
    required = {
        "chunk_schema_version",
        "chunk_id",
        "repository_index",
        "repository_total",
        "repository_name",
        "text",
        "embedding_text",
        "provenance",
    }

    chunk_ids: list[str] = []
    repository_indexes: list[int] = []
    declared_totals: Counter[int] = Counter()
    embedding_hashes: list[str] = []
    total_embedding_chars = 0
    total_authoritative_chars = 0

    for line_number, chunk in enumerate(chunks, start=1):
        missing = sorted(required - set(chunk))
        if missing:
            raise PipelineError(f"Chunk record {line_number} missing fields: {missing}")

        schema = str(chunk.get("chunk_schema_version", ""))
        if schema.split(".", 1)[0] != EXPECTED_CHUNK_SCHEMA_MAJOR:
            raise PipelineError(
                f"Chunk {chunk.get('chunk_id', line_number)!r}: unsupported Step 2 "
                f"schema version {schema!r}; expected major "
                f"{EXPECTED_CHUNK_SCHEMA_MAJOR}."
            )

        chunk_id = str(chunk["chunk_id"]).strip()
        if not chunk_id:
            raise PipelineError(f"Chunk record {line_number}: chunk_id is empty.")
        chunk_ids.append(chunk_id)

        text = chunk["text"]
        embedding_text = chunk["embedding_text"]
        if not isinstance(text, str) or not text.strip():
            raise PipelineError(f"Chunk {chunk_id}: authoritative text is empty.")
        if not isinstance(embedding_text, str) or not embedding_text.strip():
            raise PipelineError(f"Chunk {chunk_id}: embedding_text is empty.")

        try:
            repo_index = int(chunk["repository_index"])
            repo_total = int(chunk["repository_total"])
        except (TypeError, ValueError) as exc:
            raise PipelineError(f"Chunk {chunk_id}: invalid repository index/total.") from exc

        repository_indexes.append(repo_index)
        declared_totals[repo_total] += 1

        provenance = chunk["provenance"]
        if not isinstance(provenance, dict):
            raise PipelineError(f"Chunk {chunk_id}: provenance is not an object.")
        expected_text_hash = provenance.get("chunk_text_sha256")
        if not expected_text_hash:
            raise PipelineError(f"Chunk {chunk_id}: provenance.chunk_text_sha256 missing.")
        if sha256_text(text) != expected_text_hash:
            raise PipelineError(f"Chunk {chunk_id}: authoritative text SHA-256 mismatch.")

        embedding_hashes.append(sha256_text(embedding_text))
        total_embedding_chars += len(embedding_text)
        total_authoritative_chars += len(text)

    duplicates = sorted(cid for cid, count in Counter(chunk_ids).items() if count > 1)
    if duplicates:
        raise PipelineError(f"Duplicate chunk IDs in Step 2 input: {duplicates[:20]}")

    if len(declared_totals) != 1:
        raise PipelineError(
            f"Conflicting repository_total values in Step 2 input: {dict(declared_totals)}"
        )
    expected_repo_total = next(iter(declared_totals))
    actual_repo_indexes = set(repository_indexes)
    expected_repo_indexes = set(range(1, expected_repo_total + 1))
    missing_repos = sorted(expected_repo_indexes - actual_repo_indexes)
    extra_repos = sorted(actual_repo_indexes - expected_repo_indexes)
    if missing_repos or extra_repos:
        raise PipelineError(
            "Repository coverage mismatch in Step 2 chunks: "
            f"missing={missing_repos or 'none'}, extra={extra_repos or 'none'}"
        )

    return {
        "chunk_count": len(chunks),
        "repository_count": len(actual_repo_indexes),
        "repository_total": expected_repo_total,
        "embedding_text_character_total": total_embedding_chars,
        "authoritative_text_character_total": total_authoritative_chars,
        "embedding_text_sha256_order_digest": sha256_text("\n".join(embedding_hashes)),
        "chunk_id_order_digest": sha256_text("\n".join(chunk_ids)),
    }


def checkpoint_identity(input_sha256: str, chunks: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "checkpoint_schema_version": "1.0.0",
        "input_path": rel(INPUT_PATH),
        "input_sha256": input_sha256,
        "chunk_count": len(chunks),
        "chunk_id_order_digest": sha256_text(
            "\n".join(str(chunk["chunk_id"]) for chunk in chunks)
        ),
        "provider": PROVIDER,
        "embedding_model": EMBEDDING_MODEL,
        "embedding_dimensions": EMBEDDING_DIMENSIONS,
        "encoding_format": ENCODING_FORMAT,
        "batch_size": BATCH_SIZE,
    }


def prepare_checkpoint(identity: dict[str, Any]) -> tuple[int, int]:
    state_path = CHECKPOINT_DIR / "checkpoint.json"
    resumed_batches = 0
    stale_removed = 0

    if CHECKPOINT_DIR.exists():
        if not state_path.is_file():
            shutil.rmtree(CHECKPOINT_DIR)
            stale_removed = 1
        else:
            try:
                existing = json.loads(state_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                shutil.rmtree(CHECKPOINT_DIR)
                stale_removed = 1
            else:
                if existing != identity:
                    shutil.rmtree(CHECKPOINT_DIR)
                    stale_removed = 1

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    write_json(state_path, identity)

    for path in CHECKPOINT_DIR.glob("batch-*.npz"):
        resumed_batches += 1

    return resumed_batches, stale_removed


def batch_checkpoint_path(start: int, end: int) -> Path:
    return CHECKPOINT_DIR / f"batch-{start:06d}-{end - 1:06d}.npz"


def save_batch_checkpoint(
    path: Path,
    start: int,
    end: int,
    chunk_ids: Sequence[str],
    vectors: Any,
    prompt_tokens: int,
    api_requests: int,
) -> None:
    temp_path = path.with_suffix(".tmp.npz")
    np.savez(
        temp_path,
        start=np.asarray([start], dtype=np.int64),
        end=np.asarray([end], dtype=np.int64),
        chunk_ids=np.asarray(list(chunk_ids), dtype=np.str_),
        vectors=np.asarray(vectors, dtype=np.float32),
        prompt_tokens=np.asarray([prompt_tokens], dtype=np.int64),
        api_requests=np.asarray([api_requests], dtype=np.int64),
    )
    os.replace(temp_path, path)


def load_batch_checkpoint(
    path: Path,
    start: int,
    end: int,
    expected_chunk_ids: Sequence[str],
) -> tuple[Any, int, int]:
    try:
        with np.load(path, allow_pickle=False) as data:
            stored_start = int(data["start"][0])
            stored_end = int(data["end"][0])
            stored_ids = [str(x) for x in data["chunk_ids"].tolist()]
            vectors = np.asarray(data["vectors"], dtype=np.float32)
            prompt_tokens = int(data["prompt_tokens"][0])
            api_requests = int(data["api_requests"][0])
    except Exception as exc:
        raise PipelineError(f"Checkpoint file is unreadable: {rel(path)}: {exc}") from exc

    expected_rows = end - start
    if stored_start != start or stored_end != end:
        raise PipelineError(f"Checkpoint range mismatch: {rel(path)}")
    if stored_ids != list(expected_chunk_ids):
        raise PipelineError(f"Checkpoint chunk ordering mismatch: {rel(path)}")
    if vectors.shape != (expected_rows, EMBEDDING_DIMENSIONS):
        raise PipelineError(
            f"Checkpoint vector shape mismatch in {rel(path)}: {vectors.shape}; "
            f"expected {(expected_rows, EMBEDDING_DIMENSIONS)}"
        )
    if not np.isfinite(vectors).all():
        raise PipelineError(f"Checkpoint contains NaN/Inf: {rel(path)}")
    if np.any(np.linalg.norm(vectors.astype(np.float64), axis=1) <= 0.0):
        raise PipelineError(f"Checkpoint contains zero vector: {rel(path)}")

    return vectors, prompt_tokens, api_requests


def exception_status_code(exc: Exception) -> int | None:
    code = getattr(exc, "status_code", None)
    try:
        return int(code) if code is not None else None
    except (TypeError, ValueError):
        return None


def is_retryable_exception(exc: Exception) -> bool:
    code = exception_status_code(exc)
    if code in {408, 409, 429}:
        return True
    if code is not None and 500 <= code <= 599:
        return True
    name = type(exc).__name__.lower()
    return any(
        token in name
        for token in (
            "connectionerror",
            "apiconnectionerror",
            "timeout",
            "apitimeouterror",
            "ratelimiterror",
            "internalservererror",
        )
    )


def looks_like_size_rejection(exc: Exception) -> bool:
    code = exception_status_code(exc)
    if code != 400:
        return False
    message = str(exc).casefold()
    indicators = (
        "maximum context length",
        "max_tokens_per_request",
        "maximum number of tokens",
        "too many tokens",
        "input is too long",
        "maximum input",
        "token limit",
    )
    return any(token in message for token in indicators)


def call_embedding_api(client: Any, texts: Sequence[str]) -> tuple[Any, int, int]:
    """Embed one provider request with bounded retries."""
    last_exc: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=list(texts),
                dimensions=EMBEDDING_DIMENSIONS,
                encoding_format=ENCODING_FORMAT,
            )

            data = sorted(response.data, key=lambda item: int(item.index))
            expected_indexes = list(range(len(texts)))
            actual_indexes = [int(item.index) for item in data]
            if actual_indexes != expected_indexes:
                raise PipelineError(
                    "Embedding API response indexes do not match request order: "
                    f"expected {expected_indexes[:5]}... got {actual_indexes[:5]}..."
                )

            vectors = np.asarray([item.embedding for item in data], dtype=np.float32)
            if vectors.shape != (len(texts), EMBEDDING_DIMENSIONS):
                raise PipelineError(
                    f"Embedding API returned shape {vectors.shape}; expected "
                    f"{(len(texts), EMBEDDING_DIMENSIONS)}."
                )
            if not np.isfinite(vectors).all():
                raise PipelineError("Embedding API returned NaN or Inf values.")

            usage = getattr(response, "usage", None)
            prompt_tokens = int(getattr(usage, "prompt_tokens", 0) or 0)
            return vectors, prompt_tokens, 1

        except PipelineError:
            raise
        except Exception as exc:
            last_exc = exc
            if looks_like_size_rejection(exc):
                raise ProviderBatchTooLarge(str(exc)) from exc
            if not is_retryable_exception(exc) or attempt >= MAX_RETRIES:
                status = exception_status_code(exc)
                status_text = f" HTTP {status}" if status is not None else ""
                raise PipelineError(
                    f"Embedding API request failed{status_text} after {attempt} attempt(s): "
                    f"{type(exc).__name__}: {exc}"
                ) from exc

            delay = min(
                MAX_BACKOFF_SECONDS,
                INITIAL_BACKOFF_SECONDS * (2 ** (attempt - 1)),
            )
            delay *= random.uniform(0.8, 1.2)
            print(
                f"        transient {type(exc).__name__}; retry "
                f"{attempt}/{MAX_RETRIES - 1} after {delay:.1f}s"
            )
            time.sleep(delay)

    raise PipelineError(f"Embedding API request failed: {last_exc}")


def embed_texts_resilient(client: Any, texts: Sequence[str]) -> tuple[Any, int, int]:
    """Embed a logical batch, splitting only if the provider rejects its size."""
    try:
        return call_embedding_api(client, texts)
    except ProviderBatchTooLarge as exc:
        if len(texts) <= 1:
            raise PipelineError(
                "A single chunk was rejected as too large by the embedding provider. "
                "Return to Step 2 and reduce that chunk before embedding. Provider "
                f"message: {exc}"
            ) from exc

        midpoint = len(texts) // 2
        left_vectors, left_tokens, left_requests = embed_texts_resilient(
            client, texts[:midpoint]
        )
        right_vectors, right_tokens, right_requests = embed_texts_resilient(
            client, texts[midpoint:]
        )
        return (
            np.concatenate([left_vectors, right_vectors], axis=0),
            left_tokens + right_tokens,
            left_requests + right_requests,
        )


def build_embedding_records(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for vector_index, chunk in enumerate(chunks):
        # Preserve all Step 2 fields verbatim except no numeric vector is placed
        # in JSON. The matrix row is linked through vector_index.
        record = dict(chunk)
        record.update(
            {
                "embedding_schema_version": EMBEDDING_SCHEMA_VERSION,
                "vector_index": vector_index,
                "embedding_provider": PROVIDER,
                "embedding_model": EMBEDDING_MODEL,
                "embedding_dimensions": EMBEDDING_DIMENSIONS,
                "embedding_encoding_format": ENCODING_FORMAT,
                "embedding_text_sha256": sha256_text(str(chunk["embedding_text"])),
            }
        )
        records.append(record)
    return records


def validate_matrix_and_records(
    matrix: Any,
    chunks: list[dict[str, Any]],
    records: list[dict[str, Any]],
) -> dict[str, Any]:
    expected_shape = (len(chunks), EMBEDDING_DIMENSIONS)
    if matrix.shape != expected_shape:
        raise PipelineError(
            f"Embedding matrix shape {matrix.shape} does not match expected {expected_shape}."
        )
    if matrix.dtype != np.float32:
        raise PipelineError(
            f"Embedding matrix dtype is {matrix.dtype}; expected float32."
        )
    if not np.isfinite(matrix).all():
        raise PipelineError("Embedding matrix contains NaN or Inf values.")

    norms = np.linalg.norm(matrix.astype(np.float64), axis=1)
    if np.any(norms <= 0.0):
        bad = np.flatnonzero(norms <= 0.0)[:20].tolist()
        raise PipelineError(f"Embedding matrix contains zero vectors at rows: {bad}")

    if len(records) != len(chunks):
        raise PipelineError(
            f"Embedding record count {len(records)} != chunk count {len(chunks)}."
        )

    seen_ids: set[str] = set()
    repo_indexes: set[int] = set()
    for index, (chunk, record) in enumerate(zip(chunks, records)):
        if int(record.get("vector_index", -1)) != index:
            raise PipelineError(f"Vector index mismatch at row {index}.")
        if record.get("chunk_id") != chunk.get("chunk_id"):
            raise PipelineError(f"Chunk mapping mismatch at vector row {index}.")
        cid = str(record["chunk_id"])
        if cid in seen_ids:
            raise PipelineError(f"Duplicate chunk ID in embedding records: {cid}")
        seen_ids.add(cid)
        repo_indexes.add(int(record["repository_index"]))

        if record.get("text") != chunk.get("text"):
            raise PipelineError(f"Authoritative text changed for chunk {cid}.")
        if record.get("embedding_text") != chunk.get("embedding_text"):
            raise PipelineError(f"Embedding text changed for chunk {cid}.")
        if record.get("embedding_text_sha256") != sha256_text(chunk["embedding_text"]):
            raise PipelineError(f"Embedding text hash mismatch for chunk {cid}.")

    declared_total = int(chunks[0]["repository_total"])
    expected_repos = set(range(1, declared_total + 1))
    if repo_indexes != expected_repos:
        raise PipelineError(
            "Embedding record repository coverage mismatch: "
            f"missing={sorted(expected_repos - repo_indexes)}, "
            f"extra={sorted(repo_indexes - expected_repos)}"
        )

    sorted_norms = np.sort(norms)
    median_norm = float(sorted_norms[len(sorted_norms) // 2])
    return {
        "matrix_shape": [int(matrix.shape[0]), int(matrix.shape[1])],
        "dtype": str(matrix.dtype),
        "vector_count": int(matrix.shape[0]),
        "dimension": int(matrix.shape[1]),
        "repository_count": len(repo_indexes),
        "duplicate_chunk_ids": 0,
        "invalid_vector_count": 0,
        "zero_vector_count": 0,
        "l2_norm_min": float(norms.min()),
        "l2_norm_median": median_norm,
        "l2_norm_max": float(norms.max()),
    }


def assemble_from_checkpoints(
    chunks: list[dict[str, Any]],
    client: Any,
) -> tuple[Any, dict[str, Any]]:
    vector_parts: list[Any] = []
    total_prompt_tokens = 0
    total_api_requests = 0
    new_batches = 0
    resumed_batches = 0
    logical_batch_count = math.ceil(len(chunks) / BATCH_SIZE)

    for logical_batch_number, start in enumerate(range(0, len(chunks), BATCH_SIZE), start=1):
        end = min(start + BATCH_SIZE, len(chunks))
        batch_chunks = chunks[start:end]
        batch_ids = [str(chunk["chunk_id"]) for chunk in batch_chunks]
        checkpoint_path = batch_checkpoint_path(start, end)

        prefix = (
            f"      Batch {logical_batch_number:03d}/{logical_batch_count:03d} "
            f"chunks {start + 1:05d}-{end:05d}"
        )

        loaded_from_checkpoint = False
        if checkpoint_path.is_file():
            try:
                vectors, prompt_tokens, api_requests = load_batch_checkpoint(
                    checkpoint_path, start, end, batch_ids
                )
            except PipelineError as exc:
                print(f"{prefix} ... invalid checkpoint removed ({exc})")
                checkpoint_path.unlink(missing_ok=True)
            else:
                loaded_from_checkpoint = True
                resumed_batches += 1
                print(f"{prefix} ... SUCCESS [checkpoint]")

        if not loaded_from_checkpoint:
            texts = [str(chunk["embedding_text"]) for chunk in batch_chunks]
            vectors, prompt_tokens, api_requests = embed_texts_resilient(client, texts)
            save_batch_checkpoint(
                checkpoint_path,
                start,
                end,
                batch_ids,
                vectors,
                prompt_tokens,
                api_requests,
            )
            # Re-read every new checkpoint immediately so successful progress is
            # proven durable before the next API request begins.
            vectors, stored_tokens, stored_requests = load_batch_checkpoint(
                checkpoint_path, start, end, batch_ids
            )
            if stored_tokens != prompt_tokens or stored_requests != api_requests:
                raise PipelineError(f"Checkpoint accounting mismatch: {rel(checkpoint_path)}")
            new_batches += 1
            print(f"{prefix} ... SUCCESS [API]")

        vector_parts.append(vectors)
        total_prompt_tokens += prompt_tokens
        total_api_requests += api_requests

    matrix = np.concatenate(vector_parts, axis=0).astype(np.float32, copy=False)
    return matrix, {
        "logical_batch_count": logical_batch_count,
        "new_logical_batches": new_batches,
        "resumed_logical_batches": resumed_batches,
        "api_request_count_accounted": total_api_requests,
        "prompt_tokens_accounted": total_prompt_tokens,
    }


def write_temp_outputs(
    matrix: Any,
    records: list[dict[str, Any]],
    chunks: list[dict[str, Any]],
    input_sha256: str,
    input_stats: dict[str, Any],
    vector_stats: dict[str, Any],
    api_stats: dict[str, Any],
    dependency_versions: dict[str, str],
) -> dict[str, Any]:
    if TEMP_OUTPUT_DIR.exists():
        shutil.rmtree(TEMP_OUTPUT_DIR)
    TEMP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    matrix_path = TEMP_OUTPUT_DIR / "embeddings.npy"
    records_path = TEMP_OUTPUT_DIR / "embedding-records.jsonl"
    manifest_path = TEMP_OUTPUT_DIR / "embedding-manifest.json"
    report_path = TEMP_OUTPUT_DIR / "embedding-validation-report.txt"

    np.save(matrix_path, matrix, allow_pickle=False)
    written_records = write_jsonl(records_path, records)
    if written_records != len(chunks):
        raise PipelineError(
            f"Wrote {written_records} embedding records; expected {len(chunks)}."
        )

    # Re-read matrix and JSONL before creating the manifest so published hashes
    # refer only to artifacts already proven readable.
    reloaded_matrix = np.load(matrix_path, mmap_mode="r", allow_pickle=False)
    if reloaded_matrix.shape != matrix.shape or reloaded_matrix.dtype != np.float32:
        raise PipelineError("Re-read validation failed for embeddings.npy.")

    # Validate finite values in bounded row windows to avoid forcing another
    # full matrix copy into memory during the post-write check.
    for start in range(0, reloaded_matrix.shape[0], 512):
        block = np.asarray(reloaded_matrix[start : start + 512])
        if not np.isfinite(block).all():
            raise PipelineError(
                f"Re-read embeddings.npy contains NaN/Inf near row {start}."
            )

    reloaded_records = load_jsonl(records_path)
    if len(reloaded_records) != len(records):
        raise PipelineError(
            f"Re-read record count {len(reloaded_records)} != expected {len(records)}."
        )
    for index, record in enumerate(reloaded_records):
        if int(record.get("vector_index", -1)) != index:
            raise PipelineError(
                f"Re-read embedding-records.jsonl vector_index mismatch at row {index}."
            )
        if record.get("chunk_id") != chunks[index].get("chunk_id"):
            raise PipelineError(
                f"Re-read embedding-records.jsonl chunk mapping mismatch at row {index}."
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
        "input": {
            "path": rel(INPUT_PATH),
            "sha256": input_sha256,
            **input_stats,
        },
        "embedding": {
            "provider": PROVIDER,
            "model": EMBEDDING_MODEL,
            "dimensions": EMBEDDING_DIMENSIONS,
            "encoding_format": ENCODING_FORMAT,
            "dtype": DTYPE_NAME,
            "field_embedded": "embedding_text",
            "authoritative_evidence_field": "text",
            "batch_size": BATCH_SIZE,
        },
        "matrix": vector_stats,
        "api_accounting": api_stats,
        "dependencies": dependency_versions,
        "artifacts": {
            "embeddings.npy": {
                "sha256": artifact_hashes["embeddings.npy"],
                "rows": len(chunks),
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
            "chunk_id_order_preserved": "PASS",
            "authoritative_text_preserved": "PASS",
            "embedding_text_preserved": "PASS",
            "repository_coverage": "PASS",
            "duplicate_chunk_ids": 0,
            "invalid_vectors": 0,
            "nan_or_inf_vectors": 0,
            "zero_vectors": 0,
        },
        "next_pipeline_input": {
            "vectors": "rag-corpus/embeddings/embeddings.npy",
            "records": "rag-corpus/embeddings/embedding-records.jsonl",
            "configuration": "rag-corpus/embeddings/embedding-manifest.json",
        },
    }
    write_json(manifest_path, manifest)

    # Hash the final manifest after writing it. The manifest intentionally does
    # not self-hash because a self-referential digest has no stable fixed point.
    report_lines = [
        "Portfolio GitHub RAG pipeline — Step 3 embedding validation report",
        "",
        "STATUS: PASS",
        "",
        "INPUT",
        f"  {rel(INPUT_PATH)}",
        f"  SHA-256: {input_sha256}",
        f"  Chunks: {len(chunks)}",
        f"  Repositories: {input_stats['repository_count']}/{input_stats['repository_total']}",
        "",
        "EMBEDDING CONFIGURATION",
        f"  Provider: {PROVIDER}",
        f"  Model: {EMBEDDING_MODEL}",
        f"  Dimensions: {EMBEDDING_DIMENSIONS}",
        f"  Encoding: {ENCODING_FORMAT}",
        f"  Matrix dtype: {DTYPE_NAME}",
        f"  Embedded field: embedding_text",
        f"  Authoritative evidence field: text",
        "",
        "VECTOR VALIDATION",
        f"  Matrix shape: {tuple(vector_stats['matrix_shape'])}",
        f"  Valid vectors: {vector_stats['vector_count']}/{len(chunks)}",
        "  Missing vectors: 0",
        "  Duplicate chunk IDs: 0",
        "  NaN/Inf vectors: 0",
        "  Zero vectors: 0",
        f"  L2 norm min/median/max: "
        f"{vector_stats['l2_norm_min']:.6f}/"
        f"{vector_stats['l2_norm_median']:.6f}/"
        f"{vector_stats['l2_norm_max']:.6f}",
        "",
        "API / CHECKPOINT ACCOUNTING",
        f"  Logical batches: {api_stats['logical_batch_count']}",
        f"  Newly embedded batches: {api_stats['new_logical_batches']}",
        f"  Resumed batches: {api_stats['resumed_logical_batches']}",
        f"  Provider requests accounted: {api_stats['api_request_count_accounted']}",
        f"  Prompt tokens accounted: {api_stats['prompt_tokens_accounted']}",
        "",
        "OUTPUT",
        "  rag-corpus/embeddings/embeddings.npy",
        "  rag-corpus/embeddings/embedding-records.jsonl",
        "  rag-corpus/embeddings/embedding-manifest.json",
        "  rag-corpus/embeddings/embedding-validation-report.txt",
        "",
        "REFERENTIAL INTEGRITY",
        "  embeddings.npy row N <-> embedding-records.jsonl vector_index N: PASS",
        "  Step 2 chunk ordering preserved: PASS",
        "  authoritative `text` preserved: PASS",
        "  `embedding_text` preserved and hashed: PASS",
        "  repository coverage: PASS",
        "",
        "NEXT PIPELINE INPUT",
        "  rag-corpus/embeddings/embeddings.npy",
        "  rag-corpus/embeddings/embedding-records.jsonl",
        "  rag-corpus/embeddings/embedding-manifest.json",
        "",
        "For runtime query embeddings, use the exact model and dimensions recorded",
        "in embedding-manifest.json. Never expose the API key in browser code.",
        "",
    ]
    report_path.write_text("\n".join(report_lines), encoding="utf-8", newline="\n")

    # Final re-read of manifest/report plus hashes for the main two data files.
    loaded_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if loaded_manifest.get("input", {}).get("sha256") != input_sha256:
        raise PipelineError("Re-read embedding-manifest.json input hash mismatch.")
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
    backup_dir = RAG_DIR / ".embeddings.previous"
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


def verify_published_output(expected_input_sha256: str, expected_chunk_count: int) -> None:
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
    if manifest.get("matrix", {}).get("vector_count") != expected_chunk_count:
        raise PipelineError("Published manifest vector count mismatch.")

    matrix = np.load(matrix_path, mmap_mode="r", allow_pickle=False)
    if matrix.shape != (expected_chunk_count, EMBEDDING_DIMENSIONS):
        raise PipelineError("Published embeddings.npy shape mismatch.")
    if matrix.dtype != np.float32:
        raise PipelineError("Published embeddings.npy dtype mismatch.")

    record_count = 0
    first_chunk_id = None
    last_chunk_id = None
    with records_path.open("r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            record = json.loads(line)
            if record_count == 0:
                first_chunk_id = record.get("chunk_id")
            last_chunk_id = record.get("chunk_id")
            if int(record.get("vector_index", -1)) != record_count:
                raise PipelineError(
                    f"Published vector_index mismatch at record {record_count}."
                )
            record_count += 1
    if record_count != expected_chunk_count:
        raise PipelineError(
            f"Published embedding record count {record_count} != {expected_chunk_count}."
        )
    if first_chunk_id is None or last_chunk_id is None:
        raise PipelineError("Published embedding records are unexpectedly empty.")


def print_header() -> None:
    print("Portfolio GitHub RAG pipeline — Step 3: embedding generation")
    print(f"Working directory: {BASE_DIR}")
    print()
    print("INPUT")
    print("  rag-corpus/chunks/chunks.jsonl")
    print("  Field embedded: embedding_text")
    print("  Evidence retained: text + all Step 2 metadata")
    print()
    print("OUTPUT")
    print("  rag-corpus/embeddings/embeddings.npy")
    print("  rag-corpus/embeddings/embedding-records.jsonl")
    print("  rag-corpus/embeddings/embedding-manifest.json")
    print("  rag-corpus/embeddings/embedding-validation-report.txt")
    print()
    print("EMBEDDING CONFIGURATION")
    print(f"  Provider:   {PROVIDER}")
    print(f"  Model:      {EMBEDDING_MODEL}")
    print(f"  Dimensions: {EMBEDDING_DIMENSIONS}")
    print(f"  Encoding:   {ENCODING_FORMAT}")
    print()


def main() -> int:
    print_header()
    matrix = None

    try:
        print("[1/10] Validate zero-argument invocation and dependencies ... ", end="", flush=True)
        if len(sys.argv) != 1:
            raise PipelineError(
                f"{SCRIPT_NAME} accepts no command-line arguments. Run: python {SCRIPT_NAME}"
            )
        numpy_version, openai_version = load_dependencies()
        print(f"SUCCESS (numpy {numpy_version}, openai {openai_version})")

        print("[2/10] Locate Step 2 chunk input ... ", end="", flush=True)
        if not INPUT_PATH.is_file():
            raise PipelineError(
                f"Required input not found: {rel(INPUT_PATH)}. Complete Step 2 first."
            )
        input_size = INPUT_PATH.stat().st_size
        input_sha256 = sha256_file(INPUT_PATH)
        print(f"SUCCESS ({input_size:,} bytes)")

        print("[3/10] Load and validate chunk corpus ... ", end="", flush=True)
        chunks = load_jsonl(INPUT_PATH)
        input_stats = validate_chunks(chunks)
        print(
            "SUCCESS "
            f"({input_stats['chunk_count']:,} chunks; "
            f"{input_stats['repository_count']}/{input_stats['repository_total']} repositories)"
        )

        print("[4/10] Resolve credentials and initialize embedding client ... ", end="", flush=True)
        api_key, credential_source = find_api_key()
        try:
            client = OpenAI(
                api_key=api_key,
                timeout=REQUEST_TIMEOUT_SECONDS,
                max_retries=0,
            )
        except Exception as exc:
            raise PipelineError(
                f"Could not initialize OpenAI client: {type(exc).__name__}: {exc}"
            ) from exc
        print(f"SUCCESS (credential source: {credential_source}; key not printed/stored)")

        print("[5/10] Prepare resumable checkpoint state ... ", end="", flush=True)
        identity = checkpoint_identity(input_sha256, chunks)
        existing_batches, stale_removed = prepare_checkpoint(identity)
        details = f"{existing_batches} reusable batch file(s)"
        if stale_removed:
            details += "; stale/incompatible checkpoint reset"
        print(f"SUCCESS ({details})")

        print("[6/10] Generate or resume embedding batches ...")
        matrix, api_stats = assemble_from_checkpoints(chunks, client)
        print(
            "      Embedding batches complete ... SUCCESS "
            f"({api_stats['new_logical_batches']} new, "
            f"{api_stats['resumed_logical_batches']} resumed)"
        )

        print("[7/10] Build vector-to-evidence records ... ", end="", flush=True)
        records = build_embedding_records(chunks)
        if len(records) != len(chunks):
            raise PipelineError("Internal record-building count mismatch.")
        print(f"SUCCESS ({len(records):,} records)")

        print("[8/10] Validate vectors, dimensions, and referential integrity ... ", end="", flush=True)
        vector_stats = validate_matrix_and_records(matrix, chunks, records)
        print(
            "SUCCESS "
            f"(shape {tuple(vector_stats['matrix_shape'])}; "
            "NaN/Inf 0; zero vectors 0; duplicate IDs 0)"
        )

        print("[9/10] Write and re-read temporary output artifacts ... ", end="", flush=True)
        temp_stats = write_temp_outputs(
            matrix=matrix,
            records=records,
            chunks=chunks,
            input_sha256=input_sha256,
            input_stats=input_stats,
            vector_stats=vector_stats,
            api_stats=api_stats,
            dependency_versions={
                "python": sys.version.split()[0],
                "numpy": str(np.__version__),
                "openai": importlib.metadata.version("openai"),
            },
        )
        print(
            "SUCCESS "
            f"(matrix {temp_stats['matrix_bytes']:,} bytes; "
            f"records {temp_stats['records_bytes']:,} bytes)"
        )

        print("[10/10] Publish validated embedding corpus atomically ... ", end="", flush=True)
        publish_temp_output()
        verify_published_output(input_sha256, len(chunks))
        if CHECKPOINT_DIR.exists():
            shutil.rmtree(CHECKPOINT_DIR)
        print("SUCCESS")

        print()
        print("STEP 3 COMPLETE: SUCCESS")
        print(f"Chunks expected:               {len(chunks):,}")
        print(f"Chunks embedded:               {vector_stats['vector_count']:,}")
        print(f"Repositories covered:          {vector_stats['repository_count']}/{input_stats['repository_total']}")
        print(f"Embedding model:               {EMBEDDING_MODEL}")
        print(f"Embedding dimensions:          {EMBEDDING_DIMENSIONS:,}")
        print(f"Vector matrix shape:           {tuple(vector_stats['matrix_shape'])}")
        print(f"Vector dtype:                  {vector_stats['dtype']}")
        print("Missing embeddings:            0")
        print("Duplicate chunk IDs:           0")
        print("Invalid / NaN / Inf vectors:   0")
        print("Zero vectors:                  0")
        print(f"Logical batches:               {api_stats['logical_batch_count']}")
        print(f"New batches this run:          {api_stats['new_logical_batches']}")
        print(f"Resumed batches:               {api_stats['resumed_logical_batches']}")
        print(f"Provider requests accounted:   {api_stats['api_request_count_accounted']}")
        print(f"Prompt tokens accounted:       {api_stats['prompt_tokens_accounted']:,}")
        print()
        print("OUTPUT")
        print("  rag-corpus/embeddings/embeddings.npy")
        print("  rag-corpus/embeddings/embedding-records.jsonl")
        print("  rag-corpus/embeddings/embedding-manifest.json")
        print("  rag-corpus/embeddings/embedding-validation-report.txt")
        print()
        print("NEXT PIPELINE INPUT")
        print("  rag-corpus/embeddings/embeddings.npy")
        print("  rag-corpus/embeddings/embedding-records.jsonl")
        print("  rag-corpus/embeddings/embedding-manifest.json")
        print()
        print("For runtime queries: embed the employer question with the exact model and")
        print("dimensions in embedding-manifest.json; keep the API key server-side only.")
        return 0

    except KeyboardInterrupt:
        print()
        print("STEP 3 INTERRUPTED: NOT COMPLETE")
        print(f"Checkpoint preserved at: {rel(CHECKPOINT_DIR)}")
        print(f"Re-run `python {SCRIPT_NAME}` with no arguments to resume safely.")
        return 130
    except Exception as exc:
        print()
        print("FAILED")
        print()
        print("STEP 3 COMPLETE: FAILED")
        print(f"Reason: {exc}")
        if CHECKPOINT_DIR.exists():
            print(f"Checkpoint preserved: {rel(CHECKPOINT_DIR)}")
            print("Successful compatible batches will be reused on the next run.")
        if TEMP_OUTPUT_DIR.exists():
            shutil.rmtree(TEMP_OUTPUT_DIR, ignore_errors=True)
        return 1
    finally:
        # Do not retain the key in a global. The local string leaves scope when
        # main returns; generated files never contain it.
        matrix = None


if __name__ == "__main__":
    raise SystemExit(main())
