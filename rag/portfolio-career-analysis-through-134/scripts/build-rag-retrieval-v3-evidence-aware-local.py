#!/usr/bin/env python3
"""
Portfolio GitHub RAG pipeline — Step 4 v3: evidence-aware FREE LOCAL retrieval.

ZERO ARGUMENTS. Run from the project root beside `rag-corpus/`:

    python build-rag-retrieval-v3-evidence-aware-local.py

NO PAID API. NO API KEY. NO MODEL TRAINING.

INPUT
-----
    rag-corpus/embeddings-v2/embeddings.npy
    rag-corpus/embeddings-v2/embedding-records.jsonl
    rag-corpus/embeddings-v2/embedding-manifest.json

OUTPUT
------
    rag-corpus/retrieval-v3/retrieval-config.json
    rag-corpus/retrieval-v3/retrieval-validation-report.txt
    rag-corpus/retrieval-v3/test-results/
        retrieval-session-YYYYMMDD-HHMMSS.jsonl
        latest-results.json

RETRIEVAL ARCHITECTURE
----------------------
    Employer question
        -> query intent + primary concept/facet analysis
        -> exact dense cosine recall over all evidence-aware documents
        -> BM25 lexical recall
        -> metadata/topic/skill recall
        -> Reciprocal Rank Fusion candidate union
        -> PRIMARY-CONCEPT GATE (supporting words alone cannot qualify a result)
        -> evidence-class / polarity / specificity scoring
        -> local CrossEncoder rerank of bounded candidate pool
        -> CROSSENCODER-DOMINANT final ranking
        -> positive-vs-negative evidence gate appropriate to query intent
        -> semantic duplicate suppression + repository diversity
        -> top evidence with complete source-fragment provenance

This script intentionally treats dense cosine as ONE recall signal. It is NOT a
cosine-only retriever. The final result order is evidence-aware and locally
reranked.

FIXED VECTOR SPACE (must match Step 3 v2)
-----------------------------------------
Embedding model:   nomic-ai/nomic-embed-text-v1.5
Revision:          e9b6763023c676ca8431644204f50c2b100d9aab
Native dimension:  768
Stored dimension:  512
Query prefix:      search_query: 
Transform:         layer_norm -> first 512 dimensions -> L2 normalize
Dense similarity:  exact cosine

LOCAL RERANKER
--------------
Model:             cross-encoder/ms-marco-MiniLM-L6-v2
Pinned revision:   4bebbd56fc380a66525f95b03d4ec1a4b41a4f1e
Purpose:           final semantic relevance judgment after concept gating
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
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Sequence

# ---------------------------------------------------------------------------
# Paths / identities
# ---------------------------------------------------------------------------

SCRIPT_NAME = Path(__file__).name
BASE_DIR = Path(__file__).resolve().parent
RAG_DIR = BASE_DIR / "rag-corpus"
EMBEDDINGS_DIR = RAG_DIR / "embeddings-v2"
MATRIX_PATH = EMBEDDINGS_DIR / "embeddings.npy"
RECORDS_PATH = EMBEDDINGS_DIR / "embedding-records.jsonl"
MANIFEST_PATH = EMBEDDINGS_DIR / "embedding-manifest.json"

OUTPUT_DIR = RAG_DIR / "retrieval-v3"
TEMP_OUTPUT_DIR = RAG_DIR / ".retrieval-v3.tmp"
TEST_RESULTS_DIR = OUTPUT_DIR / "test-results"
CONFIG_PATH = OUTPUT_DIR / "retrieval-config.json"
REPORT_PATH = OUTPUT_DIR / "retrieval-validation-report.txt"
LATEST_RESULTS_PATH = TEST_RESULTS_DIR / "latest-results.json"

RETRIEVAL_SCHEMA_VERSION = "3.0.0"
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

# Corpus is only 2,808 documents. Exact dense search is cheap and serves as one
# broad recall channel; lexical and metadata channels prevent semantic blur.
DENSE_CANDIDATES = 500
BM25_CANDIDATES = 500
METADATA_CANDIDATES = 400
PRE_GATE_LIMIT = 800
RERANK_CANDIDATES = 120
TOP_K = 10
MAX_RESULTS_PER_REPOSITORY = 2
RRF_K = 60.0
SEMANTIC_DUPLICATE_THRESHOLD = 0.955

# Final ranking deliberately gives the local CrossEncoder the strongest voice.
WEIGHT_CROSS = 0.64
WEIGHT_DENSE = 0.10
WEIGHT_BM25 = 0.07
WEIGHT_METADATA = 0.06
WEIGHT_RRF = 0.04
WEIGHT_EVIDENCE = 0.09

UNIT_NORM_TOLERANCE = 1e-4
SELF_TEST_SAMPLE_COUNT = 32
DISPLAY_TEXT_CHARS = 1200

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
            trust_remote_code=False,
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
            trust_remote_code=False,
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
# Corpus validation
# ---------------------------------------------------------------------------

def validate_manifest(manifest: dict[str, Any]) -> None:
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
    bad = [f"{k}: {a!r} != {b!r}" for k, (a, b) in checks.items() if a != b]
    if bad:
        raise PipelineError("Vector-space identity mismatch: " + "; ".join(bad))


def verify_artifact_hashes(manifest: dict[str, Any]) -> None:
    artifacts = manifest.get("artifacts") or {}
    expected_m = ((artifacts.get("embeddings.npy") or {}).get("sha256"))
    expected_r = ((artifacts.get("embedding-records.jsonl") or {}).get("sha256"))
    if expected_m and sha256_file(MATRIX_PATH) != expected_m:
        raise PipelineError("embeddings.npy SHA-256 does not match Step 3 v2 manifest")
    if expected_r and sha256_file(RECORDS_PATH) != expected_r:
        raise PipelineError("embedding-records.jsonl SHA-256 does not match Step 3 v2 manifest")


def validate_matrix_records(matrix: Any, records: list[dict[str, Any]]) -> dict[str, Any]:
    if matrix.dtype != np.float32:
        raise PipelineError(f"Matrix dtype {matrix.dtype}; expected float32")
    if matrix.shape != (len(records), EMBEDDING_DIMENSIONS):
        raise PipelineError(
            f"Matrix shape {matrix.shape}; expected ({len(records)}, {EMBEDDING_DIMENSIONS})"
        )
    if not np.isfinite(matrix).all():
        raise PipelineError("Matrix contains NaN/Inf")
    norms = np.linalg.norm(matrix.astype(np.float64), axis=1)
    if np.any(norms <= 0):
        raise PipelineError("Matrix contains zero vectors")
    if float(np.max(np.abs(norms - 1.0))) > UNIT_NORM_TOLERANCE:
        raise PipelineError("Matrix vectors are not unit normalized")

    ids: set[str] = set()
    repos: set[int] = set()
    classes = Counter()
    areas = Counter()
    levels = Counter()
    polarities = Counter()
    for i, r in enumerate(records):
        if int(r.get("vector_index", -1)) != i:
            raise PipelineError(f"vector_index mismatch at row {i}")
        did = str(r.get("document_id") or "").strip()
        if not did:
            raise PipelineError(f"Missing document_id at row {i}")
        if did in ids:
            raise PipelineError(f"Duplicate document_id: {did}")
        ids.add(did)
        schema = str(r.get("document_schema_version", ""))
        if schema.split(".", 1)[0] != EXPECTED_DOCUMENT_SCHEMA_MAJOR:
            raise PipelineError(f"Unexpected document schema for {did}: {schema}")
        text = str(r.get("text") or "")
        if not text.strip():
            raise PipelineError(f"Empty authoritative text in {did}")
        prov = r.get("provenance") or {}
        expected_hash = prov.get("document_text_sha256")
        if expected_hash and sha256_text(text) != expected_hash:
            raise PipelineError(f"Authoritative text SHA-256 mismatch in {did}")
        repos.add(int(r.get("repository_index", 0)))
        classes[str(r.get("retrieval_class") or "unknown")] += 1
        areas[str(r.get("semantic_area") or "unknown")] += 1
        levels[str(r.get("evidence_level") or "unknown")] += 1
        polarities[str(r.get("evidence_polarity") or "unknown")] += 1

    declared = {int(r.get("repository_total", 0)) for r in records}
    if len(declared) != 1:
        raise PipelineError(f"Conflicting repository_total values: {sorted(declared)}")
    repo_total = next(iter(declared))
    expected = set(range(1, repo_total + 1))
    if repos != expected:
        raise PipelineError(
            f"Repository coverage mismatch: missing={sorted(expected-repos)}, extra={sorted(repos-expected)}"
        )
    return {
        "documents": len(records),
        "repositories": len(repos),
        "repository_total": repo_total,
        "retrieval_classes": dict(classes),
        "semantic_areas": dict(areas),
        "evidence_levels": dict(levels),
        "polarities": dict(polarities),
        "norm_min": float(norms.min()),
        "norm_median": float(np.median(norms)),
        "norm_max": float(norms.max()),
    }


def exact_search_self_test(matrix: Any) -> dict[str, Any]:
    count = min(SELF_TEST_SAMPLE_COUNT, matrix.shape[0])
    if count <= 0:
        raise PipelineError("No vectors for self-test")
    positions = np.linspace(0, matrix.shape[0] - 1, count, dtype=int)
    failures = 0
    min_self = 1.0
    for idx in positions:
        sims = matrix @ matrix[idx]
        min_self = min(min_self, float(sims[idx]))
        if int(np.argmax(sims)) != int(idx):
            # Exact duplicate vectors can tie. Accept when the self score equals max.
            if abs(float(sims[idx]) - float(np.max(sims))) > 1e-6:
                failures += 1
    if failures:
        raise PipelineError(f"Exact cosine self-test failures: {failures}")
    return {"samples": count, "failures": failures, "min_self_similarity": min_self}


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


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------

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


def retrieve(
    query: str,
    matrix: Any,
    records: list[dict[str, Any]],
    lexical: LexicalIndex,
    embedding_model: Any,
    reranker: Any,
    device: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    intent = analyze_query(query, records)
    qvec, token_count = embed_query(embedding_model, query)

    # 1) Broad recall channels.
    dense_all = matrix @ qvec
    dense_rank = top_indices_from_array(dense_all, min(DENSE_CANDIDATES, len(records)))
    bm_all = bm25_scores(lexical, intent.expanded_tokens, len(records))
    bm_rank = top_indices_from_dict(bm_all, min(BM25_CANDIDATES, len(records)))
    meta_all = metadata_scores(lexical, intent.expanded_tokens, len(records))
    meta_rank = top_indices_from_dict(meta_all, min(METADATA_CANDIDATES, len(records)))
    rrf_all = reciprocal_rank_fusion([dense_rank, bm_rank, meta_rank])
    union = set(dense_rank) | set(bm_rank) | set(meta_rank)

    # Explicit repository request narrows safely before concept gating.
    requested_filtered = [i for i in union if requested_repo_match(records[i], intent)]
    if (intent.requested_repository_indexes or intent.requested_repository_names) and requested_filtered:
        union = set(requested_filtered)

    # 2) Primary concept gate + evidence quality. This is the critical v3 change.
    gate_info: dict[int, dict[str, Any]] = {}
    quality_info: dict[int, tuple[float, dict[str, Any]]] = {}
    gated: list[int] = []
    for i in union:
        passed, facet_score, details = concept_gate(records[i], intent)
        gate_info[i] = {"passed": passed, "facet_score": facet_score, **details}
        qscore, qdetails = evidence_quality(records[i], intent, lexical.repeated_source_penalty[i])
        quality_info[i] = (qscore, qdetails)
        if passed:
            gated.append(i)

    # Defensive fallback: if an unusually phrased query overconstrains the facet
    # gate, do not return nothing. Keep the best concept-scoring candidates and
    # record that the fallback happened in diagnostics.
    gate_fallback = False
    if len(gated) < min(20, max(5, len(union) // 20)) and intent.facets:
        gate_fallback = True
        ordered = sorted(union, key=lambda i: (-gate_info[i]["facet_score"], -float(dense_all[i]), i))
        gated = ordered[:min(PRE_GATE_LIMIT, max(40, len(gated)))]
    else:
        gated.sort(key=lambda i: (-rrf_all.get(i, 0.0), -float(dense_all[i]), i))
        gated = gated[:PRE_GATE_LIMIT]

    # 3) Pre-rerank selection. Recall scores select candidates; they will not
    # overpower the CrossEncoder after reranking.
    d_norm = minmax({i: float(dense_all[i]) for i in gated})
    b_norm = minmax({i: float(bm_all.get(i, 0.0)) for i in gated})
    m_norm = minmax({i: float(meta_all.get(i, 0.0)) for i in gated})
    r_norm = minmax({i: float(rrf_all.get(i, 0.0)) for i in gated})
    pre: list[tuple[int, float]] = []
    for i in gated:
        qual = quality_info[i][0]
        facet = gate_info[i]["facet_score"]
        score = (
            0.31 * d_norm.get(i, 0.0) +
            0.22 * b_norm.get(i, 0.0) +
            0.16 * m_norm.get(i, 0.0) +
            0.16 * r_norm.get(i, 0.0) +
            0.10 * qual +
            0.05 * facet
        )
        pre.append((i, score))
    pre.sort(key=lambda x: (-x[1], x[0]))
    rerank_pool = [i for i, _ in pre[:min(RERANK_CANDIDATES, len(pre))]]
    pre_score_map = dict(pre)

    # 4) CrossEncoder relevance judgment.
    cross = cross_encoder_scores(reranker, query, rerank_pool, records, device)
    dn = minmax({i: float(dense_all[i]) for i in rerank_pool})
    bn = minmax({i: float(bm_all.get(i, 0.0)) for i in rerank_pool})
    mn = minmax({i: float(meta_all.get(i, 0.0)) for i in rerank_pool})
    rn = minmax({i: float(rrf_all.get(i, 0.0)) for i in rerank_pool})

    ranked: list[tuple[int, float, dict[str, Any]]] = []
    for i in rerank_pool:
        evidence = quality_info[i][0]
        c = cross[i]
        score = (
            WEIGHT_CROSS * c +
            WEIGHT_DENSE * dn.get(i, 0.0) +
            WEIGHT_BM25 * bn.get(i, 0.0) +
            WEIGHT_METADATA * mn.get(i, 0.0) +
            WEIGHT_RRF * rn.get(i, 0.0) +
            WEIGHT_EVIDENCE * evidence
        )
        # A precise facet match is a gate first, only a tiny tie-breaker here.
        score += 0.025 * gate_info[i]["facet_score"]
        components = {
            "cross_encoder": c,
            "dense_cosine_raw": float(dense_all[i]),
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
    ranked.sort(key=lambda x: (-x[1], -x[2]["cross_encoder"], x[0]))

    # 5) Intent-aware evidence gate, semantic duplicate suppression, repository diversity.
    eligible = [x for x in ranked if positive_evidence_eligible(records[x[0]], x[2]["cross_encoder"], intent)]
    if len(eligible) < TOP_K:
        # Preserve access to truthful caveats if there are not enough positive
        # results; these appear after the stronger positive evidence.
        used = {x[0] for x in eligible}
        eligible.extend(x for x in ranked if x[0] not in used)

    selected: list[tuple[int, float, dict[str, Any]]] = []
    per_repo: Counter[int] = Counter()
    chronology_repo_limit = 1 if intent.chronology_query else MAX_RESULTS_PER_REPOSITORY
    for item in eligible:
        i = item[0]
        repo = int(records[i].get("repository_index", 0))
        if per_repo[repo] >= chronology_repo_limit:
            continue
        duplicate = False
        for already, _, _ in selected:
            sim = float(matrix[i] @ matrix[already])
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
    for rank, (i, score, comp) in enumerate(selected, 1):
        r = records[i]
        results.append({
            "rank": rank,
            "final_score": float(score),
            "vector_index": i,
            "document_id": r.get("document_id"),
            "repository_index": int(r.get("repository_index", 0)),
            "repository_name": r.get("repository_name"),
            "repository_url": r.get("repository_url"),
            "retrieval_class": r.get("retrieval_class"),
            "semantic_area": r.get("semantic_area"),
            "evidence_polarity": r.get("evidence_polarity"),
            "evidence_level": r.get("evidence_level"),
            "specificity_score": r.get("specificity_score"),
            "concrete_signal_count": r.get("concrete_signal_count"),
            "topics": r.get("topics") or [],
            "related_skill_ratings": r.get("related_skill_ratings") or [],
            "evidence_areas": r.get("evidence_areas") or [],
            "text": r.get("text") or "",
            "source_fragments": r.get("source_fragments") or [],
            "provenance": r.get("provenance") or {},
            "provenance_label": provenance_label(r),
            "score_components": comp,
        })

    diagnostics = {
        "query": query,
        "query_tokens": token_count,
        "intent": {
            "base_tokens": intent.base_tokens,
            "expanded_tokens": intent.expanded_tokens,
            "limitation_query": intent.limitation_query,
            "chronology_query": intent.chronology_query,
            "positive_evidence_query": intent.positive_evidence_query,
            "strongest_query": intent.strongest_query,
            "facets": [
                {"name": f.name, "semantic_area": f.semantic_area, "concept_terms": list(f.concept_terms)}
                for f in intent.facets
            ],
            "requested_repository_indexes": sorted(intent.requested_repository_indexes),
            "requested_repository_names": sorted(intent.requested_repository_names),
        },
        "candidate_counts": {
            "dense": len(dense_rank),
            "bm25": len(bm_rank),
            "metadata": len(meta_rank),
            "union": len(union),
            "passed_primary_concept_gate": sum(1 for x in gate_info.values() if x["passed"]),
            "gate_fallback_used": gate_fallback,
            "after_gate_for_prerank": len(gated),
            "cross_encoder": len(rerank_pool),
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
# Output / reporting
# ---------------------------------------------------------------------------

def make_config(corpus_stats: dict[str, Any], deps: dict[str, str], device: str, device_name: str) -> dict[str, Any]:
    return {
        "retrieval_schema_version": RETRIEVAL_SCHEMA_VERSION,
        "pipeline_step": 4,
        "generated_at_utc": utc_now(),
        "script": SCRIPT_NAME,
        "cost": {"paid_api_used": False, "api_key_required": False, "retrieval_cost_usd": 0, "model_training": False},
        "input": {
            "vectors": rel(MATRIX_PATH),
            "records": rel(RECORDS_PATH),
            "manifest": rel(MANIFEST_PATH),
            "matrix_sha256": sha256_file(MATRIX_PATH),
            "records_sha256": sha256_file(RECORDS_PATH),
            "documents": corpus_stats["documents"],
            "repositories": corpus_stats["repositories"],
        },
        "embedding": {
            "model": EMBEDDING_MODEL,
            "revision": EMBEDDING_MODEL_REVISION,
            "native_dimensions": NATIVE_DIMENSIONS,
            "stored_dimensions": EMBEDDING_DIMENSIONS,
            "query_prefix": QUERY_PREFIX,
            "transform": "layer_norm -> first 512 -> L2 normalize",
            "dense_similarity": "exact cosine",
        },
        "retrieval": {
            "architecture": "dense + BM25 + metadata -> RRF -> primary-concept gate -> evidence-quality -> CrossEncoder -> polarity gate -> diversity",
            "dense_candidates": DENSE_CANDIDATES,
            "bm25_candidates": BM25_CANDIDATES,
            "metadata_candidates": METADATA_CANDIDATES,
            "cross_encoder_candidates": RERANK_CANDIDATES,
            "top_k": TOP_K,
            "rrf_k": RRF_K,
            "max_results_per_repository": MAX_RESULTS_PER_REPOSITORY,
            "semantic_duplicate_threshold": SEMANTIC_DUPLICATE_THRESHOLD,
            "final_weights": {
                "cross_encoder": WEIGHT_CROSS,
                "dense": WEIGHT_DENSE,
                "bm25": WEIGHT_BM25,
                "metadata": WEIGHT_METADATA,
                "rrf": WEIGHT_RRF,
                "evidence_quality": WEIGHT_EVIDENCE,
            },
            "primary_concept_gate": True,
            "query_aware_polarity_gate": True,
            "negative_evidence_deleted": False,
        },
        "reranker": {"model": RERANKER_MODEL, "revision": RERANKER_MODEL_REVISION, "device": device, "device_name": device_name},
        "dependencies": deps,
        "corpus_profile": corpus_stats,
    }


def report_text(config: dict[str, Any], selftest: dict[str, Any], querytest: dict[str, Any]) -> str:
    c = config["corpus_profile"]
    lines = [
        "Portfolio GitHub RAG — Step 4 v3 retrieval validation report",
        "=" * 72,
        f"Generated UTC: {config['generated_at_utc']}",
        "",
        "STATUS",
        "  STEP 4 v3 INITIALIZATION: SUCCESS",
        "",
        "INPUT",
        f"  {rel(MATRIX_PATH)}",
        f"  {rel(RECORDS_PATH)}",
        f"  {rel(MANIFEST_PATH)}",
        "",
        "CORPUS",
        f"  Evidence-aware documents: {c['documents']}",
        f"  Repositories covered: {c['repositories']}/{c['repository_total']}",
        f"  Retrieval classes: {json.dumps(c['retrieval_classes'], sort_keys=True)}",
        f"  Semantic areas: {json.dumps(c['semantic_areas'], sort_keys=True)}",
        f"  Evidence levels: {json.dumps(c['evidence_levels'], sort_keys=True)}",
        "",
        "RETRIEVAL ARCHITECTURE",
        "  Exact dense cosine: recall signal only",
        "  BM25 lexical: enabled",
        "  Metadata/topic/skill retrieval: enabled",
        "  Reciprocal Rank Fusion: enabled",
        "  Primary-concept gate: enabled",
        "  Evidence-level and polarity gating: enabled",
        f"  CrossEncoder: {RERANKER_MODEL}",
        f"  CrossEncoder final weight: {WEIGHT_CROSS:.2f}",
        "  Semantic duplicate suppression: enabled",
        "  Repository diversity: enabled",
        "  Negative/limitation evidence retained for matching queries: YES",
        "",
        "VALIDATION",
        f"  Exact-search self-test: PASS ({selftest['samples']} samples; failures {selftest['failures']})",
        f"  Query/evidence logic tests: PASS ({querytest['tests']} tests; failures {querytest['failures']})",
        "  Matrix/record referential integrity: PASS",
        "  Source-document SHA-256 checks: PASS",
        "  134-repository coverage: PASS" if c['repository_total'] == 134 else "  Repository coverage: PASS",
        "",
        "COST",
        "  Paid API requests: 0",
        "  API keys required: 0",
        "  Model training: NO",
        "  Retrieval cost: $0",
        "",
        "OUTPUT",
        f"  {rel(CONFIG_PATH)}",
        f"  {rel(REPORT_PATH)}",
        f"  {rel(TEST_RESULTS_DIR)}/",
        "",
    ]
    return "\n".join(lines)


def publish_initialization(config: dict[str, Any], selftest: dict[str, Any], querytest: dict[str, Any]) -> None:
    if TEMP_OUTPUT_DIR.exists():
        shutil.rmtree(TEMP_OUTPUT_DIR)
    TEMP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    temp_config = TEMP_OUTPUT_DIR / "retrieval-config.json"
    temp_report = TEMP_OUTPUT_DIR / "retrieval-validation-report.txt"
    write_json(temp_config, config)
    temp_report.write_text(report_text(config, selftest, querytest), encoding="utf-8", newline="\n")
    # Re-read before publication.
    _ = load_json(temp_config)
    report = temp_report.read_text(encoding="utf-8")
    if "INITIALIZATION: SUCCESS" not in report:
        raise PipelineError("Temporary validation report failed re-read verification")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TEST_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    os.replace(temp_config, CONFIG_PATH)
    os.replace(temp_report, REPORT_PATH)
    shutil.rmtree(TEMP_OUTPUT_DIR, ignore_errors=True)
    if not CONFIG_PATH.exists() or not REPORT_PATH.exists():
        raise PipelineError("Published retrieval artifacts are missing")


def print_result(result: dict[str, Any]) -> None:
    print("-" * 108)
    print(
        f"#{result['rank']:02d} final={result['final_score']:.6f}  "
        f"repo={result['repository_index']:03d}  {result['repository_name']}"
    )
    print(
        f"     Class={result['retrieval_class']} | area={result['semantic_area']} | "
        f"polarity={result['evidence_polarity']} | level={result['evidence_level']}"
    )
    print(f"     Document: {result['document_id']}")
    print(f"     Source:   {result['provenance_label']}")
    sc = result["score_components"]
    print(
        f"     Scores: cross={sc['cross_encoder']:.4f}  dense={sc['dense_cosine_raw']:.4f}  "
        f"bm25={sc['bm25_raw']:.3f}  meta={sc['metadata_raw']:.3f}  "
        f"evidence={sc['evidence_quality']['final_evidence_quality']:.3f}"
    )
    gate = sc["concept_gate"]
    if gate.get("matched_facets"):
        pieces = []
        for m in gate["matched_facets"]:
            pieces.append(f"{m['facet']}:{','.join(m['concept_hits'][:6])}")
        print(f"     Concept gate: PASS ({'; '.join(pieces)})")
    text = str(result.get("text") or "").strip()
    if len(text) > DISPLAY_TEXT_CHARS:
        text = text[:DISPLAY_TEXT_CHARS].rstrip() + " ..."
    print("     Evidence:")
    for line in text.splitlines():
        print(f"       {line}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    print("Portfolio GitHub RAG pipeline — Step 4 v3: FREE LOCAL evidence-aware retrieval")
    print(f"Working directory: {BASE_DIR}")
    print()
    print("COST / EXECUTION")
    print("  Paid API:       NONE")
    print("  API key:        NOT REQUIRED")
    print("  Model training: NONE")
    print("  Retrieval cost: $0")
    print()
    print("INPUT")
    print("  rag-corpus/embeddings-v2/embeddings.npy")
    print("  rag-corpus/embeddings-v2/embedding-records.jsonl")
    print("  rag-corpus/embeddings-v2/embedding-manifest.json")
    print()
    print("OUTPUT")
    print("  rag-corpus/retrieval-v3/retrieval-config.json")
    print("  rag-corpus/retrieval-v3/retrieval-validation-report.txt")
    print("  rag-corpus/retrieval-v3/test-results/")
    print()
    print("RETRIEVAL DESIGN")
    print("  Dense cosine:      recall signal only")
    print("  Lexical:           BM25")
    print("  Structured:        topics / skills / evidence metadata")
    print("  Concept gate:      REQUIRED for specific technical queries")
    print("  Evidence gate:     query-aware class + polarity + specificity")
    print(f"  Local reranker:    {RERANKER_MODEL}")
    print(f"  Reranker weight:   {WEIGHT_CROSS:.0%} of final fusion")
    print()

    try:
        print("[1/14] Validate zero-argument invocation and dependencies ... ", end="", flush=True)
        if len(sys.argv) != 1:
            raise PipelineError(f"This script accepts zero arguments. Run: python {SCRIPT_NAME}")
        deps = load_dependencies()
        print(f"SUCCESS (numpy {deps['numpy']}, torch {deps['torch']}, sentence-transformers {deps['sentence-transformers']})")

        print("[2/14] Locate Step 3 v2 input artifacts ... ", end="", flush=True)
        missing = [p for p in (MATRIX_PATH, RECORDS_PATH, MANIFEST_PATH) if not p.is_file()]
        if missing:
            raise PipelineError("Missing input artifact(s): " + ", ".join(rel(p) for p in missing))
        print(f"SUCCESS (matrix {MATRIX_PATH.stat().st_size:,} bytes; records {RECORDS_PATH.stat().st_size:,} bytes)")

        print("[3/14] Load manifest and validate exact vector-space identity ... ", end="", flush=True)
        manifest = load_json(MANIFEST_PATH)
        validate_manifest(manifest)
        print(f"SUCCESS ({EMBEDDING_MODEL}; {EMBEDDING_MODEL_REVISION[:12]}...; {EMBEDDING_DIMENSIONS}D)")

        print("[4/14] Verify Step 3 v2 artifact hashes ... ", end="", flush=True)
        verify_artifact_hashes(manifest)
        print("SUCCESS")

        print("[5/14] Load evidence-aware matrix and records ... ", end="", flush=True)
        matrix = np.load(MATRIX_PATH, allow_pickle=False)
        records = load_jsonl(RECORDS_PATH)
        print(f"SUCCESS ({len(records):,} documents)")

        print("[6/14] Validate vector integrity, evidence metadata and repository coverage ... ", end="", flush=True)
        corpus_stats = validate_matrix_records(matrix, records)
        print(f"SUCCESS ({corpus_stats['repositories']}/{corpus_stats['repository_total']} repositories; shape {matrix.shape})")

        print("[7/14] Build BM25 + metadata/topic/skill retrieval indexes ... ", end="", flush=True)
        t0 = time.perf_counter()
        lexical = build_lexical_index(records)
        print(f"SUCCESS ({len(lexical.doc_freq):,} lexical terms; {time.perf_counter()-t0:.3f}s)")

        print("[8/14] Run exact-cosine mathematical self-test ... ", end="", flush=True)
        search_selftest = exact_search_self_test(matrix)
        print(f"SUCCESS ({search_selftest['samples']} samples; failures 0; min self {search_selftest['min_self_similarity']:.8f})")

        print("[9/14] Run query-facet and primary-concept-gate self-tests ... ", end="", flush=True)
        query_selftest = run_query_logic_self_tests()
        print(f"SUCCESS ({query_selftest['tests']} tests; failures 0)")

        print("[10/14] Select free local inference device ... ", end="", flush=True)
        device, device_name = select_device()
        print(f"SUCCESS ({device}: {device_name})")

        print("[11/14] Load and validate exact pinned Nomic query model ... ", end="", flush=True)
        embedding_model = load_embedding_model(device)
        print(f"SUCCESS ({NATIVE_DIMENSIONS}D native -> {EMBEDDING_DIMENSIONS}D query space)")

        print("[12/14] Validate runtime query embedding path ... ", end="", flush=True)
        test_vec, test_tokens = embed_query(embedding_model, "authorization architecture evidence")
        if test_vec.shape != (EMBEDDING_DIMENSIONS,) or not np.isfinite(test_vec).all():
            raise PipelineError("Runtime query embedding self-test failed")
        _ = matrix @ test_vec
        print(f"SUCCESS ({test_tokens} tokens -> {EMBEDDING_DIMENSIONS}D)")

        print("[13/14] Load pinned local CrossEncoder and validate reranking ... ", end="", flush=True)
        reranker = load_reranker(device)
        smoke_candidates = list(range(min(3, len(records))))
        smoke = cross_encoder_scores(reranker, "technical evidence", smoke_candidates, records, device)
        if len(smoke) != len(smoke_candidates):
            raise PipelineError("CrossEncoder smoke test returned wrong number of scores")
        print(f"SUCCESS ({RERANKER_MODEL}; {len(smoke)} smoke scores)")

        print("[14/14] Write, re-read and publish retrieval-v3 validation artifacts ... ", end="", flush=True)
        config = make_config(corpus_stats, deps, device, device_name)
        publish_initialization(config, search_selftest, query_selftest)
        print("SUCCESS")

    except KeyboardInterrupt:
        print("\nFAILED\n\nSTEP 4 v3 INITIALIZATION COMPLETE: FAILED\nReason: interrupted by user")
        return 130
    except Exception as exc:
        print("FAILED")
        print("\nSTEP 4 v3 INITIALIZATION COMPLETE: FAILED")
        print(f"Reason: {exc}")
        return 1

    print()
    print("STEP 4 v3 INITIALIZATION COMPLETE: SUCCESS")
    print(f"Evidence-aware documents:        {len(records):,}")
    print(f"Repositories covered:            {corpus_stats['repositories']}/{corpus_stats['repository_total']}")
    print("Candidate retrieval:             exact dense + BM25 + structured metadata")
    print("Primary-concept gate:            ENABLED")
    print("Evidence/polarity gate:          ENABLED")
    print("CrossEncoder-dominant reranking: ENABLED")
    print(f"CrossEncoder candidates/query:   {RERANK_CANDIDATES}")
    print("Semantic duplicate suppression:  ENABLED")
    print("Repository diversity:            ENABLED")
    print("Paid API requests:               0")
    print("API keys required:               0")
    print("Model training performed:        NO")
    print("Retrieval cost:                  $0")
    print(f"Inference device:                {device} ({device_name})")
    print()
    print("OUTPUT")
    print("  rag-corpus/retrieval-v3/retrieval-config.json")
    print("  rag-corpus/retrieval-v3/retrieval-validation-report.txt")
    print("  rag-corpus/retrieval-v3/test-results/")
    print()
    print("INTERACTIVE EVIDENCE-AWARE RETRIEVAL TEST")
    print("  Enter an employer-style question and press Enter.")
    print("  Full scoring diagnostics + source-fragment provenance are saved automatically.")
    print("  Commands: :help  :quit  :exit")
    print()
    print("Suggested first comparison question:")
    print("  What evidence shows experience with authorization architecture?")
    print()

    session_path = TEST_RESULTS_DIR / f"retrieval-session-{local_stamp()}.jsonl"
    print(f"Session results will be saved to: {rel(session_path)}")
    print()

    query_no = 0
    while True:
        try:
            query = input("Employer question> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not query:
            continue
        if query.casefold() in {":quit", ":exit", "quit", "exit"}:
            break
        if query.casefold() == ":help":
            print("Ask an employer-style question. Examples:")
            print("  What evidence shows experience with authorization architecture?")
            print("  How has the candidate's testing discipline evolved over time?")
            print("  Which projects provide the strongest evidence of backend engineering?")
            print("  What are the candidate's weakest engineering areas?")
            print("  Which repositories demonstrate product ownership rather than only coding?")
            continue

        query_no += 1
        try:
            print(f"\n[QUERY {query_no}] Evidence-aware hybrid retrieval ... ", end="", flush=True)
            t0 = time.perf_counter()
            results, diagnostics = retrieve(query, matrix, records, lexical, embedding_model, reranker, device)
            elapsed = time.perf_counter() - t0
            counts = diagnostics["candidate_counts"]
            print(
                f"SUCCESS ({elapsed:.3f}s; union {counts['union']} -> concept-pass "
                f"{counts['passed_primary_concept_gate']} -> rerank {counts['cross_encoder']} -> top {counts['final']})"
            )

            payload = {
                "retrieval_schema_version": RETRIEVAL_SCHEMA_VERSION,
                "timestamp_utc": utc_now(),
                "query_number": query_no,
                "query": query,
                "elapsed_seconds": elapsed,
                "diagnostics": diagnostics,
                "results": results,
            }
            append_jsonl(session_path, payload)
            write_json(LATEST_RESULTS_PATH, payload)
            print(f"[QUERY {query_no}] Persist full evidence/provenance ... SUCCESS")
            print()
            print("TOP 10 EVIDENCE-AWARE HYBRID + CROSS-ENCODER RESULTS")
            print("=" * 108)
            for result in results:
                print_result(result)
            print("-" * 108)
            print()
        except Exception as exc:
            print("FAILED")
            print(f"Reason: {exc}")
            print()

    print("Retrieval session ended.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
