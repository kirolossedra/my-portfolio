import type { AnimationClip, Mesh, Object3D } from 'three';
import {
  KIRO_BONE_ALIASES,
  KIRO_MORPH_ALIASES,
  KIRO_STATE_CLIP_KEYWORDS,
} from './kiro-model-contract.ts';
import type {
  KiroAvatarState,
  KiroBoneRole,
  KiroModelCapabilities,
  KiroMorphRole,
} from './kiro-model.types.ts';

export const normalizeRigName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function aliasScore(name: string, aliases: readonly string[]) {
  const normalized = normalizeRigName(name);
  let best = 0;
  for (const alias of aliases) {
    const candidate = normalizeRigName(alias);
    if (normalized === candidate) best = Math.max(best, 100);
    else if (normalized.endsWith(candidate) || normalized.startsWith(candidate)) best = Math.max(best, 80);
    else if (normalized.includes(candidate)) best = Math.max(best, 60);
  }
  return best;
}

export function findObjectByAliases(root: Object3D, aliases: readonly string[]): Object3D | undefined {
  let winner: Object3D | undefined;
  let winnerScore = 0;
  root.traverse((object) => {
    if (!object.name) return;
    const score = aliasScore(object.name, aliases) + (object.type === 'Bone' ? 4 : 0);
    if (score > winnerScore) {
      winner = object;
      winnerScore = score;
    }
  });
  return winner;
}

export function findClipByKeywords(clips: readonly AnimationClip[], keywords: readonly string[]) {
  let winner: AnimationClip | undefined;
  let winnerScore = 0;
  for (const clip of clips) {
    const score = aliasScore(clip.name, keywords);
    if (score > winnerScore) {
      winner = clip;
      winnerScore = score;
    }
  }
  return winner;
}

export interface MorphBinding {
  mesh: Mesh;
  index: number;
  name: string;
}

export function findMorphBindings(root: Object3D, aliases: readonly string[]): MorphBinding[] {
  const exact: MorphBinding[] = [];
  const fuzzy: MorphBinding[] = [];

  root.traverse((object) => {
    const mesh = object as Mesh;
    const dictionary = mesh.morphTargetDictionary;
    if (!dictionary) return;
    for (const [name, index] of Object.entries(dictionary)) {
      const score = aliasScore(name, aliases);
      if (score >= 100) exact.push({ mesh, index, name });
      else if (score > 0) fuzzy.push({ mesh, index, name });
    }
  });

  return exact.length > 0 ? exact : fuzzy;
}

export function inspectKiroModel(
  modelUrl: string,
  root: Object3D,
  clips: readonly AnimationClip[],
): KiroModelCapabilities {
  const objectNames: string[] = [];
  const boneNames: string[] = [];
  const morphTargetNames = new Set<string>();

  root.traverse((object) => {
    if (object.name) objectNames.push(object.name);
    if (object.type === 'Bone' && object.name) boneNames.push(object.name);
    const mesh = object as Mesh;
    if (mesh.morphTargetDictionary) {
      Object.keys(mesh.morphTargetDictionary).forEach((name) => morphTargetNames.add(name));
    }
  });

  const resolvedBones: Partial<Record<KiroBoneRole, string>> = {};
  (Object.keys(KIRO_BONE_ALIASES) as KiroBoneRole[]).forEach((role) => {
    const object = findObjectByAliases(root, KIRO_BONE_ALIASES[role]);
    if (object) resolvedBones[role] = object.name;
  });

  const resolvedMorphs: Partial<Record<KiroMorphRole, string[]>> = {};
  (Object.keys(KIRO_MORPH_ALIASES) as KiroMorphRole[]).forEach((role) => {
    const names = findMorphBindings(root, KIRO_MORPH_ALIASES[role]).map((binding) => binding.name);
    if (names.length > 0) resolvedMorphs[role] = [...new Set(names)];
  });

  const stateClips: Partial<Record<KiroAvatarState, string>> = {};
  (Object.keys(KIRO_STATE_CLIP_KEYWORDS) as KiroAvatarState[]).forEach((state) => {
    const clip = findClipByKeywords(clips, KIRO_STATE_CLIP_KEYWORDS[state]);
    if (clip) stateClips[state] = clip.name;
  });

  const warnings: string[] = [];
  if (boneNames.length === 0) warnings.push('No skeleton bones were detected. Body animation will be limited to authored object animation clips.');
  if (!resolvedBones.head && !resolvedBones.neck) warnings.push('No head or neck bone alias matched. Procedural head/gaze control will stay disabled.');
  if (morphTargetNames.size === 0) warnings.push('No facial morph targets were detected. Expressions will depend on authored animation clips.');
  if (clips.length === 0) warnings.push('No authored animation clips were detected. The controller will use only safe procedural motion supported by the rig.');

  return {
    modelUrl,
    objectNames: [...new Set(objectNames)].sort(),
    boneNames: [...new Set(boneNames)].sort(),
    animationNames: clips.map((clip) => clip.name),
    morphTargetNames: [...morphTargetNames].sort(),
    resolvedBones,
    resolvedMorphs,
    stateClips,
    warnings,
  };
}
