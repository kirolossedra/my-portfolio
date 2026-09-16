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

Optional authored motion clips live in `rag/3d-kiro/animations/*.fbx`. The same synchronizer copies them into the generated public asset directory and writes `animations.json`, which the browser uses to discover clips.

The file should contain the character mesh, skinning and Mixamo skeleton. It is suitable for bounded runtime bone motion.

## Runtime behavior

`src/features/kiro-rag/model3d/kiro-glb-avatar.tsx` loads the production asset through Three.js `FBXLoader`.

`kiro-animation-controller.ts`:

- runs independently from chat state,
- randomly alternates calm full-body motion and expressive gestures,
- prevents immediate repetition and forces an expressive gesture after two calm sequences,
- uses eased procedural transitions and crossfades authored Mixamo clips,
- substantially reduces autonomous motion for `prefers-reduced-motion`.

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
