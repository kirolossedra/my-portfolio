# Pinecone Dense Backend

## Table of Contents

- [Decision](#decision)
- [Index Contract](#index-contract)
- [Ingestion](#ingestion)
- [Why 29 vs 44 Batches](#why-29-vs-44-batches)
- [Parity v1](#parity-v1)
- [Parity v2](#parity-v2)
- [Retrieval Ownership](#retrieval-ownership)
- [Failure / Recovery](#failure-recovery)
- [2026-08-31 Qwen Migration Decision](#2026-08-31-qwen-migration-decision)
- [Pinecone vs Vectorize Under the Current Pipeline](#pinecone-vs-vectorize-under-the-current-pipeline)
- [Capacity Measurement Required](#capacity-measurement-required)

<a id="decision"></a>
## Decision

Pinecone Serverless Starter is the active dense serving backend. The dataset is small enough for local exact search, so the decision is about production architecture and implementation signal, not raw scale necessity.

<a id="index-contract"></a>
## Index Contract

```text
index: portfolio-career-rag-v1
dimension: 512
metric: cosine
serverless cloud: AWS
region: us-east-1
namespace: corpus-v1
deletion protection: enabled
vectors: 2,808
```

<a id="ingestion"></a>
## Ingestion

`upsert-pinecone-v1.py` validates local dimensions/count, validates target index, uploads 100 vectors per network batch (29 batches total), waits/checks data freshness and writes `pinecone-upsert-validation-v1.json`.

<a id="why-29-vs-44-batches"></a>
## Why 29 vs 44 Batches

44 = local Nomic compute batches at 64. 29 = remote Pinecone write batches at 100. Batch boundaries are implementation details of different stages; vector count stays 2,808.

<a id="parity-v1"></a>
## Parity v1

Same top-1 and 100/96/98% overlap at 10/25/50 already showed strong ANN parity. The validator incorrectly treated 0.0025883320 ANN-reported score drift as failure because of a <=0.001 threshold.

<a id="parity-v2"></a>
## Parity v2

The corrected test separates ANN recall from storage fidelity. It requires high overlap, then fetches vectors and compares values exactly. Result: zero vector delta and zero recomputed cosine delta. This proves the server stores the intended vectors even though ANN-reported search scores/order can differ slightly from exhaustive exact search.

<a id="retrieval-ownership"></a>
## Retrieval Ownership

Pinecone owns dense candidate serving and remote vector storage. Local code continues to own BM25, metadata, concept/evidence gates, CrossEncoder, polarity, dedupe decision logic, repo diversity and full provenance.

<a id="failure-recovery"></a>
## Failure / Recovery

Because Pinecone is derived state, recovery is upsert from validated local embeddings followed by the v2 parity validator. Do not reconstruct the canonical evidence corpus from Pinecone metadata.

<a id="2026-08-31-qwen-migration-decision"></a>
## 2026-08-31 Qwen Migration Decision

The active Pinecone decision is **not revoked** by the Cloudflare-native runtime investigation.

If `@cf/qwen/qwen3-embedding-0.6b` is evaluated, the first candidate should stay on Pinecone so the experiment changes the embedding model without simultaneously changing the vector-serving backend.

Required shape:

```text
ACTIVE BASELINE
portfolio-career-rag-v1
512-D cosine
Nomic
corpus-v1

PARALLEL CANDIDATE
new index name / new namespace
1024-D cosine
Qwen3-Embedding-0.6B
```

The candidate index name must be explicit and versioned when implemented. Do not overload `portfolio-career-rag-v1` with a different vector shape or model lineage.

<a id="pinecone-vs-vectorize-under-the-current-pipeline"></a>
## Pinecone vs Vectorize Under the Current Pipeline

Vectorize is a legitimate vector database, but it is not an automatic replacement for Pinecone in the current retrieval design.

| Requirement | Pinecone current path | Vectorize current Free path |
|---|---|---|
| 2,808-vector corpus | ✅ | ✅ |
| Qwen 1,024-D vectors | ✅ new compatible index | ✅ below 1,536-D max |
| current dense `top 500` | ✅ query API supports much larger `topK` | ❌ max 100 without values/metadata; 50 with values/full metadata |
| current Nomic 512-D baseline | ✅ already validated | would require separate migration |
| per-query capacity accounting | read units | queried vector dimensions |
| Cloudflare-native binding | ❌ | ✅ |
| first model bake-off | **preferred** | deferred |

### Vectorize free-dimension calculation for the Qwen candidate

With 2,808 documents and 1,024 dimensions:

```text
stored dimensions = 2,808 * 1,024
                  = 2,875,392
```

Free stored allowance is 5,000,000 dimensions, so the corpus would fit.

Using Cloudflare's queried-dimension formula and 30,000,000 queried dimensions/month:

```text
max queries/month ≈ 30,000,000 / 1,024 - 2,808
                  ≈ 26,488
```

That is roughly `883/day` averaged over 30 days. This is likely enough for portfolio traffic, but it is **not** equivalent to the much larger embedding-only Workers AI capacity and it does not solve the top-500 mismatch.

Therefore:

> **Do not couple the embedding-model migration to the vector-database migration.**

<a id="capacity-measurement-required"></a>
## Capacity Measurement Required

Pinecone Starter currently includes up to 1,000,000 read units/month. Query/fetch responses expose `usage.read_units`.

The next Qwen/Nomic benchmark should record:

- read units for the current top-500 dense query;
- read units for vector fetches used by semantic dedupe;
- response egress size;
- whether `include_values`/metadata can be reduced without changing behavior.

Then compute:

```text
estimated monthly full-query capacity
= 1,000,000 Starter read units
  / measured read units per complete retrieval request
```

Do not substitute a generic Pinecone marketing example for this workload-specific measurement.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Embedding history](embedding-version-history.md)
- [Testing](testing-and-regressions.md)
- [Zero-cost Cloudflare migration](cloudflare-native-zero-cost-migration.md)
