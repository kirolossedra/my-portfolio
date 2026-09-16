# Kiro Mixamo model slot

The production character is served from:

```text
rag/3d-kiro/athletic+man+3d+model.fbx (canonical source)
public/models/kiro/kiro.fbx (generated build input)
```

Vite exposes it at:

```text
/models/kiro/kiro.fbx
```

## Required master asset

The validated production model lives at `rag/3d-kiro/athletic+man+3d+model.fbx`. `scripts/sync-kiro-model.mjs` copies it byte-for-byte to `public/models/kiro/kiro.fbx` before development and production builds.

The file should contain the character mesh, skinning and Mixamo skeleton. It is suitable for bounded runtime bone motion.

## Runtime behavior

`src/features/kiro-rag/model3d/kiro-glb-avatar.tsx` loads the production asset through Three.js `FBXLoader`.

`kiro-animation-controller.ts`:

- resolves common Mixamo bone names;
- lowers the base T-pose into a calm standing pose;
- adds subtle idle breathing;
- reacts to RAG retrieval state;
- gestures while answer tokens stream;
- provides short success/error reactions;
- honors reduced-motion preferences;
- can still prefer authored semantic clips when meaningful clips are added later.

## Facial animation

Do not assume lip sync from this asset. A proper facial blend-shape/viseme set must be verified before adding phoneme-driven mouth animation.
