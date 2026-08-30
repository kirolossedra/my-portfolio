import type {
  KiroAvatarState,
  KiroExpression,
  KiroPose,
  KiroPoseOverride,
  KiroResolvedRig,
} from './kiro-avatar.types.ts';

export const KIRO_CANVAS_SIZE = 1254;

export const KIRO_DEFAULT_POSE: KiroPose = {
  body: { x: 0, y: 0, rotate: 0, scale: 1 },
  head: { x: 0, y: 0, rotate: 0, scale: 1 },
  face: {
    gaze: { x: 0, y: 0 },
    leftEyeOpen: 1,
    rightEyeOpen: 1,
    leftBrowLift: 0,
    rightBrowLift: 0,
    leftBrowRotate: 0,
    rightBrowRotate: 0,
    mouthX: 0,
    mouthY: 0,
    mouthScaleX: 1,
    mouthScaleY: 1,
    mouthRotate: 0,
  },
  leftArm: { upperRotate: 0, lowerRotate: 0 },
  rightArm: { upperRotate: 0, lowerRotate: 0 },
  leftLeg: { upperRotate: 0, lowerRotate: 0 },
  rightLeg: { upperRotate: 0, lowerRotate: 0 },
  cape: { x: 0, y: 0, rotate: 0, scale: 1 },
  board: { x: 0, y: 0, rotate: 0, scale: 1 },
  leftThrust: 1,
  rightThrust: 1,
  arrowIntensity: 1,
  arrowScale: 1,
};

const EXPRESSION_POSES: Record<KiroExpression, KiroPoseOverride> = {
  neutral: {
    face: {
      gaze: { x: 0, y: 0 },
      leftEyeOpen: 1,
      rightEyeOpen: 1,
      leftBrowLift: 0,
      rightBrowLift: 0,
      leftBrowRotate: 0,
      rightBrowRotate: 0,
      mouthScaleX: 0.94,
      mouthScaleY: 0.72,
      mouthRotate: 0,
    },
  },
  happy: {
    face: {
      gaze: { x: 0.08, y: -0.05 },
      leftEyeOpen: 0.92,
      rightEyeOpen: 0.92,
      leftBrowLift: 2,
      rightBrowLift: 2,
      leftBrowRotate: -2,
      rightBrowRotate: 2,
      mouthScaleX: 1.08,
      mouthScaleY: 1.02,
      mouthY: -1,
    },
  },
  thinking: {
    face: {
      gaze: { x: 0.62, y: -0.7 },
      leftEyeOpen: 0.96,
      rightEyeOpen: 0.92,
      leftBrowLift: 5,
      rightBrowLift: -1,
      leftBrowRotate: -7,
      rightBrowRotate: 5,
      mouthScaleX: 0.72,
      mouthScaleY: 0.48,
      mouthX: -2,
      mouthY: 1,
      mouthRotate: -3,
    },
  },
  focused: {
    face: {
      gaze: { x: 0.15, y: 0.05 },
      leftEyeOpen: 0.88,
      rightEyeOpen: 0.88,
      leftBrowLift: -2,
      rightBrowLift: -2,
      leftBrowRotate: 5,
      rightBrowRotate: -5,
      mouthScaleX: 0.78,
      mouthScaleY: 0.42,
      mouthY: 2,
    },
  },
  confused: {
    face: {
      gaze: { x: -0.42, y: 0.18 },
      leftEyeOpen: 1,
      rightEyeOpen: 0.9,
      leftBrowLift: 5,
      rightBrowLift: -2,
      leftBrowRotate: -10,
      rightBrowRotate: -2,
      mouthScaleX: 0.78,
      mouthScaleY: -0.48,
      mouthX: 2,
      mouthY: 3,
      mouthRotate: 5,
    },
  },
  surprised: {
    face: {
      gaze: { x: 0, y: 0 },
      leftEyeOpen: 1.14,
      rightEyeOpen: 1.14,
      leftBrowLift: 8,
      rightBrowLift: 8,
      leftBrowRotate: -2,
      rightBrowRotate: 2,
      mouthScaleX: 0.58,
      mouthScaleY: 1.42,
      mouthY: 4,
    },
  },
  error: {
    face: {
      gaze: { x: 0.46, y: 0.55 },
      leftEyeOpen: 0.9,
      rightEyeOpen: 0.82,
      leftBrowLift: -4,
      rightBrowLift: 2,
      leftBrowRotate: 8,
      rightBrowRotate: -7,
      mouthScaleX: 0.82,
      mouthScaleY: -0.64,
      mouthX: 2,
      mouthY: 4,
      mouthRotate: 2,
    },
  },
};

interface StatePreset {
  expression: KiroExpression;
  talking?: boolean;
  pose: KiroPoseOverride;
}

const STATE_PRESETS: Record<KiroAvatarState, StatePreset> = {
  idle: {
    expression: 'neutral',
    pose: {
      head: { rotate: 0 },
      board: { rotate: 0 },
      leftThrust: 0.9,
      rightThrust: 0.9,
      arrowIntensity: 0.78,
    },
  },
  thinking: {
    expression: 'thinking',
    pose: {
      head: { x: -1, y: 1, rotate: -6 },
      rightArm: { upperRotate: -4, lowerRotate: 5 },
      cape: { rotate: -2 },
      board: { rotate: -1.4 },
      leftThrust: 0.92,
      rightThrust: 1.02,
      arrowIntensity: 1.2,
      arrowScale: 1.04,
    },
  },
  retrieving: {
    expression: 'focused',
    pose: {
      body: { y: -2, rotate: 1.2 },
      head: { y: 1, rotate: 2 },
      leftArm: { upperRotate: -3, lowerRotate: 2 },
      rightArm: { upperRotate: 4, lowerRotate: -3 },
      cape: { x: -3, rotate: -4, scale: 1.02 },
      board: { y: -2, rotate: -3.2 },
      leftThrust: 1.34,
      rightThrust: 1.38,
      arrowIntensity: 1.35,
      arrowScale: 1.06,
    },
  },
  answering: {
    expression: 'happy',
    talking: true,
    pose: {
      head: { rotate: 1.5 },
      leftArm: { upperRotate: -2, lowerRotate: 1 },
      rightArm: { upperRotate: -2, lowerRotate: 2 },
      board: { rotate: 0.8 },
      leftThrust: 1.04,
      rightThrust: 1.02,
      arrowIntensity: 1.04,
    },
  },
  success: {
    expression: 'happy',
    pose: {
      body: { y: -4, rotate: -1 },
      head: { y: -2, rotate: 4 },
      leftArm: { upperRotate: -7, lowerRotate: -4 },
      rightArm: { upperRotate: -9, lowerRotate: -7 },
      leftLeg: { upperRotate: -2, lowerRotate: 1 },
      rightLeg: { upperRotate: 2, lowerRotate: -1 },
      cape: { x: -3, rotate: -5, scale: 1.03 },
      board: { y: -3, rotate: 2.2 },
      leftThrust: 1.18,
      rightThrust: 1.2,
      arrowIntensity: 1.45,
      arrowScale: 1.1,
    },
  },
  error: {
    expression: 'error',
    pose: {
      head: { x: 2, y: 2, rotate: 7 },
      leftArm: { upperRotate: 5, lowerRotate: -4 },
      rightArm: { upperRotate: 6, lowerRotate: 7 },
      leftLeg: { upperRotate: -1, lowerRotate: 2 },
      rightLeg: { upperRotate: 2, lowerRotate: -3 },
      cape: { rotate: 3 },
      board: { x: 2, rotate: 4.5 },
      leftThrust: 0.58,
      rightThrust: 1.04,
      arrowIntensity: 0.7,
      arrowScale: 0.96,
    },
  },
};

function mergePose(base: KiroPose, override?: KiroPoseOverride): KiroPose {
  if (!override) return structuredClone(base);

  return {
    body: { ...base.body, ...override.body },
    head: { ...base.head, ...override.head },
    face: {
      ...base.face,
      ...override.face,
      gaze: { ...base.face.gaze, ...override.face?.gaze },
    },
    leftArm: { ...base.leftArm, ...override.leftArm },
    rightArm: { ...base.rightArm, ...override.rightArm },
    leftLeg: { ...base.leftLeg, ...override.leftLeg },
    rightLeg: { ...base.rightLeg, ...override.rightLeg },
    cape: { ...base.cape, ...override.cape },
    board: { ...base.board, ...override.board },
    leftThrust: override.leftThrust ?? base.leftThrust,
    rightThrust: override.rightThrust ?? base.rightThrust,
    arrowIntensity: override.arrowIntensity ?? base.arrowIntensity,
    arrowScale: override.arrowScale ?? base.arrowScale,
  };
}

export function clampKiroPose(pose: KiroPose): KiroPose {
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  return {
    ...pose,
    body: {
      x: clamp(pose.body.x, -18, 18),
      y: clamp(pose.body.y, -18, 18),
      rotate: clamp(pose.body.rotate, -10, 10),
      scale: clamp(pose.body.scale, 0.92, 1.08),
    },
    head: {
      x: clamp(pose.head.x, -20, 20),
      y: clamp(pose.head.y, -16, 16),
      rotate: clamp(pose.head.rotate, -16, 16),
      scale: clamp(pose.head.scale, 0.94, 1.06),
    },
    face: {
      ...pose.face,
      gaze: {
        x: clamp(pose.face.gaze.x, -1, 1),
        y: clamp(pose.face.gaze.y, -1, 1),
      },
      leftEyeOpen: clamp(pose.face.leftEyeOpen, 0.04, 1.2),
      rightEyeOpen: clamp(pose.face.rightEyeOpen, 0.04, 1.2),
      leftBrowLift: clamp(pose.face.leftBrowLift, -9, 10),
      rightBrowLift: clamp(pose.face.rightBrowLift, -9, 10),
      leftBrowRotate: clamp(pose.face.leftBrowRotate, -18, 18),
      rightBrowRotate: clamp(pose.face.rightBrowRotate, -18, 18),
      mouthX: clamp(pose.face.mouthX, -8, 8),
      mouthY: clamp(pose.face.mouthY, -8, 10),
      mouthScaleX: clamp(pose.face.mouthScaleX, 0.45, 1.3),
      mouthScaleY: clamp(pose.face.mouthScaleY, -1.1, 1.5),
      mouthRotate: clamp(pose.face.mouthRotate, -14, 14),
    },
    leftArm: {
      upperRotate: clamp(pose.leftArm.upperRotate, -18, 18),
      lowerRotate: clamp(pose.leftArm.lowerRotate, -22, 22),
    },
    rightArm: {
      upperRotate: clamp(pose.rightArm.upperRotate, -18, 18),
      lowerRotate: clamp(pose.rightArm.lowerRotate, -22, 22),
    },
    leftLeg: {
      upperRotate: clamp(pose.leftLeg.upperRotate, -10, 10),
      lowerRotate: clamp(pose.leftLeg.lowerRotate, -12, 12),
    },
    rightLeg: {
      upperRotate: clamp(pose.rightLeg.upperRotate, -10, 10),
      lowerRotate: clamp(pose.rightLeg.lowerRotate, -12, 12),
    },
    cape: {
      x: clamp(pose.cape.x, -14, 14),
      y: clamp(pose.cape.y, -10, 10),
      rotate: clamp(pose.cape.rotate, -12, 12),
      scale: clamp(pose.cape.scale, 0.94, 1.08),
    },
    board: {
      x: clamp(pose.board.x, -14, 14),
      y: clamp(pose.board.y, -14, 14),
      rotate: clamp(pose.board.rotate, -8, 8),
      scale: clamp(pose.board.scale, 0.96, 1.05),
    },
    leftThrust: clamp(pose.leftThrust, 0.35, 1.65),
    rightThrust: clamp(pose.rightThrust, 0.35, 1.65),
    arrowIntensity: clamp(pose.arrowIntensity, 0.2, 1.6),
    arrowScale: clamp(pose.arrowScale, 0.85, 1.18),
  };
}

export function resolveKiroRig(
  state: KiroAvatarState = 'idle',
  expression?: KiroExpression,
  override?: KiroPoseOverride,
  talking?: boolean,
): KiroResolvedRig {
  const statePreset = STATE_PRESETS[state];
  const resolvedExpression = expression ?? statePreset.expression;

  let pose = mergePose(KIRO_DEFAULT_POSE, statePreset.pose);
  pose = mergePose(pose, EXPRESSION_POSES[resolvedExpression]);
  pose = mergePose(pose, override);
  pose = clampKiroPose(pose);

  return {
    state,
    expression: resolvedExpression,
    pose,
    talking: talking ?? Boolean(statePreset.talking),
  };
}

export const KIRO_STATE_LABELS: Record<KiroAvatarState, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  retrieving: 'Retrieving',
  answering: 'Answering',
  success: 'Success',
  error: 'Error',
};
