# Stage 06 — Hosted-Backend Validation

## Table of Contents

- [Responsibility](#responsibility)
- [Pinecone History](#pinecone-history)
- [Cloudflare Vectorize v1](#cloudflare-vectorize-v1)
- [Validation Boundary](#validation-boundary)

## Responsibility

Prove that a hosted vector backend preserves the intended vector/document mapping and provides acceptable dense candidate retrieval behavior before that backend is wired into production runtime code.

## Pinecone History

- v1: historically useful but flawed acceptance rule treated an ANN-reported score as if it had to equal exhaustive NumPy cosine.
- v2: active Pinecone acceptance validator; separates ANN candidate parity from exact fetched-vector fidelity.

## Cloudflare Vectorize v1

Run:

```powershell
node rag/scripts/06-validation/cloudflare-vectorize/validate-vectorize-dense-parity-v1.mjs
```

The validator performs no remote mutation. It validates:

- index identity/count;
- complete 2,808-ID inventory;
- stratified stored-vector fidelity;
- compact metadata mapping;
- Qwen runtime query embedding contract;
- exact local cosine versus Vectorize high-precision top-50 candidate retrieval across five employer-style regression queries;
- returned-value and reported-score fidelity.

## Validation Boundary

Stage 06 v1 approves **Vectorize as the dense backend for the Qwen vector space**.

It does not claim that the final employer-facing RAG runtime is complete. Cross-document ranking, evidence gates, reranking, content lookup, generation, citations, streaming, and abuse controls belong to the later Cloudflare Worker runtime integration and its end-to-end validation.
