# RAG Documentation

## Purpose

`docs/rag/` is the canonical documentation domain for the portfolio RAG subsystem. Architecture, production-runtime truth, migration decisions, operational boundaries and known caveats live here. Validation incidents and acceptance evidence live separately under `docs/qc/rag/`; executable code/data lives under top-level `rag/` and `worker/`.

## Current production truth

The Cloudflare-native backend is now the production RAG runtime.

```text
134 repository analyses
  -> 2,808 evidence-aware retrieval documents
  -> Cloudflare Workers AI Qwen3 embeddings (1,024-D)
  -> Cloudflare Vectorize: portfolio-career-rag-cloudflare-v1

visitor question
  -> Worker validation + rate limit
  -> Qwen3 query embedding
  -> Vectorize top 40
  -> D1 authoritative evidence hydration
  -> BGE reranker top 20
  -> evidence-aware / repository-diverse top 8
  -> GLM-4.7-Flash grounded synthesis
  -> answer + E# citations + provenance
```

Current production invariants:

- 2,808 D1 evidence documents;
- 2,808 unique document IDs;
- 134 repositories, indices 1–134;
- retrieval-document schema `2.0.0`;
- source SHA-256 `a10c2b2d9d4e79e8a6e6629cc15b18cb1123513b45df44dc73e668b44c1bee58`;
- live health endpoint returns HTTP 200;
- first successful production RAG query returned HTTP 200 with grounded answer, citations, retrieval diagnostics and model identities;
- Worker verification currently passes 64/64 tests across 11 files.

The frontend is **not connected yet**. That is the next product-integration boundary.

## Canonical documents

### Start here

- [Production RAG Architecture](production-architecture.md) — authoritative explanation of the current end-to-end system, component responsibilities, generator-filtering policy, deployment boundaries and failure modes.
- [Active Pipeline](pipeline.md) — stage-by-stage current pipeline and implementation paths.
- [Testing and Regressions](testing-and-regressions.md) — current acceptance evidence and remaining validation work.
- [Known Issues](known-issues.md) — active caveats after production deployment.

### Version/history documents

- [Chunking / retrieval-document history](chunking-and-document-history.md)
- [Embedding version history](embedding-version-history.md)
- [Retrieval version history](retrieval-version-history.md)
- [Regeneration matrix](regeneration-matrix.md)
- [Documentation history](history/README.md)

### Deployment/history documents

- [Deployment decision history](deployment/README.md)
- [2026-09-06 Cloudflare-native production rollout](deployment/2026-09-06-cloudflare-native-production-rollout.md)
- [2026-08-31 Containerization and Hosting Evaluation](deployment/2026-08-31-containerization-and-hosting-evaluation.md)
- [2026-08-31 Zero-Cost Cloudflare-Native Runtime Evaluation](deployment/2026-08-31-cloudflare-native-zero-cost-runtime-evaluation.md)

### Historical/reference architecture documents

The following remain valuable because they explain the path that led to the current design, but they should not be read as current production truth:

- [Historical Cloudflare integration plan](cloudflare-integration.md)
- [Historical zero-cost migration analysis](cloudflare-native-zero-cost-migration.md)
- [Historical Pinecone dense backend](pinecone.md)
- [Component interactions](component-interactions.md)

## Three-way directory distinction

```text
docs/rag/
  architecture, production design, deployment reasoning, migration history

docs/qc/rag/
  incidents, regression findings, acceptance evidence, pass/fail records

rag/ + worker/
  implementation, scripts, runtime, corpus and generated artifacts
```

A document belongs in `docs/qc/rag/` when its primary purpose is proving whether behavior passed or failed. A document belongs in `docs/rag/deployment/` when its primary purpose is explaining hosting/provider/runtime choices or rollout sequencing.

## Production vs historical paths

The earlier Nomic/Pinecone/Python architecture remains preserved for regression/history. It is no longer the live request path.

Current request-time production has no Python/Docker/Pinecone dependency. The Worker uses Workers AI, Vectorize and D1 directly.

## Quality boundary

Retrieval is approximate by design. The system does not require every one of the final eight evidence documents to be equally strong. The generator is allowed to ignore weak tail evidence, but it is not allowed to invent evidence or recover facts that retrieval never supplied. This policy is documented in detail in [Production RAG Architecture](production-architecture.md#9-generator-responsibility-grounded-synthesis-not-blind-summarization).

## Implementation boundary

Primary current implementation paths:

```text
rag/rag-corpus/retrieval-documents-v2/
rag/rag-corpus/embeddings-cloudflare-v1/
rag/rag-corpus/vectorize-cloudflare-v1/
rag/runtime/build-d1-rag-import.mjs
migrations/0005-rag-runtime.sql
worker/rag-runtime.ts
worker/RAG-RUNTIME.md
shared/rag.ts
```

The browser surface is:

```text
src/kiro-rag-page.tsx
src/features/kiro-rag/
```

and remains intentionally unwired until the backend documentation/validation checkpoint is complete.

## Related documentation

- Parent: [../README.md](../README.md)
- [Whole-project architecture](../architecture/README.md)
- [Whole-project operations](../operations/README.md)
- [RAG Quality Control](../qc/rag/README.md)
