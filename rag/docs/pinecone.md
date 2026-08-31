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

## Related Documentation

- Parent: [../README.md](../README.md)
- [Embedding history](embedding-version-history.md)
- [Testing](testing-and-regressions.md)
