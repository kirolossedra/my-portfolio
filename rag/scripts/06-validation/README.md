# Stage 06 — Hosted-Backend Validation

## Table of Contents
- [Responsibility](#responsibility)
- [Pinecone History](#pinecone-history)
- [Cloudflare](#cloudflare)

## Responsibility
Prove that a hosted vector backend stores the intended vectors and supplies acceptable candidate retrieval behavior.

## Pinecone History
- v1: historically useful but flawed acceptance rule treated an ANN score as if it had to equal exhaustive NumPy cosine.
- v2: active acceptance validator; tests candidate-set parity and exact fetched-vector fidelity separately.

## Cloudflare
`cloudflare-vectorize/` is reserved for the equivalent Vectorize acceptance tests.
