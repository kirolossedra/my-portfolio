#!/usr/bin/env python3
"""
Portfolio GitHub RAG runtime API — Pinecone Retrieval v3 integration.

File ID: RAG-PINECONE-API-de9841ed-372d-4111-aabf-3b470529bbc6
Version ID: RAG-PINECONE-API-v1.0.0-50de3f8b-ca98-4730-be0e-575e7afa3bc8
Version: 1.0.0

ZERO ARGUMENTS.

Run from anywhere after placing this file at:

    runtime/rag-api-pinecone-v1.py

Then:

    python runtime/rag-api-pinecone-v1.py

PURPOSE
-------
Production HTTP retrieval runtime for the portfolio RAG system.

This keeps the evidence-aware Retrieval v3 pipeline intact:

    Employer question
        -> query intent / primary concept analysis
        -> Nomic 512-D query embedding
        -> Pinecone dense ANN recall
        -> BM25 lexical recall
        -> metadata/topic/skill recall
        -> Reciprocal Rank Fusion
        -> primary-concept gate
        -> evidence class / polarity / specificity scoring
        -> pinned local CrossEncoder reranking
        -> CrossEncoder-dominant final ranking
        -> positive-vs-negative evidence gate
        -> semantic duplicate suppression using vectors fetched from Pinecone
        -> repository diversity
        -> top evidence + provenance

PINECONE REPLACES ONLY
----------------------
1. Exact local matrix search used to select dense candidates.
2. Local matrix lookups used for semantic duplicate similarity.

The local embeddings.npy matrix is NOT loaded by this runtime.

LOCAL RUNTIME DATA STILL REQUIRED
---------------------------------
rag-corpus/embeddings-v2/embedding-records.jsonl
rag-corpus/embeddings-v2/embedding-manifest.json

These records are still needed for:
- BM25
- metadata/topic/skill recall
- concept gates
- evidence-quality/polarity logic
- CrossEncoder passages
- provenance
- final evidence text

SECRETS
-------
PINECONE_API_KEY is loaded in this order:
1. Process environment (production)
2. Nearest parent .dev.vars file (local development)

The API key is never returned by the API or printed.

HTTP
----
GET  /health
POST /api/rag/retrieve

POST body:
    {"question": "What evidence shows experience with authorization architecture?"}

This v1 endpoint returns retrieval evidence only.
Gemini generation is intentionally NOT included yet.
"""

from __future__ import annotations

import hashlib
import importlib.metadata
import json
import math
import os
import re
import sys
import threading
import time
from collections import Counter, defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Sequence

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pinecone import Pinecone
import uvicorn


# ---------------------------------------------------------------------------
# Paths / identities
# ---------------------------------------------------------------------------

SCRIPT_NAME = Path(__file__).name
SCRIPT_DIR = Path(__file__).resolve().parent


def locate_project_root() -> Path:
    """Find the project root by locating rag-corpus, independent of CWD."""
    for candidate in [SCRIPT_DIR, *SCRIPT_DIR.parents]:
        if (candidate / "rag-corpus" / "embeddings-v2" / "embedding-records.jsonl").is_file():
            return candidate
    # Expected placement is <project>/runtime/<this-file>.
    return SCRIPT_DIR.parent


BASE_DIR = locate_project_root()
RAG_DIR = BASE_DIR / "rag-corpus"
EMBEDDINGS_DIR = RAG_DIR / "embeddings-v2"
RECORDS_PATH = EMBEDDINGS_DIR / "embedding-records.jsonl"
MANIFEST_PATH = EMBEDDINGS_DIR / "embedding-manifest.json"

RUNTIME_SCHEMA_VERSION = "1.0.0"
RETRIEVAL_SCHEMA_VERSION = "3.1.0-pinecone"

EXPECTED_EMBEDDING_SCHEMA_MAJOR = "3"
EXPECTED_DOCUMENT_SCHEMA_MAJOR = "2"
EXPECTED_PIPELINE_STEP = 3

PROVIDER = "local-sentence-transformers"
EMBEDDING_MODEL = "nomic-ai/nomic-embed-text-v1.5"
EMBEDDING_MODEL_REVISION = "e9b6763023c676ca8431644204f50c2b100d9aab"
NATIVE_DIMENSIONS = 768
EMBEDDING_DIMENSIONS = 512
MAX_SEQUENCE_LENGTH = 8192
QUERY_PREFIX = "search_query: "
DOCUMENT_PREFIX = "search_document: "
DTYPE_NAME = "float32"

RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L6-v2"
RERANKER_MODEL_REVISION = "4bebbd56fc380a66525f95b03d4ec1a4b41a4f1e"
RERANKER_CPU_BATCH = 16
RERANKER_GPU_BATCH = 64

PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "portfolio-career-rag-v1")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "corpus-v1")
PINECONE_METRIC = "cosine"

DENSE_CANDIDATES = 500
BM25_CANDIDATES = 500
METADATA_CANDIDATES = 400
PRE_GATE_LIMIT = 800
RERANK_CANDIDATES = 120
TOP_K = 10
MAX_RESULTS_PER_REPOSITORY = 2
RRF_K = 60.0
SEMANTIC_DUPLICATE_THRESHOLD = 0.955
PINECONE_FETCH_BATCH = 100

WEIGHT_CROSS = 0.64
WEIGHT_DENSE = 0.10
WEIGHT_BM25 = 0.07
WEIGHT_METADATA = 0.06
WEIGHT_RRF = 0.04
WEIGHT_EVIDENCE = 0.09

DISPLAY_TEXT_CHARS = 1200

DEFAULT_ALLOWED_ORIGINS = (
    "https://kirolos.dev,"
    "https://www.kirolos.dev,"
    "http://localhost:5173,"
    "http://127.0.0.1:5173"
)
ALLOWED_ORIGINS = [
    x.strip()
    for x in os.getenv("RAG_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS).split(",")
    if x.strip()
]

API_HOST = os.getenv("RAG_API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("PORT", os.getenv("RAG_API_PORT", "8000")))

np = None
torch = None
F = None
SentenceTransformer = None
CrossEncoder = None

class PipelineError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# General helpers
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


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    try:
        obj = json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as exc:
        raise PipelineError(f"Could not read JSON {rel(path)}: {exc}") from exc
    if not isinstance(obj, dict):
        raise PipelineError(f"Expected a JSON object in {rel(path)}")
    return obj


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    try:
        with path.open("r", encoding="utf-8-sig") as f:
            for line_no, line in enumerate(f, 1):
                if not line.strip():
                    continue
                obj = json.loads(line)
                if not isinstance(obj, dict):
                    raise PipelineError(f"Line {line_no} of {rel(path)} is not a JSON object")
                rows.append(obj)
    except PipelineError:
        raise
    except Exception as exc:
        raise PipelineError(f"Could not read JSONL {rel(path)}: {exc}") from exc
    if not rows:
        raise PipelineError(f"Input is empty: {rel(path)}")
    return rows


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")


def append_jsonl(path: Path, obj: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
        f.write("\n")
        f.flush()
        try:
            os.fsync(f.fileno())
        except OSError:
            pass


def package_version(name: str) -> str:
    try:
        return importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:
        return "unknown"


def version_tuple(value: str) -> tuple[int, ...]:
    nums = re.findall(r"\d+", value)
    return tuple(int(x) for x in nums[:3]) if nums else (0,)


def minmax(values: dict[int, float]) -> dict[int, float]:
    if not values:
        return {}
    lo, hi = min(values.values()), max(values.values())
    if hi - lo <= 1e-12:
        return {k: 1.0 for k in values}
    return {k: (v - lo) / (hi - lo) for k, v in values.items()}


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, float(x)))



# ---------------------------------------------------------------------------
# Dependencies / devices / models
# ---------------------------------------------------------------------------

def load_dependencies() -> dict[str, str]:
    global np, torch, F, SentenceTransformer, CrossEncoder
    try:
        import numpy as _np
        import torch as _torch
        import torch.nn.functional as _F
        from sentence_transformers import SentenceTransformer as _SentenceTransformer
        from sentence_transformers import CrossEncoder as _CrossEncoder
    except Exception as exc:
        raise PipelineError(
            "Required local packages are missing. Install with:\n"
            "  python -m pip install -U numpy sentence-transformers torch\n"
            f"Underlying error: {exc}"
        ) from exc
    np, torch, F = _np, _torch, _F
    SentenceTransformer, CrossEncoder = _SentenceTransformer, _CrossEncoder
    return {
        "numpy": package_version("numpy"),
        "torch": package_version("torch"),
        "sentence-transformers": package_version("sentence-transformers"),
        "transformers": package_version("transformers"),
    }


def select_device() -> tuple[str, str]:
    if torch.cuda.is_available():
        try:
            return "cuda", torch.cuda.get_device_name(0)
        except Exception:
            return "cuda", "CUDA GPU"
    mps = getattr(torch.backends, "mps", None)
    if mps is not None and mps.is_available():
        return "mps", "Apple Metal Performance Shaders"
    return "cpu", "CPU"


def embedding_dimension(model: Any) -> int:
    if hasattr(model, "get_embedding_dimension"):
        return int(model.get_embedding_dimension())
    return int(model.get_sentence_embedding_dimension())


def load_embedding_model(device: str) -> Any:
    try:
        model = SentenceTransformer(
            EMBEDDING_MODEL,
            revision=EMBEDDING_MODEL_REVISION,
            device=device,
            trust_remote_code=True,
        )
        model.eval()
    except Exception as exc:
        raise PipelineError(
            "Could not load pinned local Nomic model. First use may require a free "
            "public Hugging Face download; no API key is required.\n"
            f"Underlying error: {exc}"
        ) from exc
    dim = embedding_dimension(model)
    if dim != NATIVE_DIMENSIONS:
        raise PipelineError(f"Nomic native dimension {dim}; expected {NATIVE_DIMENSIONS}")
    max_seq = int(getattr(model, "max_seq_length", 0) or 0)
    if max_seq != MAX_SEQUENCE_LENGTH:
        raise PipelineError(f"Nomic max sequence {max_seq}; expected {MAX_SEQUENCE_LENGTH}")
    return model


def load_reranker(device: str) -> Any:
    try:
        model = CrossEncoder(
            RERANKER_MODEL,
            revision=RERANKER_MODEL_REVISION,
            device=device,
            trust_remote_code=True,
        )
    except Exception as exc:
        raise PipelineError(
            "Could not load pinned free local CrossEncoder reranker. First use may "
            "require a free public Hugging Face download; no API key is required.\n"
            f"Underlying error: {exc}"
        ) from exc
    return model


def embed_query(model: Any, query: str) -> tuple[Any, int]:
    model_input = QUERY_PREFIX + query.strip()
    tokenizer = model.tokenizer
    tokens = tokenizer(model_input, add_special_tokens=True, truncation=False)
    token_count = len(tokens.get("input_ids", []))
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
            if full.ndim != 2 or int(full.shape[1]) != NATIVE_DIMENSIONS:
                raise PipelineError(f"Unexpected query embedding shape: {tuple(full.shape)}")
            x = F.layer_norm(full, normalized_shape=(full.shape[1],))
            x = x[:, :EMBEDDING_DIMENSIONS]
            x = F.normalize(x, p=2, dim=1)
            vec = x[0].detach().cpu().to(torch.float32).numpy()
    except PipelineError:
        raise
    except Exception as exc:
        raise PipelineError(f"Local query embedding failed: {exc}") from exc
    if vec.shape != (EMBEDDING_DIMENSIONS,) or not np.isfinite(vec).all():
        raise PipelineError("Invalid runtime query vector")
    return np.asarray(vec, dtype=np.float32), token_count



# ---------------------------------------------------------------------------
# Lexical / metadata indexing
# ---------------------------------------------------------------------------

TOKEN_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9+#._/-]*")
STOPWORDS = {
    "a","an","and","are","as","at","be","been","being","by","can","could","did","do","does",
    "for","from","had","has","have","he","her","his","how","i","in","into","is","it","its",
    "me","of","on","or","our","show","shows","that","the","their","them","there","these","they",
    "this","to","was","we","were","what","when","where","which","who","why","will","with","would",
    "candidate","evidence","experience","experiences","project","projects","repository","repositories",
}


def normalize_token(token: str) -> str:
    t = token.casefold().strip("._/-")
    # Very conservative normalization only; technical tokens are preserved.
    if len(t) > 5 and t.endswith("ies"):
        t = t[:-3] + "y"
    elif len(t) > 5 and t.endswith("ing"):
        t = t[:-3]
    elif len(t) > 4 and t.endswith("ed"):
        t = t[:-2]
    elif len(t) > 4 and t.endswith("s") and not t.endswith("ss"):
        t = t[:-1]
    return t


def tokens(text: str, keep_stopwords: bool = False) -> list[str]:
    out = []
    for raw in TOKEN_RE.findall(text or ""):
        t = normalize_token(raw)
        if len(t) < 2:
            continue
        if not keep_stopwords and t in STOPWORDS:
            continue
        out.append(t)
    return out


def skill_names(record: dict[str, Any]) -> list[str]:
    out = []
    for row in record.get("related_skill_ratings") or []:
        if isinstance(row, dict):
            name = str(row.get("skill") or row.get("name") or "").strip()
            if name:
                out.append(name)
    return out


def metadata_text(record: dict[str, Any]) -> str:
    cls = record.get("classification_summary") or {}
    tech = str(cls.get("technical_realm") or "") if isinstance(cls, dict) else ""
    values = [
        str(record.get("repository_name") or ""),
        str(record.get("semantic_area") or "").replace("_", " "),
        str(record.get("retrieval_class") or "").replace("_", " "),
        str(record.get("evidence_level") or "").replace("_", " "),
        tech,
        " ".join(str(x) for x in (record.get("topics") or [])),
        " ".join(str(x) for x in (record.get("evidence_areas") or [])),
        " ".join(skill_names(record)),
    ]
    return "\n".join(values)


@dataclass
class LexicalIndex:
    doc_tf: list[Counter[str]]
    doc_len: list[float]
    doc_freq: Counter[str]
    avg_len: float
    meta_tf: list[Counter[str]]
    meta_freq: Counter[str]
    repeated_source_penalty: list[float]


def build_lexical_index(records: list[dict[str, Any]]) -> LexicalIndex:
    doc_tf: list[Counter[str]] = []
    meta_tf: list[Counter[str]] = []
    doc_len: list[float] = []
    df: Counter[str] = Counter()
    mdf: Counter[str] = Counter()
    repeated_penalty: list[float] = []

    for r in records:
        body_tokens = tokens(str(r.get("text") or ""))
        tf = Counter(body_tokens)
        # Add weighted document metadata to lexical recall without copying text.
        weighted_groups = [
            (r.get("topics") or [], 3),
            (r.get("evidence_areas") or [], 2),
            (skill_names(r), 4),
            ([str(r.get("semantic_area") or "").replace("_", " ")], 3),
        ]
        for values, mult in weighted_groups:
            for value in values:
                for t in tokens(str(value)):
                    tf[t] += mult
        doc_tf.append(tf)
        dl = max(1.0, float(sum(tf.values())))
        doc_len.append(dl)
        for t in tf:
            df[t] += 1

        mtf = Counter(tokens(metadata_text(r)))
        meta_tf.append(mtf)
        for t in mtf:
            mdf[t] += 1

        freqs = []
        for sf in r.get("source_fragments") or []:
            if isinstance(sf, dict):
                try:
                    freqs.append(int(sf.get("template_repository_frequency") or 0))
                except Exception:
                    pass
        high = max(freqs) if freqs else 0
        repeated_penalty.append(min(0.18, max(0, high - 4) * 0.012))

    return LexicalIndex(
        doc_tf=doc_tf,
        doc_len=doc_len,
        doc_freq=df,
        avg_len=sum(doc_len) / max(1, len(doc_len)),
        meta_tf=meta_tf,
        meta_freq=mdf,
        repeated_source_penalty=repeated_penalty,
    )


def bm25_scores(index: LexicalIndex, query_terms: list[str], n_docs: int) -> dict[int, float]:
    if not query_terms:
        return {}
    qtf = Counter(query_terms)
    k1, b = 1.5, 0.72
    scores: dict[int, float] = defaultdict(float)
    for term, qcount in qtf.items():
        df = index.doc_freq.get(term, 0)
        if df <= 0:
            continue
        idf = math.log(1.0 + (n_docs - df + 0.5) / (df + 0.5))
        for i, tf in enumerate(index.doc_tf):
            f = float(tf.get(term, 0))
            if f <= 0:
                continue
            denom = f + k1 * (1.0 - b + b * index.doc_len[i] / index.avg_len)
            scores[i] += idf * ((f * (k1 + 1.0)) / denom) * (1.0 + 0.08 * min(qcount - 1, 2))
    return dict(scores)


def metadata_scores(index: LexicalIndex, query_terms: list[str], n_docs: int) -> dict[int, float]:
    scores: dict[int, float] = defaultdict(float)
    for term in set(query_terms):
        df = index.meta_freq.get(term, 0)
        if not df:
            continue
        idf = math.log(1.0 + n_docs / (1.0 + df))
        for i, tf in enumerate(index.meta_tf):
            f = tf.get(term, 0)
            if f:
                scores[i] += idf * min(float(f), 4.0)
    return dict(scores)


def top_indices_from_array(values: Any, k: int) -> list[int]:
    n = int(values.shape[0])
    if k >= n:
        idx = np.argsort(-values, kind="stable")
    else:
        part = np.argpartition(values, n-k)[n-k:]
        idx = part[np.argsort(-values[part], kind="stable")]
    return [int(x) for x in idx[:k]]


def top_indices_from_dict(values: dict[int, float], k: int) -> list[int]:
    return [i for i, _ in sorted(values.items(), key=lambda x: (-x[1], x[0]))[:k]]


def reciprocal_rank_fusion(rankings: Sequence[Sequence[int]]) -> dict[int, float]:
    out: dict[int, float] = defaultdict(float)
    for ranking in rankings:
        for rank, idx in enumerate(ranking, 1):
            out[int(idx)] += 1.0 / (RRF_K + rank)
    return dict(out)



# ---------------------------------------------------------------------------
# Query understanding / concept gates
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class FacetSpec:
    name: str
    semantic_area: str
    phrases: tuple[str, ...]
    concept_terms: tuple[str, ...]


FACETS: tuple[FacetSpec, ...] = (
    FacetSpec(
        "authorization_access",
        "identity_access_security",
        ("authorization", "access control", "iam", "rbac", "permissions", "permission", "role based", "roles", "session", "signed session", "admin route", "identity", "authentication"),
        ("authorization","authorize","access","control","iam","rbac","permission","role","session","identity","authentication","authenticate","jwt","admin"),
    ),
    FacetSpec(
        "security_privacy",
        "identity_access_security",
        ("security", "privacy", "trust boundary", "secure", "threat"),
        ("security","privacy","secure","threat","trust","credential","secret","encryption","hash"),
    ),
    FacetSpec(
        "testing_quality",
        "testing_quality",
        ("testing", "test", "unit test", "integration test", "end to end", "e2e", "coverage", "quality assurance", "verification"),
        ("test","testing","unit","integration","e2e","coverage","verification","quality","vitest","playwright","pytest"),
    ),
    FacetSpec(
        "backend_api",
        "architecture_system_design",
        ("backend", "api", "server", "service", "database", "distributed system", "system design", "architecture"),
        ("backend","api","server","service","database","distributed","architecture","endpoint","rest","worker","hono","spring"),
    ),
    FacetSpec(
        "deployment_operations",
        "deployment_operations",
        ("deployment", "deploy", "ci/cd", "ci cd", "devops", "cloud", "hosting", "observability", "operations"),
        ("deployment","deploy","ci","cd","devops","cloud","hosting","observability","docker","workflow","pipeline"),
    ),
    FacetSpec(
        "product_ownership",
        "product_responsibility",
        ("product ownership", "product owner", "stakeholder", "requirements", "ownership", "users", "business"),
        ("product","owner","ownership","stakeholder","requirement","user","business","roadmap","scope","decision"),
    ),
    FacetSpec(
        "performance_scale",
        "performance_scale",
        ("performance", "scale", "scalability", "latency", "throughput", "optimization", "load"),
        ("performance","scale","scalability","latency","throughput","optimization","load","benchmark","million"),
    ),
    FacetSpec(
        "engineering_judgment",
        "engineering_judgment",
        ("tradeoff", "trade-off", "engineering judgment", "decision", "maintainability", "modularity"),
        ("tradeoff","decision","judgment","maintainability","modularity","design","refactor"),
    ),
    FacetSpec(
        "authorship_provenance",
        "authorship_provenance",
        ("authorship", "authored", "contribution", "contributed", "provenance", "built himself", "implemented himself"),
        ("authorship","authored","contribution","contributed","provenance","implemented","built"),
    ),
)

LIMITATION_TERMS = (
    "weakest", "weakness", "weaknesses", "limitation", "limitations", "gap", "gaps",
    "missing", "lack", "lacks", "does not prove", "doesn't prove", "not prove", "risk", "risks",
    "concern", "concerns", "problem", "problems", "debt", "failure", "failures",
)
CHRONOLOGY_TERMS = (
    "over time", "evolved", "evolution", "history", "historical", "trajectory", "progressed",
    "progression", "first", "earliest", "latest", "recent", "recently", "timeline", "chronology",
)
POSITIVE_EVIDENCE_TERMS = (
    "evidence", "experience", "demonstrate", "demonstrates", "show", "shows", "built", "implemented",
    "designed", "strongest", "best", "where did", "what has", "what projects",
)
STRONGEST_TERMS = ("strongest", "best", "most convincing", "most sophisticated", "top evidence")


@dataclass
class QueryIntent:
    raw: str
    base_tokens: list[str]
    expanded_tokens: list[str]
    limitation_query: bool
    chronology_query: bool
    positive_evidence_query: bool
    strongest_query: bool
    facets: list[FacetSpec] = field(default_factory=list)
    required_concept_terms: set[str] = field(default_factory=set)
    requested_repository_indexes: set[int] = field(default_factory=set)
    requested_repository_names: set[str] = field(default_factory=set)


def phrase_present(query_low: str, phrase: str) -> bool:
    p = phrase.casefold()
    if " " in p or "/" in p or "-" in p:
        return p in query_low
    return re.search(rf"(?<![a-z0-9]){re.escape(p)}(?![a-z0-9])", query_low) is not None


def analyze_query(query: str, records: list[dict[str, Any]]) -> QueryIntent:
    low = query.casefold().strip()
    base = tokens(query)
    limitation = any(term in low for term in LIMITATION_TERMS)
    chronology = any(term in low for term in CHRONOLOGY_TERMS)
    strongest = any(term in low for term in STRONGEST_TERMS)
    positive = (not limitation) and (any(term in low for term in POSITIVE_EVIDENCE_TERMS) or True)

    scored: list[tuple[int, FacetSpec, list[str]]] = []
    for facet in FACETS:
        matched_phrases = [p for p in facet.phrases if phrase_present(low, p)]
        # Single broad "architecture" should not become the only primary facet if a
        # more specific concept such as authorization is present.
        score = sum(3 if " " in p or len(p) >= 8 else 2 for p in matched_phrases)
        if score:
            scored.append((score, facet, matched_phrases))
    scored.sort(key=lambda x: (-x[0], x[1].name))

    facets: list[FacetSpec] = []
    if scored:
        max_score = scored[0][0]
        specific_names = {facet.name for _, facet, _ in scored if facet.name not in {"backend_api", "security_privacy"}}
        for score, facet, matched_phrases in scored:
            if score < max(2, max_score - 2):
                continue
            # A generic supporting word such as "architecture" must never become
            # a co-primary facet when the query also names a more specific concept
            # such as authorization. This directly prevents generic architecture
            # documents from passing an authorization query's concept gate.
            if facet.name == "backend_api" and specific_names:
                broad_only = set(matched_phrases).issubset({"architecture", "system design", "server", "service"})
                if broad_only:
                    continue
            # authorization_access subsumes broad security when authorization /
            # authentication / access-control vocabulary is explicit.
            if facet.name == "security_privacy" and (
                "authorization_access" in specific_names
                or any(f.name == "authorization_access" for f in facets)
            ):
                continue
            facets.append(facet)
            if len(facets) >= 2:
                break

    required: set[str] = set()
    for facet in facets:
        # Require concept-family vocabulary, not generic supporting vocabulary.
        required.update(normalize_token(x) for x in facet.concept_terms)

    expanded = list(base)
    for facet in facets:
        expanded.extend(normalize_token(x) for x in facet.concept_terms)
    if limitation:
        expanded.extend(["limitation", "missing", "weakness", "risk", "not", "absent"])
    if chronology:
        expanded.extend(["timeline", "evolution", "chronology", "progression", "earliest", "latest"])
    # Keep expansion bounded and deterministic.
    expanded = list(dict.fromkeys(t for t in expanded if t and len(t) >= 2))[:48]

    requested_idx = set(int(x) for x in re.findall(r"\brepo(?:sitory)?\s*#?\s*(\d{1,3})\b", low))
    requested_names: set[str] = set()
    for r in records:
        name = str(r.get("repository_name") or "").casefold()
        if len(name) >= 4 and name in low:
            requested_names.add(name)

    return QueryIntent(
        raw=query,
        base_tokens=base,
        expanded_tokens=expanded,
        limitation_query=limitation,
        chronology_query=chronology,
        positive_evidence_query=positive,
        strongest_query=strongest,
        facets=facets,
        required_concept_terms=required,
        requested_repository_indexes=requested_idx,
        requested_repository_names=requested_names,
    )


def record_searchable_text(record: dict[str, Any]) -> str:
    return "\n".join([
        str(record.get("text") or ""),
        metadata_text(record),
    ]).casefold()


def concept_gate(record: dict[str, Any], intent: QueryIntent) -> tuple[bool, float, dict[str, Any]]:
    """Primary-concept gate. Broad supporting words alone cannot qualify a result."""
    if not intent.facets:
        return True, 1.0, {"reason": "no-specific-facet", "matched_facets": []}

    searchable = record_searchable_text(record)
    meta = metadata_text(record).casefold()
    area = str(record.get("semantic_area") or "")
    matched = []
    best = 0.0
    for facet in intent.facets:
        hits = [t for t in facet.concept_terms if phrase_present(searchable, t)]
        meta_hits = [t for t in facet.concept_terms if phrase_present(meta, t)]
        area_match = area == facet.semantic_area
        # Area by itself is not enough: cleaned semantic areas can still be broad
        # (e.g. security vs authorization). Require at least one concept-family hit.
        if hits:
            score = min(1.0, 0.44 + 0.10 * min(len(set(hits)), 4) + (0.18 if area_match else 0.0) + (0.06 if meta_hits else 0.0))
            matched.append({
                "facet": facet.name,
                "semantic_area_match": area_match,
                "concept_hits": sorted(set(hits))[:12],
                "metadata_hits": sorted(set(meta_hits))[:12],
                "score": round(score, 4),
            })
            best = max(best, score)

    passed = best >= 0.54
    return passed, best, {"reason": "matched" if passed else "primary-concept-missing", "matched_facets": matched}



# ---------------------------------------------------------------------------
# Evidence quality / polarity gates
# ---------------------------------------------------------------------------

LEVEL_BASE = {
    "implemented_or_concrete": 1.00,
    "repository_specific": 0.86,
    "repository_limitation": 0.66,
    "interpretive": 0.58,
    "methodology_or_interpretive": 0.38,
    "conceptual_exposure": 0.32,
    "methodology_template": 0.10,
}


def evidence_quality(record: dict[str, Any], intent: QueryIntent, repeated_penalty: float) -> tuple[float, dict[str, Any]]:
    level = str(record.get("evidence_level") or "")
    rclass = str(record.get("retrieval_class") or "")
    polarity = str(record.get("evidence_polarity") or "neutral")
    base = LEVEL_BASE.get(level, 0.48)
    try:
        specificity = clamp01(float(record.get("specificity_score") or 0.0))
    except Exception:
        specificity = 0.0
    try:
        concrete = max(0, int(record.get("concrete_signal_count") or 0))
    except Exception:
        concrete = 0

    score = 0.58 * base + 0.22 * specificity + 0.20 * min(1.0, concrete / 6.0)
    adjustments: dict[str, float] = {}

    if intent.limitation_query:
        if rclass == "limitation":
            adjustments["limitation_class_bonus"] = 0.16
        if polarity in {"negative", "mixed"}:
            adjustments["negative_evidence_bonus"] = 0.12
        if polarity == "positive" and rclass == "direct_evidence":
            adjustments["positive_only_penalty"] = -0.05
    else:
        if rclass == "direct_evidence":
            adjustments["direct_evidence_bonus"] = 0.12
        elif rclass == "limitation":
            adjustments["limitation_penalty"] = -0.24
        elif rclass == "metadata":
            adjustments["metadata_penalty"] = -0.12
        if polarity == "positive":
            adjustments["positive_polarity_bonus"] = 0.08
        elif polarity == "negative":
            adjustments["negative_polarity_penalty"] = -0.22
        elif polarity == "mixed":
            adjustments["mixed_polarity_penalty"] = -0.05
        if level == "conceptual_exposure":
            adjustments["conceptual_penalty"] = -0.16
        if level in {"methodology_or_interpretive", "methodology_template"}:
            adjustments["methodology_penalty"] = -0.16

    if intent.chronology_query and rclass == "chronology":
        adjustments["chronology_bonus"] = 0.14
    elif not intent.chronology_query and rclass == "chronology":
        adjustments["chronology_off_intent_penalty"] = -0.05

    adjustments["repeated_source_penalty"] = -repeated_penalty
    score += sum(adjustments.values())
    score = clamp01(score)
    return score, {
        "evidence_level": level,
        "retrieval_class": rclass,
        "evidence_polarity": polarity,
        "specificity_score": specificity,
        "concrete_signal_count": concrete,
        "base_level_score": base,
        "adjustments": adjustments,
        "final_evidence_quality": score,
    }


def positive_evidence_eligible(record: dict[str, Any], cross_score: float, intent: QueryIntent) -> bool:
    if intent.limitation_query:
        return True
    polarity = str(record.get("evidence_polarity") or "neutral")
    rclass = str(record.get("retrieval_class") or "")
    level = str(record.get("evidence_level") or "")
    # Negative/limitation material is not deleted from the system. It is simply
    # held back for positive-evidence questions unless the reranker finds it
    # extraordinarily relevant, preserving truthful caveats without polluting
    # the main evidence list.
    if polarity == "negative" or rclass == "limitation":
        return cross_score >= 0.92
    if level == "methodology_template":
        return cross_score >= 0.95
    return True



# ---------------------------------------------------------------------------
# CrossEncoder reranking
# ---------------------------------------------------------------------------

def source_section_labels(record: dict[str, Any]) -> list[str]:
    out = []
    for sf in record.get("source_fragments") or []:
        if not isinstance(sf, dict):
            continue
        path = sf.get("section_path")
        if isinstance(path, list) and path:
            label = " > ".join(str(x) for x in path)
        else:
            label = str(sf.get("section_title") or "")
        if label and label not in out:
            out.append(label)
    return out


def build_rerank_passage(record: dict[str, Any]) -> str:
    topics = ", ".join(str(x) for x in (record.get("topics") or []))
    skills = ", ".join(skill_names(record))
    sections = "; ".join(source_section_labels(record)[:6])
    return (
        f"Repository: {record.get('repository_name')} (#{int(record.get('repository_index', 0)):03d})\n"
        f"Evidence class: {record.get('retrieval_class')}\n"
        f"Evidence polarity: {record.get('evidence_polarity')}\n"
        f"Evidence level: {record.get('evidence_level')}\n"
        f"Semantic area: {record.get('semantic_area')}\n"
        f"Topics: {topics}\n"
        f"Related skills: {skills}\n"
        f"Source sections: {sections}\n"
        f"Repository evidence:\n{record.get('text', '')}"
    )


def cross_encoder_scores(reranker: Any, query: str, candidates: list[int], records: list[dict[str, Any]], device: str) -> dict[int, float]:
    if not candidates:
        return {}
    pairs = [(query, build_rerank_passage(records[i])) for i in candidates]
    batch = RERANKER_GPU_BATCH if device == "cuda" else RERANKER_CPU_BATCH
    try:
        with torch.inference_mode():
            values = reranker.predict(
                pairs,
                batch_size=batch,
                show_progress_bar=False,
                convert_to_numpy=True,
            )
    except TypeError:
        with torch.inference_mode():
            values = reranker.predict(pairs, batch_size=batch, show_progress_bar=False)
    except Exception as exc:
        raise PipelineError(f"Local CrossEncoder reranking failed: {exc}") from exc
    arr = np.asarray(values, dtype=np.float32).reshape(-1)
    if arr.shape[0] != len(candidates) or not np.isfinite(arr).all():
        raise PipelineError("CrossEncoder returned invalid scores")
    # SentenceTransformers normally applies sigmoid for single-label MS MARCO
    # CrossEncoders. Preserve valid [0,1] probabilities; otherwise convert logits.
    out = {}
    for pos, idx in enumerate(candidates):
        raw = float(arr[pos])
        prob = raw if 0.0 <= raw <= 1.0 else 1.0 / (1.0 + math.exp(-max(-40.0, min(40.0, raw))))
        out[idx] = clamp01(prob)
    return out



def requested_repo_match(record: dict[str, Any], intent: QueryIntent) -> bool:
    if not intent.requested_repository_indexes and not intent.requested_repository_names:
        return True
    idx = int(record.get("repository_index", 0))
    name = str(record.get("repository_name") or "").casefold()
    return idx in intent.requested_repository_indexes or name in intent.requested_repository_names


def source_provenance(record: dict[str, Any]) -> list[dict[str, Any]]:
    out = []
    for sf in record.get("source_fragments") or []:
        if not isinstance(sf, dict):
            continue
        out.append({
            "source_file": sf.get("source_file"),
            "source_line_start": sf.get("source_line_start"),
            "source_line_end": sf.get("source_line_end"),
            "section_path": sf.get("section_path"),
            "text_sha256": sf.get("text_sha256"),
        })
    return out


def provenance_label(record: dict[str, Any]) -> str:
    frags = source_provenance(record)
    if not frags:
        prov = record.get("provenance") or {}
        f = prov.get("analysis_source_file") or "unknown"
        line = prov.get("earliest_source_line")
        return f"{f}" + (f" around line {line}" if line else "")
    by_file: dict[str, list[tuple[int, int]]] = defaultdict(list)
    for sf in frags:
        f = str(sf.get("source_file") or "unknown")
        try:
            a, b = int(sf.get("source_line_start")), int(sf.get("source_line_end"))
            by_file[f].append((a, b))
        except Exception:
            pass
    parts = []
    for f, ranges in by_file.items():
        if ranges:
            parts.append(f"{f} lines {min(a for a,_ in ranges)}-{max(b for _,b in ranges)}")
        else:
            parts.append(f)
    return "; ".join(parts)




# ---------------------------------------------------------------------------
# Runtime corpus / Pinecone validation
# ---------------------------------------------------------------------------

def load_pinecone_api_key() -> tuple[str, str]:
    env_value = os.getenv("PINECONE_API_KEY", "").strip()
    if env_value:
        return env_value, "process environment"

    for parent in [SCRIPT_DIR, *SCRIPT_DIR.parents]:
        candidate = parent / ".dev.vars"
        if not candidate.is_file():
            continue
        for raw_line in candidate.read_text(encoding="utf-8-sig").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, value = line.split("=", 1)
            if name.strip() != "PINECONE_API_KEY":
                continue
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
                value = value[1:-1]
            if not value:
                raise PipelineError(f"PINECONE_API_KEY is empty in {candidate}")
            return value, str(candidate)

    raise PipelineError(
        "PINECONE_API_KEY was not found in the process environment or a parent .dev.vars file"
    )


def validate_runtime_manifest(manifest: dict[str, Any]) -> None:
    if int(manifest.get("pipeline_step", -1)) != EXPECTED_PIPELINE_STEP:
        raise PipelineError("Embedding manifest pipeline_step is not 3")

    schema = str(manifest.get("embedding_schema_version", ""))
    if schema and schema.split(".", 1)[0] != EXPECTED_EMBEDDING_SCHEMA_MAJOR:
        raise PipelineError(
            f"Embedding schema {schema!r} does not match expected major "
            f"{EXPECTED_EMBEDDING_SCHEMA_MAJOR}"
        )

    emb = manifest.get("embedding") or {}
    checks = {
        "model": (emb.get("model"), EMBEDDING_MODEL),
        "model_revision": (emb.get("model_revision"), EMBEDDING_MODEL_REVISION),
        "native_dimensions": (int(emb.get("native_dimensions", -1)), NATIVE_DIMENSIONS),
        "stored_dimensions": (int(emb.get("stored_dimensions", -1)), EMBEDDING_DIMENSIONS),
        "runtime_query_prefix": (emb.get("runtime_query_prefix"), QUERY_PREFIX),
    }
    bad = [f"{k}: {actual!r} != {expected!r}" for k, (actual, expected) in checks.items() if actual != expected]
    if bad:
        raise PipelineError("Vector-space identity mismatch: " + "; ".join(bad))

    artifacts = manifest.get("artifacts") or {}
    expected_records_hash = ((artifacts.get("embedding-records.jsonl") or {}).get("sha256"))
    if expected_records_hash and sha256_file(RECORDS_PATH) != expected_records_hash:
        raise PipelineError(
            "embedding-records.jsonl SHA-256 does not match the Step 3 manifest"
        )


def validate_runtime_records(records: list[dict[str, Any]]) -> dict[str, Any]:
    if not records:
        raise PipelineError("Runtime corpus is empty")

    ids: set[str] = set()
    repos: set[int] = set()
    classes = Counter()
    areas = Counter()
    polarities = Counter()

    for i, record in enumerate(records):
        if int(record.get("vector_index", -1)) != i:
            raise PipelineError(f"vector_index mismatch at record {i}")

        document_id = str(record.get("document_id") or "").strip()
        if not document_id:
            raise PipelineError(f"Missing document_id at record {i}")
        if document_id in ids:
            raise PipelineError(f"Duplicate document_id: {document_id}")
        ids.add(document_id)

        schema = str(record.get("document_schema_version", ""))
        if schema.split(".", 1)[0] != EXPECTED_DOCUMENT_SCHEMA_MAJOR:
            raise PipelineError(
                f"Unexpected document schema for {document_id}: {schema}"
            )

        text = str(record.get("text") or "")
        if not text.strip():
            raise PipelineError(f"Empty authoritative text in {document_id}")

        provenance = record.get("provenance") or {}
        expected_text_hash = provenance.get("document_text_sha256")
        if expected_text_hash and sha256_text(text) != expected_text_hash:
            raise PipelineError(
                f"Authoritative text SHA-256 mismatch in {document_id}"
            )

        if int(record.get("embedding_dimensions", EMBEDDING_DIMENSIONS)) != EMBEDDING_DIMENSIONS:
            raise PipelineError(
                f"Embedding dimension mismatch in {document_id}"
            )

        repos.add(int(record.get("repository_index", 0)))
        classes[str(record.get("retrieval_class") or "unknown")] += 1
        areas[str(record.get("semantic_area") or "unknown")] += 1
        polarities[str(record.get("evidence_polarity") or "unknown")] += 1

    declared = {int(record.get("repository_total", 0)) for record in records}
    if len(declared) != 1:
        raise PipelineError(f"Conflicting repository_total values: {sorted(declared)}")

    repo_total = next(iter(declared))
    expected_repos = set(range(1, repo_total + 1))
    if repos != expected_repos:
        raise PipelineError(
            f"Repository coverage mismatch: missing={sorted(expected_repos - repos)}, "
            f"extra={sorted(repos - expected_repos)}"
        )

    return {
        "documents": len(records),
        "repositories": len(repos),
        "repository_total": repo_total,
        "retrieval_classes": dict(classes),
        "semantic_areas": dict(areas),
        "polarities": dict(polarities),
    }


def namespace_vector_count(index: Any, namespace: str) -> int:
    stats = index.describe_index_stats()
    namespaces = getattr(stats, "namespaces", None)
    if namespaces is None and isinstance(stats, dict):
        namespaces = stats.get("namespaces", {})
    if not namespaces:
        return 0

    entry = namespaces.get(namespace) if hasattr(namespaces, "get") else None
    if entry is None:
        return 0

    count = getattr(entry, "vector_count", None)
    if count is None and isinstance(entry, dict):
        count = entry.get("vector_count", 0)
    return int(count or 0)


def connect_pinecone(expected_count: int) -> tuple[Any, dict[str, Any]]:
    api_key, key_source = load_pinecone_api_key()
    client = Pinecone(api_key=api_key)

    description = client.describe_index(PINECONE_INDEX_NAME)
    if not bool(getattr(description.status, "ready", False)):
        raise PipelineError(
            f"Pinecone index {PINECONE_INDEX_NAME!r} is not Ready"
        )
    if int(description.dimension) != EMBEDDING_DIMENSIONS:
        raise PipelineError(
            f"Pinecone dimension {description.dimension} != {EMBEDDING_DIMENSIONS}"
        )
    if str(description.metric).casefold() != PINECONE_METRIC:
        raise PipelineError(
            f"Pinecone metric {description.metric!r} != {PINECONE_METRIC!r}"
        )
    if str(description.vector_type).casefold() != "dense":
        raise PipelineError(
            f"Pinecone vector type {description.vector_type!r} != 'dense'"
        )

    index = client.Index(host=description.host)
    vector_count = namespace_vector_count(index, PINECONE_NAMESPACE)
    if vector_count != expected_count:
        raise PipelineError(
            f"Pinecone namespace {PINECONE_NAMESPACE!r} contains "
            f"{vector_count} vectors; expected {expected_count}"
        )

    return index, {
        "index_name": PINECONE_INDEX_NAME,
        "namespace": PINECONE_NAMESPACE,
        "dimension": int(description.dimension),
        "metric": str(description.metric),
        "vector_type": str(description.vector_type),
        "vector_count": vector_count,
        "key_source": key_source,
    }


def normalize_pinecone_matches(response: Any) -> list[tuple[str, float]]:
    matches = getattr(response, "matches", None)
    if matches is None and isinstance(response, dict):
        matches = response.get("matches", [])

    result: list[tuple[str, float]] = []
    for match in matches or []:
        if isinstance(match, dict):
            document_id = str(match.get("id") or "")
            score = float(match.get("score"))
        else:
            document_id = str(getattr(match, "id"))
            score = float(getattr(match, "score"))

        if document_id:
            result.append((document_id, score))

    return result


def pinecone_dense_recall(
    index: Any,
    query_vector: Any,
    id_to_index: dict[str, int],
    k: int,
) -> tuple[list[int], dict[int, float]]:
    response = index.query(
        namespace=PINECONE_NAMESPACE,
        vector=np.asarray(query_vector, dtype=np.float32).tolist(),
        top_k=k,
        include_metadata=False,
        include_values=False,
    )
    matches = normalize_pinecone_matches(response)

    dense_rank: list[int] = []
    dense_scores: dict[int, float] = {}
    unknown: list[str] = []

    for document_id, score in matches:
        idx = id_to_index.get(document_id)
        if idx is None:
            unknown.append(document_id)
            continue
        if idx in dense_scores:
            continue
        dense_rank.append(idx)
        dense_scores[idx] = float(score)

    if unknown:
        raise PipelineError(
            "Pinecone returned document IDs absent from the local evidence corpus: "
            + ", ".join(unknown[:5])
        )

    expected = min(k, len(id_to_index))
    if len(dense_rank) != expected:
        raise PipelineError(
            f"Pinecone returned {len(dense_rank)} usable dense candidates; "
            f"expected {expected}"
        )

    return dense_rank, dense_scores


def _fetched_vector_map(response: Any) -> dict[str, Any]:
    vectors = getattr(response, "vectors", None)
    if vectors is None and isinstance(response, dict):
        vectors = response.get("vectors", {})
    return dict(vectors or {})


def _fetched_values(vector_obj: Any) -> Any:
    if isinstance(vector_obj, dict):
        values = vector_obj.get("values")
    else:
        values = getattr(vector_obj, "values", None)
    if values is None:
        raise PipelineError("A fetched Pinecone vector has no values")
    arr = np.asarray(values, dtype=np.float32)
    if arr.shape != (EMBEDDING_DIMENSIONS,) or not np.isfinite(arr).all():
        raise PipelineError(
            f"Fetched Pinecone vector shape/integrity invalid: {arr.shape}"
        )
    return arr


def fetch_candidate_vectors(
    index: Any,
    candidate_indices: Sequence[int],
    records: list[dict[str, Any]],
) -> dict[int, Any]:
    unique_indices = list(dict.fromkeys(int(i) for i in candidate_indices))
    result: dict[int, Any] = {}

    for start in range(0, len(unique_indices), PINECONE_FETCH_BATCH):
        batch_indices = unique_indices[start:start + PINECONE_FETCH_BATCH]
        ids = [str(records[i]["document_id"]) for i in batch_indices]

        response = index.fetch(
            ids=ids,
            namespace=PINECONE_NAMESPACE,
        )
        fetched = _fetched_vector_map(response)

        for idx, document_id in zip(batch_indices, ids):
            if document_id not in fetched:
                raise PipelineError(
                    f"Pinecone fetch did not return {document_id}"
                )
            result[idx] = _fetched_values(fetched[document_id])

    return result


# ---------------------------------------------------------------------------
# Retrieval — Pinecone dense recall + original v3 evidence pipeline
# ---------------------------------------------------------------------------

def retrieve(
    query: str,
    pinecone_index: Any,
    records: list[dict[str, Any]],
    id_to_index: dict[str, int],
    lexical: LexicalIndex,
    embedding_model: Any,
    reranker: Any,
    device: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    intent = analyze_query(query, records)
    qvec, token_count = embed_query(embedding_model, query)

    # 1) Broad recall channels.
    dense_rank, dense_scores = pinecone_dense_recall(
        pinecone_index,
        qvec,
        id_to_index,
        min(DENSE_CANDIDATES, len(records)),
    )
    bm_all = bm25_scores(lexical, intent.expanded_tokens, len(records))
    bm_rank = top_indices_from_dict(
        bm_all,
        min(BM25_CANDIDATES, len(records)),
    )
    meta_all = metadata_scores(lexical, intent.expanded_tokens, len(records))
    meta_rank = top_indices_from_dict(
        meta_all,
        min(METADATA_CANDIDATES, len(records)),
    )
    rrf_all = reciprocal_rank_fusion([dense_rank, bm_rank, meta_rank])
    union = set(dense_rank) | set(bm_rank) | set(meta_rank)

    # Pinecone returns ANN cosine scores only for its dense candidate set.
    # Documents entering solely through BM25/metadata get 0.0 for the dense
    # channel; the CrossEncoder remains the dominant final relevance signal.
    def dense_score(i: int) -> float:
        return float(dense_scores.get(i, 0.0))

    # Explicit repository request narrows safely before concept gating.
    requested_filtered = [
        i for i in union if requested_repo_match(records[i], intent)
    ]
    if (
        intent.requested_repository_indexes
        or intent.requested_repository_names
    ) and requested_filtered:
        union = set(requested_filtered)

    # 2) Primary concept gate + evidence quality.
    gate_info: dict[int, dict[str, Any]] = {}
    quality_info: dict[int, tuple[float, dict[str, Any]]] = {}
    gated: list[int] = []

    for i in union:
        passed, facet_score, details = concept_gate(records[i], intent)
        gate_info[i] = {
            "passed": passed,
            "facet_score": facet_score,
            **details,
        }
        qscore, qdetails = evidence_quality(
            records[i],
            intent,
            lexical.repeated_source_penalty[i],
        )
        quality_info[i] = (qscore, qdetails)
        if passed:
            gated.append(i)

    gate_fallback = False
    if (
        len(gated) < min(20, max(5, len(union) // 20))
        and intent.facets
    ):
        gate_fallback = True
        ordered = sorted(
            union,
            key=lambda i: (
                -gate_info[i]["facet_score"],
                -dense_score(i),
                i,
            ),
        )
        gated = ordered[:min(PRE_GATE_LIMIT, max(40, len(gated)))]
    else:
        gated.sort(
            key=lambda i: (
                -rrf_all.get(i, 0.0),
                -dense_score(i),
                i,
            )
        )
        gated = gated[:PRE_GATE_LIMIT]

    # 3) Pre-rerank selection.
    d_norm = minmax({i: dense_score(i) for i in gated})
    b_norm = minmax({i: float(bm_all.get(i, 0.0)) for i in gated})
    m_norm = minmax({i: float(meta_all.get(i, 0.0)) for i in gated})
    r_norm = minmax({i: float(rrf_all.get(i, 0.0)) for i in gated})

    pre: list[tuple[int, float]] = []
    for i in gated:
        qual = quality_info[i][0]
        facet = gate_info[i]["facet_score"]
        score = (
            0.31 * d_norm.get(i, 0.0)
            + 0.22 * b_norm.get(i, 0.0)
            + 0.16 * m_norm.get(i, 0.0)
            + 0.16 * r_norm.get(i, 0.0)
            + 0.10 * qual
            + 0.05 * facet
        )
        pre.append((i, score))

    pre.sort(key=lambda x: (-x[1], x[0]))
    rerank_pool = [
        i for i, _ in pre[:min(RERANK_CANDIDATES, len(pre))]
    ]
    pre_score_map = dict(pre)

    # 4) Original pinned CrossEncoder relevance judgment.
    cross = cross_encoder_scores(
        reranker,
        query,
        rerank_pool,
        records,
        device,
    )
    dn = minmax({i: dense_score(i) for i in rerank_pool})
    bn = minmax(
        {i: float(bm_all.get(i, 0.0)) for i in rerank_pool}
    )
    mn = minmax(
        {i: float(meta_all.get(i, 0.0)) for i in rerank_pool}
    )
    rn = minmax(
        {i: float(rrf_all.get(i, 0.0)) for i in rerank_pool}
    )

    ranked: list[tuple[int, float, dict[str, Any]]] = []
    for i in rerank_pool:
        evidence_score = quality_info[i][0]
        cross_score = cross[i]

        score = (
            WEIGHT_CROSS * cross_score
            + WEIGHT_DENSE * dn.get(i, 0.0)
            + WEIGHT_BM25 * bn.get(i, 0.0)
            + WEIGHT_METADATA * mn.get(i, 0.0)
            + WEIGHT_RRF * rn.get(i, 0.0)
            + WEIGHT_EVIDENCE * evidence_score
        )
        score += 0.025 * gate_info[i]["facet_score"]

        components = {
            "cross_encoder": cross_score,
            "dense_backend": "pinecone_ann_cosine",
            "dense_cosine_raw": dense_score(i),
            "dense_candidate": i in dense_scores,
            "dense_normalized": dn.get(i, 0.0),
            "bm25_raw": float(bm_all.get(i, 0.0)),
            "bm25_normalized": bn.get(i, 0.0),
            "metadata_raw": float(meta_all.get(i, 0.0)),
            "metadata_normalized": mn.get(i, 0.0),
            "rrf_raw": float(rrf_all.get(i, 0.0)),
            "rrf_normalized": rn.get(i, 0.0),
            "concept_gate": gate_info[i],
            "evidence_quality": quality_info[i][1],
            "pre_rerank_score": pre_score_map[i],
            "final_score_before_diversity": score,
        }
        ranked.append((i, score, components))

    ranked.sort(
        key=lambda x: (
            -x[1],
            -x[2]["cross_encoder"],
            x[0],
        )
    )

    # 5) Intent-aware evidence gate.
    eligible = [
        x
        for x in ranked
        if positive_evidence_eligible(
            records[x[0]],
            x[2]["cross_encoder"],
            intent,
        )
    ]

    if len(eligible) < TOP_K:
        used = {x[0] for x in eligible}
        eligible.extend(
            x for x in ranked if x[0] not in used
        )

    # Fetch only the bounded reranked candidate vectors needed for exact
    # duplicate suppression. No local embeddings.npy matrix is required.
    candidate_vectors = fetch_candidate_vectors(
        pinecone_index,
        [x[0] for x in eligible],
        records,
    )

    selected: list[tuple[int, float, dict[str, Any]]] = []
    per_repo: Counter[int] = Counter()
    chronology_repo_limit = (
        1 if intent.chronology_query else MAX_RESULTS_PER_REPOSITORY
    )

    for item in eligible:
        i = item[0]
        repo = int(records[i].get("repository_index", 0))

        if per_repo[repo] >= chronology_repo_limit:
            continue

        duplicate = False
        for already, _, _ in selected:
            sim = float(
                candidate_vectors[i] @ candidate_vectors[already]
            )
            if sim >= SEMANTIC_DUPLICATE_THRESHOLD:
                duplicate = True
                break

        if duplicate:
            continue

        selected.append(item)
        per_repo[repo] += 1

        if len(selected) >= TOP_K:
            break

    if len(selected) < TOP_K:
        used = {x[0] for x in selected}
        for item in eligible:
            if item[0] in used:
                continue
            selected.append(item)
            if len(selected) >= TOP_K:
                break

    results: list[dict[str, Any]] = []
    for rank, (i, score, components) in enumerate(selected, 1):
        record = records[i]
        results.append({
            "rank": rank,
            "final_score": float(score),
            "vector_index": i,
            "document_id": record.get("document_id"),
            "repository_index": int(record.get("repository_index", 0)),
            "repository_name": record.get("repository_name"),
            "repository_url": record.get("repository_url"),
            "retrieval_class": record.get("retrieval_class"),
            "semantic_area": record.get("semantic_area"),
            "evidence_polarity": record.get("evidence_polarity"),
            "evidence_level": record.get("evidence_level"),
            "specificity_score": record.get("specificity_score"),
            "concrete_signal_count": record.get("concrete_signal_count"),
            "topics": record.get("topics") or [],
            "related_skill_ratings": (
                record.get("related_skill_ratings") or []
            ),
            "evidence_areas": record.get("evidence_areas") or [],
            "text": record.get("text") or "",
            "source_fragments": record.get("source_fragments") or [],
            "provenance": record.get("provenance") or {},
            "provenance_label": provenance_label(record),
            "score_components": components,
        })

    diagnostics = {
        "query": query,
        "query_tokens": token_count,
        "dense_backend": {
            "provider": "pinecone",
            "index": PINECONE_INDEX_NAME,
            "namespace": PINECONE_NAMESPACE,
            "metric": PINECONE_METRIC,
            "candidate_limit": DENSE_CANDIDATES,
            "local_matrix_loaded": False,
        },
        "intent": {
            "base_tokens": intent.base_tokens,
            "expanded_tokens": intent.expanded_tokens,
            "limitation_query": intent.limitation_query,
            "chronology_query": intent.chronology_query,
            "positive_evidence_query": intent.positive_evidence_query,
            "strongest_query": intent.strongest_query,
            "facets": [
                {
                    "name": facet.name,
                    "semantic_area": facet.semantic_area,
                    "concept_terms": list(facet.concept_terms),
                }
                for facet in intent.facets
            ],
            "requested_repository_indexes": sorted(
                intent.requested_repository_indexes
            ),
            "requested_repository_names": sorted(
                intent.requested_repository_names
            ),
        },
        "candidate_counts": {
            "dense": len(dense_rank),
            "bm25": len(bm_rank),
            "metadata": len(meta_rank),
            "union": len(union),
            "passed_primary_concept_gate": sum(
                1 for x in gate_info.values() if x["passed"]
            ),
            "gate_fallback_used": gate_fallback,
            "after_gate_for_prerank": len(gated),
            "cross_encoder": len(rerank_pool),
            "dedupe_vectors_fetched": len(candidate_vectors),
            "final": len(results),
        },
    }

    return results, diagnostics

# ---------------------------------------------------------------------------
# Internal evidence-gate tests
# ---------------------------------------------------------------------------

def run_query_logic_self_tests() -> dict[str, Any]:
    tests = []

    fake_records = [
        {
            "repository_index": 1, "repository_name": "AuthApp", "semantic_area": "identity_access_security",
            "retrieval_class": "direct_evidence", "evidence_polarity": "positive", "evidence_level": "implemented_or_concrete",
            "text": "Admin endpoints require a valid signed session and role permission. Authorization is enforced server-side.",
            "topics": ["authorization", "session", "roles"], "evidence_areas": ["API design"], "related_skill_ratings": [],
        },
        {
            "repository_index": 2, "repository_name": "GAN", "semantic_area": "architecture_system_design",
            "retrieval_class": "interpretation", "evidence_polarity": "negative", "evidence_level": "repository_limitation",
            "text": "No executable architecture exists. Architecture skill remains unscored.",
            "topics": ["architecture"], "evidence_areas": ["Architecture synthesis"], "related_skill_ratings": [],
        },
    ]
    q = analyze_query("What evidence shows experience with authorization architecture?", fake_records)
    p1, _, _ = concept_gate(fake_records[0], q)
    p2, _, _ = concept_gate(fake_records[1], q)
    tests.append(("authorization concrete passes", p1 is True))
    tests.append(("generic architecture fails authorization gate", p2 is False))

    q2 = analyze_query("What are the candidate's weakest engineering areas?", fake_records)
    tests.append(("weakness query detected", q2.limitation_query is True))
    tests.append(("generic weakness query has no forced technical facet", len(q2.facets) == 0))

    failures = [name for name, passed in tests if not passed]
    if failures:
        raise PipelineError("Query/evidence gate self-test failed: " + ", ".join(failures))
    return {"tests": len(tests), "failures": 0, "passed": [name for name, _ in tests]}


# ---------------------------------------------------------------------------
# HTTP runtime
# ---------------------------------------------------------------------------

@dataclass
class RuntimeState:
    ready: bool = False
    records: list[dict[str, Any]] = field(default_factory=list)
    id_to_index: dict[str, int] = field(default_factory=dict)
    lexical: Any = None
    embedding_model: Any = None
    reranker: Any = None
    device: str = "cpu"
    device_name: str = "CPU"
    pinecone_index: Any = None
    pinecone_info: dict[str, Any] = field(default_factory=dict)
    corpus_stats: dict[str, Any] = field(default_factory=dict)
    dependency_versions: dict[str, str] = field(default_factory=dict)
    startup_utc: str | None = None
    inference_lock: threading.Lock = field(default_factory=threading.Lock)


STATE = RuntimeState()


class RetrieveRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)


def initialize_runtime() -> None:
    print("Portfolio RAG API — Pinecone Retrieval v3 runtime")
    print(f"Project root: {BASE_DIR}")
    print()

    print("[1/9] Validate local runtime files ........ ", end="", flush=True)
    missing = [
        path
        for path in (RECORDS_PATH, MANIFEST_PATH)
        if not path.is_file()
    ]
    if missing:
        raise PipelineError(
            "Missing runtime file(s): "
            + ", ".join(str(path) for path in missing)
        )
    print("SUCCESS")

    print("[2/9] Load dependencies ................... ", end="", flush=True)
    deps = load_dependencies()
    deps.update({
        "pinecone": package_version("pinecone"),
        "fastapi": package_version("fastapi"),
        "uvicorn": package_version("uvicorn"),
        "einops": package_version("einops"),
    })
    STATE.dependency_versions = deps
    print("SUCCESS")

    print("[3/9] Validate embedding manifest ......... ", end="", flush=True)
    manifest = load_json(MANIFEST_PATH)
    validate_runtime_manifest(manifest)
    print("SUCCESS")

    print("[4/9] Load and validate evidence corpus ... ", end="", flush=True)
    records = load_jsonl(RECORDS_PATH)
    corpus_stats = validate_runtime_records(records)
    id_to_index = {
        str(record["document_id"]): int(record["vector_index"])
        for record in records
    }
    STATE.records = records
    STATE.id_to_index = id_to_index
    STATE.corpus_stats = corpus_stats
    print(
        f"SUCCESS ({corpus_stats['documents']:,} documents; "
        f"{corpus_stats['repositories']} repositories)"
    )

    print("[5/9] Build BM25 + metadata indexes ....... ", end="", flush=True)
    t0 = time.perf_counter()
    STATE.lexical = build_lexical_index(records)
    print(
        f"SUCCESS ({len(STATE.lexical.doc_freq):,} terms; "
        f"{time.perf_counter() - t0:.3f}s)"
    )

    print("[6/9] Validate query/evidence gates ....... ", end="", flush=True)
    query_test = run_query_logic_self_tests()
    print(
        f"SUCCESS ({query_test['tests']} tests; "
        f"{query_test['failures']} failures)"
    )

    print("[7/9] Load Nomic + CrossEncoder ........... ", end="", flush=True)
    device, device_name = select_device()
    STATE.device = device
    STATE.device_name = device_name
    STATE.embedding_model = load_embedding_model(device)
    STATE.reranker = load_reranker(device)

    test_vector, _ = embed_query(
        STATE.embedding_model,
        "authorization architecture evidence",
    )
    if (
        test_vector.shape != (EMBEDDING_DIMENSIONS,)
        or not np.isfinite(test_vector).all()
    ):
        raise PipelineError("Runtime Nomic query embedding smoke test failed")

    smoke = cross_encoder_scores(
        STATE.reranker,
        "technical evidence",
        list(range(min(3, len(records)))),
        records,
        device,
    )
    if len(smoke) != min(3, len(records)):
        raise PipelineError("CrossEncoder smoke test failed")
    print(f"SUCCESS ({device}: {device_name})")

    print("[8/9] Connect and validate Pinecone ....... ", end="", flush=True)
    pinecone_index, pinecone_info = connect_pinecone(len(records))
    STATE.pinecone_index = pinecone_index
    STATE.pinecone_info = pinecone_info
    print(
        f"SUCCESS ({pinecone_info['index_name']} / "
        f"{pinecone_info['namespace']}; "
        f"{pinecone_info['vector_count']:,} vectors)"
    )

    print("[9/9] Run end-to-end retrieval smoke ...... ", end="", flush=True)
    t0 = time.perf_counter()
    results, diagnostics = retrieve(
        "What evidence shows experience with authorization architecture?",
        STATE.pinecone_index,
        STATE.records,
        STATE.id_to_index,
        STATE.lexical,
        STATE.embedding_model,
        STATE.reranker,
        STATE.device,
    )
    if not results:
        raise PipelineError("End-to-end retrieval smoke test returned no results")
    if diagnostics["candidate_counts"]["dense"] != min(
        DENSE_CANDIDATES,
        len(records),
    ):
        raise PipelineError("Dense recall smoke test returned wrong candidate count")
    print(
        f"SUCCESS (top={len(results)}; "
        f"{time.perf_counter() - t0:.3f}s)"
    )

    STATE.startup_utc = utc_now()
    STATE.ready = True

    print()
    print("RAG API RUNTIME INITIALIZATION: SUCCESS")
    print("Dense backend:      Pinecone")
    print("Local matrix:       NOT LOADED")
    print("BM25:               ENABLED")
    print("Metadata recall:    ENABLED")
    print("Concept gate:       ENABLED")
    print("Evidence gate:      ENABLED")
    print("CrossEncoder:       ENABLED")
    print("Semantic dedupe:    Pinecone fetched vectors")
    print("Gemini generation:  NOT YET WIRED")
    print()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        initialize_runtime()
    except Exception as exc:
        print("RAG API RUNTIME INITIALIZATION: FAILED")
        print(f"Reason: {exc}")
        raise
    yield


app = FastAPI(
    title="Portfolio Career RAG API",
    version=RUNTIME_SCHEMA_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    if not STATE.ready:
        raise HTTPException(status_code=503, detail="RAG runtime is not ready")

    return {
        "status": "ok",
        "runtime_schema_version": RUNTIME_SCHEMA_VERSION,
        "retrieval_schema_version": RETRIEVAL_SCHEMA_VERSION,
        "documents": STATE.corpus_stats.get("documents"),
        "repositories": STATE.corpus_stats.get("repositories"),
        "dense_backend": "pinecone",
        "pinecone_index": STATE.pinecone_info.get("index_name"),
        "pinecone_namespace": STATE.pinecone_info.get("namespace"),
        "pinecone_vector_count": STATE.pinecone_info.get("vector_count"),
        "embedding_model": EMBEDDING_MODEL,
        "embedding_dimensions": EMBEDDING_DIMENSIONS,
        "reranker_model": RERANKER_MODEL,
        "generation_model": None,
        "generation_status": "not_integrated",
        "startup_utc": STATE.startup_utc,
    }


@app.post("/api/rag/retrieve")
def rag_retrieve(request: RetrieveRequest) -> dict[str, Any]:
    if not STATE.ready:
        raise HTTPException(status_code=503, detail="RAG runtime is not ready")

    question = request.question.strip()
    if len(question) < 2:
        raise HTTPException(
            status_code=422,
            detail="question must contain at least 2 non-whitespace characters",
        )

    started = time.perf_counter()

    try:
        # The local transformer models are shared process-wide. Serialize their
        # inference path for deterministic, thread-safe v1 behavior.
        with STATE.inference_lock:
            results, diagnostics = retrieve(
                question,
                STATE.pinecone_index,
                STATE.records,
                STATE.id_to_index,
                STATE.lexical,
                STATE.embedding_model,
                STATE.reranker,
                STATE.device,
            )
    except PipelineError as exc:
        print(f"Retrieval failed: {exc}")
        raise HTTPException(
            status_code=500,
            detail="RAG retrieval failed",
        ) from exc
    except Exception as exc:
        print(f"Unexpected retrieval failure: {exc}")
        raise HTTPException(
            status_code=500,
            detail="RAG retrieval failed",
        ) from exc

    elapsed = time.perf_counter() - started

    return {
        "status": "ok",
        "runtime_schema_version": RUNTIME_SCHEMA_VERSION,
        "retrieval_schema_version": RETRIEVAL_SCHEMA_VERSION,
        "question": question,
        "elapsed_seconds": elapsed,
        "generation": None,
        "results": results,
        "diagnostics": diagnostics,
    }


def main() -> int:
    if len(sys.argv) != 1:
        print("FAILED")
        print(
            f"This service accepts zero arguments. Run: "
            f"python runtime/{SCRIPT_NAME}"
        )
        return 2

    print(f"Starting HTTP server on {API_HOST}:{API_PORT}")
    uvicorn.run(
        app,
        host=API_HOST,
        port=API_PORT,
        log_level="info",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
