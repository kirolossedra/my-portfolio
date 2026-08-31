# Obsolete RAG Implementations and Why They Remain

## Table of Contents

- [Policy](#policy)
- [`build-rag-chunks.py`](#build-rag-chunkspy)
- [`generate-rag-embeddings.py`](#generate-rag-embeddingspy)
- [`generate-rag-embeddings-v2-local.py`](#generate-rag-embeddings-v2-localpy)
- [`build-rag-retrieval-v1-local.py`](#build-rag-retrieval-v1-localpy)
- [`build-rag-retrieval-v2-hybrid-local.py`](#build-rag-retrieval-v2-hybrid-localpy)
- [Obsolete Generated Directories](#obsolete-generated-directories)

<a id="policy"></a>
## Policy

Obsolete does not mean useless. These files preserve the reasoning trail that produced the active architecture and provide concrete examples of failure modes to test against.

<a id="build-rag-chunkspy"></a>
## `build-rag-chunks.py`

Produced 11,642 chunks from 11,464 source units, median 53 words. Structurally successful, retrieval-unit design unsuccessful for a repetitive analytical corpus. Replaced by evidence-aware retrieval documents.

<a id="generate-rag-embeddingspy"></a>
## `generate-rag-embeddings.py`

Initial hosted/paid embedding approach. Superseded by the free/local requirement and pinned Nomic embedding architecture.

<a id="generate-rag-embeddings-v2-localpy"></a>
## `generate-rag-embeddings-v2-local.py`

Successful local Nomic embedding run over the obsolete chunks: 11,642 x 512, 182 CPU batches, same Nomic revision and Matryoshka recipe used later. The model choice survived; the input units did not.

<a id="build-rag-retrieval-v1-localpy"></a>
## `build-rag-retrieval-v1-local.py`

Exact cosine only. Demonstrated that semantically generic/negative template material could outrank direct authorization evidence. Cosine was not defective; the representation/retrieval-unit design was.

<a id="build-rag-retrieval-v2-hybrid-localpy"></a>
## `build-rag-retrieval-v2-hybrid-local.py`

Added BM25, metadata, RRF, CrossEncoder, suppression and negative evidence logic. Better, but still bounded by the old tiny chunks. This experiment justified rebuilding Step 2 rather than endlessly tuning scores.

<a id="obsolete-generated-directories"></a>
## Obsolete Generated Directories

`chunks/`, `embeddings/`, `retrieval/`, and `retrieval-v2/` correspond to those superseded generations. Do not point runtime code at them.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Version history](../docs/retrieval-version-history.md)
