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

## Related Documentation

- Parent: [../README.md](../README.md)
- [Known issues](../docs/known-issues.md)
- [Cloudflare integration](../docs/cloudflare-integration.md)
