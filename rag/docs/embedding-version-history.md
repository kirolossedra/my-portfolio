# Embedding Version History

## Table of Contents

- [Attempt 1 - Hosted/Paid Embeddings](#attempt-1-hostedpaid-embeddings)
- [Attempt 2 - Nomic on Old Chunks](#attempt-2-nomic-on-old-chunks)
- [Active Attempt - Nomic on Evidence Documents](#active-attempt-nomic-on-evidence-documents)
- [Prefix Contract](#prefix-contract)
- [Dimension Contract](#dimension-contract)

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

## Related Documentation

- Parent: [../README.md](../README.md)
- [Pinecone](pinecone.md)
