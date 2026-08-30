import { describe, expect, it } from 'vitest';
import { AnimationClip, Bone, Group } from 'three';
import {
  findClipByKeywords,
  findObjectByAliases,
  inspectKiroModel,
  normalizeRigName,
} from '../features/kiro-rag/model3d/kiro-model-inspector.ts';

function buildRig() {
  const root = new Group();
  root.name = 'KiroRoot';
  const head = new Bone();
  head.name = 'mixamorig:Head';
  root.add(head);
  const board = new Bone();
  board.name = 'Hover_Board';
  root.add(board);
  return root;
}

describe('Kiro GLB contract', () => {
  it('normalizes modeller naming conventions', () => {
    expect(normalizeRigName('mixamorig:Head')).toBe('mixamorighead');
    expect(normalizeRigName('Eye.L')).toBe('eyel');
  });

  it('resolves common bone aliases without requiring one exact rig naming scheme', () => {
    const rig = buildRig();
    expect(findObjectByAliases(rig, ['head', 'mixamorighead'])?.name).toBe('mixamorig:Head');
    expect(findObjectByAliases(rig, ['hoverboard', 'board'])?.name).toBe('Hover_Board');
  });

  it('maps authored clips to semantic behavior by clear names', () => {
    const clips = [new AnimationClip('Kiro_Idle', 1, []), new AnimationClip('Thinking_Loop', 1, [])];
    expect(findClipByKeywords(clips, ['idle'])?.name).toBe('Kiro_Idle');
    expect(findClipByKeywords(clips, ['think', 'thinking'])?.name).toBe('Thinking_Loop');
  });

  it('reports what the GLB can actually support', () => {
    const rig = buildRig();
    const clips = [new AnimationClip('Idle', 1, [])];
    const report = inspectKiroModel('/models/kiro/kiro.glb', rig, clips);
    expect(report.boneNames).toContain('mixamorig:Head');
    expect(report.resolvedBones.head).toBe('mixamorig:Head');
    expect(report.resolvedBones.board).toBe('Hover_Board');
    expect(report.stateClips.idle).toBe('Idle');
  });
});
