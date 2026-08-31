# Stage 03 — Embeddings

## Table of Contents
- [Responsibility](#responsibility)
- [Generations](#generations)
- [Providers](#providers)

## Responsibility
Convert Stage 02 retrieval documents into a versioned vector space with an explicit model/dimension/query-document contract.

## Generations
- v1: historical hosted/paid approach.
- v2: local Nomic applied to the obsolete tiny chunks.
- v3/Nomic: active validated Nomic vectors over the 2,808 evidence documents.
- next Cloudflare generation: parallel Qwen/Workers AI candidate; do not overwrite Nomic v3.

## Providers
- `nomic/` — current validated reference vector space.
- `cloudflare/` — reserved for the Cloudflare Workers AI embedding pipeline.
