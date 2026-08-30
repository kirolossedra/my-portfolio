import { describe, expect, it } from 'vitest';
import {
  KIRO_NEUTRAL_PARAMETERS,
  clampKiroParameters,
  resolveKiroModel,
} from '../features/kiro-rag/avatar/kiro-model.ts';

describe('Kiro deformation model', () => {
  it('maps semantic states to bounded continuous parameter targets', () => {
    const thinking = resolveKiroModel('thinking');
    const retrieving = resolveKiroModel('retrieving');

    expect(thinking.target.headTilt).toBeLessThan(0);
    expect(thinking.target.gazeX).toBeGreaterThan(0);
    expect(retrieving.target.bodyLean).toBeGreaterThan(0);
    expect(retrieving.target.thrustL).toBeGreaterThan(KIRO_NEUTRAL_PARAMETERS.thrustL);
    expect(retrieving.target.thrustR).toBeGreaterThan(KIRO_NEUTRAL_PARAMETERS.thrustR);
  });

  it('accepts continuous parameter overrides without exposing raw body-part rotations', () => {
    const model = resolveKiroModel('idle', {
      headYaw: 0.42,
      gazeX: -0.7,
      pointEmphasis: 0.55,
      boardPitch: -0.35,
      thrustL: 0.82,
      thrustR: 0.61,
    });

    expect(model.target.headYaw).toBe(0.42);
    expect(model.target.gazeX).toBe(-0.7);
    expect(model.target.pointEmphasis).toBe(0.55);
    expect(model.target.boardPitch).toBe(-0.35);
    expect(model.target.thrustL).toBe(0.82);
    expect(model.target.thrustR).toBe(0.61);
  });

  it('clamps values to the model envelope before rendering', () => {
    const clamped = clampKiroParameters({
      ...KIRO_NEUTRAL_PARAMETERS,
      headYaw: 20,
      gazeY: -20,
      mouthOpen: 7,
      thrustL: -4,
      thrustR: 9,
    });

    expect(clamped.headYaw).toBe(1);
    expect(clamped.gazeY).toBe(-1);
    expect(clamped.mouthOpen).toBe(1);
    expect(clamped.thrustL).toBe(0);
    expect(clamped.thrustR).toBe(1);
  });

  it('uses answering as the default talking state but still allows explicit control', () => {
    expect(resolveKiroModel('answering').talking).toBe(true);
    expect(resolveKiroModel('idle').talking).toBe(false);
    expect(resolveKiroModel('idle', undefined, true).talking).toBe(true);
  });
});
