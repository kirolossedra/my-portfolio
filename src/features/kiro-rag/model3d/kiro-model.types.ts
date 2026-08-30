export type KiroAvatarState =
  | 'idle'
  | 'thinking'
  | 'retrieving'
  | 'answering'
  | 'success'
  | 'error';

export interface KiroBehaviorTarget {
  headYaw: number;
  headPitch: number;
  headRoll: number;
  gazeX: number;
  gazeY: number;
  smile: number;
  mouthOpen: number;
  blinkLeft: number;
  blinkRight: number;
  browLiftLeft: number;
  browLiftRight: number;
  bodyLean: number;
  boardPitch: number;
  boardRoll: number;
  leftThrust: number;
  rightThrust: number;
  hoverAmount: number;
}

export interface KiroModelCapabilities {
  modelUrl: string;
  objectNames: string[];
  boneNames: string[];
  animationNames: string[];
  morphTargetNames: string[];
  resolvedBones: Partial<Record<KiroBoneRole, string>>;
  resolvedMorphs: Partial<Record<KiroMorphRole, string[]>>;
  stateClips: Partial<Record<KiroAvatarState, string>>;
  warnings: string[];
}

export type KiroBoneRole =
  | 'head'
  | 'neck'
  | 'spine'
  | 'leftEye'
  | 'rightEye'
  | 'leftUpperArm'
  | 'leftForearm'
  | 'rightUpperArm'
  | 'rightForearm'
  | 'leftUpperLeg'
  | 'leftLowerLeg'
  | 'rightUpperLeg'
  | 'rightLowerLeg'
  | 'board'
  | 'leftThruster'
  | 'rightThruster';

export type KiroMorphRole =
  | 'blinkLeft'
  | 'blinkRight'
  | 'smile'
  | 'mouthOpen'
  | 'browUpLeft'
  | 'browUpRight';

export type KiroLoadState = 'loading' | 'ready' | 'missing' | 'error';
