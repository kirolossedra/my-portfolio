# Embedding Version History

## Table of Contents

- [Attempt 1 - Hosted/Paid Embeddings](#attempt-1-hostedpaid-embeddings)
- [Attempt 2 - Nomic on Old Chunks](#attempt-2-nomic-on-old-chunks)
- [Active Attempt - Nomic on Evidence Documents](#active-attempt-nomic-on-evidence-documents)
- [Prefix Contract](#prefix-contract)
- [Dimension Contract](#dimension-contract)
- [Candidate Attempt - Cloudflare Qwen3 Embeddings](#candidate-attempt-cloudflare-qwen3-embeddings)
- [Candidate Migration Rules](#candidate-migration-rules)

<a id="attempt-1-hostedpaid-embeddings"></a>
## Attempt 1 - Hosted/Paid Embeddings

The initial script targeted paid OpenAI embeddings. It did not fit the no-paid-preprocessing constraint and was retired.

<a id="attempt-2-nomic-on-old-chunks"></a>
## Attempt 2 - Nomic on Old Chunks

Pinned Nomic v1.5 successfully embedded 11,642 old chunks locally at zero API cost. Native 768-D vectors were Matryoshka-reduced to 512 after layer normalization and then L2 normalized. This proved the model/recipe and local inference path.

<a id="active-attempt-nomic-on-evidence-documents"></a>
## Active Attempt - Nomic on Evidence Documents

The same model/recipe was deliberately retained while input units changed to 2,808 evidence-aware documents. This isolates retrieval-unit quality from embedding-model churn.

Validated active properties: 68/315/1343 token min/median/max, no 8192 overflow, 2808 x 512 float32, no invalid vectors, norm 1, 44 compute batches, complete provenance/reference integrity.

<a id="prefix-contract"></a>
## Prefix Contract

Documents use `search_document:`; runtime questions use `search_query:`. Changing one side without the other is a retrieval-breaking contract change and requires deliberate regeneration/testing.

<a id="dimension-contract"></a>
## Dimension Contract

The Pinecone index is 512-D cosine. Changing the embedding dimension/recipe requires a new compatible index or explicit migration; do not upload differently shaped vectors into the current index.

<a id="candidate-attempt-cloudflare-qwen3-embeddings"></a>
## Candidate Attempt - Cloudflare Qwen3 Embeddings

**Status: NOT YET GENERATED / NOT ACTIVE.**

The zero-cost production-runtime evaluation identified Cloudflare-hosted:

```text
@cf/qwen/qwen3-embedding-0.6b
```

as the first embedding candidate to benchmark against Nomic.

Current Cloudflare documentation identifies this model as a 1,024-D cosine embedding model with an 8,192-token supported input ceiling and Workers AI availability. This candidate is attractive because query embeddings can run directly through the existing Cloudflare Worker without a Python model host.

This does **not** invalidate the current Nomic artifacts. The active Nomic vectors remain the reference baseline until a Qwen candidate passes retrieval regression.

### Do not copy Nomic preprocessing blindly

Nomic's current contract is model-specific:

```text
search_document:
search_query:
layer_norm -> first 512 -> L2
```

Qwen's Workers AI endpoint exposes task-oriented `queries` and `documents` inputs and an optional query instruction. The candidate generation path must use and document the Qwen API contract deliberately. It must not mechanically prepend Nomic task prefixes unless a controlled benchmark proves that doing so is appropriate.

### Candidate dimension/index contract

The Qwen candidate should use a **new 1,024-D cosine index**. It must not be written into:

```text
portfolio-career-rag-v1 / corpus-v1
```

because that active index is 512-D and belongs to the Nomic baseline.

<a id="candidate-migration-rules"></a>
## Candidate Migration Rules

- [x] preserve all current Nomic embedding files;
- [x] preserve current Pinecone 512-D index and namespace;
- [ ] generate Qwen embeddings into a separately versioned directory;
- [ ] record Cloudflare model alias, response shape, token counts and source-document hashes in a new manifest;
- [ ] fail on any silent truncation/invalid vector;
- [ ] create a separate 1,024-D candidate Pinecone index;
- [ ] evaluate end-task retrieval quality, not numerical similarity between Nomic and Qwen vectors;
- [ ] capture Pinecone read units during the candidate benchmark;
- [ ] only mark Qwen active after the complete hybrid/reranking pipeline also passes.

The model decision criterion is **retrieval truth and evidence quality**, not sunk cost in the existing embedding generation and not platform neatness.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Pinecone](pinecone.md)
- [Zero-cost Cloudflare migration](cloudflare-native-zero-cost-migration.md)
