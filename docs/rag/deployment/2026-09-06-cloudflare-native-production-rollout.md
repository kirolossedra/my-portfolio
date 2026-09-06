# 2026-09-06 — Cloudflare-Native RAG Production Rollout

## Decision

The portfolio RAG backend has migrated from the historical Nomic/Pinecone/Python serving design to a Cloudflare-native production request path.

The migration was accepted only after each data/runtime layer passed its own validation. The old artifacts were preserved rather than overwritten.

## Final production topology

```text
Cloudflare Worker
  -> Workers AI Qwen3 query embedding
  -> Vectorize top-40 dense candidates
  -> D1 authoritative evidence hydration
  -> Workers AI BGE reranker top-20
  -> TypeScript evidence scoring/repository diversity -> top 8
  -> Workers AI GLM-4.7-Flash grounded generation
  -> answer + E# citations + provenance
```

No Python container, Pinecone call or locally loaded model is required at request time.

## Rollout sequence

### 1. Cloudflare embeddings

The finalized 2,808 retrieval documents were embedded using `@cf/qwen/qwen3-embedding-0.6b` into a new 1,024-D generation under `rag/rag-corpus/embeddings-cloudflare-v1/`.

The old Nomic artifacts were not modified.

### 2. Vectorize publication

The production index `portfolio-career-rag-cloudflare-v1` was populated with all 2,808 vectors.

Exact ID inventory, stored-vector fidelity and dense parity against local cosine passed.

### 3. D1 runtime evidence

The D1 import builder generated a runtime SQL artifact from the authoritative retrieval corpus.

Local migration/import validated 2,808 unique documents across 134 repositories with valid JSON-backed fields and matching source SHA-256.

The same corpus was then imported remotely. Remote read-only integrity queries reproduced the same invariants.

### 4. Worker verification and deployment

The Worker uses four production bindings:

- `AI` — Workers AI;
- `RAG_INDEX` — Vectorize index;
- `DB` — D1;
- `RAG_RATE_LIMITER` — 10 requests per 60 seconds per client IP.

Legacy Worker tests initially lacked the required new RAG bindings. The fixtures were corrected in commit:

```text
e125ea7 test(worker): add RAG bindings to legacy env fixtures
```

Verification and dry-run then passed, and the live health route returned HTTP 200 with 2,808 documents and 134 repositories.

### 5. First end-to-end generation attempt

The first production question reached the generation boundary but returned HTTP 502 `generation_invalid`.

The upstream retrieval path had already completed, isolating the issue to GLM response handling.

The production fix disabled GLM thinking and hardened visible-output normalization without exposing reasoning content:

```text
2b230596 fix(rag): disable GLM thinking and normalize generation output
```

### 6. Successful production acceptance

After redeployment, the same single question returned HTTP 200 with:

- grounded answer;
- inline `[E#]` citations;
- citation metadata/provenance;
- retrieval diagnostics;
- model identities;
- no grounding warning.

Validated Worker version:

```text
0c62658d-4de3-4b66-9a1e-85c0afafb951
```

## Why generator filtering is accepted

The final evidence packet may contain weak tail results because dense retrieval/reranking is approximate.

The chosen production policy is not to keep tuning until every selected document is perfect. Instead:

- retrieve enough candidates to preserve useful recall;
- rerank and evidence-score them;
- keep a small final evidence packet;
- require GLM to use only evidence that materially supports the answer;
- expose citations/provenance so unsupported narrative is not silently trusted.

This is a bounded tradeoff, not permission for the generator to fabricate evidence. If relevant evidence never reaches the packet, generation must not invent it.

## Rollback/preservation

Historical Nomic/Pinecone/Python artifacts remain in the repository. They are not production dependencies and should not be deleted as part of frontend integration.

A rollback would be an explicit architecture decision, not an automatic fallback inside the live Worker.

## Current stopping point

Backend migration and documentation are complete enough to establish a clean handoff boundary.

**Not yet done:** Kiro RAG frontend integration.

No frontend file should be modified as part of this rollout record.

## Related documentation

- [Production architecture](../production-architecture.md)
- [Active pipeline](../pipeline.md)
- [Production QC record](../../qc/rag/2026-09-06-cloudflare-production-rag-validation.md)
