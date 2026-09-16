# Portfolio RAG Worker Runtime

Production corpus selection is release-scoped. D1 stores `active_rag_release` and `previous_rag_release` in `rag_runtime_config`; document hydration uses the active release, and Vectorize queries use its indexed `release_id` metadata. The health response exposes both the active release and the release embedded in the deployed Worker. Pointer-only rollback restores the immediately previous retained release.

Retrieval requests 64 semantic candidates, then applies the local `deterministic-evidence-reranker-v1`. Its score combines dense similarity (55%), exact query-term coverage (16%), repository/title relevance (8%), corpus tags (10%), source-section context (7%), and evidence quality/intent alignment (4%). Selection collapses shared-source or highly overlapping evidence, applies a soft per-repository penalty capped at 0.07, and fills a manifest-independent context budget instead of a fixed chunk count. The default evidence budget is 2,600 estimated tokens and can be changed with `RAG_EVIDENCE_TOKEN_BUDGET` within the enforced 800–6,000 range.

Set `RAG_RETRIEVAL_DEBUG=true` only in an internal environment to log the query, Vectorize candidates, scoring signals, duplicate/budget decisions, and final evidence. This trace is not included in public API responses.

## Table of Contents

- [Purpose](#purpose)
- [Production Request Path](#production-request-path)
- [Bindings](#bindings)
- [Models](#models)
- [Endpoints](#endpoints)
- [Grounding Contract](#grounding-contract)
- [Abuse and Cost Controls](#abuse-and-cost-controls)
- [Deployment Sequence](#deployment-sequence)

## Purpose

This runtime serves employer-facing questions about the portfolio using the validated Cloudflare-native dense retrieval backend. It does not depend on Python, Docker, Pinecone, a locally loaded embedding model, or an external LLM API key in production.

## Production Request Path

```text
question
  -> Workers AI Qwen3 query embedding
  -> Vectorize top-40 dense candidates
  -> D1 authoritative evidence lookup
  -> Workers AI BGE reranker (top 20)
  -> evidence-aware / repository-diverse top 8
  -> Workers AI GLM-4.7-Flash grounded generation
  -> answer + [E#] citations
```

The runtime uses the same Qwen query contract validated in Stage 06:

```text
mode: queries
instruction: Given a web search query, retrieve relevant passages that answer the query
```

The returned query vector is explicitly L2-normalized before cosine retrieval.

## Bindings

`wrangler.jsonc` adds:

- `AI` — Workers AI binding.
- `RAG_INDEX` — `portfolio-career-rag-cloudflare-v1` Vectorize index.
- `RAG_RATE_LIMITER` — per-client RAG request limiter.
- Existing `DB` — D1 remains the authoritative evidence-text store.

## Models

- Embedding: `@cf/qwen/qwen3-embedding-0.6b`
- Reranking: `@cf/baai/bge-reranker-base`
- Generation: `@cf/zai-org/glm-4.7-flash`

The generator is intentionally bounded to 700 completion tokens and receives only the final eight evidence documents.

## Endpoints

### `GET /api/rag/health`

Checks that the active D1 release matches its manifest-derived document count across 134 repositories. The response includes the active release and the release identifier embedded in the deployed Worker.

### `POST /api/rag/query`

Request:

```json
{
  "question": "What evidence shows backend engineering experience?"
}
```

Returns a synchronous grounded answer, structured citations, retrieval diagnostics, and model identities.

### `POST /api/rag/query/stream`

Uses the same retrieval/reranking path, then returns normalized Server-Sent Events:

- `context` — citations, retrieval diagnostics, and model identities.
- `token` — generated answer text deltas.
- `done` — cited evidence labels and any grounding warning.
- `error` — stream failure information.

## Grounding Contract

The generation system prompt requires the model to:

- use only supplied portfolio evidence;
- distinguish implemented/concrete work from interpretation and conceptual exposure;
- preserve explicit limitations and evidence ceilings;
- avoid inventing technologies, scale, ownership, dates, production status, or outcomes;
- cite claims inline using `[E1]`, `[E2]`, and so on;
- state when the evidence is insufficient.

The API also returns the underlying citation metadata and source-fragment line provenance independently of the generated prose.

## Abuse and Cost Controls

The RAG route is protected before any AI call by a Cloudflare Rate Limiting binding configured for 10 requests per 60 seconds per `CF-Connecting-IP` value.

The browser CORS surface is restricted to `FRONTEND_ORIGIN`. Direct non-browser requests remain possible, so the rate limiter is the primary runtime cost guard at this stage.

## Deployment Sequence

From the repository root:

```powershell
npm run rag:d1:build
npm run db:migrate:remote
npm run rag:d1:import:remote
npm run verify
```

After those pass, deploy the Worker with the existing deployment command:

```powershell
npm run worker:deploy
```

Then test:

```powershell
Invoke-RestMethod -Method Get -Uri "https://kirolos-portfolio-api.linc-ministry.workers.dev/api/rag/health"
```

Use `rag/run-rag-pipeline.ps1` for production publication. It deploys only after the manifest-derived D1 release and matching Vectorize release are ready, then switches the active release pointer.
