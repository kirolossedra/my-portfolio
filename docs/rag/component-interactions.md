# RAG Component Interactions

## Table of Contents

- [Data Passed Between Components](#data-passed-between-components)
- [Dense Channel](#dense-channel)
- [Lexical and Metadata Channels](#lexical-and-metadata-channels)
- [Gate and Reranker Roles](#gate-and-reranker-roles)
- [Dedupe and Diversity](#dedupe-and-diversity)

<a id="data-passed-between-components"></a>
## Data Passed Between Components

| From | To | Data |
|---|---|---|
| source Markdown | normalizer | repository report text + headings/provenance |
| normalizer | retrieval-document compiler | canonical repository JSON/sections/tags/ratings |
| compiler | embedding generator | 2,808 `embedding_text` records + source fragments |
| embedding generator | offline retriever | normalized 512-D matrix + records |
| embedding generator | Pinecone uploader | vector rows + compact metadata |
| user question | Nomic | `search_query: <question>` |
| Pinecone | runtime | vector IDs + ANN cosine scores; fetched vectors for dedupe |
| local records | BM25/metadata | text/topics/skills/semantic area/evidence metadata |
| candidates | concept gate | query facets + record evidence text/metadata |
| rerank pool | CrossEncoder | `(question, passage)` pairs |
| final ranking | API | evidence text + source fragments + scoring diagnostics |
| evidence packet | Gemini | **future** question + selected evidence/provenance |
| generated answer | Kiro UI | **future** answer + evidence refs/status |

<a id="dense-channel"></a>
## Dense Channel

Offline v3 has exact cosine for every record. Runtime Pinecone searches top 500 and therefore only has ANN dense scores for returned dense candidates. This is the one intentional/known equivalence gap around the otherwise preserved v3 logic.

<a id="lexical-and-metadata-channels"></a>
## Lexical and Metadata Channels

BM25 and metadata indexes are built locally from `embedding-records.jsonl`. Pinecone does not replace them.

<a id="gate-and-reranker-roles"></a>
## Gate and Reranker Roles

The primary-concept gate is a relevance admission control; it prevents a broad supporting word from qualifying unrelated evidence. The CrossEncoder then performs pairwise semantic relevance over a bounded pool. Evidence quality/polarity is a separate dimension so a semantically relevant limitation is not automatically promoted as positive proof.

<a id="dedupe-and-diversity"></a>
## Dedupe and Diversity

Semantic dedupe threshold is 0.955. Final output caps a repository at two results so one large repository cannot consume all ten evidence slots.

## Related Documentation

- Parent: [RAG documentation](README.md)
- [Pipeline](pipeline.md)
