# Stage 03 — Embeddings

## Table of Contents

- [Responsibility](#responsibility)
- [Version Families](#version-families)
- [Generations](#generations)
- [Providers](#providers)
- [Current Migration State](#current-migration-state)
- [Next Stage](#next-stage)

## Responsibility

Convert Stage 02 retrieval documents into a versioned vector space with an explicit provider/model/dimension/document-query contract.

Embedding generations are immutable vector spaces: changing the embedding model or its document/query contract requires a new generation rather than overwriting validated vectors.

## Version Families

Two version labels are intentionally kept separate:

1. **Embedding generation** — a semantic generation of the vector space across the entire RAG history (`v1`, `v2`, `v3`, `v4`).
2. **Provider artifact generation** — the version within a specific provider branch (`cloudflare-v1`, existing Nomic artifact lineage, and so on).

This avoids the previous ambiguity where script version, retrieval-document version, output-directory version, and embedding-schema version could all carry unrelated numbers.

## Generations

| Generation | Provider / Model | Retrieval Units | Dimensions | Meaning |
| --- | --- | --- | ---: | --- |
| v1 | historical hosted/paid embedding path | historical chunks | historical | Initial hosted embedding experiment. |
| v2 | local Nomic | obsolete small chunks | 512 stored | Removed hosted embedding cost but retained the fragmented retrieval units. |
| v3 | local Nomic | 2,808 evidence-aware documents | 512 stored | Current validated reference vector space. |
| **v4** | **Cloudflare Workers AI / Qwen3 Embedding 0.6B** | **2,808 evidence-aware documents** | **1,024** | **Cloudflare-native candidate being built for Vectorize.** |

## Providers

### `nomic/`

Contains the validated local Nomic v3 generator and remains the reference implementation while migration is in progress.

### `cloudflare/`

Contains the active Cloudflare v4 generator:

```text
cloudflare/generate-rag-embeddings-v4-cloudflare.mjs
```

It writes a parallel artifact set under:

```text
rag-corpus/embeddings-cloudflare-v1/
```

It never overwrites:

```text
rag-corpus/embeddings-v2/
```

## Current Migration State

Stage 03 now has both sides needed for a controlled migration:

```text
Stage 02 evidence documents
        │
        ├── Nomic v3 reference
        │      └── embeddings-v2/ (512D)
        │
        └── Cloudflare v4 candidate
               └── embeddings-cloudflare-v1/ (1024D)
```

The Cloudflare generator uses Workers AI for the actual vector inference while retaining local checkpointing, deterministic evidence mapping, artifact hashing, and validation.

## Next Stage

Do not change the portfolio UI yet.

After `embeddings-cloudflare-v1` validates successfully, create the matching 1,024-D cosine Vectorize index in Stage 05 and publish this generation into it.
