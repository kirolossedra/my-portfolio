# Kiro RAG Frontend and 3D Runtime

## Status

**ACTIVE live portfolio-agent frontend.** `/kiro-rag` now uses the production `POST /api/rag/query/stream` endpoint rather than timer-driven demo transitions.

The page is intentionally chat-shaped while preserving the existing GLB avatar as the agent presence layer.

## Active files

```text
src/kiro-rag-page.tsx
src/features/kiro-rag/kiro-chat.tsx
src/features/kiro-rag/kiro-chat.css
src/features/kiro-rag/rag-client.ts
src/features/kiro-rag/model3d/
```

Earlier rig/demo helpers remain in the feature tree for development history, but they are no longer the default `/kiro-rag` interaction surface.

## Chat interaction model

The browser maintains visual chat history for the current session. The production backend remains deliberately single-question grounded RAG, so each turn is retrieved and generated independently rather than pretending the model has cross-turn memory.

Modern agent-style interaction behaviors include:

- streaming token output over Server-Sent Events;
- a persistent bottom composer;
- Enter-to-send and Shift+Enter newline behavior;
- stop generation through `AbortController`;
- retry/regenerate after error or cancellation;
- suggested starter questions;
- source/citation drawers;
- a collapsible retrieval activity trace;
- auto-follow while the reader remains near the bottom;
- responsive desktop/mobile layouts;
- reduced-motion handling.

## Real lifecycle → avatar state

```text
question submitted
  -> retrieving

SSE context arrives after retrieval/reranking
  -> answering

visible token stream
  -> answering + talking

SSE done
  -> success

network/provider failure
  -> error

user stop
  -> idle
```

No artificial lifecycle timers are used by the active chat.

## Streaming contract

`rag-client.ts` calls:

```text
POST /api/rag/query/stream
```

and consumes normalized events:

- `context`: citations, retrieval counts, model identities;
- `token`: visible answer text delta;
- `done`: cited evidence labels and grounding warning;
- `error`: stream failure.

The parser handles SSE frame boundaries across arbitrary network chunks. It never receives Cloudflare credentials or direct Vectorize/D1 access.

## Citation UX

Inline `[E#]` references in generated text become source jump links. Each turn exposes the selected evidence metadata returned by the backend, including repository identity, evidence type/level and source-analysis line provenance.

The UI distinguishes evidence the generator actually cited from additional evidence that was considered but filtered out during answer synthesis.

## GLB contract

The expected asset remains:

```text
/models/kiro/kiro.glb
```

`KiroGlbAvatar` still owns runtime GLB loading, capability inspection and bounded semantic animation. The chat only supplies semantic lifecycle state; it does not manipulate arbitrary bones or morphs directly.

## Boundaries

- Chat history is client-session presentation state, not server memory.
- Every question is independently grounded to the portfolio corpus.
- The browser calls only the portfolio Worker.
- Embeddings, Vectorize, D1, reranking and generation remain server-side.
- Frontend changes do not require corpus or embedding regeneration.

## Related documentation

- [Production RAG architecture](../../../docs/rag/production-architecture.md)
- [RAG system](../../../rag/README.md)
- [Worker RAG runtime](../../../worker/RAG-RUNTIME.md)
