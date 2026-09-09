# Cloudflare Vectorize Publication v1

## Table of Contents

- [Purpose](#purpose)
- [Input](#input)
- [Remote Contract](#remote-contract)
- [Run](#run)
- [Publication Safety](#publication-safety)
- [Metadata](#metadata)
- [Validation Performed During Publication](#validation-performed-during-publication)
- [Outputs](#outputs)
- [Next Stage](#next-stage)

## Purpose

`publish-vectorize-v1.mjs` publishes the validated Cloudflare/Qwen Stage 03 embedding generation to Cloudflare Vectorize V2.

It does not touch the Nomic/Pinecone reference path.

## Input

```text
rag/rag-corpus/embeddings-cloudflare-v1/embeddings.npy
rag/rag-corpus/embeddings-cloudflare-v1/embedding-records.jsonl
rag/rag-corpus/embeddings-cloudflare-v1/embedding-manifest.json
```

The script refuses to publish unless the Stage 03 manifest, artifact hashes, record ordering, vector dimensions, model identity, document IDs, repository coverage, dtype, cosine contract, and L2-normalization checks all pass.

## Remote Contract

```text
Backend:    Cloudflare Vectorize V2
Index:      portfolio-career-rag-cloudflare-v1
Dimensions: 1024
Metric:     cosine
Namespace:  none
Vector ID:  document_id
Model:      @cf/qwen/qwen3-embedding-0.6b
```

No namespace is used because the index name itself identifies the first Cloudflare corpus/index generation. A future incompatible vector generation should receive a new index generation rather than silently mixing vector spaces.

## Run

From the portfolio repository root, for a normal first publication:

```powershell
node rag/scripts/05-vector-index/cloudflare-vectorize/publish-vectorize-v1.mjs
```

If the 2,808-vector upsert has already succeeded and only the post-publication validator needs to be rerun, use:

```powershell
node rag/scripts/05-vector-index/cloudflare-vectorize/publish-vectorize-v1.mjs --verify-only
```

`--verify-only` never creates an index and never upserts vectors. It requires the compatible index to already exist with exactly 2,808 visible vectors.

The script reuses the existing Wrangler login when explicit Cloudflare credentials are not supplied through the environment.

## Publication Safety

The publisher is deliberately conservative:

- normal publication accepts zero arguments; `--verify-only` validates an already-populated compatible index without performing another upsert;
- uses `upsert`, making an interrupted run safe to rerun;
- never calls Vectorize delete APIs;
- never deletes/recreates an incompatible index;
- uploads in bounded batches;
- waits for the final asynchronous mutation to become visible;
- treats `list-vectors` as diagnostic only; exact correctness never depends on continuation cursors;
- proves the final remote ID set using authoritative `vectorCount=2808` plus exhaustive retrieval of every expected document ID;
- sends `get_by_ids` requests in batches of at most 20 IDs, matching the limit enforced by the live Vectorize V2 endpoint;
- never stores a Cloudflare token in generated artifacts.

If the existing index contains stale/extra IDs, publication fails instead of silently accepting a contaminated corpus.

## Metadata

Vectorize stores only compact routing/evidence metadata, not the full RAG evidence text. Stored metadata includes fields such as:

- repository index/name/URL;
- retrieval class;
- semantic area;
- evidence level and polarity;
- specificity/concrete-signal counts;
- embedding generation/model identity.

Full evidence content remains in the canonical local corpus and will later be served through the production content store/runtime path.

## Validation Performed During Publication

After publication the script checks:

1. index identity: 1,024 dimensions + cosine;
2. final mutation visibility;
3. remote count: exactly 2,808;
4. complete vector-ID identity: `vectorCount=2808` plus exhaustive retrieval of all 2,808 expected IDs in 20-ID batches; a first `list-vectors` page may be recorded for diagnostics but is not part of the correctness proof;
5. 32 stratified stored vectors against local float32 values, also fetched in batches of at most 20 IDs;
6. compact metadata round-trip for the same samples.

## Outputs

```text
rag/rag-corpus/vectorize-cloudflare-v1/vectorize-publication-manifest.json
rag/rag-corpus/vectorize-cloudflare-v1/vectorize-publication-validation-report.txt
```

## Next Stage

Run the independent dense-backend acceptance validator:

```powershell
node rag/scripts/06-validation/cloudflare-vectorize/validate-vectorize-dense-parity-v1.mjs
```
