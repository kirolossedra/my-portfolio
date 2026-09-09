#!/usr/bin/env python3
"""
upsert-pinecone-v1.py

File ID: RAG-PINECONE-UPLOADER-a2749bcb-b781-4e82-af03-24889097b52a
Version ID: RAG-PINECONE-UPLOADER-v1.0.0-31799700-4c06-4f27-8d69-b3acc2fc71d0
Version: 1.0.0

Purpose
-------
Bulk-upload the already validated active RAG embeddings and compact,
filterable metadata into the Pinecone serverless index.

This script is location-independent within rag/scripts/. It discovers the
containing rag/ root by walking upward from its own file location.

INPUT
-----
rag-corpus/embeddings-v2/embeddings.npy
rag-corpus/embeddings-v2/embedding-records.jsonl
rag-corpus/retrieval-documents-v2/documents.jsonl
<portfolio-root>/.dev.vars  [PINECONE_API_KEY only]

PINECONE TARGET
---------------
Index:     portfolio-career-rag-v1
Namespace: corpus-v1
Vector:    dense, 512 dimensions
Metric:    cosine

OUTPUT
------
rag-corpus/pinecone-v1/pinecone-upsert-validation-v1.json

Safety / validation
-------------------
- Takes zero command-line arguments.
- Never prints the API key.
- Verifies the Pinecone index is Ready, dense, 512-D, cosine.
- Verifies all 2,808 local vectors and document IDs align.
- Uses each embedding record's vector_index rather than trusting line order.
- Uploads compact metadata only; full evidence text remains in the local corpus.
- Upserts in bounded batches.
- Polls Pinecone until the namespace reaches the expected vector count.
- Fetches sample IDs after ingestion for round-trip validation.
- Does not delete any Pinecone records or local files.
"""

from __future__ import annotations

import json
import math
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from pinecone import Pinecone


SCRIPT_FILE_ID = "RAG-PINECONE-UPLOADER-a2749bcb-b781-4e82-af03-24889097b52a"
SCRIPT_VERSION_ID = "RAG-PINECONE-UPLOADER-v1.0.0-31799700-4c06-4f27-8d69-b3acc2fc71d0"
SCRIPT_VERSION = "1.0.0"

INDEX_NAME = "portfolio-career-rag-v1"
NAMESPACE = "corpus-v1"
EXPECTED_COUNT = 2808
EXPECTED_DIMENSION = 512
EXPECTED_METRIC = "cosine"
BATCH_SIZE = 100
FRESHNESS_TIMEOUT_SECONDS = 120
FRESHNESS_POLL_SECONDS = 3

SCRIPT_DIR = Path(__file__).resolve().parent


def find_rag_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if candidate.name == "rag" and (candidate / "scripts").is_dir() and (candidate / "rag-corpus").is_dir():
            return candidate
    raise RuntimeError(
        "Could not locate the enclosing rag/ root. Expected this script to live under rag/scripts/."
    )


PROJECT_ROOT = find_rag_root(SCRIPT_DIR)

EMBEDDINGS_PATH = PROJECT_ROOT / "rag-corpus" / "embeddings-v2" / "embeddings.npy"
EMBEDDING_RECORDS_PATH = (
    PROJECT_ROOT / "rag-corpus" / "embeddings-v2" / "embedding-records.jsonl"
)
DOCUMENTS_PATH = (
    PROJECT_ROOT / "rag-corpus" / "retrieval-documents-v2" / "documents.jsonl"
)
OUTPUT_DIR = PROJECT_ROOT / "rag-corpus" / "pinecone-v1"
REPORT_PATH = OUTPUT_DIR / "pinecone-upsert-validation-v1.json"


def find_dev_vars() -> Path:
    for parent in [SCRIPT_DIR, *SCRIPT_DIR.parents]:
        candidate = parent / ".dev.vars"
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        "Could not find .dev.vars by walking upward from the script directory."
    )


def load_dev_var(path: Path, key: str) -> str:
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        if name.strip() != key:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        if not value:
            raise RuntimeError(f"{key} exists in {path} but is empty.")
        return value
    raise RuntimeError(f"{key} was not found in {path}.")


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as exc:
                raise RuntimeError(
                    f"Invalid JSON in {path} at line {line_number}: {exc}"
                ) from exc
            if not isinstance(obj, dict):
                raise RuntimeError(
                    f"Expected JSON object in {path} at line {line_number}."
                )
            records.append(obj)
    return records


def string_list(value: Any, *, max_items: int = 40) -> list[str] | None:
    if not isinstance(value, list):
        return None
    result: list[str] = []
    seen: set[str] = set()
    for item in value:
        if not isinstance(item, (str, int, float, bool)):
            continue
        text = str(item).strip()
        if not text or text in seen:
            continue
        seen.add(text)
        result.append(text)
        if len(result) >= max_items:
            break
    return result or None


def compact_metadata(
    embedding_record: dict[str, Any],
    document: dict[str, Any],
) -> dict[str, Any]:
    metadata: dict[str, Any] = {
        "document_id": document["document_id"],
        "repository_index": int(document["repository_index"]),
        "repository_name": str(document.get("repository_name") or ""),
        "repository_total": int(document.get("repository_total") or 134),
        "retrieval_class": str(document.get("retrieval_class") or ""),
        "semantic_area": str(document.get("semantic_area") or ""),
        "evidence_level": str(document.get("evidence_level") or ""),
        "evidence_polarity": str(document.get("evidence_polarity") or ""),
        "specificity_score": float(document.get("specificity_score") or 0.0),
        "concrete_signal_count": int(document.get("concrete_signal_count") or 0),
        "word_count": int(document.get("word_count") or 0),
        "embedding_model": str(embedding_record.get("embedding_model") or ""),
        "embedding_dimensions": int(
            embedding_record.get("embedding_dimensions") or EXPECTED_DIMENSION
        ),
    }

    for field in ("repository_slug", "repository_url"):
        value = document.get(field)
        if value:
            metadata[field] = str(value)

    topics = string_list(document.get("topics"))
    if topics:
        metadata["topics"] = topics

    evidence_areas = string_list(document.get("evidence_areas"))
    if evidence_areas:
        metadata["evidence_areas"] = evidence_areas

    return {
        key: value
        for key, value in metadata.items()
        if value != "" and value is not None
    }


def namespace_count(stats: Any, namespace: str) -> int:
    namespaces = getattr(stats, "namespaces", None)
    if namespaces is None and isinstance(stats, dict):
        namespaces = stats.get("namespaces", {})

    if not namespaces:
        return 0

    ns = namespaces.get(namespace) if hasattr(namespaces, "get") else None
    if ns is None:
        return 0

    count = getattr(ns, "vector_count", None)
    if count is None and isinstance(ns, dict):
        count = ns.get("vector_count", 0)
    return int(count or 0)


def write_report(report: dict[str, Any]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    started = datetime.now(timezone.utc)
    report_file_id = f"RAG-PINECONE-VALIDATION-{uuid.uuid4()}"
    report_version_id = f"RAG-PINECONE-VALIDATION-v1.0.0-{uuid.uuid4()}"

    print("Portfolio Career RAG -> Pinecone bulk upsert v1")
    print(f"Project root: {PROJECT_ROOT}")
    print()
    print("INPUT:")
    print(f"  {EMBEDDINGS_PATH.relative_to(PROJECT_ROOT)}")
    print(f"  {EMBEDDING_RECORDS_PATH.relative_to(PROJECT_ROOT)}")
    print(f"  {DOCUMENTS_PATH.relative_to(PROJECT_ROOT)}")
    print()
    print("TARGET:")
    print(f"  Index:     {INDEX_NAME}")
    print(f"  Namespace: {NAMESPACE}")
    print()

    if len(sys.argv) != 1:
        print("[1/8] Zero-argument invocation ........ FAILED")
        print("This script intentionally takes no command-line arguments.")
        return 2
    print("[1/8] Zero-argument invocation ........ SUCCESS")

    required = [EMBEDDINGS_PATH, EMBEDDING_RECORDS_PATH, DOCUMENTS_PATH]
    missing = [p for p in required if not p.is_file()]
    if missing:
        print("[2/8] Locate local inputs .............. FAILED")
        for path in missing:
            print(f"      Missing: {path}")
        return 1

    try:
        dev_vars = find_dev_vars()
        api_key = load_dev_var(dev_vars, "PINECONE_API_KEY")
    except Exception as exc:
        print("[2/8] Locate local inputs .............. FAILED")
        print(f"      {exc}")
        return 1

    print("[2/8] Locate local inputs .............. SUCCESS")
    print(f"      .dev.vars: {dev_vars}")
    print("      PINECONE_API_KEY: loaded (value hidden)")

    try:
        embeddings = np.load(EMBEDDINGS_PATH, allow_pickle=False)
        embedding_records = load_jsonl(EMBEDDING_RECORDS_PATH)
        documents = load_jsonl(DOCUMENTS_PATH)
    except Exception as exc:
        print("[3/8] Load active corpus ................ FAILED")
        print(f"      {exc}")
        return 1

    print("[3/8] Load active corpus ................ SUCCESS")

    try:
        if embeddings.shape != (EXPECTED_COUNT, EXPECTED_DIMENSION):
            raise RuntimeError(
                f"Embedding shape {embeddings.shape} != "
                f"({EXPECTED_COUNT}, {EXPECTED_DIMENSION})."
            )
        if embeddings.dtype != np.float32:
            raise RuntimeError(f"Embedding dtype {embeddings.dtype} != float32.")
        if len(embedding_records) != EXPECTED_COUNT:
            raise RuntimeError(
                f"Embedding record count {len(embedding_records)} != {EXPECTED_COUNT}."
            )
        if len(documents) != EXPECTED_COUNT:
            raise RuntimeError(
                f"Document count {len(documents)} != {EXPECTED_COUNT}."
            )
        if not np.isfinite(embeddings).all():
            raise RuntimeError("Embedding matrix contains NaN or Inf.")

        docs_by_id = {}
        for doc in documents:
            doc_id = doc.get("document_id")
            if not doc_id:
                raise RuntimeError("A retrieval document is missing document_id.")
            if doc_id in docs_by_id:
                raise RuntimeError(f"Duplicate document_id in documents: {doc_id}")
            docs_by_id[doc_id] = doc

        seen_ids: set[str] = set()
        seen_indices: set[int] = set()

        for rec in embedding_records:
            doc_id = rec.get("document_id")
            if not doc_id:
                raise RuntimeError("An embedding record is missing document_id.")
            if doc_id in seen_ids:
                raise RuntimeError(f"Duplicate embedding document_id: {doc_id}")
            seen_ids.add(doc_id)

            if doc_id not in docs_by_id:
                raise RuntimeError(
                    f"Embedding document_id has no retrieval document: {doc_id}"
                )

            vector_index = rec.get("vector_index")
            if not isinstance(vector_index, int):
                raise RuntimeError(
                    f"Invalid vector_index for {doc_id}: {vector_index!r}"
                )
            if not 0 <= vector_index < EXPECTED_COUNT:
                raise RuntimeError(
                    f"Out-of-range vector_index for {doc_id}: {vector_index}"
                )
            if vector_index in seen_indices:
                raise RuntimeError(f"Duplicate vector_index: {vector_index}")
            seen_indices.add(vector_index)

            dims = int(rec.get("embedding_dimensions") or 0)
            if dims != EXPECTED_DIMENSION:
                raise RuntimeError(
                    f"Embedding dimension metadata for {doc_id} is {dims}, "
                    f"expected {EXPECTED_DIMENSION}."
                )

        if seen_ids != set(docs_by_id):
            raise RuntimeError("Embedding/document ID sets are not identical.")
        if seen_indices != set(range(EXPECTED_COUNT)):
            raise RuntimeError("vector_index does not cover exactly 0..2807.")

    except Exception as exc:
        print("[4/8] Validate IDs/vectors ............... FAILED")
        print(f"      {exc}")
        return 1

    print("[4/8] Validate IDs/vectors ............... SUCCESS")
    print(f"      Documents/vectors: {EXPECTED_COUNT}")
    print(f"      Dimensions:        {EXPECTED_DIMENSION}")

    try:
        pc = Pinecone(api_key=api_key)
        description = pc.describe_index(INDEX_NAME)

        if not bool(getattr(description.status, "ready", False)):
            raise RuntimeError(f"Index is not Ready: {description.status}")
        if int(description.dimension) != EXPECTED_DIMENSION:
            raise RuntimeError(
                f"Pinecone dimension {description.dimension} != {EXPECTED_DIMENSION}."
            )
        if str(description.metric).lower() != EXPECTED_METRIC:
            raise RuntimeError(
                f"Pinecone metric {description.metric} != {EXPECTED_METRIC}."
            )
        if str(description.vector_type).lower() != "dense":
            raise RuntimeError(
                f"Pinecone vector type {description.vector_type} != dense."
            )

        index = pc.Index(host=description.host)
        before_count = namespace_count(index.describe_index_stats(), NAMESPACE)
    except Exception as exc:
        print("[5/8] Validate Pinecone target ........... FAILED")
        print(f"      {exc}")
        return 1

    print("[5/8] Validate Pinecone target ........... SUCCESS")
    print(f"      Existing {NAMESPACE} vectors: {before_count}")

    vectors: list[dict[str, Any]] = []
    try:
        for rec in embedding_records:
            doc_id = rec["document_id"]
            vector_index = rec["vector_index"]
            doc = docs_by_id[doc_id]

            values = embeddings[vector_index]
            norm = float(np.linalg.norm(values))
            if not math.isfinite(norm) or not (0.999 <= norm <= 1.001):
                raise RuntimeError(
                    f"Vector {doc_id} has unexpected L2 norm {norm:.8f}."
                )

            vectors.append(
                {
                    "id": doc_id,
                    "values": values.tolist(),
                    "metadata": compact_metadata(rec, doc),
                }
            )
    except Exception as exc:
        print("[6/8] Build Pinecone records ............. FAILED")
        print(f"      {exc}")
        return 1

    print("[6/8] Build Pinecone records ............. SUCCESS")

    total_batches = math.ceil(len(vectors) / BATCH_SIZE)
    uploaded = 0

    try:
        for batch_number, start in enumerate(
            range(0, len(vectors), BATCH_SIZE), start=1
        ):
            batch = vectors[start : start + BATCH_SIZE]
            response = index.upsert(vectors=batch, namespace=NAMESPACE)
            count = int(getattr(response, "upserted_count", len(batch)) or len(batch))
            uploaded += count
            print(
                f"      Batch {batch_number:02d}/{total_batches:02d} "
                f"-> requested {len(batch)} records"
            )
    except Exception as exc:
        print("[7/8] Upsert vectors ..................... FAILED")
        print(f"      Successfully acknowledged before failure: {uploaded}")
        print(f"      {exc}")
        return 1

    print("[7/8] Upsert vectors ..................... SUCCESS")
    print(f"      Requested records: {len(vectors)}")

    deadline = time.time() + FRESHNESS_TIMEOUT_SECONDS
    final_count = -1

    try:
        while time.time() < deadline:
            stats = index.describe_index_stats()
            final_count = namespace_count(stats, NAMESPACE)
            print(
                f"      Data freshness check: {final_count}/{EXPECTED_COUNT}",
                end="\r",
                flush=True,
            )
            if final_count == EXPECTED_COUNT:
                break
            time.sleep(FRESHNESS_POLL_SECONDS)

        print()

        if final_count != EXPECTED_COUNT:
            raise RuntimeError(
                f"Namespace count is {final_count}, expected {EXPECTED_COUNT} "
                f"after {FRESHNESS_TIMEOUT_SECONDS} seconds."
            )

        sample_ids = [
            embedding_records[0]["document_id"],
            embedding_records[len(embedding_records) // 2]["document_id"],
            embedding_records[-1]["document_id"],
        ]

        fetched = index.fetch(ids=sample_ids, namespace=NAMESPACE)
        fetched_vectors = getattr(fetched, "vectors", None)
        if fetched_vectors is None and isinstance(fetched, dict):
            fetched_vectors = fetched.get("vectors", {})

        fetched_ids = set(fetched_vectors.keys()) if fetched_vectors else set()

        if fetched_ids != set(sample_ids):
            raise RuntimeError(
                f"Round-trip fetch mismatch. Expected {sample_ids}, "
                f"received {sorted(fetched_ids)}."
            )

        finished = datetime.now(timezone.utc)

        report = {
            "file_id": report_file_id,
            "version_id": report_version_id,
            "schema_version": "1.0.0",
            "generated_at_utc": finished.isoformat(),
            "generator": {
                "script": Path(__file__).name,
                "file_id": SCRIPT_FILE_ID,
                "version_id": SCRIPT_VERSION_ID,
                "version": SCRIPT_VERSION,
            },
            "source": {
                "embedding_count": EXPECTED_COUNT,
                "embedding_dimensions": EXPECTED_DIMENSION,
                "embedding_dtype": str(embeddings.dtype),
                "document_count": len(documents),
            },
            "pinecone": {
                "index_name": INDEX_NAME,
                "namespace": NAMESPACE,
                "metric": EXPECTED_METRIC,
                "dimension": EXPECTED_DIMENSION,
                "vector_type": "dense",
                "existing_count_before_upsert": before_count,
                "final_namespace_count": final_count,
                "sample_ids_fetched": sample_ids,
            },
            "validation": {
                "local_alignment": "PASS",
                "index_configuration": "PASS",
                "upsert": "PASS",
                "namespace_count": "PASS",
                "round_trip_fetch": "PASS",
            },
            "duration_seconds": round((finished - started).total_seconds(), 3),
        }

        write_report(report)

    except Exception as exc:
        print("[8/8] Verify remote corpus ............... FAILED")
        print(f"      {exc}")
        return 1

    print("[8/8] Verify remote corpus ............... SUCCESS")
    print()
    print("PINECONE INGESTION: SUCCESS")
    print(f"Index:        {INDEX_NAME}")
    print(f"Namespace:    {NAMESPACE}")
    print(f"Vector count: {final_count}")
    print(f"Report:       {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    print(f"File ID:      {report_file_id}")
    print(f"Version ID:   {report_version_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
