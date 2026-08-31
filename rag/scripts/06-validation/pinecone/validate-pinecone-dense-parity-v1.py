#!/usr/bin/env python3
"""
validate-pinecone-dense-parity-v1.py

File ID: RAG-PINECONE-PARITY-90555eec-72f5-434d-9311-66b6aae27688
Version ID: RAG-PINECONE-PARITY-v1.0.0-b324d78a-86fa-4ecf-b4e6-067271e23cf6
Version: 1.0.0

Purpose
-------
Preserved first Pinecone dense-parity validator. This version is superseded as
an acceptance gate because it incorrectly requires ANN-reported scores to match
exhaustive NumPy cosine within 0.001. It remains runnable for historical/debug
comparison.

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

SCRIPT_FILE_ID = "RAG-PINECONE-PARITY-90555eec-72f5-434d-9311-66b6aae27688"
SCRIPT_VERSION_ID = "RAG-PINECONE-PARITY-v1.0.0-b324d78a-86fa-4ecf-b4e6-067271e23cf6"
SCRIPT_VERSION = "1.0.0"
INDEX_NAME = "portfolio-career-rag-v1"
NAMESPACE = "corpus-v1"
QUERY = "What evidence shows experience with authorization architecture?"
EXPECTED_COUNT = 2808
EXPECTED_STORED_DIMENSION = 512
EXPECTED_NATIVE_DIMENSION = 768
EXPECTED_METRIC = "cosine"
MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"
MODEL_REVISION = "e9b6763023c676ca8431644204f50c2b100d9aab"
QUERY_PREFIX = "search_query: "
TOP_K = 50
DISPLAY_TOP_K = 10
SCORE_TOLERANCE = 0.001

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
REPORT_PATH = OUTPUT_DIR / "dense-parity-validation-v1.json"

def find_dev_vars() -> Path:
    for parent in [SCRIPT_DIR, *SCRIPT_DIR.parents]:
        candidate = parent / ".dev.vars"
        if candidate.is_file():
            return candidate
    raise FileNotFoundError("Could not find .dev.vars while walking upward from the script directory.")

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
        if not value: raise RuntimeError(f"{key} exists in {path} but is empty.")
        return value
    raise RuntimeError(f"{key} was not found in {path}.")

def load_json(path: Path) -> dict[str, Any]:
    obj = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(obj, dict): raise RuntimeError(f"Expected JSON object in {path}.")
    return obj

def load_jsonl(path: Path) -> list[dict[str, Any]]:
    records=[]
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip(): continue
            try: obj=json.loads(line)
            except json.JSONDecodeError as exc: raise RuntimeError(f"Invalid JSON in {path} at line {line_number}: {exc}") from exc
            if not isinstance(obj, dict): raise RuntimeError(f"Expected JSON object in {path} at line {line_number}.")
            records.append(obj)
    return records

def layer_norm_rows(vectors: np.ndarray, eps: float = 1e-5) -> np.ndarray:
    vectors=np.asarray(vectors,dtype=np.float32); mean=vectors.mean(axis=1,keepdims=True); variance=((vectors-mean)**2).mean(axis=1,keepdims=True)
    return (vectors-mean)/np.sqrt(variance+eps)

def l2_normalize_rows(vectors: np.ndarray) -> np.ndarray:
    norms=np.linalg.norm(vectors,axis=1,keepdims=True)
    if np.any(~np.isfinite(norms)) or np.any(norms<=0): raise RuntimeError("Cannot L2-normalize query embedding: invalid norm.")
    return vectors/norms

def build_query_embedding() -> np.ndarray:
    print("      Loading Nomic model...")
    model=SentenceTransformer(MODEL_NAME, revision=MODEL_REVISION, trust_remote_code=True)
    native=model.encode([QUERY_PREFIX+QUERY], convert_to_numpy=True, normalize_embeddings=False, show_progress_bar=False)
    native=np.asarray(native,dtype=np.float32)
    if native.shape!=(1,EXPECTED_NATIVE_DIMENSION): raise RuntimeError(f"Native query embedding shape {native.shape} != (1, {EXPECTED_NATIVE_DIMENSION}).")
    normalized=layer_norm_rows(native); truncated=normalized[:,:EXPECTED_STORED_DIMENSION]; query=l2_normalize_rows(truncated)[0].astype(np.float32,copy=False)
    if query.shape!=(EXPECTED_STORED_DIMENSION,): raise RuntimeError(f"Stored query shape {query.shape} is invalid.")
    norm=float(np.linalg.norm(query))
    if not 0.999<=norm<=1.001: raise RuntimeError(f"Stored query L2 norm {norm:.8f} is invalid.")
    return query

def normalize_pinecone_matches(response: Any) -> list[dict[str, Any]]:
    raw_matches=getattr(response,"matches",None)
    if raw_matches is None and isinstance(response,dict): raw_matches=response.get("matches",[])
    result=[]
    for match in raw_matches or []:
        if isinstance(match,dict): match_id=str(match.get("id")); score=float(match.get("score")); metadata=match.get("metadata") or {}
        else: match_id=str(getattr(match,"id")); score=float(getattr(match,"score")); metadata=getattr(match,"metadata",None) or {}
        result.append({"document_id":match_id,"score":score,"metadata":dict(metadata)})
    return result

def overlap_metrics(local_results, remote_results, k):
    local_ids=[item["document_id"] for item in local_results[:k]]; remote_ids=[item["document_id"] for item in remote_results[:k]]; shared=set(local_ids)&set(remote_ids)
    return {"k":k,"shared_count":len(shared),"overlap_ratio":len(shared)/k,"local_ids":local_ids,"pinecone_ids":remote_ids}

def result_summary(item, docs_by_id, rank):
    doc=docs_by_id[item["document_id"]]
    return {"rank":rank,"document_id":item["document_id"],"score":float(item["score"]),"repository_index":doc.get("repository_index"),"repository_name":doc.get("repository_name"),"retrieval_class":doc.get("retrieval_class"),"semantic_area":doc.get("semantic_area"),"evidence_polarity":doc.get("evidence_polarity"),"specificity_score":doc.get("specificity_score")}

def print_top(title, results, docs_by_id):
    print(); print(title); print("-"*len(title))
    for rank,item in enumerate(results[:DISPLAY_TOP_K],1):
        doc=docs_by_id[item["document_id"]]; repo_idx=int(doc.get("repository_index") or 0)
        print(f"{rank:2d}. {item['document_id']:<20} score={item['score']:.8f}  repo={repo_idx:03d} {str(doc.get('repository_name') or '')}  class={str(doc.get('retrieval_class') or '')}  polarity={str(doc.get('evidence_polarity') or '')}")

def main() -> int:
    started=datetime.now(timezone.utc); report_file_id=f"RAG-PINECONE-DENSE-PARITY-{uuid.uuid4()}"; report_version_id=f"RAG-PINECONE-DENSE-PARITY-v1.0.0-{uuid.uuid4()}"
    print("Portfolio Career RAG -> Pinecone dense parity validation v1"); print(f"Project root: {PROJECT_ROOT}"); print(f"Query: {QUERY}\n")
    if len(sys.argv)!=1: print("[1/8] Zero-argument invocation ........ FAILED"); return 2
    print("[1/8] Zero-argument invocation ........ SUCCESS")
    required=[EMBEDDINGS_PATH,RECORDS_PATH,MANIFEST_PATH,DOCUMENTS_PATH]; missing=[p for p in required if not p.is_file()]
    if missing:
        print("[2/8] Locate inputs ...................... FAILED")
        for p in missing: print(f"      Missing: {p}")
        return 1
    try: dev_vars=find_dev_vars(); api_key=load_dev_var(dev_vars,"PINECONE_API_KEY")
    except Exception as exc: print("[2/8] Locate inputs ...................... FAILED"); print(f"      {exc}"); return 1
    print("[2/8] Locate inputs ...................... SUCCESS"); print(f"      .dev.vars: {dev_vars}"); print("      PINECONE_API_KEY: loaded (value hidden)")
    try:
        embeddings=np.load(EMBEDDINGS_PATH,allow_pickle=False); records=load_jsonl(RECORDS_PATH); manifest=load_json(MANIFEST_PATH); documents=load_jsonl(DOCUMENTS_PATH)
        if embeddings.shape!=(EXPECTED_COUNT,EXPECTED_STORED_DIMENSION): raise RuntimeError(f"Embedding matrix shape {embeddings.shape} != ({EXPECTED_COUNT}, {EXPECTED_STORED_DIMENSION}).")
        if embeddings.dtype!=np.float32: raise RuntimeError(f"Embedding matrix dtype {embeddings.dtype} != float32.")
        if len(records)!=EXPECTED_COUNT or len(documents)!=EXPECTED_COUNT: raise RuntimeError("Corpus counts do not equal 2,808.")
        if not np.isfinite(embeddings).all(): raise RuntimeError("Embedding matrix contains NaN or Inf.")
        docs_by_id={}
        for doc in documents:
            doc_id=doc.get("document_id")
            if not doc_id: raise RuntimeError("A retrieval document is missing document_id.")
            if doc_id in docs_by_id: raise RuntimeError(f"Duplicate document_id: {doc_id}")
            docs_by_id[doc_id]=doc
        record_by_id={}; vector_index_to_id={}
        for rec in records:
            doc_id=rec.get("document_id"); vector_index=rec.get("vector_index")
            if not doc_id: raise RuntimeError("An embedding record is missing document_id.")
            if doc_id in record_by_id: raise RuntimeError(f"Duplicate embedding record ID: {doc_id}")
            if doc_id not in docs_by_id: raise RuntimeError(f"Embedding record has no retrieval document: {doc_id}")
            if not isinstance(vector_index,int): raise RuntimeError(f"Invalid vector_index for {doc_id}: {vector_index!r}")
            if vector_index in vector_index_to_id: raise RuntimeError(f"Duplicate vector_index {vector_index}.")
            record_by_id[doc_id]=rec; vector_index_to_id[vector_index]=doc_id
        if set(record_by_id)!=set(docs_by_id): raise RuntimeError("Document ID sets are not identical.")
        if set(vector_index_to_id)!=set(range(EXPECTED_COUNT)): raise RuntimeError("vector_index coverage is incomplete.")
        if {str(rec.get('embedding_model')) for rec in records}!={MODEL_NAME}: raise RuntimeError("Unexpected embedding models in records.")
        if {str(rec.get('embedding_model_revision')) for rec in records}!={MODEL_REVISION}: raise RuntimeError("Embedding model revision does not match the parity script.")
        if {int(rec.get('embedding_dimensions')) for rec in records}!={EXPECTED_STORED_DIMENSION}: raise RuntimeError("Unexpected stored dimensions.")
    except Exception as exc: print("[3/8] Validate active corpus .............. FAILED"); print(f"      {exc}"); return 1
    print("[3/8] Validate active corpus .............. SUCCESS")
    try: query_vector=build_query_embedding()
    except Exception as exc: print("[4/8] Build query embedding .............. FAILED"); print(f"      {exc}"); return 1
    print("[4/8] Build query embedding .............. SUCCESS")
    try:
        local_scores=embeddings@query_vector; local_top_indices=np.argsort(-local_scores,kind="stable")[:TOP_K]
        local_results=[{"document_id":vector_index_to_id[int(idx)],"score":float(local_scores[int(idx)]),"vector_index":int(idx)} for idx in local_top_indices]
    except Exception as exc: print("[5/8] Exact local cosine search .......... FAILED"); print(f"      {exc}"); return 1
    print("[5/8] Exact local cosine search .......... SUCCESS")
    try:
        pc=Pinecone(api_key=api_key); description=pc.describe_index(INDEX_NAME)
        if not bool(getattr(description.status,"ready",False)): raise RuntimeError(f"Index is not Ready: {description.status}")
        if int(description.dimension)!=EXPECTED_STORED_DIMENSION: raise RuntimeError("Pinecone dimension mismatch.")
        if str(description.metric).lower()!=EXPECTED_METRIC: raise RuntimeError("Pinecone metric mismatch.")
        index=pc.Index(host=description.host); remote_response=index.query(namespace=NAMESPACE,vector=query_vector.tolist(),top_k=TOP_K,include_metadata=True,include_values=False); remote_results=normalize_pinecone_matches(remote_response)
        if len(remote_results)!=TOP_K: raise RuntimeError(f"Pinecone returned {len(remote_results)} results, expected {TOP_K}.")
        unknown=[item["document_id"] for item in remote_results if item["document_id"] not in docs_by_id]
        if unknown: raise RuntimeError(f"Pinecone returned unknown document IDs: {unknown[:5]}")
    except Exception as exc: print("[6/8] Pinecone dense search .............. FAILED"); print(f"      {exc}"); return 1
    print("[6/8] Pinecone dense search .............. SUCCESS")
    try:
        overlap10=overlap_metrics(local_results,remote_results,10); overlap25=overlap_metrics(local_results,remote_results,25); overlap50=overlap_metrics(local_results,remote_results,50)
        remote_score_by_id={item["document_id"]:float(item["score"]) for item in remote_results}; shared_score_deltas=[]
        for local in local_results:
            doc_id=local["document_id"]
            if doc_id not in remote_score_by_id: continue
            local_score=float(local["score"]); remote_score=remote_score_by_id[doc_id]; delta=abs(local_score-remote_score)
            shared_score_deltas.append({"document_id":doc_id,"local_score":local_score,"pinecone_score":remote_score,"absolute_delta":delta})
        max_score_delta=max((item["absolute_delta"] for item in shared_score_deltas),default=float("inf")); top1_same=local_results[0]["document_id"]==remote_results[0]["document_id"]
        checks={"top1_same_document":top1_same,"top10_overlap_at_least_90_percent":overlap10["overlap_ratio"]>=0.90,"top25_overlap_at_least_90_percent":overlap25["overlap_ratio"]>=0.90,"top50_overlap_at_least_90_percent":overlap50["overlap_ratio"]>=0.90,"shared_score_delta_within_tolerance":max_score_delta<=SCORE_TOLERANCE}; overall_pass=all(checks.values())
    except Exception as exc: print("[7/8] Compare local vs Pinecone .......... FAILED"); print(f"      {exc}"); return 1
    print("[7/8] Compare local vs Pinecone .......... SUCCESS"); print(f"      Same top-1: {top1_same}"); print(f"      Overlap@10: {overlap10['shared_count']}/10 ({overlap10['overlap_ratio']:.1%})"); print(f"      Overlap@25: {overlap25['shared_count']}/25 ({overlap25['overlap_ratio']:.1%})"); print(f"      Overlap@50: {overlap50['shared_count']}/50 ({overlap50['overlap_ratio']:.1%})"); print(f"      Max shared score delta: {max_score_delta:.10f}")
    print_top("LOCAL EXACT COSINE TOP 10",local_results,docs_by_id); print_top("PINECONE COSINE TOP 10",remote_results,docs_by_id)
    try:
        OUTPUT_DIR.mkdir(parents=True,exist_ok=True); finished=datetime.now(timezone.utc)
        report={"file_id":report_file_id,"version_id":report_version_id,"schema_version":"1.0.0","generated_at_utc":finished.isoformat(),"generator":{"script":Path(__file__).name,"file_id":SCRIPT_FILE_ID,"version_id":SCRIPT_VERSION_ID,"version":SCRIPT_VERSION},"query":QUERY,"embedding":{"model":MODEL_NAME,"revision":MODEL_REVISION,"query_prefix":QUERY_PREFIX.strip(),"native_dimension":EXPECTED_NATIVE_DIMENSION,"stored_dimension":EXPECTED_STORED_DIMENSION,"stored_query_l2_norm":float(np.linalg.norm(query_vector))},"pinecone":{"index_name":INDEX_NAME,"namespace":NAMESPACE,"dimension":EXPECTED_STORED_DIMENSION,"metric":EXPECTED_METRIC},"criteria":{"top1_must_match":True,"minimum_overlap_at_10":0.90,"minimum_overlap_at_25":0.90,"minimum_overlap_at_50":0.90,"maximum_shared_score_delta":SCORE_TOLERANCE},"checks":checks,"overall_result":"PASS" if overall_pass else "FAIL","comparison":{"overlap_at_10":overlap10,"overlap_at_25":overlap25,"overlap_at_50":overlap50,"maximum_shared_score_delta":max_score_delta,"shared_score_deltas":shared_score_deltas},"local_top_50":[result_summary(item,docs_by_id,rank) for rank,item in enumerate(local_results,1)],"pinecone_top_50":[result_summary(item,docs_by_id,rank) for rank,item in enumerate(remote_results,1)],"duration_seconds":round((finished-started).total_seconds(),3)}
        REPORT_PATH.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    except Exception as exc: print("[8/8] Write validation report ............ FAILED"); print(f"      {exc}"); return 1
    print("[8/8] Write validation report ............ SUCCESS"); print(f"      Report: {REPORT_PATH.relative_to(PROJECT_ROOT)}")
    if overall_pass:
        print("\nDENSE PARITY VALIDATION: PASS"); return 0
    print("\nDENSE PARITY VALIDATION: FAIL"); print("This v1 criterion is superseded; use validate-pinecone-dense-parity-v2.py as the acceptance gate."); return 1

if __name__ == "__main__":
    raise SystemExit(main())
