# RAG Deployment and Hosting Decision History

## Purpose

`docs/rag/deployment/` is the canonical location for RAG-specific hosting/provider/runtime decisions and production rollout records.

## Decision timeline

1. [2026-08-31 — Containerization and Hosting Evaluation](2026-08-31-containerization-and-hosting-evaluation.md)
   - Python/Pinecone runtime containerized successfully;
   - measured initialized runtime approximately 1.293 GiB;
   - Cloudflare Containers blocked by paid-plan requirement at the time;
   - Render Free memory was insufficient for the measured runtime.

2. [2026-08-31 — Zero-Cost Cloudflare-Native Runtime Evaluation](2026-08-31-cloudflare-native-zero-cost-runtime-evaluation.md)
   - problem reframed around removing the Python serving requirement while preserving evidence quality;
   - Qwen3-Embedding-0.6B identified as the Cloudflare-native embedding candidate;
   - migration decomposed into independently validated stages rather than a big-bang rewrite.

3. [2026-09-06 — Cloudflare-Native Production Rollout](2026-09-06-cloudflare-native-production-rollout.md)
   - Qwen embedding generation completed;
   - Vectorize publication and dense parity passed;
   - D1 authoritative evidence imported and verified locally/remotely;
   - Worker runtime deployed;
   - first live generation boundary failure isolated and fixed by disabling GLM thinking;
   - repeated production query returned HTTP 200 with grounded citations;
   - frontend intentionally left untouched.

## Current production recommendation

The migration is complete for the backend request path. Do not treat the earlier Nomic/Pinecone/Python path as the recommended production serving architecture.

Current request-time topology:

```text
Workers AI Qwen3
  -> Vectorize
  -> D1
  -> Workers AI BGE reranker
  -> TypeScript evidence selection
  -> Workers AI GLM-4.7-Flash
```

The old path remains preserved for historical comparison and regression reference.

## Rollout boundary

The backend is production-operational. The next integration stage is the Kiro RAG browser UI.

Frontend work should not regenerate:

- retrieval documents;
- embeddings;
- Vectorize data;
- D1 corpus.

It should consume the existing Worker API.

## Evidence boundary

Deployment records answer “what architecture was selected and how was it rolled out?”

Quality-control records answer “did a stage or behavior pass?” and live under `docs/qc/rag/`.

The 2026-09-06 production rollout record links to the matching QC acceptance record rather than duplicating all evidence.

## Related documentation

- [Production architecture](../production-architecture.md)
- [Active pipeline](../pipeline.md)
- [Known issues](../known-issues.md)
- [RAG Quality Control](../../qc/rag/README.md)
- [Whole-project operations](../../operations/README.md)
