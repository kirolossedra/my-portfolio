# Kiro GLB model slot

Place the production character model in this folder with this exact filename:

```text
public/models/kiro/kiro.glb
```

Vite serves that file at:

```text
/models/kiro/kiro.glb
```

## What the runtime can use

The React/Three.js runtime inspects the GLB automatically. The best model contains:

- one skinned character mesh with a skeleton/armature;
- named head/neck/spine/arm/forearm/leg bones;
- separate eye bones or eye meshes when available;
- facial morph targets such as blink, smile and mouth-open;
- a board bone/object and separate left/right thruster objects when available;
- authored clips named with clear words such as `Idle`, `Thinking`, `Retrieving`, `Talking`, `Success`, `Error`.

The loader tolerates different naming conventions and resolves common aliases automatically. If a model uses unusual names, add aliases in `src/features/kiro-rag/model3d/kiro-model-contract.ts`.

## Important

Do not rename this file to encode versions. Keep the runtime path stable as `kiro.glb`; version the source model in the modelling project or Git history instead.

The web runtime does not alter the GLB. It only loads it, inspects its capabilities, plays authored clips, and adds bounded procedural controls on top.
