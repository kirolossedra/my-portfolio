import { describe, expect, it } from 'vitest';
import { AnimationClip, Bone, Group } from 'three';
import {
  findClipByKeywords,
  findObjectByAliases,
  inspectKiroModel,
  normalizeRigName,
} from '../features/kiro-rag/model3d/kiro-model-inspector.ts';
import { KiroAnimationController } from '../features/kiro-rag/model3d/kiro-animation-controller.ts';

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

  it('does not resolve an unrelated bone when no alias matches', () => {
    const rig = buildRig();
    expect(findObjectByAliases(rig, ['leftEye', 'eyeleft'])).toBeUndefined();
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

  it('writes changing transforms to the rendered rig bones every frame', () => {
    const rig = new Group();
    const hips = new Bone(); hips.name = 'mixamorigHips'; rig.add(hips);
    const spine = new Bone(); spine.name = 'mixamorigSpine2'; hips.add(spine);
    const head = new Bone(); head.name = 'mixamorigHead'; spine.add(head);
    const leftArm = new Bone(); leftArm.name = 'mixamorigLeftArm'; spine.add(leftArm);
    const rightArm = new Bone(); rightArm.name = 'mixamorigRightArm'; spine.add(rightArm);
    const container = new Group(); container.add(rig);
    const controller = new KiroAnimationController({ modelUrl: '/kiro.fbx', root: rig, modelContainer: container, clips: [], random: () => 0.5 });
    const before = head.quaternion.clone();
    controller.update(1 / 60, 1);
    expect(head.quaternion.angleTo(before)).toBeGreaterThan(0.01);
    controller.setReducedMotion(true);
    const reducedBefore = head.quaternion.clone();
    controller.update(1 / 60, 2);
    expect(head.quaternion.angleTo(reducedBefore)).toBeGreaterThan(0.001);
    controller.dispose();
  });
});
