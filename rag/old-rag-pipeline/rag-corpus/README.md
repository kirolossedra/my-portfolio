# RAG Generated Artifact Lineage

## Table of Contents

- [Purpose](#purpose)
- [Lineage](#lineage)
- [Canonical Normalized Corpus](#canonical-normalized-corpus)
- [Retrieval Documents v2](#retrieval-documents-v2)
- [Embeddings v2 Directory Name](#embeddings-v2-directory-name)
- [Retrieval v3](#retrieval-v3)
- [Pinecone Validation](#pinecone-validation)
- [Regeneration Policy](#regeneration-policy)

<a id="purpose"></a>
## Purpose

`rag-corpus/` contains active derived artifacts. It is not the original source-analysis folder and it is not the obsolete experiment archive.

<a id="lineage"></a>
## Lineage

```text
other/repositories-*.md
  -> repositories/*.json + repositories.jsonl
  -> retrieval-documents-v2/documents.jsonl
  -> embeddings-v2/{embedding-records.jsonl, embeddings.npy, manifest, validation}
  -> retrieval-v3/{config, validation, test-results}
  -> Pinecone remote namespace corpus-v1
  -> pinecone-v1/{upsert validation, parity v1, parity v2}
```

<a id="canonical-normalized-corpus"></a>
## Canonical Normalized Corpus

134 repository JSON files plus combined JSONL/catalog/manifest/validation. Historical success: 11,823 sections, 975 retrieval tags, 535 skill-rating rows.

<a id="retrieval-documents-v2"></a>
## Retrieval Documents v2

2,808 evidence-oriented documents compiled from 30,930 retained blocks. Repetition and tiny generic blocks are suppressed only in this derived layer, preserving canonical source.

<a id="embeddings-v2-directory-name"></a>
## Embeddings v2 Directory Name

Despite the script name `generate-rag-embeddings-v3-documents-local.py`, active output is `embeddings-v2/`. Treat the manifest/schema and documented model contract as authoritative; do not infer pipeline generation solely from the directory suffix.

Matrix shape is 2808 x 512 float32. Records preserve `source_fragments` and the original `embedding_text`.

<a id="retrieval-v3"></a>
## Retrieval v3

Contains configuration, validation and interactive-session evidence for the exact local evidence-aware retriever.

<a id="pinecone-validation"></a>
## Pinecone Validation

`pinecone-v1/` holds the audit trail for remote ingestion and dense-backend validation. v1 parity is retained because the mistaken ANN score criterion is an important debugging record; v2 is the current acceptance result.

<a id="regeneration-policy"></a>
## Regeneration Policy

Derived artifacts can be rebuilt from upstream sources, but regeneration is not casual: follow [`../docs/regeneration-matrix.md`](../docs/regeneration-matrix.md) so changing a downstream rank rule does not unnecessarily rebuild embeddings or the corpus.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Pipeline](../docs/pipeline.md)
- [Pinecone](../docs/pinecone.md)
