# RAG Python Runtime API

## Table of Contents

- [Current Status](#current-status)
- [Input Data](#input-data)
- [Dependencies](#dependencies)
- [Startup](#startup)
- [Runtime Pipeline](#runtime-pipeline)
- [HTTP](#http)
- [Environment](#environment)
- [Model Contracts](#model-contracts)
- [Runtime vs Offline Exact v3](#runtime-vs-offline-exact-v3)
- [Local Runtime Evidence](#local-runtime-evidence)
- [Proposed v1.1 Gate](#proposed-v11-gate)
- [2026-08-31 Runtime Decomposition for No-Python Production](#2026-08-31-runtime-decomposition-for-no-python-production)
- [Retirement Gate](#retirement-gate)

<a id="current-status"></a>
## Current Status

`rag-api-pinecone-v1.py` is **ACTIVE code on GitHub main** with runtime schema `1.0.0` and retrieval schema `3.1.0-pinecone`. It has been exercised through a real local HTTP retrieval request. Gemini generation remains intentionally absent.

<a id="input-data"></a>
## Input Data

The runtime needs:

```text
rag-corpus/embeddings-v2/embedding-records.jsonl
rag-corpus/embeddings-v2/embedding-manifest.json
```

It does not load `embeddings.npy`. It finds the project root by walking parent directories until these artifacts are found.

<a id="dependencies"></a>
## Dependencies

`requirements-rag-api-v1.txt` includes NumPy, PyTorch, SentenceTransformers, `einops`, Pinecone, FastAPI and Uvicorn. `einops` supports Nomic tensor operations; it is not a model/provider.

<a id="startup"></a>
## Startup

```powershell
python -m pip install -r .\rag\runtime\requirements-rag-api-v1.txt
python .\rag\runtime\rag-api-pinecone-v1.py
```

<a id="runtime-pipeline"></a>
## Runtime Pipeline

Question analysis -> pinned Nomic `search_query:` embedding -> Pinecone top 500 + local BM25 top 500 + metadata top 400 -> fusion/gates -> rerank 120 with pinned CrossEncoder -> evidence/polarity handling -> semantic dedupe via fetched Pinecone vectors -> repo diversity -> top 10.

<a id="http"></a>
## HTTP

`GET /health` reports service health. `POST /api/rag/retrieve` accepts `{"question":"..."}` and returns ranked evidence/provenance. `generation` is currently null.

<a id="environment"></a>
## Environment

- `PINECONE_API_KEY`: required; environment first, nearest parent `.dev.vars` second;
- `PINECONE_INDEX_NAME`: default `portfolio-career-rag-v1`;
- `PINECONE_NAMESPACE`: default `corpus-v1`;
- `RAG_ALLOWED_ORIGINS`: configurable CORS list;
- `RAG_API_HOST`: default `0.0.0.0`;
- `PORT` / `RAG_API_PORT`: default port 8000.

<a id="model-contracts"></a>
## Model Contracts

Nomic revision `e9b676...9aab` and CrossEncoder revision `4bebbd...4f1e` are pinned. Nomic produces native 768-D output that is layer-normalized, sliced to first 512 dimensions and L2 normalized. Silent query truncation is refused if token count exceeds 8192.

<a id="runtime-vs-offline-exact-v3"></a>
## Runtime vs Offline Exact v3

Pinecone replaces dense candidate search; the runtime does not possess an exact dense score for every BM25/metadata-only union item. Such candidates receive dense score zero if they were not in Pinecone top 500. This is why “Pinecone backend parity” does not equal “bit-for-bit complete ranking parity.”

<a id="local-runtime-evidence"></a>
## Local Runtime Evidence

A captured backend/system-design query returned HTTP JSON with `status=ok`, schemas 1.0.0 / 3.1.0-pinecone, ~8.17 s elapsed, LInC rank 1 and my-portfolio rank 2. This proves current local execution, but not public production deployment.

<a id="proposed-v11-gate"></a>
## Proposed v1.1 Gate

The local `rag-backend-positive-gate-v1` proposal adds a backend-positive concept-support check and bumps runtime/retrieval schemas to 1.1.0/3.1.1-pinecone. It is **not in current GitHub main and must not be described as active**.

<a id="2026-08-31-runtime-decomposition-for-no-python-production"></a>
## 2026-08-31 Runtime Decomposition for No-Python Production

A later deployment review established an important boundary:

> **Removing Nomic does not by itself remove this Python runtime.**

The runtime currently owns all of the following:

| Responsibility | Current owner | Candidate no-Python owner |
|---|---|---|
| query validation/analysis | Python | Worker TypeScript |
| query embedding | Nomic in Python | Workers AI Qwen candidate |
| dense candidate request | Pinecone client in Python | Worker/Pinecone REST or TS client |
| BM25 top 500 | Python local state | D1 FTS5 or validated TS lexical implementation |
| metadata top 400 | Python local state | D1 indexed SQL |
| fusion/weights | Python | TypeScript |
| concept/evidence gates | Python | TypeScript |
| polarity handling | Python | TypeScript |
| rerank top 120 | local CrossEncoder | Workers AI BGE candidate |
| semantic dedupe | Python + Pinecone vector fetch | TypeScript + vector fetch/data |
| repository diversity | Python | TypeScript |
| evidence/provenance response | FastAPI | Worker route |

### Current runtime remains authoritative

None of the candidate owners above is active yet. This README continues to describe `rag-api-pinecone-v1.py` as the current validated HTTP runtime.

### Worker bundle/data warning

`embedding-records.jsonl` is approximately 34 MB in the current repository. Workers Free currently has a 3 MB compressed bundle cap and 128 MB isolate memory. The migration must therefore **not** solve Python removal by bundling the entire existing runtime JSONL into the Worker.

The candidate design should create a slim D1-backed runtime representation containing only the evidence text, provenance and metadata fields actually required for retrieval/response.

### Reranker is a separate model migration

The current pinned CrossEncoder is part of the validated ranking system. Replacing it with `@cf/baai/bge-reranker-base` is a model change and must be measured independently. Current Cloudflare AI Search documentation lists a 512-token input limit for the BGE reranker, so truncation behavior for long documents must be explicit.

### Capacity must be measured end to end

Qwen short-query embedding may support very high daily request counts under Workers AI Free, but reranking 120 candidates can dominate neuron usage. Pinecone read units, D1 rows read and Gemini generation quota can also become the real limiting factors.

Full analysis:

- [../docs/cloudflare-native-zero-cost-migration.md](../docs/cloudflare-native-zero-cost-migration.md)

<a id="retirement-gate"></a>
## Retirement Gate

Do not delete or mark `rag-api-pinecone-v1.py` obsolete until all of these are true:

- [ ] Qwen document/query retrieval passes the regression suite;
- [ ] parallel Qwen Pinecone index passes integrity checks;
- [ ] D1 lexical/metadata path passes hybrid-ranking regression;
- [ ] TypeScript fusion/gates/polarity behavior is validated;
- [ ] serverless reranker passes final-ranking regression;
- [ ] full-query free-tier usage is measured;
- [ ] Worker HTTP contract/security tests pass;
- [ ] Kiro browser integration passes;
- [ ] production telemetry shows the new path is stable;
- [ ] rollback to the current runtime is no longer operationally required.

Offline Python scripts may remain even after public runtime retirement; the target is **no production Python dependency**, not removal of the language from data engineering and validation workflows.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Known issues](../docs/known-issues.md)
- [Cloudflare integration](../docs/cloudflare-integration.md)
- [Zero-cost Cloudflare migration](../docs/cloudflare-native-zero-cost-migration.md)
