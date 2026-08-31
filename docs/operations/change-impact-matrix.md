# Change Impact Matrix

## Table of Contents

- [Portfolio Application Changes](#portfolio-application-changes)
- [RAG Change Matrix](#rag-change-matrix)
- [Hard Rule](#hard-rule)

<a id="portfolio-application-changes"></a>
## Portfolio Application Changes

| Change | Required follow-up |
|---|---|
| Shared milestone/opinion contract | update browser + Worker consumers; typecheck both |
| Worker route/schema | update client calls, tests and README/API docs |
| D1 schema | add ordered migration; local migration validation; deployment applies remote migration |
| Auth behavior | update `auth.ts`, auth tests, trust-boundary docs and legacy-auth guard assumptions |
| Image storage strategy | update migrations/repositories/API/docs and policy gate `check:no-r2` if intentionally changing that decision |
| Frontend route | update `App.tsx`, Netlify SPA assumptions, relevant page docs/tests |
| CI command | update `package.json`, workflow and testing docs |

<a id="rag-change-matrix"></a>
## RAG Change Matrix

| Change | Rebuild/revalidate |
|---|---|
| Source batch content only | Step 1 -> Step 2 -> embeddings -> Retrieval v3 regression -> Pinecone upsert -> parity |
| Step 1 parser/normalization | rerun Step 1 and every downstream stage; first fix the current relocation caveat |
| Retrieval-document compiler | rerun Step 2, embeddings, offline regression, Pinecone upsert/parity |
| Embedding model/revision/dimension/Matryoshka recipe | regenerate all embeddings, create compatible Pinecone index, rerun all retrieval/parity tests |
| Retrieval weights/gates only | embeddings and Pinecone vectors stay valid; rerun retrieval regression/runtime tests |
| CrossEncoder model/revision | vectors stay valid; rerun retrieval regressions and latency checks |
| Pinecone batch size | no embedding rebuild; re-upsert only if remote contents need rebuilding |
| Pinecone metric/dimension | new compatible index and parity validation required |
| Pinecone namespace | upsert and validate target namespace |
| Runtime-only HTTP/CORS behavior | no corpus regeneration; run startup, `/health`, retrieval and CORS tests |
| Gemini model/prompt | no retrieval rebuild; run grounding/answer regression |
| Kiro animation mapping | no RAG rebuild; frontend tests/model diagnostics only |
| Browser RAG contract | update frontend + server/gateway + docs; keep secrets server-side |

<a id="hard-rule"></a>
## Hard Rule

Do not rerun the active 2,808-document embedding stage simply because a later retrieval rule changes. Embedding generation is expensive in time but not money, and the current matrix is already validated. Regenerate only when its upstream text or embedding contract changes.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG regeneration matrix](../../rag/docs/regeneration-matrix.md)
