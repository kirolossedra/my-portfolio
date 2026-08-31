# Testing and Verification Strategy

## Table of Contents

- [Portfolio Quality Gate](#portfolio-quality-gate)
- [Frontend / Worker Tests](#frontend-worker-tests)
- [RAG Validation Philosophy](#rag-validation-philosophy)
- [Runtime Smoke Evidence](#runtime-smoke-evidence)

<a id="portfolio-quality-gate"></a>
## Portfolio Quality Gate

The Node application combines prevention gates and ordinary correctness checks. The `verify` script rejects legacy JavaScript artifacts, active R2 integration and the removed permanent-admin-token mechanism; then runs ESLint, strict TypeScript checks, Vitest and a Wrangler dry-run. CI adds local D1 migration validation and the Vite production build.

<a id="frontend-worker-tests"></a>
## Frontend / Worker Tests

Tests live under `src/__tests__/` and `worker/__tests__/`. Type checking is split into `tsconfig.app.json` and `tsconfig.worker.json`, ensuring browser and Worker environments are independently valid.

<a id="rag-validation-philosophy"></a>
## RAG Validation Philosophy

RAG validation is not one metric. It includes structural counts, referential integrity, token-length safety, embedding norms, regression queries, candidate/reranking diagnostics, Pinecone remote corpus counts, ANN overlap and exact stored-vector fidelity.

The most important lesson from Pinecone parity v1 is that a validator can be wrong even when the backend is right. v1 demanded a maximum reported ANN score delta <=0.001; Pinecone returned the same top-1 and 96-100% overlap but a 0.0025883320 max score delta. v2 corrected the test by separating approximate candidate parity from exact fetched-vector fidelity. Fetched vectors then matched local vectors exactly (max value delta 0; recomputed cosine delta 0), so Pinecone passed.

<a id="runtime-smoke-evidence"></a>
## Runtime Smoke Evidence

A local `POST http://127.0.0.1:8000/api/rag/retrieve` returned `status: ok`, runtime schema `1.0.0`, retrieval schema `3.1.0-pinecone`, and real ranked evidence for the backend/system-design question. That proves the current service can initialize, query Pinecone, execute the local hybrid/rerank path, and serialize results. It does not prove Gemini generation or public deployment, because `generation` remains null.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG testing](../../rag/docs/testing-and-regressions.md)
