# RAG Regeneration Matrix

## Table of Contents

- [Matrix](#matrix)
- [Step 1 Special Warning](#step-1-special-warning)
- [Embedding Preservation Rule](#embedding-preservation-rule)
- [Qwen Candidate Regeneration Rules](#qwen-candidate-regeneration-rules)
- [Cloudflare Runtime Change-Impact Matrix](#cloudflare-runtime-change-impact-matrix)

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

<a id="qwen-candidate-regeneration-rules"></a>
## Qwen Candidate Regeneration Rules

The Cloudflare-native investigation introduces a **parallel candidate**, not a replacement-in-place.

| Candidate change | Rebuild current Nomic? | Generate Qwen candidate? | New Pinecone index? | Re-run hybrid regression? |
|---|:---:|:---:|:---:|:---:|
| first Qwen bake-off | ❌ | ✅ | ✅ 1,024-D | ✅ |
| Qwen query instruction changes | ❌ | maybe documents only if document contract changes | maybe | ✅ |
| Qwen document formatting changes | ❌ | ✅ | ✅/rewrite candidate | ✅ |
| Qwen model alias/version changes | ❌ | ✅ | ✅/rewrite candidate | ✅ |
| D1 FTS5 schema/scoring change | ❌ | ❌ | ❌ | ✅ |
| TypeScript fusion/gate port | ❌ | ❌ | ❌ | ✅ |
| Workers AI BGE reranker change | ❌ | ❌ | ❌ | ✅ final ranking |
| Pinecone -> Vectorize experiment | ❌ | ❌ if same Qwen vectors are compatible | new Vectorize index | ✅ dense + full pipeline |

### Hard preservation rule

Do not overwrite:

```text
rag/rag-corpus/embeddings-v2/
portfolio-career-rag-v1
corpus-v1
```

while the Qwen path is still a candidate.

<a id="cloudflare-runtime-change-impact-matrix"></a>
## Cloudflare Runtime Change-Impact Matrix

| Future implementation change | Required validation |
|---|---|
| add Workers AI binding | Worker typecheck + local/remote model smoke |
| add `migrations/0005-rag-runtime-search.sql` | D1 migration dry-run + row-count/integrity + FTS query tests |
| move BM25 to D1 FTS5 | lexical Recall@K/rank regression; D1 rows-read measurement |
| move metadata recall to D1 | candidate-set parity + query-plan/index checks |
| port gates/fusion to TypeScript | deterministic fixture parity |
| replace CrossEncoder with BGE | reranking regression + token truncation + neuron measurement |
| query Pinecone from Worker | top-500 response + `usage.read_units` + secret-handling test |
| switch Pinecone to Vectorize | topK/recall redesign + free-dimension budget calculation |
| wire Kiro page | browser state + timeout/error/evidence rendering tests |
| integrate Gemini | grounding regression + project quota + privacy/data-flow review |

Detailed migration record: [cloudflare-native-zero-cost-migration.md](cloudflare-native-zero-cost-migration.md).

## Related Documentation

- Parent: [../README.md](../README.md)
- [Scripts](../scripts/README.md)
- [Zero-cost Cloudflare migration](cloudflare-native-zero-cost-migration.md)
