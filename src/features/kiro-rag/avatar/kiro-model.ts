import type {
  KiroAvatarState,
  KiroModelParameters,
  KiroParameterOverride,
  KiroResolvedModel,
} from './kiro-avatar.types.ts';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const KIRO_NEUTRAL_PARAMETERS: KiroModelParameters = {
  headYaw: 0,
  headPitch: 0,
  headTilt: 0,
  gazeX: 0,
  gazeY: 0,
  eyeOpenL: 1,
  eyeOpenR: 1,
  browLiftL: 0,
  browLiftR: 0,
  browTiltL: 0,
  browTiltR: 0,
  mouthOpen: 0,
  mouthSmile: 0.15,
  bodyLean: 0,
  bodyRise: 0,
  crouch: 0,
  pointEmphasis: 0,
  rightArmEnergy: 0,
  capeWind: 0.12,
  boardPitch: 0,
  boardRoll: 0,
  thrustL: 0.48,
  thrustR: 0.48,
  arrowIntensity: 0.5,
};

const STATE_TARGETS: Record<KiroAvatarState, KiroParameterOverride> = {
  idle: {},
  thinking: {
    headYaw: 0.16,
    headPitch: -0.1,
    headTilt: -0.18,
    gazeX: 0.52,
    gazeY: -0.42,
    browLiftL: 0.08,
    browLiftR: 0.32,
    browTiltL: -0.08,
    browTiltR: 0.18,
    mouthSmile: 0.02,
    bodyLean: -0.03,
    capeWind: 0.18,
    arrowIntensity: 0.78,
  },
  retrieving: {
    headYaw: 0.02,
    headPitch: 0.08,
    gazeX: 0.02,
    gazeY: -0.05,
    browLiftL: -0.08,
    browLiftR: -0.08,
    browTiltL: -0.08,
    browTiltR: 0.08,
    mouthSmile: 0.04,
    bodyLean: 0.18,
    bodyRise: -0.04,
    capeWind: 0.52,
    boardPitch: -0.14,
    thrustL: 0.78,
    thrustR: 0.78,
    arrowIntensity: 0.95,
  },
  answering: {
    headYaw: -0.04,
    headPitch: 0.02,
    gazeX: 0.12,
    gazeY: 0.02,
    browLiftL: 0.06,
    browLiftR: 0.06,
    mouthSmile: 0.2,
    bodyLean: 0.03,
    pointEmphasis: 0.1,
    capeWind: 0.22,
    thrustL: 0.54,
    thrustR: 0.54,
    arrowIntensity: 0.63,
  },
  success: {
    headPitch: -0.03,
    headTilt: -0.05,
    gazeY: -0.05,
    eyeOpenL: 0.94,
    eyeOpenR: 0.94,
    browLiftL: 0.16,
    browLiftR: 0.16,
    mouthSmile: 0.58,
    bodyRise: -0.08,
    pointEmphasis: 0.12,
    capeWind: 0.3,
    thrustL: 0.6,
    thrustR: 0.6,
    arrowIntensity: 1,
  },
  error: {
    headYaw: -0.08,
    headPitch: 0.11,
    headTilt: 0.14,
    gazeX: -0.18,
    gazeY: 0.28,
    browLiftL: -0.12,
    browLiftR: 0.05,
    browTiltL: 0.18,
    browTiltR: -0.12,
    mouthSmile: -0.26,
    bodyLean: -0.04,
    capeWind: 0.08,
    thrustL: 0.38,
    thrustR: 0.42,
    arrowIntensity: 0.36,
  },
};

const PARAMETER_LIMITS: Record<keyof KiroModelParameters, readonly [number, number]> = {
  headYaw: [-1, 1],
  headPitch: [-1, 1],
  headTilt: [-1, 1],
  gazeX: [-1, 1],
  gazeY: [-1, 1],
  eyeOpenL: [0, 1.08],
  eyeOpenR: [0, 1.08],
  browLiftL: [-1, 1],
  browLiftR: [-1, 1],
  browTiltL: [-1, 1],
  browTiltR: [-1, 1],
  mouthOpen: [0, 1],
  mouthSmile: [-1, 1],
  bodyLean: [-1, 1],
  bodyRise: [-1, 1],
  crouch: [-1, 1],
  pointEmphasis: [-1, 1],
  rightArmEnergy: [-1, 1],
  capeWind: [-1, 1],
  boardPitch: [-1, 1],
  boardRoll: [-1, 1],
  thrustL: [0, 1],
  thrustR: [0, 1],
  arrowIntensity: [0, 1],
};

export const KIRO_PARAMETER_KEYS = Object.keys(KIRO_NEUTRAL_PARAMETERS) as (keyof KiroModelParameters)[];

export function clampKiroParameters(parameters: KiroModelParameters): KiroModelParameters {
  const output = { ...parameters };
  for (const key of KIRO_PARAMETER_KEYS) {
    const [min, max] = PARAMETER_LIMITS[key];
    output[key] = clamp(output[key], min, max);
  }
  return output;
}

export function resolveKiroModel(
  state: KiroAvatarState = 'idle',
  override?: KiroParameterOverride,
  talking = state === 'answering',
): KiroResolvedModel {
  return {
    state,
    target: clampKiroParameters({
      ...KIRO_NEUTRAL_PARAMETERS,
      ...STATE_TARGETS[state],
      ...override,
    }),
    talking,
  };
}

export const KIRO_STATE_LABELS: Record<KiroAvatarState, string> = {
  idle: 'Ready',
  thinking: 'Thinking',
  retrieving: 'Searching the portfolio',
  answering: 'Explaining',
  success: 'Complete',
  error: 'Needs attention',
};
