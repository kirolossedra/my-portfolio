# Kiro RAG Frontend and 3D Runtime

## Status

**ACTIVE live portfolio-agent frontend with a Mixamo-ready character presence.**

`/kiro-rag` uses the production `POST /api/rag/query/stream` endpoint. The 3D character is driven by the real chat lifecycle rather than timer-driven demo transitions.

## Active files

```text
src/kiro-rag-page.tsx
src/features/kiro-rag/kiro-chat.tsx
src/features/kiro-rag/kiro-chat.css
src/features/kiro-rag/rag-client.ts
src/features/kiro-rag/model3d/
rag/3d-kiro/athletic+man+3d+model.fbx
public/models/kiro/kiro.fbx (generated)
```

## Chat interaction model

The browser maintains visual chat history for the current session. The backend remains deliberately single-question grounded RAG, so each turn is retrieved and generated independently rather than pretending the model has cross-turn memory.

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

## Real lifecycle -> avatar motion

```text
question submitted
  -> retrieving
  -> attentive posture + bounded head scan

SSE context arrives after retrieval/reranking
  -> answering

visible token stream
  -> answering + conversational arm/head motion

SSE done
  -> success
  -> short completion nod/open gesture, then settles

network/provider failure
  -> error
  -> bounded head-shake reaction

user stop
  -> idle
```

No artificial delay is added to make the animation visible. RAG responsiveness remains the priority.

## Mixamo asset contract

The active production asset is:

```text
/models/kiro/kiro.fbx
```

Source location:

```text
rag/3d-kiro/athletic+man+3d+model.fbx
```

The validated skinned model is stored at `rag/3d-kiro/athletic+man+3d+model.fbx`. The build synchronizer generates `public/models/kiro/kiro.fbx`; the runtime uses the named skeleton through the existing alias resolver and can drive head, spine, upper-arm and forearm motion without letting the LLM directly manipulate arbitrary joints.

Additional Mixamo clips may be added as `rag/3d-kiro/animations/*.fbx`. Builds create a public manifest automatically; the runtime loads compatible clips, removes root-position tracks to keep the feet anchored, and adds them to the autonomous pool.

The component loads the generated production FBX through Three.js `FBXLoader`.

## Motion strategy

Avatar motion is autonomous and does not follow chat state. A randomized scheduler moves between breathing, weight shifts, gaze changes, stance changes and several expressive arm/torso sequences. Procedural transitions are eased; authored clips crossfade through Three.js `AnimationMixer`. Reduced-motion mode holds a quiet breathing stance.

The supplied base FBX is essentially a rigged master pose rather than a library of authored conversational clips. Therefore the active runtime now provides safe procedural movement:

- converts the T-pose arms into a calm standing pose;
- adds subtle breathing while idle;
- makes retrieval visually attentive without fake waiting;
- alternates bounded arm gestures during streamed answers;
- adds head motion and pointer-follow gaze;
- provides short success/error reactions;
- honors `prefers-reduced-motion`.

If authored Mixamo clips are added later, the animation controller still supports semantic clip lookup (`Idle`, `Talking`, `Thinking`, `Success`, and related names) and will prefer a meaningful authored clip over procedural body motion.

## Important limitation

The supplied model does not expose a verified facial blend-shape/viseme set. The current update therefore animates the **rigged body and head**, not phoneme-accurate lips. Lip sync should only be added after a model/export with suitable facial morph targets is available.

## Boundaries

- Chat lifecycle state controls animation semantics; the LLM does not command bones.
- Chat history is client-session presentation state, not server memory.
- Every question is independently grounded to the portfolio corpus.
- The browser calls only the portfolio Worker.
- Embeddings, Vectorize, D1, reranking and generation remain server-side.
- This avatar update does not require corpus or embedding regeneration.

## Related documentation

- [Production RAG architecture](../../../docs/rag/production-architecture.md)
- [RAG system](../../../rag/README.md)
- [Worker RAG runtime](../../../worker/RAG-RUNTIME.md)
