#!/usr/bin/env python3
"""
Portfolio GitHub RAG pipeline — Step 4 v2: sophisticated FREE LOCAL hybrid retrieval.

ZERO ARGUMENTS. Run this script from the project root beside `rag-corpus/`:

    python build-rag-retrieval-v2-hybrid-local.py

NO PAID API. NO API KEY. NO MODEL TRAINING.

INPUT
-----
    rag-corpus/embeddings/embeddings.npy
    rag-corpus/embeddings/embedding-records.jsonl
    rag-corpus/embeddings/embedding-manifest.json

OUTPUT
------
    rag-corpus/retrieval-v2/retrieval-config.json
    rag-corpus/retrieval-v2/retrieval-validation-report.txt
    rag-corpus/retrieval-v2/test-results/
        retrieval-session-YYYYMMDD-HHMMSS.jsonl
        latest-results.json

RETRIEVAL PIPELINE
------------------
    Employer question
        -> query analysis + conservative synonym expansion
        -> dense exact cosine candidate retrieval (Nomic, 512D)
        -> BM25 lexical candidate retrieval
        -> metadata/skill/title lexical candidate retrieval
        -> Reciprocal Rank Fusion (RRF)
        -> evidence-quality / template-genericity scoring
        -> local CrossEncoder reranking of a bounded candidate set
        -> final evidence-aware fusion
        -> diversity selection (duplicate / repository / chronology aware)
        -> top evidence with complete provenance

The expensive 11,642 document embeddings from Step 3 are reused unchanged.
Only ONE query is embedded at runtime and only a bounded candidate pool is passed
through the local CrossEncoder.

FIXED DENSE VECTOR SPACE (must match Step 3)
---------------------------------------------
Embedding model:   nomic-ai/nomic-embed-text-v1.5
Revision:          e9b6763023c676ca8431644204f50c2b100d9aab
Native dimension:  768
Stored dimension:  512
Query prefix:      search_query: 
Transform:         layer_norm -> first 512 dimensions -> L2 normalize
Similarity:        exact cosine

LOCAL RERANKER
--------------
Model:             cross-encoder/ms-marco-MiniLM-L6-v2
Pinned revision:   4bebbd56fc380a66525f95b03d4ec1a4b41a4f1e
License:           Apache-2.0
Purpose:           rerank only the bounded hybrid candidate pool

The first run may download the public reranker model from Hugging Face. This is
free and requires no account or token. Once cached, inference is local.
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
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

# ---------------------------------------------------------------------------
# Paths and fixed identities
# ---------------------------------------------------------------------------

SCRIPT_NAME = Path(__file__).name
BASE_DIR = Path(__file__).resolve().parent
RAG_DIR = BASE_DIR / "rag-corpus"
EMBEDDINGS_DIR = RAG_DIR / "embeddings"
MATRIX_PATH = EMBEDDINGS_DIR / "embeddings.npy"
RECORDS_PATH = EMBEDDINGS_DIR / "embedding-records.jsonl"
MANIFEST_PATH = EMBEDDINGS_DIR / "embedding-manifest.json"

OUTPUT_DIR = RAG_DIR / "retrieval-v2"
TEMP_OUTPUT_DIR = RAG_DIR / ".retrieval-v2.tmp"
TEST_RESULTS_DIR = OUTPUT_DIR / "test-results"
CONFIG_PATH = OUTPUT_DIR / "retrieval-config.json"
REPORT_PATH = OUTPUT_DIR / "retrieval-validation-report.txt"
LATEST_RESULTS_PATH = TEST_RESULTS_DIR / "latest-results.json"

RETRIEVAL_SCHEMA_VERSION = "2.0.0"
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

RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L6-v2"
RERANKER_MODEL_REVISION = "4bebbd56fc380a66525f95b03d4ec1a4b41a4f1e"
RERANKER_MAX_LENGTH = 512
RERANKER_CPU_BATCH = 16
RERANKER_GPU_BATCH = 64

# Candidate pool sizes. Exact dense search is cheap at this corpus size.
DENSE_CANDIDATES = 350
BM25_CANDIDATES = 350
METADATA_CANDIDATES = 250
FUSED_PRE_RERANK = 120
RERANK_CANDIDATES = 80
TOP_K = 10
MAX_RESULTS_PER_REPOSITORY = 2
RRF_K = 60.0

# Final fusion weights. Quality adjustment is bounded separately.
WEIGHT_CROSS = 0.48
WEIGHT_DENSE = 0.18
WEIGHT_BM25 = 0.13
WEIGHT_METADATA = 0.09
WEIGHT_RRF = 0.07
WEIGHT_QUALITY = 0.05

DISPLAY_TEXT_CHARS = 1000
UNIT_NORM_TOLERANCE = 1e-4
SELF_TEST_SAMPLE_COUNT = 32
MIN_SENTENCE_TRANSFORMERS_VERSION = (5, 3, 0)
MIN_TRANSFORMERS_VERSION = (5, 5, 0)

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
            f"{name} {version} is too old; require >= {wanted}. Run:\n"
            "  python -m pip install -U numpy sentence-transformers torch transformers"
        )
    return version


def section_label(record: dict[str, Any]) -> str:
    section = record.get("section")
    if not isinstance(section, dict):
        return "(unknown section)"
    path = section.get("path")
    if isinstance(path, list) and path:
        return " > ".join(str(x) for x in path)
    return str(section.get("title") or "(repository introduction)")


def section_title(record: dict[str, Any]) -> str:
    section = record.get("section")
    if not isinstance(section, dict):
        return ""
    return str(section.get("title") or "")


def provenance_label(record: dict[str, Any]) -> str:
    p = record.get("provenance")
    if not isinstance(p, dict):
        return "source unavailable"
    source = p.get("analysis_source_file") or "unknown"
    start = p.get("analysis_source_line_start")
    end = p.get("analysis_source_line_end")
    if start is not None and end is not None:
        return f"{source} lines {start}-{end}"
    return str(source)


def minmax_normalize(values: dict[int, float]) -> dict[int, float]:
    if not values:
        return {}
    lo = min(values.values())
    hi = max(values.values())
    if math.isclose(lo, hi, abs_tol=1e-12):
        return {k: 1.0 if hi > 0 else 0.0 for k in values}
    span = hi - lo
    return {k: (v - lo) / span for k, v in values.items()}


def top_indices_from_scores(scores: Any, k: int) -> list[int]:
    k = min(max(1, int(k)), int(scores.shape[0]))
    if k == scores.shape[0]:
        top = np.argsort(-scores, kind="stable")
    else:
        candidate = np.argpartition(scores, -k)[-k:]
        top = candidate[np.argsort(-scores[candidate], kind="stable")]
    return [int(i) for i in top]


# ---------------------------------------------------------------------------
# Dependencies / model loading
# ---------------------------------------------------------------------------


def load_dependencies() -> dict[str, str]:
    global np, torch, F, SentenceTransformer, CrossEncoder
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
        from sentence_transformers import CrossEncoder as CE
    except ImportError:
        ST = None
        CE = None
        missing.append("sentence-transformers")

    if missing:
        raise PipelineError(
            "Missing required package(s): " + ", ".join(missing) + "\nInstall with:\n"
            "  python -m pip install -U numpy sentence-transformers torch transformers"
        )

    np = numpy_module
    torch = torch_module
    F = functional_module
    SentenceTransformer = ST
    CrossEncoder = CE

    st = require_min_version("sentence-transformers", MIN_SENTENCE_TRANSFORMERS_VERSION)
    tr = require_min_version("transformers", MIN_TRANSFORMERS_VERSION)
    return {
        "python": sys.version.split()[0],
        "numpy": package_version("numpy"),
        "torch": package_version("torch"),
        "sentence-transformers": st,
        "transformers": tr,
    }


def choose_device() -> tuple[str, str]:
    if bool(torch.cuda.is_available()):
        try:
            return "cuda", str(torch.cuda.get_device_name(0))
        except Exception:
            return "cuda", "CUDA GPU"
    mps = getattr(torch.backends, "mps", None)
    if mps is not None and bool(mps.is_available()):
        return "mps", "Apple Metal (MPS)"
    return "cpu", "CPU"


def load_embedding_model(device: str) -> Any:
    try:
        model = SentenceTransformer(
            EMBEDDING_MODEL,
            revision=EMBEDDING_MODEL_REVISION,
            device=device,
            trust_remote_code=False,
        )
    except Exception as exc:
        raise PipelineError(
            "Could not load pinned local embedding model. Step 3 should already have "
            "cached it. No API key is needed.\n"
            f"Model: {EMBEDDING_MODEL}\nRevision: {EMBEDDING_MODEL_REVISION}\n{exc}"
        ) from exc
    try:
        model.eval()
    except Exception:
        pass
    get_dim = getattr(model, "get_embedding_dimension", None)
    model_dim = int(get_dim() if callable(get_dim) else model.get_sentence_embedding_dimension())
    if model_dim != NATIVE_DIMENSIONS:
        raise PipelineError(f"Embedding model dimension {model_dim}; expected {NATIVE_DIMENSIONS}.")
    max_seq = int(getattr(model, "max_seq_length", 0) or 0)
    if max_seq != MAX_SEQUENCE_LENGTH:
        raise PipelineError(f"Embedding max_seq_length={max_seq}; expected {MAX_SEQUENCE_LENGTH}.")
    if not hasattr(model, "tokenizer") or model.tokenizer is None:
        raise PipelineError("Embedding model has no tokenizer.")
    return model


def load_reranker(device: str) -> Any:
    try:
        model = CrossEncoder(
            RERANKER_MODEL,
            revision=RERANKER_MODEL_REVISION,
            device=device,
            trust_remote_code=False,
            max_length=RERANKER_MAX_LENGTH,
            activation_fn=torch.nn.Sigmoid(),
        )
    except Exception as exc:
        raise PipelineError(
            "Could not load the pinned FREE LOCAL reranker. The first run may need "
            "internet access to download the public Hugging Face model; no token/API key "
            "is required.\n"
            f"Model: {RERANKER_MODEL}\nRevision: {RERANKER_MODEL_REVISION}\n{exc}"
        ) from exc
    return model


def apply_nomic_matryoshka(full_embeddings: Any) -> Any:
    if full_embeddings.ndim != 2 or int(full_embeddings.shape[1]) != NATIVE_DIMENSIONS:
        raise PipelineError("Embedding model returned incompatible native dimensions.")
    x = F.layer_norm(full_embeddings, normalized_shape=(full_embeddings.shape[1],))
    x = x[:, :EMBEDDING_DIMENSIONS]
    return F.normalize(x, p=2, dim=1)


def embed_query(model: Any, query: str) -> tuple[Any, int]:
    query = query.strip()
    if not query:
        raise PipelineError("Query cannot be empty.")
    model_input = QUERY_PREFIX + query
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
            f"Query is {token_count} tokens; max {MAX_SEQUENCE_LENGTH}. Refusing truncation."
        )
    try:
        with torch.inference_mode():
            full = model.encode(
                [model_input], batch_size=1, show_progress_bar=False,
                convert_to_tensor=True, normalize_embeddings=False,
            )
            transformed = apply_nomic_matryoshka(full)
            vector = transformed.detach().cpu().to(torch.float32).numpy()[0]
    except Exception as exc:
        raise PipelineError(f"Local query embedding failed: {exc}") from exc
    vector = np.asarray(vector, dtype=np.float32)
    if vector.shape != (EMBEDDING_DIMENSIONS,) or not np.isfinite(vector).all():
        raise PipelineError("Runtime query vector is invalid.")
    norm = float(np.linalg.norm(vector.astype(np.float64)))
    if abs(norm - 1.0) > UNIT_NORM_TOLERANCE:
        raise PipelineError(f"Query vector is not normalized; norm={norm:.8f}.")
    return vector, token_count


# ---------------------------------------------------------------------------
# Step 3 artifact validation (same invariants as v1)
# ---------------------------------------------------------------------------


def validate_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    schema = str(manifest.get("embedding_schema_version", ""))
    if not schema.startswith(EXPECTED_STEP3_SCHEMA_MAJOR + "."):
        raise PipelineError(f"Unsupported Step 3 schema {schema!r}.")
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
    mismatches = []
    for key, wanted in expected.items():
        actual = embedding.get(key)
        if actual != wanted:
            mismatches.append(f"{key}: got {actual!r}, expected {wanted!r}")
    if mismatches:
        raise PipelineError("Incompatible Step 3 vector space:\n  - " + "\n  - ".join(mismatches))
    artifacts = manifest.get("artifacts")
    if not isinstance(artifacts, dict):
        raise PipelineError("Step 3 manifest missing artifacts.")
    mm = artifacts.get("embeddings.npy")
    rm = artifacts.get("embedding-records.jsonl")
    if not isinstance(mm, dict) or not isinstance(rm, dict):
        raise PipelineError("Step 3 manifest missing matrix/record artifact metadata.")
    return {
        "embedding_schema_version": schema,
        "expected_rows": int(mm.get("rows", -1)),
        "expected_columns": int(mm.get("columns", -1)),
        "matrix_sha256": str(mm.get("sha256", "")),
        "expected_records": int(rm.get("records", -1)),
        "records_sha256": str(rm.get("sha256", "")),
    }


def load_and_validate_artifacts(info: dict[str, Any]) -> tuple[Any, list[dict[str, Any]], dict[str, Any]]:
    try:
        matrix = np.load(MATRIX_PATH, mmap_mode="r", allow_pickle=False)
    except Exception as exc:
        raise PipelineError(f"Could not load {rel(MATRIX_PATH)}: {exc}") from exc
    if matrix.shape != (info["expected_rows"], info["expected_columns"]):
        raise PipelineError(f"Matrix shape {matrix.shape} disagrees with Step 3 manifest.")
    if matrix.shape[1] != EMBEDDING_DIMENSIONS or matrix.dtype != np.float32:
        raise PipelineError("Embedding matrix dimensions/dtype are incompatible.")
    mh = sha256_file(MATRIX_PATH)
    rh = sha256_file(RECORDS_PATH)
    if mh != info["matrix_sha256"]:
        raise PipelineError("embeddings.npy SHA-256 mismatch.")
    if rh != info["records_sha256"]:
        raise PipelineError("embedding-records.jsonl SHA-256 mismatch.")
    records = load_jsonl(RECORDS_PATH)
    if len(records) != matrix.shape[0] or len(records) != info["expected_records"]:
        raise PipelineError("Embedding record count does not match matrix/manifest.")

    seen: set[str] = set()
    repos: set[int] = set()
    max_norm_error = 0.0
    for start in range(0, matrix.shape[0], 512):
        block = np.asarray(matrix[start:start+512], dtype=np.float32)
        if not np.isfinite(block).all():
            raise PipelineError("Embedding matrix contains NaN/Inf.")
        norms = np.linalg.norm(block.astype(np.float64), axis=1)
        if np.any(norms <= 0.0):
            raise PipelineError("Embedding matrix contains zero vector(s).")
        max_norm_error = max(max_norm_error, float(np.max(np.abs(norms - 1.0))))
    if max_norm_error > UNIT_NORM_TOLERANCE:
        raise PipelineError(f"Stored vector norm error too large: {max_norm_error:.8f}")

    required = {"vector_index", "chunk_id", "repository_index", "repository_name", "text", "section", "provenance"}
    for i, r in enumerate(records):
        missing = required - set(r)
        if missing:
            raise PipelineError(f"Record {i} missing fields: {sorted(missing)}")
        if int(r["vector_index"]) != i:
            raise PipelineError(f"vector_index mismatch at row {i}.")
        cid = str(r["chunk_id"])
        if cid in seen:
            raise PipelineError(f"Duplicate chunk_id: {cid}")
        seen.add(cid)
        repos.add(int(r["repository_index"]))
    totals = Counter(int(r.get("repository_total", 0)) for r in records)
    repo_total = totals.most_common(1)[0][0] if totals else 0
    expected_repos = set(range(1, repo_total + 1))
    if repo_total <= 0 or repos != expected_repos:
        raise PipelineError("Repository coverage is incomplete or inconsistent.")
    return matrix, records, {
        "vector_count": int(matrix.shape[0]), "dimensions": int(matrix.shape[1]),
        "record_count": len(records), "repository_count": len(repos),
        "repository_total": repo_total, "max_unit_norm_error": max_norm_error,
        "matrix_sha256": mh, "records_sha256": rh,
    }


def exact_search_scores(matrix: Any, query_vector: Any) -> Any:
    scores = np.asarray(matrix @ query_vector, dtype=np.float32)
    if scores.ndim != 1 or scores.shape[0] != matrix.shape[0] or not np.isfinite(scores).all():
        raise PipelineError("Exact cosine search produced invalid scores.")
    return scores


def mathematical_self_test(matrix: Any) -> dict[str, Any]:
    count = int(matrix.shape[0])
    sample_count = min(SELF_TEST_SAMPLE_COUNT, count)
    sample_indices = [0] if sample_count == 1 else [
        int(round(i * (count - 1) / (sample_count - 1))) for i in range(sample_count)
    ]
    minimum = 1.0
    failures = 0
    for idx in sample_indices:
        q = np.asarray(matrix[idx], dtype=np.float32)
        scores = exact_search_scores(matrix, q)
        own = float(scores[idx]); minimum = min(minimum, own)
        if abs(own - 1.0) > 2e-4 or float(np.max(scores)) > own + 2e-5:
            failures += 1
    if failures:
        raise PipelineError(f"Dense mathematical self-test failed for {failures} samples.")
    return {"sample_count": sample_count, "failures": 0, "minimum_self_similarity": minimum}


# ---------------------------------------------------------------------------
# Query understanding and lexical processing
# ---------------------------------------------------------------------------

TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9_+.#/-]*", re.IGNORECASE)

STOPWORDS = {
    "a","an","and","are","as","at","be","been","being","but","by","can","candidate",
    "could","did","do","does","for","from","had","has","have","he","her","his","how",
    "i","in","into","is","it","its","me","most","of","on","or","our","provide","repo",
    "repositories","repository","show","shows","that","the","their","them","there","these",
    "they","this","to","was","were","what","when","where","which","who","why","with",
    "would","you","your","experience","evidence","engineering","project","projects",
}

# Conservative domain expansion. Expansion terms assist recall; they do not become claims.
SYNONYM_GROUPS = [
    {"authorization","authorisation","authz","rbac","permission","permissions","roles","role","iam","access-control","access"},
    {"authentication","authn","login","session","sessions","oauth","identity","signin","sign-in"},
    {"backend","server","api","apis","endpoint","endpoints","service","services","spring","django","worker"},
    {"testing","test","tests","unit-test","integration-test","e2e","playwright","vitest","pytest","ci"},
    {"security","secure","iam","rbac","permissions","origin","csrf","xss"},
    {"database","databases","sql","postgresql","mysql","firebase","d1","persistence","storage"},
    {"distributed","concurrency","concurrent","threading","threads","synchronization","kafka","queue","queues"},
    {"embedded","firmware","microcontroller","mcu","uart","i2c","spi","nrf","zephyr"},
    {"wireless","wifi","wi-fi","5g","lte","radio","rf","rtt","latency","throughput"},
    {"product","ownership","stakeholder","requirements","roadmap","users","business","delivery"},
    {"architecture","architectural","design","system-design","boundaries","components","dataflow","data-flow"},
    {"deployment","deploy","deployed","cicd","ci/cd","netlify","azure","cloudflare","render"},
]

NEGATIVE_INTENT_TERMS = {
    "weakest","weakness","weaknesses","limitation","limitations","lack","lacks","missing","absent",
    "gap","gaps","debt","mistake","mistakes","failure","failures","risk","risks","not-prove","does-not-prove",
    "shortcoming","shortcomings","concern","concerns","problem","problems",
}
CHRONOLOGY_TERMS = {
    "evolved","evolution","over-time","progression","trajectory","throughout","earliest","first","recent",
    "latest","matured","growth","developed","history","chronology","timeline",
}
STRONG_EVIDENCE_TERMS = {
    "strongest","best","strong","demonstrate","demonstrates","prove","proves","implemented","built","authored",
    "production","mature","direct","capability","capabilities",
}


def tokenize(text: str, *, keep_stopwords: bool = False) -> list[str]:
    tokens = []
    for raw in TOKEN_RE.findall(text.casefold().replace("’", "'")):
        t = raw.strip("-_/.")
        if not t:
            continue
        if not keep_stopwords and t in STOPWORDS:
            continue
        tokens.append(t)
    return tokens


def normalize_query_phrase(text: str) -> str:
    x = text.casefold()
    x = re.sub(r"\bdoes\s+not\s+prove\b", "does-not-prove", x)
    x = re.sub(r"\bover\s+time\b", "over-time", x)
    x = re.sub(r"\baccess\s+control\b", "access-control", x)
    x = re.sub(r"\bsign\s+in\b", "sign-in", x)
    return x


@dataclass
class QueryIntent:
    original: str
    normalized: str
    base_tokens: list[str]
    expanded_tokens: list[str]
    negative_or_limitations: bool
    chronology: bool
    strongest_evidence: bool
    requested_repository_indexes: set[int]
    requested_repository_names: set[str]


def analyze_query(query: str, records: list[dict[str, Any]]) -> QueryIntent:
    normalized = normalize_query_phrase(query)
    base = tokenize(normalized)
    base_set = set(base)
    expanded = list(base)
    for group in SYNONYM_GROUPS:
        if base_set & group:
            for term in sorted(group):
                if term not in expanded:
                    expanded.append(term)
    negative = bool(base_set & NEGATIVE_INTENT_TERMS)
    chronology = bool(base_set & CHRONOLOGY_TERMS)
    strongest = bool(base_set & STRONG_EVIDENCE_TERMS) or ("evidence" in normalized and not negative)

    requested_indexes: set[int] = set()
    for m in re.finditer(r"(?:\brepo(?:sitory)?\s*#?0*(\d{1,3})\b|#0*(\d{1,3})\b)", normalized):
        raw_value = m.group(1) or m.group(2)
        value = int(raw_value)
        if 1 <= value <= 999:
            requested_indexes.add(value)

    requested_names: set[str] = set()
    qcf = query.casefold()
    unique_names = {str(r.get("repository_name") or "") for r in records}
    for name in unique_names:
        if len(name) < 4:
            continue
        escaped = re.escape(name.casefold())
        if re.search(r"(?<![a-z0-9])" + escaped + r"(?![a-z0-9])", qcf):
            requested_names.add(name)

    return QueryIntent(
        original=query,
        normalized=normalized,
        base_tokens=base,
        expanded_tokens=expanded,
        negative_or_limitations=negative,
        chronology=chronology,
        strongest_evidence=strongest,
        requested_repository_indexes=requested_indexes,
        requested_repository_names=requested_names,
    )


# ---------------------------------------------------------------------------
# BM25 + metadata lexical index
# ---------------------------------------------------------------------------


def skill_names(record: dict[str, Any]) -> list[str]:
    out: list[str] = []
    rows = record.get("related_skill_ratings")
    if isinstance(rows, list):
        for row in rows:
            if isinstance(row, dict) and row.get("skill"):
                out.append(str(row["skill"]))
    return out


def record_year(record: dict[str, Any]) -> int | None:
    c = record.get("chronology_summary")
    texts: list[str] = []
    if isinstance(c, dict):
        texts.extend(str(v) for v in c.values() if v)
    texts.append(str(record.get("text") or "")[:500])
    years = []
    for text in texts:
        years.extend(int(y) for y in re.findall(r"\b(20\d{2}|19\d{2})\b", text))
    return min(years) if years else None


def lexical_document(record: dict[str, Any]) -> str:
    tags = record.get("retrieval_tags")
    tag_text = " ".join(str(x) for x in tags) if isinstance(tags, list) else ""
    categories = record.get("canonical_categories")
    category_text = " ".join(str(x) for x in categories) if isinstance(categories, list) else ""
    skills = " ".join(skill_names(record))
    # Repeat high-signal metadata moderately so BM25 sees section/tags/skills without
    # allowing metadata boilerplate to completely overwhelm the evidence text.
    return "\n".join([
        str(record.get("repository_name") or ""),
        section_label(record), section_label(record),
        str(record.get("primary_category") or ""), category_text,
        tag_text, tag_text,
        skills, skills,
        str(record.get("text") or ""),
    ])


def metadata_document(record: dict[str, Any]) -> str:
    tags = record.get("retrieval_tags")
    categories = record.get("canonical_categories")
    return " ".join([
        str(record.get("repository_name") or ""),
        section_label(record),
        str(record.get("primary_category") or ""),
        " ".join(str(x) for x in tags) if isinstance(tags, list) else "",
        " ".join(str(x) for x in categories) if isinstance(categories, list) else "",
        " ".join(skill_names(record)),
        str((record.get("classification_summary") or {}).get("technical_realm", "")) if isinstance(record.get("classification_summary"), dict) else "",
        str((record.get("classification_summary") or {}).get("business_realm", "")) if isinstance(record.get("classification_summary"), dict) else "",
    ])


@dataclass
class LexicalIndex:
    postings: dict[str, list[tuple[int, int]]]
    doc_lengths: list[int]
    avg_doc_length: float
    doc_freq: dict[str, int]
    metadata_tokens: list[Counter[str]]
    title_frequency: Counter[str]
    years: list[int | None]


def build_lexical_index(records: list[dict[str, Any]]) -> LexicalIndex:
    postings: dict[str, list[tuple[int, int]]] = defaultdict(list)
    doc_lengths: list[int] = []
    doc_freq: dict[str, int] = defaultdict(int)
    metadata_tokens: list[Counter[str]] = []
    title_frequency: Counter[str] = Counter()
    years: list[int | None] = []

    for idx, record in enumerate(records):
        toks = tokenize(lexical_document(record))
        counts = Counter(toks)
        doc_lengths.append(sum(counts.values()))
        for token, tf in counts.items():
            postings[token].append((idx, tf))
            doc_freq[token] += 1
        metadata_tokens.append(Counter(tokenize(metadata_document(record))))
        title_frequency[section_title(record).casefold().strip()] += 1
        years.append(record_year(record))

    avg = sum(doc_lengths) / max(1, len(doc_lengths))
    return LexicalIndex(dict(postings), doc_lengths, avg, dict(doc_freq), metadata_tokens, title_frequency, years)


def weighted_query_terms(intent: QueryIntent) -> dict[str, float]:
    """Weight exact employer wording above conservative recall expansions."""
    weights: dict[str, float] = {}
    base = set(intent.base_tokens)
    for token in intent.expanded_tokens:
        weights[token] = max(weights.get(token, 0.0), 1.0 if token in base else 0.32)
    # Phrases/concepts that are inherently broad should not dominate merely because
    # a synonym expansion produced them.
    for broad in {"design", "components", "boundaries", "access", "role", "secure"}:
        if broad not in base and broad in weights:
            weights[broad] = min(weights[broad], 0.22)
    return weights


def bm25_scores(index: LexicalIndex, query_tokens: list[str] | dict[str, float], n_docs: int) -> dict[int, float]:
    k1 = 1.45
    b = 0.72
    scores: dict[int, float] = defaultdict(float)
    if isinstance(query_tokens, dict):
        qweights = dict(query_tokens)
    else:
        qweights = {t: float(c) for t, c in Counter(query_tokens).items()}
    for token, qweight_raw in qweights.items():
        plist = index.postings.get(token)
        if not plist:
            continue
        df = index.doc_freq[token]
        idf = math.log(1.0 + (n_docs - df + 0.5) / (df + 0.5))
        qweight = max(0.0, float(qweight_raw))
        for doc_id, tf in plist:
            dl = index.doc_lengths[doc_id]
            denom = tf + k1 * (1.0 - b + b * dl / max(index.avg_doc_length, 1e-9))
            scores[doc_id] += idf * (tf * (k1 + 1.0) / denom) * qweight
    return dict(scores)


def metadata_scores(index: LexicalIndex, intent: QueryIntent, records: list[dict[str, Any]]) -> dict[int, float]:
    q = weighted_query_terms(intent)
    result: dict[int, float] = {}
    for idx, counts in enumerate(index.metadata_tokens):
        score = 0.0
        for token, qweight in q.items():
            if token in counts:
                df = index.doc_freq.get(token, 1)
                idf = math.log(1.0 + len(records) / max(df, 1))
                score += idf * min(counts[token], 3) * qweight
        record = records[idx]
        if int(record["repository_index"]) in intent.requested_repository_indexes:
            score += 25.0
        if str(record["repository_name"]) in intent.requested_repository_names:
            score += 25.0
        if score > 0:
            result[idx] = score
    return result


def top_dict_scores(values: dict[int, float], k: int) -> list[int]:
    return [idx for idx, _ in sorted(values.items(), key=lambda kv: (-kv[1], kv[0]))[:k]]


def lexical_self_test() -> dict[str, Any]:
    toy = [
        {"repository_name":"a","section":{"title":"Authorization","path":["Authorization"]},"text":"role based access control permissions", "retrieval_tags":["rbac"], "related_skill_ratings":[]},
        {"repository_name":"b","section":{"title":"Imaging","path":["Imaging"]},"text":"gaussian blur image filtering", "retrieval_tags":["image"], "related_skill_ratings":[]},
    ]
    idx = build_lexical_index(toy)
    scores = bm25_scores(idx, ["authorization","rbac","permissions"], 2)
    if not scores or max(scores, key=scores.get) != 0:
        raise PipelineError("BM25 lexical self-test failed.")
    return {"toy_documents": 2, "winner": 0}


# ---------------------------------------------------------------------------
# Evidence quality / genericity model
# ---------------------------------------------------------------------------

GENERIC_SECTION_PATTERNS = [
    "expanded direct-skill evidence ledger",
    "architecture review checklist",
    "retrieval tags",
    "rag metadata",
    "anti-inflation",
    "evidence ledger",
    "architecture checklist",
    "queryable",
]

NEGATIVE_EVIDENCE_PATTERNS = [
    "no substantive implementation exists",
    "absent / n/a",
    "not evidenced",
    "no implemented technology",
    "does not prove",
    "not prove",
    "no direct evidence",
    "retain only chronology/intent",
    "conceptual exposure",
    "rather than proven",
    "assistant-generated",
]

CONCRETE_EVIDENCE_PATTERNS = [
    "implemented", "exposes", "requires", "validates", "configured", "created", "built",
    "endpoint", "route", "middleware", "test", "workflow", "schema", "database", "session",
    "permission", "role", "authentication", "authorization", "source file", "commit",
]


def query_term_hits(text: str, tokens: Iterable[str]) -> int:
    tf = Counter(tokenize(text))
    return sum(1 for t in set(tokens) if tf.get(t, 0) > 0)


def maximum_related_skill_rating(record: dict[str, Any], intent: QueryIntent) -> tuple[float | None, int]:
    rows = record.get("related_skill_ratings")
    if not isinstance(rows, list):
        return None, 0
    q = set(intent.expanded_tokens)
    ratings: list[float] = []
    matching = 0
    for row in rows:
        if not isinstance(row, dict):
            continue
        skill = str(row.get("skill") or "")
        skill_tokens = set(tokenize(skill))
        try:
            rating = float(row.get("rating_5"))
        except (TypeError, ValueError):
            continue
        ratings.append(rating)
        if skill_tokens & q:
            matching += 1
    if not ratings:
        return None, matching
    return max(ratings), matching


def concept_aliases_for_token(token: str) -> set[str]:
    aliases = {token}
    for group in SYNONYM_GROUPS:
        if token in group:
            aliases |= group
    return aliases


def base_concept_coverage(record: dict[str, Any], intent: QueryIntent) -> tuple[int, int]:
    if not intent.base_tokens:
        return 0, 0
    haystack = " ".join([section_label(record), metadata_document(record), str(record.get("text") or "")])
    tokens = set(tokenize(haystack))
    covered = 0
    for base in set(intent.base_tokens):
        if tokens & concept_aliases_for_token(base):
            covered += 1
    return covered, len(set(intent.base_tokens))


def quality_adjustment(record: dict[str, Any], intent: QueryIntent, index: LexicalIndex) -> tuple[float, dict[str, float | int | str | bool]]:
    title = section_title(record).casefold().strip()
    label = section_label(record).casefold()
    text = str(record.get("text") or "")
    low = text.casefold()
    tags = " ".join(str(x) for x in (record.get("retrieval_tags") or []))
    skills = " ".join(skill_names(record))

    adjustment = 0.0
    details: dict[str, float | int | str | bool] = {}

    title_freq = index.title_frequency.get(title, 0)
    repeated_title_penalty = 0.0
    if title_freq >= 40:
        repeated_title_penalty = min(0.20, 0.07 + (title_freq - 40) / 500.0)
    if any(p in label for p in GENERIC_SECTION_PATTERNS):
        repeated_title_penalty = max(repeated_title_penalty, 0.18)
    # Do not punish a generic section if the query explicitly asks for that concept.
    title_hits = query_term_hits(label, intent.base_tokens)
    if title_hits >= 2:
        repeated_title_penalty *= 0.35
    adjustment -= repeated_title_penalty

    negative_hits = sum(1 for p in NEGATIVE_EVIDENCE_PATTERNS if p in low)
    negative_penalty = 0.0
    if negative_hits:
        if intent.negative_or_limitations:
            adjustment += min(0.18, 0.05 * negative_hits)
        else:
            negative_penalty = min(0.30, 0.09 * negative_hits)
            adjustment -= negative_penalty

    concrete_hits = sum(1 for p in CONCRETE_EVIDENCE_PATTERNS if p in low)
    concrete_bonus = min(0.12, concrete_hits * 0.012)
    adjustment += concrete_bonus

    metadata_hit_count = query_term_hits(" ".join([label, tags, skills]), intent.expanded_tokens)
    metadata_bonus = min(0.16, metadata_hit_count * 0.025)
    adjustment += metadata_bonus

    covered_concepts, total_concepts = base_concept_coverage(record, intent)
    concept_bonus = 0.0
    if total_concepts:
        coverage_ratio = covered_concepts / total_concepts
        concept_bonus = 0.14 * coverage_ratio
        adjustment += concept_bonus

    max_rating, matching_skills = maximum_related_skill_rating(record, intent)
    skill_bonus = 0.0
    if max_rating is not None and matching_skills > 0:
        skill_bonus = min(0.12, (max_rating / 5.0) * 0.10 + min(matching_skills, 2) * 0.01)
        adjustment += skill_bonus

    word_count = int(record.get("word_count", 0) or 0)
    short_penalty = 0.0
    if word_count and word_count < 12:
        short_penalty = 0.10
        adjustment -= short_penalty

    if intent.requested_repository_indexes and int(record["repository_index"]) not in intent.requested_repository_indexes:
        adjustment -= 0.35
    if intent.requested_repository_names and str(record["repository_name"]) not in intent.requested_repository_names:
        adjustment -= 0.35

    adjustment = max(-0.45, min(0.35, adjustment))
    details.update({
        "adjustment": adjustment,
        "section_title_frequency": title_freq,
        "generic_template_penalty": repeated_title_penalty,
        "negative_pattern_hits": negative_hits,
        "negative_evidence_penalty": negative_penalty,
        "concrete_pattern_hits": concrete_hits,
        "concrete_bonus": concrete_bonus,
        "metadata_query_hits": metadata_hit_count,
        "metadata_bonus": metadata_bonus,
        "base_concepts_covered": covered_concepts,
        "base_concepts_total": total_concepts,
        "base_concept_coverage_bonus": concept_bonus,
        "matching_skill_rows": matching_skills,
        "max_related_skill_rating": max_rating if max_rating is not None else "none",
        "skill_bonus": skill_bonus,
        "short_chunk_penalty": short_penalty,
    })
    return adjustment, details


# ---------------------------------------------------------------------------
# Hybrid candidate generation + reranking
# ---------------------------------------------------------------------------


def reciprocal_rank_fusion(rankings: list[list[int]]) -> dict[int, float]:
    scores: dict[int, float] = defaultdict(float)
    for ranking in rankings:
        for rank, idx in enumerate(ranking, start=1):
            scores[idx] += 1.0 / (RRF_K + rank)
    return dict(scores)


def build_rerank_passage(record: dict[str, Any]) -> str:
    tags = record.get("retrieval_tags")
    tag_text = ", ".join(str(x) for x in tags) if isinstance(tags, list) else ""
    skills = ", ".join(skill_names(record))
    classification = record.get("classification_summary")
    technical = ""
    maturity = ""
    if isinstance(classification, dict):
        technical = str(classification.get("technical_realm") or "")
        maturity = str(classification.get("maturity") or "")
    text = str(record.get("text") or "")
    # Put the highest-signal fields before evidence so they survive the 512-token
    # cross-encoder window even when a source chunk is long.
    return (
        f"Repository: {record.get('repository_name')} (#{int(record.get('repository_index', 0)):03d})\n"
        f"Section: {section_label(record)}\n"
        f"Category: {record.get('primary_category') or ''}\n"
        f"Technical realm: {technical}\n"
        f"Maturity: {maturity}\n"
        f"Retrieval tags: {tag_text}\n"
        f"Related skills: {skills}\n"
        f"Evidence:\n{text}"
    )


def cross_encoder_scores(reranker: Any, query: str, candidates: list[int], records: list[dict[str, Any]], device: str) -> dict[int, float]:
    pairs = [(query, build_rerank_passage(records[idx])) for idx in candidates]
    batch_size = RERANKER_GPU_BATCH if device == "cuda" else RERANKER_CPU_BATCH
    try:
        with torch.inference_mode():
            values = reranker.predict(
                pairs,
                batch_size=batch_size,
                show_progress_bar=False,
                convert_to_numpy=True,
            )
    except Exception as exc:
        # Some sentence-transformers versions do not expose convert_to_numpy.
        try:
            with torch.inference_mode():
                values = reranker.predict(pairs, batch_size=batch_size, show_progress_bar=False)
        except Exception as exc2:
            raise PipelineError(f"Local CrossEncoder reranking failed: {exc2}") from exc
    arr = np.asarray(values, dtype=np.float32).reshape(-1)
    if arr.shape[0] != len(candidates) or not np.isfinite(arr).all():
        raise PipelineError("CrossEncoder returned invalid score array.")
    return {idx: float(arr[pos]) for pos, idx in enumerate(candidates)}


def result_from_record(rank: int, final_score: float, idx: int, record: dict[str, Any], components: dict[str, Any]) -> dict[str, Any]:
    return {
        "rank": rank,
        "final_score": final_score,
        "vector_index": idx,
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
        "score_components": components,
    }


def final_diverse_selection(
    ranked: list[tuple[int, float, dict[str, Any]]],
    matrix: Any,
    records: list[dict[str, Any]],
    intent: QueryIntent,
) -> list[tuple[int, float, dict[str, Any]]]:
    selected: list[tuple[int, float, dict[str, Any]]] = []
    repo_counts: Counter[int] = Counter()
    used_years: set[int] = set()
    specific_repo = bool(intent.requested_repository_indexes or intent.requested_repository_names)

    remaining = list(ranked)
    while remaining and len(selected) < TOP_K:
        best_pos = None
        best_adjusted = -1e9
        for pos, (idx, base_score, comp) in enumerate(remaining[:80]):
            record = records[idx]
            repo = int(record["repository_index"])
            if not specific_repo and repo_counts[repo] >= MAX_RESULTS_PER_REPOSITORY:
                continue

            adjusted = base_score
            # Semantic duplicate suppression using already available document vectors.
            max_similarity = 0.0
            if selected:
                v = np.asarray(matrix[idx], dtype=np.float32)
                sims = [float(v @ np.asarray(matrix[sidx], dtype=np.float32)) for sidx, _, _ in selected]
                max_similarity = max(sims)
                if max_similarity >= 0.97:
                    adjusted -= 0.25
                elif max_similarity >= 0.93:
                    adjusted -= 0.10

            year = record_year(record)
            chronology_bonus = 0.0
            if intent.chronology and year is not None and year not in used_years:
                chronology_bonus = 0.035
                adjusted += chronology_bonus

            repo_novelty = 0.0
            if not specific_repo and repo_counts[repo] == 0:
                repo_novelty = 0.015
                adjusted += repo_novelty

            if adjusted > best_adjusted:
                best_adjusted = adjusted
                best_pos = pos
                comp["selection_max_similarity_to_prior"] = max_similarity
                comp["selection_chronology_bonus"] = chronology_bonus
                comp["selection_repository_novelty_bonus"] = repo_novelty
                comp["selection_adjusted_score"] = adjusted

        if best_pos is None:
            break
        item = remaining.pop(best_pos)
        selected.append(item)
        repo = int(records[item[0]]["repository_index"])
        repo_counts[repo] += 1
        y = record_year(records[item[0]])
        if y is not None:
            used_years.add(y)

    return selected


def hybrid_retrieve(
    query: str,
    query_vector: Any,
    matrix: Any,
    records: list[dict[str, Any]],
    lexical: LexicalIndex,
    reranker: Any,
    device: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    intent = analyze_query(query, records)

    # Stage A: exact dense over entire matrix.
    dense_all = exact_search_scores(matrix, query_vector)
    dense_rank = top_indices_from_scores(dense_all, DENSE_CANDIDATES)

    # Stage B: BM25 lexical recall.
    bm25_all = bm25_scores(lexical, weighted_query_terms(intent), len(records))
    bm25_rank = top_dict_scores(bm25_all, BM25_CANDIDATES)

    # Stage C: metadata/title/tags/skills lexical recall.
    meta_all = metadata_scores(lexical, intent, records)
    meta_rank = top_dict_scores(meta_all, METADATA_CANDIDATES)

    # Stage D: robust rank fusion. Each retriever gets one vote; no score scale assumptions.
    rrf_all = reciprocal_rank_fusion([dense_rank, bm25_rank, meta_rank])
    union = set(dense_rank) | set(bm25_rank) | set(meta_rank)

    # Query-aware corpus narrowing when the employer explicitly names a repository.
    if intent.requested_repository_indexes or intent.requested_repository_names:
        explicit = {
            i for i in union
            if int(records[i]["repository_index"]) in intent.requested_repository_indexes
            or str(records[i]["repository_name"]) in intent.requested_repository_names
        }
        if explicit:
            union = explicit

    # Pre-rerank score uses normalized heterogeneous components plus quality. This
    # chooses the bounded CrossEncoder pool; final score is recalculated later.
    dense_union = {i: float(dense_all[i]) for i in union}
    bm25_union = {i: float(bm25_all.get(i, 0.0)) for i in union}
    meta_union = {i: float(meta_all.get(i, 0.0)) for i in union}
    rrf_union = {i: float(rrf_all.get(i, 0.0)) for i in union}
    dn = minmax_normalize(dense_union)
    bn = minmax_normalize(bm25_union)
    mn = minmax_normalize(meta_union)
    rn = minmax_normalize(rrf_union)

    quality: dict[int, tuple[float, dict[str, Any]]] = {}
    pre_scores: dict[int, float] = {}
    for i in union:
        qadj, qdetails = quality_adjustment(records[i], intent, lexical)
        quality[i] = (qadj, qdetails)
        pre_scores[i] = (
            0.40 * dn.get(i, 0.0) + 0.25 * bn.get(i, 0.0) +
            0.17 * mn.get(i, 0.0) + 0.18 * rn.get(i, 0.0) +
            0.22 * qadj
        )

    pre_rank = [i for i, _ in sorted(pre_scores.items(), key=lambda kv: (-kv[1], kv[0]))[:FUSED_PRE_RERANK]]
    rerank_pool = pre_rank[:RERANK_CANDIDATES]
    cross = cross_encoder_scores(reranker, query, rerank_pool, records, device)
    cn = minmax_normalize(cross)

    # Normalize candidate-stage metrics only over the reranker pool.
    dense_pool = minmax_normalize({i: dense_union[i] for i in rerank_pool})
    bm25_pool = minmax_normalize({i: bm25_union[i] for i in rerank_pool})
    meta_pool = minmax_normalize({i: meta_union[i] for i in rerank_pool})
    rrf_pool = minmax_normalize({i: rrf_union[i] for i in rerank_pool})

    final_ranked: list[tuple[int, float, dict[str, Any]]] = []
    for i in rerank_pool:
        qadj, qdetails = quality[i]
        quality01 = (qadj + 0.45) / 0.80  # map bounded [-.45,.35] to [0,1]
        quality01 = max(0.0, min(1.0, quality01))
        score = (
            WEIGHT_CROSS * cn.get(i, 0.0) +
            WEIGHT_DENSE * dense_pool.get(i, 0.0) +
            WEIGHT_BM25 * bm25_pool.get(i, 0.0) +
            WEIGHT_METADATA * meta_pool.get(i, 0.0) +
            WEIGHT_RRF * rrf_pool.get(i, 0.0) +
            WEIGHT_QUALITY * quality01
        )
        components = {
            "dense_cosine_raw": dense_union[i],
            "dense_normalized": dense_pool.get(i, 0.0),
            "bm25_raw": bm25_union[i],
            "bm25_normalized": bm25_pool.get(i, 0.0),
            "metadata_raw": meta_union[i],
            "metadata_normalized": meta_pool.get(i, 0.0),
            "rrf_raw": rrf_union[i],
            "rrf_normalized": rrf_pool.get(i, 0.0),
            "cross_encoder_raw": cross[i],
            "cross_encoder_normalized": cn.get(i, 0.0),
            "quality_adjustment": qadj,
            "quality_details": qdetails,
            "pre_rerank_score": pre_scores[i],
            "final_fusion_score_before_diversity": score,
        }
        final_ranked.append((i, score, components))

    final_ranked.sort(key=lambda x: (-x[1], x[0]))
    selected = final_diverse_selection(final_ranked, matrix, records, intent)

    results: list[dict[str, Any]] = []
    for rank, (idx, score, components) in enumerate(selected, start=1):
        results.append(result_from_record(rank, score, idx, records[idx], components))

    diagnostics = {
        "query_intent": {
            "base_tokens": intent.base_tokens,
            "expanded_tokens": intent.expanded_tokens,
            "negative_or_limitations": intent.negative_or_limitations,
            "chronology": intent.chronology,
            "strongest_evidence": intent.strongest_evidence,
            "requested_repository_indexes": sorted(intent.requested_repository_indexes),
            "requested_repository_names": sorted(intent.requested_repository_names),
        },
        "candidate_counts": {
            "dense": len(dense_rank), "bm25": len(bm25_rank), "metadata": len(meta_rank),
            "union": len(union), "pre_rerank": len(pre_rank), "cross_encoder": len(rerank_pool),
            "final": len(results),
        },
    }
    return results, diagnostics


# ---------------------------------------------------------------------------
# Validation of reranking behavior
# ---------------------------------------------------------------------------


def reranker_self_test(reranker: Any, device: str) -> dict[str, Any]:
    query = "authorization architecture role based access control permissions"
    positive = "The API validates signed sessions and enforces role-based permissions on protected admin routes."
    negative = "The image-processing notebook applies Gaussian blur and edge detection to photographs."
    try:
        scores = cross_encoder_scores(
            reranker, query, [0, 1],
            [{"repository_name":"positive","repository_index":1,"section":{"path":["Authorization"]},"primary_category":"security","text":positive,"retrieval_tags":["authorization","rbac"],"related_skill_ratings":[],"classification_summary":{}},
             {"repository_name":"negative","repository_index":2,"section":{"path":["Image processing"]},"primary_category":"image","text":negative,"retrieval_tags":["image-processing"],"related_skill_ratings":[],"classification_summary":{}}],
            device,
        )
    except Exception as exc:
        raise PipelineError(f"CrossEncoder self-test failed to execute: {exc}") from exc
    pos = scores[0]; neg = scores[1]
    if not pos > neg:
        raise PipelineError(f"CrossEncoder self-test failed: relevant={pos:.6f}, irrelevant={neg:.6f}")
    return {"relevant_score": pos, "irrelevant_score": neg, "pass": True}


# ---------------------------------------------------------------------------
# Output + interactive UI
# ---------------------------------------------------------------------------


def print_results(results: list[dict[str, Any]]) -> None:
    print()
    print(f"TOP {len(results)} HYBRID + CROSS-ENCODER RESULTS")
    print("=" * 104)
    for r in results:
        c = r["score_components"]
        text = str(r.get("text") or "").strip().replace("\r", "")
        display = text[:DISPLAY_TEXT_CHARS].rstrip() + (" ..." if len(text) > DISPLAY_TEXT_CHARS else "")
        print(
            f"#{r['rank']:02d} final={r['final_score']:.6f}  repo={r['repository_index']:03d}  {r['repository_name']}"
        )
        print(f"     Section: {r['section_label']}")
        print(f"     Chunk:   {r['chunk_id']}")
        print(f"     Source:  {r['provenance_label']}")
        print(
            "     Scores:  "
            f"cross={c['cross_encoder_raw']:.4f}  dense={c['dense_cosine_raw']:.4f}  "
            f"bm25={c['bm25_raw']:.3f}  meta={c['metadata_raw']:.3f}  "
            f"quality={c['quality_adjustment']:+.3f}"
        )
        qd = c.get("quality_details", {})
        if qd:
            print(
                "     Quality: "
                f"generic_penalty={float(qd.get('generic_template_penalty',0)):.3f}  "
                f"negative_penalty={float(qd.get('negative_evidence_penalty',0)):.3f}  "
                f"metadata_hits={int(qd.get('metadata_query_hits',0))}  "
                f"concrete_hits={int(qd.get('concrete_pattern_hits',0))}"
            )
        print("     Evidence:")
        for line in display.splitlines() or [""]:
            print(f"       {line}")
        print("-" * 104)


def publish_validation_outputs(
    manifest_info: dict[str, Any], artifact_stats: dict[str, Any], dense_test: dict[str, Any],
    lexical_test: dict[str, Any], rerank_test: dict[str, Any], dependency_versions: dict[str, str],
    device: str, device_name: str, lexical: LexicalIndex,
) -> None:
    if TEMP_OUTPUT_DIR.exists():
        shutil.rmtree(TEMP_OUTPUT_DIR)
    TEMP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (TEMP_OUTPUT_DIR / "test-results").mkdir(parents=True, exist_ok=True)

    config = {
        "retrieval_schema_version": RETRIEVAL_SCHEMA_VERSION,
        "pipeline_step": "4-v2",
        "generated_at_utc": utc_now(),
        "script": SCRIPT_NAME,
        "cost": {"paid_api_used": False, "api_key_required": False, "model_training": False, "retrieval_cost_usd": 0},
        "input": {
            "vectors": rel(MATRIX_PATH), "records": rel(RECORDS_PATH), "manifest": rel(MANIFEST_PATH),
            "vectors_sha256": artifact_stats["matrix_sha256"], "records_sha256": artifact_stats["records_sha256"],
            "step3_embedding_schema_version": manifest_info["embedding_schema_version"],
        },
        "dense_embedding": {
            "model": EMBEDDING_MODEL, "model_revision": EMBEDDING_MODEL_REVISION,
            "native_dimensions": NATIVE_DIMENSIONS, "stored_dimensions": EMBEDDING_DIMENSIONS,
            "query_prefix": QUERY_PREFIX, "similarity": SIMILARITY,
        },
        "reranker": {
            "model": RERANKER_MODEL, "model_revision": RERANKER_MODEL_REVISION,
            "max_length": RERANKER_MAX_LENGTH, "device": device, "device_name": device_name,
        },
        "retrieval": {
            "stages": ["query-analysis", "exact-dense", "bm25", "metadata-lexical", "rrf", "evidence-quality", "cross-encoder", "score-fusion", "diversity-selection"],
            "dense_candidates": DENSE_CANDIDATES, "bm25_candidates": BM25_CANDIDATES,
            "metadata_candidates": METADATA_CANDIDATES, "fused_pre_rerank": FUSED_PRE_RERANK,
            "rerank_candidates": RERANK_CANDIDATES, "top_k": TOP_K,
            "max_results_per_repository": MAX_RESULTS_PER_REPOSITORY,
            "weights": {"cross":WEIGHT_CROSS,"dense":WEIGHT_DENSE,"bm25":WEIGHT_BM25,"metadata":WEIGHT_METADATA,"rrf":WEIGHT_RRF,"quality":WEIGHT_QUALITY},
            "hard_global_template_deletion": False,
            "negative_evidence_query_aware": True,
            "chronology_diversity_query_aware": True,
        },
        "corpus": {
            "vector_count": artifact_stats["vector_count"], "record_count": artifact_stats["record_count"],
            "repository_count": artifact_stats["repository_count"], "repository_total": artifact_stats["repository_total"],
            "bm25_unique_terms": len(lexical.postings), "avg_bm25_doc_length": lexical.avg_doc_length,
        },
        "validation": {
            "step3_hashes": "PASS", "dense_math": dense_test, "bm25_self_test": lexical_test,
            "reranker_self_test": rerank_test, "repository_coverage": "PASS", "unit_vectors": "PASS",
        },
        "dependencies": dependency_versions,
    }
    write_json(TEMP_OUTPUT_DIR / "retrieval-config.json", config)

    lines = [
        "Portfolio GitHub RAG pipeline — Step 4 v2 sophisticated hybrid retrieval validation",
        "", "STATUS: PASS", "",
        "INPUT", f"  {rel(MATRIX_PATH)}", f"  {rel(RECORDS_PATH)}", f"  {rel(MANIFEST_PATH)}", "",
        "OUTPUT", "  rag-corpus/retrieval-v2/retrieval-config.json", "  rag-corpus/retrieval-v2/retrieval-validation-report.txt", "  rag-corpus/retrieval-v2/test-results/", "",
        "COST", "  Paid API: NONE", "  API key: NOT REQUIRED", "  Model training: NONE", "  Retrieval cost: $0", "",
        "PIPELINE", "  exact dense -> BM25 -> metadata lexical -> RRF -> evidence quality -> local CrossEncoder -> fusion -> diversity", "",
        f"CORPUS: {artifact_stats['vector_count']:,} chunks; {artifact_stats['repository_count']}/{artifact_stats['repository_total']} repositories",
        f"BM25 unique terms: {len(lexical.postings):,}", f"BM25 avg document length: {lexical.avg_doc_length:.2f}",
        f"CrossEncoder self-test: relevant={rerank_test['relevant_score']:.6f} > irrelevant={rerank_test['irrelevant_score']:.6f}",
        "", "All initialization and integrity checks passed.",
    ]
    report_path = TEMP_OUTPUT_DIR / "retrieval-validation-report.txt"
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")

    # Re-read temporary artifacts before publication.
    reread = load_json(TEMP_OUTPUT_DIR / "retrieval-config.json")
    if reread.get("retrieval_schema_version") != RETRIEVAL_SCHEMA_VERSION:
        raise PipelineError("Temporary retrieval config failed re-read validation.")
    if "STATUS: PASS" not in report_path.read_text(encoding="utf-8"):
        raise PipelineError("Temporary validation report failed re-read validation.")

    # Atomically-ish replace only v2 output; v1 remains untouched.
    backup = RAG_DIR / ".retrieval-v2.backup"
    if backup.exists():
        shutil.rmtree(backup)
    if OUTPUT_DIR.exists():
        OUTPUT_DIR.rename(backup)
    try:
        TEMP_OUTPUT_DIR.rename(OUTPUT_DIR)
    except Exception:
        if OUTPUT_DIR.exists():
            shutil.rmtree(OUTPUT_DIR)
        if backup.exists():
            backup.rename(OUTPUT_DIR)
        raise
    if backup.exists():
        # Preserve old test sessions by copying them into the new directory if names do not collide.
        old_tests = backup / "test-results"
        if old_tests.is_dir():
            TEST_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
            for old in old_tests.iterdir():
                dst = TEST_RESULTS_DIR / old.name
                if old.is_file() and not dst.exists():
                    shutil.copy2(old, dst)
        shutil.rmtree(backup)


def print_help() -> None:
    print("\nAsk an employer-style question. The retriever uses dense + BM25 + metadata +")
    print("local CrossEncoder reranking and evidence-aware diversity. Commands: :help :quit :exit\n")


def run_interactive_session(
    embedding_model: Any, reranker: Any, matrix: Any, records: list[dict[str, Any]],
    lexical: LexicalIndex, device: str,
) -> None:
    TEST_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    session_started = utc_now()
    session_path = TEST_RESULTS_DIR / f"retrieval-session-{local_stamp()}.jsonl"
    print("\nINTERACTIVE SOPHISTICATED RETRIEVAL TEST")
    print("  Enter an employer-style question and press Enter.")
    print("  Full scoring diagnostics + evidence provenance are saved automatically.")
    print("  Commands: :help  :quit  :exit")
    print("\nSuggested first comparison question:")
    print("  What evidence shows experience with authorization architecture?")
    print(f"\nSession results will be saved to: {rel(session_path)}\n")

    qno = 0
    while True:
        try:
            raw = input("Employer question> ")
        except EOFError:
            print(); break
        except KeyboardInterrupt:
            print("\nInterrupt received; completed query results remain saved."); break
        query = raw.strip()
        if not query:
            print("  No question entered. Type a question, :help, or :quit."); continue
        cmd = query.casefold()
        if cmd in {":quit",":exit","quit","exit"}: break
        if cmd in {":help","help"}: print_help(); continue

        qno += 1
        print(f"\n[QUERY {qno}] Analyze query ...", end=" ", flush=True)
        t0 = time.perf_counter()
        intent = analyze_query(query, records)
        print(
            f"SUCCESS ({len(intent.base_tokens)} base terms -> {len(intent.expanded_tokens)} expanded; "
            f"limitations={intent.negative_or_limitations}; chronology={intent.chronology})"
        )

        print(f"[QUERY {qno}] Embed query locally ...", end=" ", flush=True)
        try:
            qvec, tokens = embed_query(embedding_model, query)
        except PipelineError as exc:
            print("FAILED"); print(f"Reason: {exc}"); qno -= 1; continue
        embed_s = time.perf_counter() - t0
        print(f"SUCCESS ({tokens} tokens; {embed_s:.3f}s; local:{device})")

        print(f"[QUERY {qno}] Hybrid retrieval + local CrossEncoder reranking ...", end=" ", flush=True)
        search_start = time.perf_counter()
        try:
            results, diagnostics = hybrid_retrieve(query, qvec, matrix, records, lexical, reranker, device)
        except PipelineError as exc:
            print("FAILED"); print(f"Reason: {exc}"); qno -= 1; continue
        search_s = time.perf_counter() - search_start
        cc = diagnostics["candidate_counts"]
        print(
            f"SUCCESS ({search_s:.3f}s; union {cc['union']} -> rerank {cc['cross_encoder']} -> top {cc['final']})"
        )

        event = {
            "retrieval_schema_version": RETRIEVAL_SCHEMA_VERSION,
            "session_started_at_utc": session_started,
            "queried_at_utc": utc_now(), "query_number": qno, "question": query,
            "query_token_count": tokens, "embedding_seconds": embed_s,
            "retrieval_seconds": search_s, "diagnostics": diagnostics,
            "models": {
                "embedding": {"name":EMBEDDING_MODEL,"revision":EMBEDDING_MODEL_REVISION},
                "reranker": {"name":RERANKER_MODEL,"revision":RERANKER_MODEL_REVISION},
            },
            "results": results,
        }
        append_jsonl(session_path, event)
        write_json(LATEST_RESULTS_PATH, event)
        print(f"[QUERY {qno}] Persist full scores/evidence/provenance ... SUCCESS")
        print_results(results)

    print("\nINTERACTIVE SESSION COMPLETE: SUCCESS")
    print(f"Questions tested: {qno}")
    if qno:
        print(f"Session output:   {rel(session_path)}")
        print(f"Latest result:    {rel(LATEST_RESULTS_PATH)}")


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------


def print_header() -> None:
    print("Portfolio GitHub RAG pipeline — Step 4 v2: SOPHISTICATED FREE LOCAL HYBRID RETRIEVAL")
    print(f"Working directory: {BASE_DIR}\n")
    print("COST / EXECUTION")
    print("  Paid API:       NONE")
    print("  API key:        NOT REQUIRED")
    print("  Model training: NONE")
    print("  Retrieval cost: $0")
    print("  First run:      may download free public local reranker (~91 MB weights)\n")
    print("INPUT")
    print("  rag-corpus/embeddings/embeddings.npy")
    print("  rag-corpus/embeddings/embedding-records.jsonl")
    print("  rag-corpus/embeddings/embedding-manifest.json\n")
    print("OUTPUT")
    print("  rag-corpus/retrieval-v2/retrieval-config.json")
    print("  rag-corpus/retrieval-v2/retrieval-validation-report.txt")
    print("  rag-corpus/retrieval-v2/test-results/\n")
    print("RETRIEVAL ARCHITECTURE")
    print("  Exact dense cosine + BM25 + metadata/skills + RRF")
    print("  Query-aware evidence quality / template suppression")
    print("  Pinned local CrossEncoder reranker")
    print("  Semantic duplicate suppression + repository/chronology diversity\n")


def main() -> int:
    print_header()
    try:
        print("[1/14] Validate zero-argument invocation and dependencies ...", end=" ", flush=True)
        if len(sys.argv) != 1:
            raise PipelineError(f"This script takes no arguments. Run only: python {SCRIPT_NAME}")
        deps = load_dependencies()
        print(f"SUCCESS (numpy {deps['numpy']}, torch {deps['torch']}, sentence-transformers {deps['sentence-transformers']})")

        print("[2/14] Locate Step 3 input artifacts ...", end=" ", flush=True)
        missing = [p for p in (MATRIX_PATH, RECORDS_PATH, MANIFEST_PATH) if not p.is_file()]
        if missing:
            raise PipelineError("Missing input artifact(s): " + ", ".join(rel(p) for p in missing))
        print(f"SUCCESS (matrix {MATRIX_PATH.stat().st_size:,} bytes; records {RECORDS_PATH.stat().st_size:,} bytes)")

        print("[3/14] Validate Step 3 vector-space manifest ...", end=" ", flush=True)
        manifest = load_json(MANIFEST_PATH)
        mi = validate_manifest(manifest)
        print(f"SUCCESS ({EMBEDDING_MODEL}; {EMBEDDING_DIMENSIONS}D; pinned revision)")

        print("[4/14] Load matrix/evidence records and verify SHA-256 mapping ...", end=" ", flush=True)
        matrix, records, stats = load_and_validate_artifacts(mi)
        print(f"SUCCESS ({stats['vector_count']:,} vectors <-> {stats['record_count']:,} records)")

        print("[5/14] Validate repository coverage and vector integrity ...", end=" ", flush=True)
        print(f"SUCCESS ({stats['repository_count']}/{stats['repository_total']} repositories; finite; unit normalized)")

        print("[6/14] Run exact dense-search mathematical self-test ...", end=" ", flush=True)
        dense_test = mathematical_self_test(matrix)
        print(f"SUCCESS ({dense_test['sample_count']} samples; min self-similarity {dense_test['minimum_self_similarity']:.8f})")

        print("[7/14] Build in-memory BM25 + metadata lexical index ...", end=" ", flush=True)
        t = time.perf_counter(); lexical = build_lexical_index(records); elapsed = time.perf_counter()-t
        print(f"SUCCESS ({len(lexical.postings):,} terms; avg doc {lexical.avg_doc_length:.1f} tokens; {elapsed:.2f}s)")

        print("[8/14] Run BM25 lexical self-test ...", end=" ", flush=True)
        lexical_test = lexical_self_test()
        print("SUCCESS (authorization document outranks unrelated imaging document)")

        print("[9/14] Select local inference device ...", end=" ", flush=True)
        device, device_name = choose_device()
        print(f"SUCCESS ({device}: {device_name})")

        print("[10/14] Load exact pinned Nomic query embedding model ...", end=" ", flush=True)
        embedding_model = load_embedding_model(device)
        print(f"SUCCESS ({NATIVE_DIMENSIONS}D native -> {EMBEDDING_DIMENSIONS}D retrieval)")

        print("[11/14] Load pinned FREE LOCAL CrossEncoder reranker ...", end=" ", flush=True)
        reranker = load_reranker(device)
        print(f"SUCCESS ({RERANKER_MODEL}; revision {RERANKER_MODEL_REVISION[:12]}...; max {RERANKER_MAX_LENGTH} tokens)")

        print("[12/14] Validate runtime query embedding + reranker discrimination ...", end=" ", flush=True)
        smoke_question = "What evidence shows experience with authorization architecture?"
        smoke_vec, smoke_tokens = embed_query(embedding_model, smoke_question)
        smoke_dense = exact_search_scores(matrix, smoke_vec)
        if len(top_indices_from_scores(smoke_dense, 3)) != 3:
            raise PipelineError("Dense smoke search failed.")
        rerank_test = reranker_self_test(reranker, device)
        print(f"SUCCESS ({smoke_tokens} tokens; reranker relevant {rerank_test['relevant_score']:.4f} > irrelevant {rerank_test['irrelevant_score']:.4f})")

        print("[13/14] Validate sophisticated hybrid retrieval end-to-end ...", end=" ", flush=True)
        smoke_results, smoke_diag = hybrid_retrieve(
            smoke_question, smoke_vec, matrix, records, lexical, reranker, device,
        )
        if len(smoke_results) != TOP_K:
            raise PipelineError(f"Hybrid smoke retrieval returned {len(smoke_results)} results; expected {TOP_K}.")
        if len({r['chunk_id'] for r in smoke_results}) != len(smoke_results):
            raise PipelineError("Hybrid smoke retrieval returned duplicate chunk IDs.")
        print(f"SUCCESS (union {smoke_diag['candidate_counts']['union']} -> rerank {smoke_diag['candidate_counts']['cross_encoder']} -> top {TOP_K})")

        print("[14/14] Write, re-read, and publish v2 validation artifacts ...", end=" ", flush=True)
        publish_validation_outputs(mi, stats, dense_test, lexical_test, rerank_test, deps, device, device_name, lexical)
        print("SUCCESS")

        print("\nSTEP 4 v2 INITIALIZATION COMPLETE: SUCCESS")
        print(f"Vectors searchable:              {stats['vector_count']:,}")
        print(f"Repositories covered:            {stats['repository_count']}/{stats['repository_total']}")
        print("Candidate retrieval:             exact dense + BM25 + metadata")
        print("Fusion:                          Reciprocal Rank Fusion + normalized scores")
        print(f"Local reranker:                  {RERANKER_MODEL}")
        print(f"CrossEncoder candidates/query:   {RERANK_CANDIDATES}")
        print("Template handling:               query-aware soft suppression (not deletion)")
        print("Negative evidence handling:      query-aware")
        print("Repository diversity:            enabled")
        print("Chronology diversity:            enabled for chronology questions")
        print("Paid API requests:               0")
        print("API keys required:               0")
        print("Model training performed:        NO")
        print("Retrieval cost:                  $0")
        print(f"Inference device:                {device} ({device_name})\n")
        print("OUTPUT")
        print("  rag-corpus/retrieval-v2/retrieval-config.json")
        print("  rag-corpus/retrieval-v2/retrieval-validation-report.txt")
        print("  rag-corpus/retrieval-v2/test-results/")

        run_interactive_session(embedding_model, reranker, matrix, records, lexical, device)
        return 0
    except PipelineError as exc:
        print("\nFAILED\n")
        print("STEP 4 v2 COMPLETE: FAILED")
        print(f"Reason: {exc}")
        return 1
    except Exception as exc:
        print("\nFAILED\n")
        print("STEP 4 v2 COMPLETE: FAILED")
        print(f"Unexpected error: {type(exc).__name__}: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
