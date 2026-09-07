# Kiro Mixamo model slot

The production character is served from:

```text
public/models/kiro/kiro.fbx
```

Vite exposes it at:

```text
/models/kiro/kiro.fbx
```

## Required master asset

Place the validated Mixamo-rigged FBX at `public/models/kiro/kiro.fbx`. Keep this runtime filename stable. Version source assets through Git history rather than changing the browser URL.

The file should contain the character mesh, skinning and Mixamo skeleton. It is suitable for bounded runtime bone motion.

## Runtime behavior

`src/features/kiro-rag/model3d/kiro-glb-avatar.tsx` retains its historical filename for import compatibility, but now loads the production asset through Three.js `FBXLoader`.

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
