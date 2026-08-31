# Kiro RAG Frontend and 3D Runtime

## Table of Contents

- [Status](#status)
- [Files](#files)
- [Semantic State Contract](#semantic-state-contract)
- [GLB Contract](#glb-contract)
- [Bounded Procedural Controls](#bounded-procedural-controls)
- [Current Interaction Demo](#current-interaction-demo)
- [Target API Adapter](#target-api-adapter)
- [Relationship to `rag/`](#relationship-to-rag)

<a id="status"></a>
## Status

**ACTIVE frontend scaffold; live retrieval integration is not yet wired.** The page exists at `/kiro-rag`, is linked from the main navigation, and renders a GLB-oriented 3D runtime. The behavior test deliberately simulates RAG lifecycle states with timers.

<a id="files"></a>
## Files

```text
src/kiro-rag-page.tsx
src/features/kiro-rag/kiro-interaction-demo.tsx
src/features/kiro-rag/kiro-rig-lab.tsx
src/features/kiro-rag/avatar/
src/features/kiro-rag/model3d/
```

`avatar/` contains earlier/procedural avatar helpers that remain part of the feature tree. `model3d/` is the GLB-first path and contains the active model contract, inspector, diagnostics, animation controller and React renderer.

<a id="semantic-state-contract"></a>
## Semantic State Contract

```text
idle
thinking
retrieving
answering
success
error
```

`KiroBehaviorTarget` exposes bounded semantic controls for head yaw/pitch/roll, gaze, smile, mouth opening, blinking, brows, body lean, board pitch/roll, left/right thrust and hover amount. Application state expresses intent; the controller decides safe transforms.

<a id="glb-contract"></a>
## GLB Contract

The expected asset is `/models/kiro/kiro.glb`. Runtime inspection discovers object names, bones, animation clips and morph targets and resolves common aliases for head/neck/spine/eyes/arms/legs/board/thrusters plus blink/smile/mouth/brow morphs.

State clip keywords map authored animation names to semantic states. For example, `thinking` accepts concepts such as think/ponder/curious; `retrieving` accepts retrieve/search/scan/fly; `answering` accepts talk/speak; success/error have their own semantic keyword sets.

<a id="bounded-procedural-controls"></a>
## Bounded Procedural Controls

The contract caps head/eye/body/board rotations, thruster scale and hover displacement. This is intentional: the GLB owns anatomy and the React layer adds only bounded procedural behavior. Missing capabilities are surfaced by diagnostics rather than fabricated.

<a id="current-interaction-demo"></a>
## Current Interaction Demo

The default example question is “What did you build that best demonstrates systems engineering?” On submit, local timers transition through thinking (~720 ms to retrieving), answering (~1.85 s), success (~3.9 s), then idle (~4.85 s). These timings demonstrate state behavior only; they are not retrieval latency targets and should disappear when the real request lifecycle is wired.

<a id="target-api-adapter"></a>
## Target API Adapter

Future integration should replace the timer sequence with an async request:

```text
submit -> thinking
request accepted/query analysis -> retrieving
retrieval evidence complete/generation starts -> answering
answer received -> success
network/retrieval/generation failure -> error
```

The browser must not receive Pinecone or Gemini credentials. It should call a server/gateway endpoint that returns a controlled answer/evidence schema.

<a id="relationship-to-rag"></a>
## Relationship to `rag/`

This directory is the **presentation/runtime-state side** of Kiro RAG. The corpus and retrieval engine live under [`../../../rag/`](../../../rag/README.md). Keeping these docs separate prevents a visual-model change from being mistaken for an embedding/retrieval change.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG system](../../../rag/README.md)
- [RAG runtime](../../../rag/runtime/README.md)
