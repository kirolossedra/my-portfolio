# Stage 05 — Vector-Index Publication

## Table of Contents

- [Responsibility](#responsibility)
- [Backend Families](#backend-families)
- [Cloudflare Vectorize v1](#cloudflare-vectorize-v1)
- [Versioning Rule](#versioning-rule)

## Responsibility

Publish an already validated embedding generation to a hosted vector index without changing the textual corpus or the embedding space.

Stage 05 owns **storage/index publication** only. It must not regenerate retrieval documents or embeddings.

## Backend Families

- `pinecone/` — existing 512-D Nomic/Pinecone reference publication implementation.
- `cloudflare-vectorize/` — Cloudflare-native 1,024-D Qwen/Vectorize publication implementation.

## Cloudflare Vectorize v1

Run:

```powershell
node rag/scripts/05-vector-index/cloudflare-vectorize/publish-vectorize-v1.mjs
```

The publisher consumes:

```text
rag/rag-corpus/embeddings-cloudflare-v1/
```

and creates or reuses the compatible Vectorize V2 index:

```text
portfolio-career-rag-cloudflare-v1
1024 dimensions
cosine metric
2808 document_id-addressed vectors
```

The operation is intentionally rerunnable through **upsert**. It never deletes or recreates an existing index. An existing index with incompatible dimensions or metric causes a hard failure.

After the final mutation becomes visible, the publisher:

1. verifies the remote vector count;
2. enumerates all vector IDs and requires an exact 2,808-ID match;
3. fetches stratified stored-vector samples;
4. verifies float32 vector fidelity and compact metadata mapping;
5. writes the Stage 05 publication manifest/report.

## Versioning Rule

Provider versions are independent. Vectorize v1 is **not** Pinecone v2.

The Vectorize index name itself carries the corpus/index generation so the first Cloudflare generation does not require an additional namespace.
