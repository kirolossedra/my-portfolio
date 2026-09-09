#!/usr/bin/env python3
"""
validate-pinecone-dense-parity-v2.py

File ID: RAG-PINECONE-PARITY-a53761c3-2c45-4f54-beb6-2f1658adce6f
Version ID: RAG-PINECONE-PARITY-v2.0.0-5b97bdb9-7bd0-478f-8d4a-8f823cc98161
Version: 2.0.0

Purpose
-------
Validate Pinecone as the dense-recall backend for Retrieval v3 using TWO
separate checks:

1. ANN RETRIEVAL PARITY
   Compare Pinecone's approximate nearest-neighbor candidate set against
   exact local cosine search.

2. STORED-VECTOR FIDELITY
   Fetch Pinecone's stored vectors for the compared candidate IDs and
   recompute exact cosine locally. This verifies that vector storage itself
   preserved the active 512-D Nomic vectors.

Why v2 exists
-------------
v1 incorrectly treated Pinecone's ANN-reported score as if it had to match
exhaustive NumPy cosine to <= 0.001. Pinecone is an ANN vector database, so
candidate-set recall is the correct retrieval-parity metric. Exact score
fidelity is validated separately using fetched stored vectors.

This script is location-independent within rag/scripts/. It discovers the
containing rag/ root by walking upward from its own file location.
"""

from __future__ import annotations

import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

SCRIPT_FILE_ID = "RAG-PINECONE-PARITY-a53761c3-2c45-4f54-beb6-2f1658adce6f"
SCRIPT_VERSION_ID = "RAG-PINECONE-PARITY-v2.0.0-5b97bdb9-7bd0-478f-8d4a-8f823cc98161"
SCRIPT_VERSION = "2.0.0"
INDEX_NAME = "portfolio-career-rag-v1"
NAMESPACE = "corpus-v1"
QUERY = "What evidence shows experience with authorization architecture?"
EXPECTED_COUNT = 2808
STORED_DIMENSION = 512
NATIVE_DIMENSION = 768
METRIC = "cosine"
MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"
MODEL_REVISION = "e9b6763023c676ca8431644204f50c2b100d9aab"
QUERY_PREFIX = "search_query: "
TOP_K = 50
DISPLAY_K = 10
MIN_OVERLAP_10 = 0.90
MIN_OVERLAP_25 = 0.90
MIN_OVERLAP_50 = 0.90
MAX_VECTOR_ABS_DELTA = 1e-6
MAX_RECOMPUTED_SCORE_DELTA = 1e-6

SCRIPT_DIR = Path(__file__).resolve().parent

def find_rag_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if candidate.name == "rag" and (candidate / "scripts").is_dir() and (candidate / "rag-corpus").is_dir():
            return candidate
    raise RuntimeError("Could not locate the enclosing rag/ root. Expected this script under rag/scripts/.")

PROJECT_ROOT = find_rag_root(SCRIPT_DIR)
EMBEDDINGS_PATH = PROJECT_ROOT / "rag-corpus" / "embeddings-v2" / "embeddings.npy"
RECORDS_PATH = PROJECT_ROOT / "rag-corpus" / "embeddings-v2" / "embedding-records.jsonl"
MANIFEST_PATH = PROJECT_ROOT / "rag-corpus" / "embeddings-v2" / "embedding-manifest.json"
DOCUMENTS_PATH = PROJECT_ROOT / "rag-corpus" / "retrieval-documents-v2" / "documents.jsonl"
OUTPUT_DIR = PROJECT_ROOT / "rag-corpus" / "pinecone-v1"
REPORT_PATH = OUTPUT_DIR / "dense-parity-validation-v2.json"

def find_dev_vars() -> Path:
    for parent in [SCRIPT_DIR, *SCRIPT_DIR.parents]:
        candidate = parent / ".dev.vars"
        if candidate.is_file():
            return candidate
    raise FileNotFoundError("Could not find .dev.vars while walking upward.")

def load_dev_var(path: Path, key: str) -> str:
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        if name.strip() != key:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        if not value:
            raise RuntimeError(f"{key} is empty in {path}.")
        return value
    raise RuntimeError(f"{key} not found in {path}.")

def load_jsonl(path: Path) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_no, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as exc:
                raise RuntimeError(f"Invalid JSONL {path} line {line_no}: {exc}") from exc
            if not isinstance(obj, dict):
                raise RuntimeError(f"Expected object at {path} line {line_no}.")
            out.append(obj)
    return out

def layer_norm_rows(v: np.ndarray, eps: float = 1e-5) -> np.ndarray:
    v = np.asarray(v, dtype=np.float32)
    mean = v.mean(axis=1, keepdims=True)
    var = ((v - mean) ** 2).mean(axis=1, keepdims=True)
    return (v - mean) / np.sqrt(var + eps)

def l2_rows(v: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(v, axis=1, keepdims=True)
    if np.any(~np.isfinite(norms)) or np.any(norms <= 0):
        raise RuntimeError("Invalid vector norm.")
    return v / norms

def build_query_embedding() -> np.ndarray:
    print("      Loading Nomic model...")
    model = SentenceTransformer(MODEL_NAME, revision=MODEL_REVISION, trust_remote_code=True)
    native = model.encode([QUERY_PREFIX + QUERY], convert_to_numpy=True, normalize_embeddings=False, show_progress_bar=False)
    native = np.asarray(native, dtype=np.float32)
    if native.shape != (1, NATIVE_DIMENSION):
        raise RuntimeError(f"Native query shape {native.shape} != (1, {NATIVE_DIMENSION}).")
    q = layer_norm_rows(native)[:, :STORED_DIMENSION]
    q = l2_rows(q)[0].astype(np.float32, copy=False)
    if q.shape != (STORED_DIMENSION,):
        raise RuntimeError(f"Stored query shape {q.shape} is invalid.")
    return q

def normalize_matches(response: Any) -> list[dict[str, Any]]:
    matches = getattr(response, "matches", None)
    if matches is None and isinstance(response, dict):
        matches = response.get("matches", [])
    result: list[dict[str, Any]] = []
    for m in matches or []:
        if isinstance(m, dict):
            result.append({"document_id": str(m["id"]), "score": float(m["score"])})
        else:
            result.append({"document_id": str(m.id), "score": float(m.score)})
    return result

def fetched_vectors_dict(response: Any) -> dict[str, Any]:
    vectors = getattr(response, "vectors", None)
    if vectors is None and isinstance(response, dict):
        vectors = response.get("vectors", {})
    return dict(vectors or {})

def fetched_values(obj: Any) -> np.ndarray:
    values = obj.get("values") if isinstance(obj, dict) else getattr(obj, "values", None)
    if values is None:
        raise RuntimeError("Fetched Pinecone vector has no values.")
    return np.asarray(values, dtype=np.float32)

def overlap(local: list[str], remote: list[str], k: int) -> dict[str, Any]:
    a, b = set(local[:k]), set(remote[:k])
    shared = a & b
    return {"k": k, "shared": len(shared), "ratio": len(shared) / k, "only_local": sorted(a-b), "only_pinecone": sorted(b-a)}

def main() -> int:
    started = datetime.now(timezone.utc)
    report_file_id = f"RAG-PINECONE-DENSE-PARITY-{uuid.uuid4()}"
    report_version_id = f"RAG-PINECONE-DENSE-PARITY-v2.0.0-{uuid.uuid4()}"
    print("Portfolio Career RAG -> Pinecone dense parity validation v2")
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Query: {QUERY}\n")
    if len(sys.argv) != 1:
        print("[1/9] Zero-argument invocation ........ FAILED"); return 2
    print("[1/9] Zero-argument invocation ........ SUCCESS")
    required = [EMBEDDINGS_PATH, RECORDS_PATH, MANIFEST_PATH, DOCUMENTS_PATH]
    missing = [p for p in required if not p.is_file()]
    if missing:
        print("[2/9] Locate inputs ...................... FAILED")
        for p in missing: print(f"      Missing: {p}")
        return 1
    try:
        dev_vars = find_dev_vars(); api_key = load_dev_var(dev_vars, "PINECONE_API_KEY")
    except Exception as exc:
        print("[2/9] Locate inputs ...................... FAILED"); print(f"      {exc}"); return 1
    print("[2/9] Locate inputs ...................... SUCCESS")
    print(f"      .dev.vars: {dev_vars}")
    print("      PINECONE_API_KEY: loaded (value hidden)")
    try:
        embeddings = np.load(EMBEDDINGS_PATH, allow_pickle=False)
        records = load_jsonl(RECORDS_PATH); documents = load_jsonl(DOCUMENTS_PATH)
        if embeddings.shape != (EXPECTED_COUNT, STORED_DIMENSION): raise RuntimeError(f"Unexpected matrix shape {embeddings.shape}.")
        if embeddings.dtype != np.float32: raise RuntimeError(f"Unexpected dtype {embeddings.dtype}.")
        if not np.isfinite(embeddings).all(): raise RuntimeError("Embedding matrix contains NaN/Inf.")
        if len(records) != EXPECTED_COUNT or len(documents) != EXPECTED_COUNT: raise RuntimeError("Corpus counts do not equal 2,808.")
        docs_by_id = {}
        for doc in documents:
            doc_id = doc["document_id"]
            if doc_id in docs_by_id: raise RuntimeError(f"Duplicate document ID {doc_id}.")
            docs_by_id[doc_id] = doc
        index_to_id: dict[int, str] = {}; id_to_index: dict[str, int] = {}
        for rec in records:
            doc_id = rec["document_id"]; idx = rec["vector_index"]
            if doc_id not in docs_by_id: raise RuntimeError(f"Unknown document ID {doc_id}.")
            if idx in index_to_id: raise RuntimeError(f"Duplicate vector_index {idx}.")
            if doc_id in id_to_index: raise RuntimeError(f"Duplicate embedding ID {doc_id}.")
            if rec.get("embedding_model") != MODEL_NAME: raise RuntimeError(f"Wrong embedding model on {doc_id}.")
            if rec.get("embedding_model_revision") != MODEL_REVISION: raise RuntimeError(f"Wrong embedding revision on {doc_id}.")
            if int(rec.get("embedding_dimensions")) != STORED_DIMENSION: raise RuntimeError(f"Wrong dimension metadata on {doc_id}.")
            index_to_id[int(idx)] = doc_id; id_to_index[doc_id] = int(idx)
        if set(index_to_id) != set(range(EXPECTED_COUNT)): raise RuntimeError("vector_index coverage is incomplete.")
    except Exception as exc:
        print("[3/9] Validate active corpus .............. FAILED"); print(f"      {exc}"); return 1
    print("[3/9] Validate active corpus .............. SUCCESS")
    print(f"      Vectors: {EXPECTED_COUNT}\n      Dimension: {STORED_DIMENSION}")
    try: query = build_query_embedding()
    except Exception as exc:
        print("[4/9] Build query embedding .............. FAILED"); print(f"      {exc}"); return 1
    print("[4/9] Build query embedding .............. SUCCESS")
    print(f"      L2 norm: {np.linalg.norm(query):.8f}")
    try:
        local_scores = embeddings @ query
        local_indices = np.argsort(-local_scores, kind="stable")[:TOP_K]
        local_results = [{"document_id": index_to_id[int(idx)], "score": float(local_scores[int(idx)]), "vector_index": int(idx)} for idx in local_indices]
    except Exception as exc:
        print("[5/9] Exact local cosine search .......... FAILED"); print(f"      {exc}"); return 1
    print("[5/9] Exact local cosine search .......... SUCCESS")
    try:
        pc = Pinecone(api_key=api_key); desc = pc.describe_index(INDEX_NAME)
        if not bool(desc.status.ready): raise RuntimeError("Pinecone index is not Ready.")
        if int(desc.dimension) != STORED_DIMENSION: raise RuntimeError("Pinecone dimension mismatch.")
        if str(desc.metric).lower() != METRIC: raise RuntimeError("Pinecone metric mismatch.")
        index = pc.Index(host=desc.host)
        response = index.query(namespace=NAMESPACE, vector=query.tolist(), top_k=TOP_K, include_metadata=False, include_values=False)
        remote_results = normalize_matches(response)
        if len(remote_results) != TOP_K: raise RuntimeError(f"Pinecone returned {len(remote_results)} / {TOP_K} results.")
        unknown = [r["document_id"] for r in remote_results if r["document_id"] not in docs_by_id]
        if unknown: raise RuntimeError(f"Pinecone returned unknown IDs: {unknown[:5]}")
    except Exception as exc:
        print("[6/9] Pinecone ANN search ................ FAILED"); print(f"      {exc}"); return 1
    print("[6/9] Pinecone ANN search ................ SUCCESS")
    local_ids = [r["document_id"] for r in local_results]; remote_ids = [r["document_id"] for r in remote_results]
    o10, o25, o50 = overlap(local_ids, remote_ids, 10), overlap(local_ids, remote_ids, 25), overlap(local_ids, remote_ids, 50)
    top1_same = local_ids[0] == remote_ids[0]
    ann_checks = {"same_top1": top1_same, "overlap_at_10": o10["ratio"] >= MIN_OVERLAP_10, "overlap_at_25": o25["ratio"] >= MIN_OVERLAP_25, "overlap_at_50": o50["ratio"] >= MIN_OVERLAP_50}
    ann_pass = all(ann_checks.values())
    print("[7/9] ANN candidate parity ............... " + ("SUCCESS" if ann_pass else "FAILED"))
    print(f"      Same top-1: {top1_same}")
    print(f"      Overlap@10: {o10['shared']}/10 ({o10['ratio']:.1%})")
    print(f"      Overlap@25: {o25['shared']}/25 ({o25['ratio']:.1%})")
    print(f"      Overlap@50: {o50['shared']}/50 ({o50['ratio']:.1%})")
    try:
        union_ids = sorted(set(local_ids) | set(remote_ids)); fetched = index.fetch(ids=union_ids, namespace=NAMESPACE); fetched_map = fetched_vectors_dict(fetched)
        if set(fetched_map) != set(union_ids):
            missing_remote = sorted(set(union_ids)-set(fetched_map)); raise RuntimeError(f"Pinecone fetch missing {len(missing_remote)} candidate IDs: {missing_remote[:5]}")
        max_vector_delta = 0.0; max_score_delta = 0.0; fidelity_rows: list[dict[str, Any]] = []
        for doc_id in union_ids:
            local_vector = embeddings[id_to_index[doc_id]]; remote_vector = fetched_values(fetched_map[doc_id])
            if remote_vector.shape != (STORED_DIMENSION,): raise RuntimeError(f"Fetched vector {doc_id} shape {remote_vector.shape} is invalid.")
            vector_delta = float(np.max(np.abs(local_vector-remote_vector)))
            local_exact_score = float(local_vector @ query); fetched_exact_score = float(remote_vector @ query); score_delta = abs(local_exact_score-fetched_exact_score)
            max_vector_delta = max(max_vector_delta, vector_delta); max_score_delta = max(max_score_delta, score_delta)
            fidelity_rows.append({"document_id": doc_id, "max_vector_absolute_delta": vector_delta, "local_exact_cosine": local_exact_score, "fetched_vector_exact_cosine": fetched_exact_score, "recomputed_score_absolute_delta": score_delta})
        storage_checks = {"max_vector_delta_within_tolerance": max_vector_delta <= MAX_VECTOR_ABS_DELTA, "recomputed_cosine_within_tolerance": max_score_delta <= MAX_RECOMPUTED_SCORE_DELTA}
        storage_pass = all(storage_checks.values())
    except Exception as exc:
        print("[8/9] Stored-vector fidelity ............. FAILED"); print(f"      {exc}"); return 1
    print("[8/9] Stored-vector fidelity ............. " + ("SUCCESS" if storage_pass else "FAILED"))
    print(f"      Max vector abs delta: {max_vector_delta:.10g}")
    print(f"      Max recomputed cosine delta: {max_score_delta:.10g}")
    print("\nLOCAL EXACT TOP 10\n------------------")
    for rank, row in enumerate(local_results[:DISPLAY_K], 1):
        doc = docs_by_id[row["document_id"]]; print(f"{rank:2d}. {row['document_id']:<20} score={row['score']:.8f} repo={int(doc.get('repository_index') or 0):03d} {doc.get('repository_name') or ''}")
    print("\nPINECONE ANN TOP 10\n-------------------")
    for rank, row in enumerate(remote_results[:DISPLAY_K], 1):
        doc = docs_by_id[row["document_id"]]; print(f"{rank:2d}. {row['document_id']:<20} ann_score={row['score']:.8f} repo={int(doc.get('repository_index') or 0):03d} {doc.get('repository_name') or ''}")
    overall_pass = ann_pass and storage_pass
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True); finished = datetime.now(timezone.utc)
        report = {"file_id": report_file_id, "version_id": report_version_id, "schema_version": "2.0.0", "generated_at_utc": finished.isoformat(), "generator": {"script": Path(__file__).name, "file_id": SCRIPT_FILE_ID, "version_id": SCRIPT_VERSION_ID, "version": SCRIPT_VERSION}, "query": QUERY, "embedding": {"model": MODEL_NAME, "revision": MODEL_REVISION, "query_prefix": QUERY_PREFIX.strip(), "native_dimension": NATIVE_DIMENSION, "stored_dimension": STORED_DIMENSION}, "pinecone": {"index_name": INDEX_NAME, "namespace": NAMESPACE, "metric": METRIC}, "ann_candidate_parity": {"checks": ann_checks, "same_top1": top1_same, "overlap_at_10": o10, "overlap_at_25": o25, "overlap_at_50": o50, "result": "PASS" if ann_pass else "FAIL"}, "stored_vector_fidelity": {"checks": storage_checks, "maximum_vector_absolute_delta": max_vector_delta, "maximum_recomputed_cosine_delta": max_score_delta, "rows": fidelity_rows, "result": "PASS" if storage_pass else "FAIL"}, "pinecone_ann_reported_scores_note": "Pinecone ANN scores are retained for diagnostics but are not required to numerically equal exhaustive NumPy cosine scores.", "local_top_50": local_results, "pinecone_top_50": remote_results, "overall_result": "PASS" if overall_pass else "FAIL", "duration_seconds": round((finished-started).total_seconds(), 3)}
        REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    except Exception as exc:
        print("[9/9] Write validation report ............ FAILED"); print(f"      {exc}"); return 1
    print("[9/9] Write validation report ............ SUCCESS")
    print(f"      Report: {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    print(f"      File ID: {report_file_id}\n      Version ID: {report_version_id}\n")
    if overall_pass:
        print("PINECONE DENSE BACKEND VALIDATION: PASS")
        print("Pinecone is approved to replace the exact dense candidate-search portion of Retrieval v3."); return 0
    print("PINECONE DENSE BACKEND VALIDATION: FAIL"); print("Do not integrate Pinecone into Retrieval v3 yet."); return 1

if __name__ == "__main__":
    raise SystemExit(main())
