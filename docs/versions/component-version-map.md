# Component Version Map

## Table of Contents

- [Portfolio Components](#portfolio-components)
- [RAG Version Truth](#rag-version-truth)

| Layer | Current status | Authoritative implementation / artifact |
|---|---|---|
| Source analysis | **ACTIVE / COMPLETE** | `rag/other/repositories-*.md`, 134/134 repositories |
| Canonical normalization | **ACTIVE / OUTPUT VALID** | `rag/scripts/prepare-rag-corpus.py` -> `rag/rag-corpus/` |
| Evidence document compiler | **ACTIVE / COMPLETE** | `build-rag-retrieval-documents-v2.py` -> 2,808 documents |
| Document embeddings | **ACTIVE / COMPLETE; DO NOT REGENERATE WITHOUT CAUSE** | `generate-rag-embeddings-v3-documents-local.py`, 2,808 x 512 |
| Offline evidence-aware retrieval | **ACTIVE / VALIDATED** | `build-rag-retrieval-v3-evidence-aware-local.py` |
| Dense vector serving | **ACTIVE / VALIDATED** | Pinecone `portfolio-career-rag-v1`, namespace `corpus-v1` |
| Pinecone parity | **ACTIVE / PASS** | `dense-parity-validation-v2.json` |
| Python HTTP retrieval runtime | **ACTIVE CODE; LOCALLY EXERCISED** | `rag/runtime/rag-api-pinecone-v1.py`, schema 1.0.0 / retrieval 3.1.0-pinecone |
| Answer generation | **SELECTED / NOT INTEGRATED** | Gemini 2.5 Flash-Lite |
| Browser-to-RAG API wiring | **NOT YET INTEGRATED** | `/kiro-rag` currently drives a simulated state flow and 3D avatar |
| Positive-backend hardening patch | **PROPOSED - NOT APPLIED TO `main`** | local proposal `rag-backend-positive-gate-v1`, runtime schema 1.1.0 |

<a id="portfolio-components"></a>
## Portfolio Components

| Component | Status | Current truth |
|---|---|---|
| React frontend | ACTIVE | React 19.1.1 / Vite 7.1.3 project |
| Cloudflare Worker | ACTIVE | TypeScript Worker, `worker/index.ts` |
| D1 persistence | ACTIVE | migrations 0001-0004 |
| GitHub OAuth owner auth | ACTIVE | numeric-ID authorization + one-time exchange + signed session |
| Permanent admin token | SUPERSEDED / explicitly rejected | CI policy gate prevents reintroduction |
| R2 image path | SUPERSEDED / explicitly rejected | current images are Base64 in D1 |
| Kiro image-cutout animation | SUPERSEDED | GLB-first runtime now owns model body |
| Kiro GLB interaction scaffold | ACTIVE | semantic states + runtime capability inspection |
| Live browser RAG call | PROPOSED | not wired yet |

<a id="rag-version-truth"></a>
## RAG Version Truth

The active remote/runtime dense backend is Pinecone, but the active HTTP runtime in GitHub `main` remains **runtime schema 1.0.0 / retrieval schema 3.1.0-pinecone**. A local proposal exists with runtime schema 1.1.0 / retrieval schema 3.1.1-pinecone and a backend-positive support gate; it is **not** the current `main` implementation.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG version history](../../rag/docs/retrieval-version-history.md)
