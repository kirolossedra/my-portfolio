import { describe, expect, it } from 'vitest';
import { resolveKiroRig } from '../features/kiro-rag/avatar/kiro-rig.ts';

describe('Kiro articulated rig', () => {
  it('maps semantic states to repeatable pose presets', () => {
    const thinking = resolveKiroRig('thinking');
    const retrieving = resolveKiroRig('retrieving');

    expect(thinking.expression).toBe('thinking');
    expect(thinking.pose.head.rotate).toBeLessThan(0);
    expect(retrieving.expression).toBe('focused');
    expect(retrieving.pose.leftThrust).toBeGreaterThan(1);
    expect(retrieving.pose.rightThrust).toBeGreaterThan(1);
  });

  it('accepts continuous user pose overrides on top of a semantic state', () => {
    const rig = resolveKiroRig('idle', undefined, {
      face: { gaze: { x: 0.72, y: -0.4 } },
      leftArm: { upperRotate: 11, lowerRotate: -7 },
      board: { rotate: 5.5 },
      leftThrust: 1.42,
      rightThrust: 0.63,
    });

    expect(rig.pose.face.gaze).toEqual({ x: 0.72, y: -0.4 });
    expect(rig.pose.leftArm).toEqual({ upperRotate: 11, lowerRotate: -7 });
    expect(rig.pose.board.rotate).toBe(5.5);
    expect(rig.pose.leftThrust).toBe(1.42);
    expect(rig.pose.rightThrust).toBe(0.63);
  });

  it('clamps unsafe pose ranges so cutout joints do not tear apart', () => {
    const rig = resolveKiroRig('idle', 'surprised', {
      head: { rotate: 999 },
      face: { gaze: { x: -9, y: 9 } },
      leftArm: { upperRotate: -999 },
      rightThrust: 99,
    });

    expect(rig.pose.head.rotate).toBe(16);
    expect(rig.pose.face.gaze).toEqual({ x: -1, y: 1 });
    expect(rig.pose.leftArm.upperRotate).toBe(-18);
    expect(rig.pose.rightThrust).toBe(1.65);
  });

  it('enables mouth motion for answering without forcing it on custom states', () => {
    expect(resolveKiroRig('answering').talking).toBe(true);
    expect(resolveKiroRig('idle').talking).toBe(false);
    expect(resolveKiroRig('idle', undefined, undefined, true).talking).toBe(true);
  });
});
