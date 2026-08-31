# RAG Regeneration Matrix

## Table of Contents

- [Matrix](#matrix)
- [Step 1 Special Warning](#step-1-special-warning)
- [Embedding Preservation Rule](#embedding-preservation-rule)

<a id="matrix"></a>
## Matrix

| Changed item | Step 1 | Step 2 | Embeddings | Offline retrieval validation | Pinecone upsert | Pinecone parity | Runtime smoke | Generation regression |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| source Markdown | yes | yes | yes | yes | yes | yes | yes | yes |
| normalizer behavior | yes | yes | yes | yes | yes | yes | yes | yes |
| retrieval-document compiler | no | yes | yes | yes | yes | yes | yes | yes |
| Nomic model/revision/recipe | no | no | yes | yes | yes/new index if incompatible | yes | yes | yes |
| retrieval weights/gates | no | no | no | yes | no | no | yes | yes |
| CrossEncoder model | no | no | no | yes | no | no | yes | yes |
| Pinecone batch size | no | no | no | no | only when rewriting remote | yes after rewrite | yes | no |
| Pinecone index/namespace | no | no | no | no | yes | yes | yes | no |
| FastAPI/CORS/serialization | no | no | no | no | no | no | yes | no |
| Gemini prompt/model | no | no | no | no | no | no | API smoke | yes |
| Kiro animations | no | no | no | no | no | no | no | browser integration only |

<a id="step-1-special-warning"></a>
## Step 1 Special Warning

Before any full rebuild, fix `prepare-rag-corpus.py` path assumptions caused by moving it from beside the source Markdown into `rag/scripts/`.

<a id="embedding-preservation-rule"></a>
## Embedding Preservation Rule

Current embeddings are validated. A reranking/gating change is not an embedding change. Avoid unnecessary 44-batch recomputation and Pinecone rewrite.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Scripts](../scripts/README.md)
