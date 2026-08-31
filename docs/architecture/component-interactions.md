# Component Interactions

## Table of Contents

- [Interaction Matrix](#interaction-matrix)
- [Browser to Worker](#browser-to-worker)
- [Worker to D1](#worker-to-d1)
- [Browser to Kiro Model](#browser-to-kiro-model)
- [Python RAG Interactions](#python-rag-interactions)
- [Important Non-Interactions](#important-non-interactions)

<a id="interaction-matrix"></a>
## Interaction Matrix

| Caller | Callee | Data | Status |
|---|---|---|---|
| Browser timeline | Cloudflare Worker | published milestone queries | ACTIVE |
| Browser opinions | Worker | approved-opinion reads / pending submissions | ACTIVE |
| Browser admin | Worker auth/admin routes | OAuth exchange, session, CRUD | ACTIVE |
| Worker | D1 | SQL reads/writes | ACTIVE |
| Worker auth | GitHub OAuth | authorization-code identity lookup | ACTIVE |
| Netlify build | Vite | static frontend bundle | ACTIVE |
| GitHub Actions | Wrangler | D1 migrations + Worker deployment | ACTIVE |
| GitHub Actions | Netlify CLI | prebuilt `dist/` deployment | ACTIVE |
| Kiro page | Kiro GLB runtime | semantic avatar state / capabilities | ACTIVE |
| Kiro behavior probe | real RAG API | question | **NOT YET WIRED** |
| Python runtime | Pinecone | dense ANN query / vector fetch | ACTIVE in local runtime |
| Python runtime | Nomic | query embedding | ACTIVE |
| Python runtime | CrossEncoder | question/passage reranking | ACTIVE |
| Python runtime | Gemini 2.5 Flash-Lite | evidence packet | **SELECTED / NOT INTEGRATED** |
| Worker/gateway | Python RAG | public portfolio RAG calls | **PROPOSED** |

<a id="browser-to-worker"></a>
## Browser to Worker

Frontend data modules build HTTP requests against `VITE_API_BASE_URL`. The browser does not talk to D1 directly. Public routes can be read without an admin session; protected routes enforce the expected origin and signed session.

<a id="worker-to-d1"></a>
## Worker to D1

The Worker owns D1 access. Repository modules contain milestone/opinion persistence. Images are stored as Base64 in D1 but returned to public callers as binary image responses.

<a id="browser-to-kiro-model"></a>
## Browser to Kiro Model

Kiro interaction state is a semantic adapter, not raw bone manipulation. `KiroAvatarState` values are `idle`, `thinking`, `retrieving`, `answering`, `success`, and `error`. The model contract maps those states to bounded head/gaze/face/body/board/thruster targets and optionally to authored GLB animation clips discovered at runtime.

<a id="python-rag-interactions"></a>
## Python RAG Interactions

The runtime loads local `embedding-records.jsonl` and its manifest for text/provenance/BM25/metadata. It does **not** load `embeddings.npy`. Nomic embeds only the query. Pinecone returns dense candidates. BM25 and metadata produce additional candidates. Fusion/gates select a rerank pool; the pinned CrossEncoder scores question/passage pairs; final logic applies polarity handling, dedupe and repository diversity.

For semantic dedupe, the runtime fetches only required candidate vectors from Pinecone and computes exact dot-product similarity locally. This preserves the v3 dedupe behavior without keeping the full matrix resident.

<a id="important-non-interactions"></a>
## Important Non-Interactions

- Netlify does not own OAuth secrets.
- D1 does not store the RAG vector corpus.
- Pinecone does not replace BM25, evidence logic, CrossEncoder or provenance.
- Gemini is not currently in the runtime call graph.
- The current `/kiro-rag` query form does not call `/api/rag/retrieve`.
- The active Cloudflare Worker does not execute Python or import the RAG runtime.

## Related Documentation

- Parent: [../README.md](../README.md)
- [System overview](system-overview.md)
- [RAG interactions](../../rag/docs/component-interactions.md)
