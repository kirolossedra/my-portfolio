# Data and Storage Map

## Table of Contents

- [Authoritative vs Derived Data](#authoritative-vs-derived-data)
- [D1 Image Design](#d1-image-design)
- [RAG Provenance](#rag-provenance)
- [What Pinecone Is Not](#what-pinecone-is-not)

<a id="authoritative-vs-derived-data"></a>
## Authoritative vs Derived Data

| Data | Location | Authority |
|---|---|---|
| Milestones/sections/images/opinions/OAuth exchange state | Cloudflare D1 | runtime authority for editable portfolio content |
| Skills evidence page | `src/data/project-skills.ts` | versioned source authority |
| 134-repository career analysis | `rag/other/repositories-*.md` | source-analysis authority |
| Normalized repository JSON | `rag/rag-corpus/` | canonical derived RAG corpus |
| Retrieval documents | `rag/rag-corpus/retrieval-documents-v2/` | active retrieval text units |
| Embedding records/matrix | `rag/rag-corpus/embeddings-v2/` | active local embedding artifacts |
| Pinecone vectors | index `portfolio-career-rag-v1`, namespace `corpus-v1` | remote serving copy of derived vectors |
| Retrieval validation | `rag/rag-corpus/retrieval-v3/` and `pinecone-v1/` | validation/audit artifacts |
| 3D Kiro model | `/public/models/kiro/kiro.glb` expected by contract | authored visual asset |

<a id="d1-image-design"></a>
## D1 Image Design

Milestone images use Base64 persistence in D1, not active R2. Public APIs expose URLs and binary responses rather than embedding Base64 in timeline JSON.

<a id="rag-provenance"></a>
## RAG Provenance

Every RAG transformation is designed to retain source repository identity and original batch/source line information. This enables retrieved answers to be grounded in the original analytical evidence rather than only vector IDs.

<a id="what-pinecone-is-not"></a>
## What Pinecone Is Not

Pinecone is not the authoritative prose store. If the remote index is lost, it should be recreated from the checked-in/local embedding artifacts. It must not become the only location of evidence text or provenance.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG documentation](../rag/README.md)
- Implementation corpus: `rag/rag-corpus/`
