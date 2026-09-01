# Cloudflare Vectorize Dense Parity v1

## Table of Contents

- [Purpose](#purpose)
- [Preconditions](#preconditions)
- [Run](#run)
- [Regression Query Suite](#regression-query-suite)
- [Acceptance Checks](#acceptance-checks)
- [Why High-Precision Vectorize Queries Are Used](#why-high-precision-vectorize-queries-are-used)
- [Outputs](#outputs)
- [What PASS Means](#what-pass-means)

## Purpose

`validate-vectorize-dense-parity-v1.mjs` is the independent acceptance gate for the Cloudflare Vectorize dense backend.

It compares the hosted Vectorize index against exhaustive local cosine search over the exact same 2,808 Qwen vectors rather than comparing unrelated Nomic and Qwen embedding spaces.

## Preconditions

The following must already exist and pass their own validations:

```text
rag/rag-corpus/embeddings-cloudflare-v1/
rag/rag-corpus/vectorize-cloudflare-v1/vectorize-publication-manifest.json
```

The validator checks the Stage 03 and Stage 05 hashes so it cannot accidentally test a Vectorize publication built from a different embedding generation.

## Run

```powershell
node rag/scripts/06-validation/cloudflare-vectorize/validate-vectorize-dense-parity-v1.mjs
```

No Vectorize write/delete/upsert operation is performed by this script.

## Regression Query Suite

The validator generates fresh query embeddings using the exact Stage 03 runtime contract:

```text
Model:       @cf/qwen/qwen3-embedding-0.6b
Input mode:  queries
Instruction: Given a web search query, retrieve relevant passages that answer the query
Postprocess: L2 normalize
```

It tests five employer-style questions spanning:

- authorization architecture;
- testing evolution;
- backend-engineering evidence;
- engineering weaknesses/limitations;
- product ownership.

## Acceptance Checks

The gate separates distinct failure classes.

### 1. Index/document identity

- 1,024 dimensions;
- cosine metric;
- exactly 2,808 vectors;
- exact local/remote document-ID set, proven with `vectorCount=2808` plus exhaustive `get_by_ids` retrieval of every expected ID; `get_by_ids` requests are capped at 20 IDs to match the live Vectorize V2 endpoint; `list-vectors` is diagnostic only.

### 2. Stored-vector fidelity

64 stratified vectors are fetched directly by ID in batches of at most 20 and compared with the local float32 matrix.

The validator also verifies the repository/retrieval metadata mapping for those vectors.

### 3. Dense candidate parity

For each regression query:

- exhaustive local cosine computes the exact top 50;
- Vectorize is queried for top 50;
- overlap@10, overlap@25 and overlap@50 must each be at least 90%;
- the top result must be the same, except an exact-score tie is accepted as equivalent.

### 4. Score/value fidelity

The validator records both:

- the score reported by Vectorize;
- cosine recomputed independently from the original vector values returned by Vectorize.

The independently recomputed cosine is the hard numeric-fidelity check. The Vectorize-reported score delta is retained as a diagnostic only, because Cloudflare documents `returnValues: true` as high-precision scoring but does not publish an absolute numeric error tolerance that would justify treating an arbitrary score-delta threshold as an acceptance gate.

A query therefore fails for numeric fidelity if the returned original vectors cannot reproduce the local cosine result within tolerance, not merely because the service's reported score differs by more than an undocumented threshold.

## Why High-Precision Vectorize Queries Are Used

The parity gate sends `returnValues: true`. In current Vectorize behavior this uses original vector values for high-precision scoring and improves candidate accuracy. This is appropriate for backend acceptance testing even though the eventual production runtime may choose a different latency/precision tradeoff after measurement.

## Outputs

```text
rag/rag-corpus/vectorize-cloudflare-v1/vectorize-dense-parity-validation-v1.json
rag/rag-corpus/vectorize-cloudflare-v1/vectorize-dense-parity-validation-v1.txt
```

## What PASS Means

A PASS means Cloudflare Vectorize is accepted as a faithful dense-recall backend for the validated Cloudflare/Qwen embedding generation: exact corpus identity, stored-vector fidelity, top-1 equivalence, >=90% overlap at 10/25/50, independently recomputed returned-vector cosine fidelity, and metadata mapping all pass. The service-reported score delta remains visible in the report for diagnostics but is not itself a hard gate.

It does **not** yet mean the complete production RAG is done. The next implementation step is the Cloudflare Worker runtime path: query embedding, Vectorize recall, reranking/evidence policy, content retrieval, grounded generation, citations, streaming and abuse controls.
