export type KiroAvatarState =
  | 'idle'
  | 'thinking'
  | 'retrieving'
  | 'answering'
  | 'success'
  | 'error';

export interface KiroModelParameters {
  headYaw: number;
  headPitch: number;
  headTilt: number;
  gazeX: number;
  gazeY: number;
  eyeOpenL: number;
  eyeOpenR: number;
  browLiftL: number;
  browLiftR: number;
  browTiltL: number;
  browTiltR: number;
  mouthOpen: number;
  mouthSmile: number;
  bodyLean: number;
  bodyRise: number;
  crouch: number;
  pointEmphasis: number;
  rightArmEnergy: number;
  capeWind: number;
  boardPitch: number;
  boardRoll: number;
  thrustL: number;
  thrustR: number;
  arrowIntensity: number;
}

export type KiroParameterOverride = Partial<KiroModelParameters>;

export interface KiroGazeTarget {
  x: number;
  y: number;
}

export interface KiroResolvedModel {
  state: KiroAvatarState;
  target: KiroModelParameters;
  talking: boolean;
}
