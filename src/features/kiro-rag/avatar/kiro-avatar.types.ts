export type KiroAvatarState =
  | 'idle'
  | 'thinking'
  | 'retrieving'
  | 'answering'
  | 'success'
  | 'error';

export type KiroExpression =
  | 'neutral'
  | 'happy'
  | 'thinking'
  | 'focused'
  | 'confused'
  | 'surprised'
  | 'error';

export interface KiroPointPose {
  x: number;
  y: number;
}

export interface KiroTransformPose extends KiroPointPose {
  rotate: number;
  scale: number;
}

export interface KiroFacePose {
  gaze: KiroPointPose;
  leftEyeOpen: number;
  rightEyeOpen: number;
  leftBrowLift: number;
  rightBrowLift: number;
  leftBrowRotate: number;
  rightBrowRotate: number;
  mouthX: number;
  mouthY: number;
  mouthScaleX: number;
  mouthScaleY: number;
  mouthRotate: number;
}

export interface KiroLimbPose {
  upperRotate: number;
  lowerRotate: number;
}

export interface KiroPose {
  body: KiroTransformPose;
  head: KiroTransformPose;
  face: KiroFacePose;
  leftArm: KiroLimbPose;
  rightArm: KiroLimbPose;
  leftLeg: KiroLimbPose;
  rightLeg: KiroLimbPose;
  cape: KiroTransformPose;
  board: KiroTransformPose;
  leftThrust: number;
  rightThrust: number;
  arrowIntensity: number;
  arrowScale: number;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type KiroPoseOverride = DeepPartial<KiroPose>;

export interface KiroResolvedRig {
  state: KiroAvatarState;
  expression: KiroExpression;
  pose: KiroPose;
  talking: boolean;
}
