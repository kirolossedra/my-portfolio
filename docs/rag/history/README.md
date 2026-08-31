# RAG Documentation History

## Table of Contents

- [Purpose](#purpose)
- [Preserved Historical Snapshot](#preserved-historical-snapshot)
- [Current-vs-Historical Rule](#current-vs-historical-rule)

<a id="purpose"></a>
## Purpose

`docs/rag/history/` is the navigation home for superseded RAG documentation history. Historical material is retained for provenance but must not be mistaken for current architecture truth.

<a id="preserved-historical-snapshot"></a>
## Preserved Historical Snapshot

The repository already contains the complete pre-Pinecone/pre-runtime snapshot at:

```text
rag/docs/historical-rag-readme-v1.md
```

That **85 KB historical file is not deleted or rewritten by this documentation-only replacement**. It remains intact in the top-level RAG implementation tree and preserves the earlier model/provider comparisons, schemas, security rules, acceptance criteria, lessons and planning history.

It is intentionally not duplicated into this ZIP: duplicating the full snapshot would create two physical authoritative-looking copies. This `history/` index is the canonical documentation pointer to the preserved historical artifact.

<a id="current-vs-historical-rule"></a>
## Current-vs-Historical Rule

```text
Current RAG architecture/design truth -> docs/rag/
Historical superseded snapshot         -> rag/docs/historical-rag-readme-v1.md
Implementation/code/data               -> rag/
Retrieval QC                            -> docs/qc/rag/
```

## Related Documentation

- Parent: [RAG documentation](../README.md)
- [Retrieval history](../retrieval-version-history.md)
