import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Bone,
  Euler,
  Group,
  LoopOnce,
  LoopRepeat,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import {
  KIRO_BONE_ALIASES,
  KIRO_LIMITS,
  KIRO_MORPH_ALIASES,
  KIRO_STATE_CLIP_KEYWORDS,
  KIRO_STATE_TARGETS,
} from './kiro-model-contract.ts';
import {
  findClipByKeywords,
  findMorphBindings,
  findObjectByAliases,
  inspectKiroModel,
  type MorphBinding,
} from './kiro-model-inspector.ts';
import type {
  KiroAvatarState,
  KiroBehaviorTarget,
  KiroBoneRole,
  KiroModelCapabilities,
  KiroMorphRole,
} from './kiro-model.types.ts';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const damp = (current: number, target: number, lambda: number, delta: number) => (
  current + (target - current) * (1 - Math.exp(-lambda * delta))
);

const copyBehavior = (value: KiroBehaviorTarget): KiroBehaviorTarget => ({ ...value });
const STATE_KEYS = Object.keys(KIRO_STATE_TARGETS.idle) as (keyof KiroBehaviorTarget)[];

interface ObjectRestPose {
  object: Object3D;
  quaternion: Quaternion;
  scale: Vector3;
}

export interface KiroAnimationControllerOptions {
  modelUrl: string;
  root: Object3D;
  modelContainer: Group;
  clips: readonly AnimationClip[];
  reducedMotion?: boolean;
}

export class KiroAnimationController {
  readonly capabilities: KiroModelCapabilities;

  private readonly root: Object3D;
  private readonly modelContainer: Group;
  private readonly mixer: AnimationMixer;
  private readonly bones = new Map<KiroBoneRole, ObjectRestPose>();
  private readonly morphs = new Map<KiroMorphRole, MorphBinding[]>();
  private readonly clipByState = new Map<KiroAvatarState, AnimationClip>();
  private readonly baseContainerPosition: Vector3;
  private readonly current: KiroBehaviorTarget;

  private target: KiroBehaviorTarget;
  private currentAction?: AnimationAction;
  private state: KiroAvatarState = 'idle';
  private lookX = 0;
  private lookY = 0;
  private talking = false;
  private reducedMotion = false;
  private nextBlinkAt = 2.8;
  private blinkStartedAt = -1;
  private lastElapsed = 0;
  private stateChangedAt = 0;

  constructor(options: KiroAnimationControllerOptions) {
    this.root = options.root;
    this.modelContainer = options.modelContainer;
    this.mixer = new AnimationMixer(this.root);
    this.baseContainerPosition = this.modelContainer.position.clone();
    this.current = copyBehavior(KIRO_STATE_TARGETS.idle);
    this.target = copyBehavior(KIRO_STATE_TARGETS.idle);
    this.reducedMotion = Boolean(options.reducedMotion);

    (Object.keys(KIRO_BONE_ALIASES) as KiroBoneRole[]).forEach((role) => {
      const object = findObjectByAliases(this.root, KIRO_BONE_ALIASES[role]);
      if (!object) return;

      this.bones.set(role, {
        object,
        quaternion: object.quaternion.clone(),
        scale: object.scale.clone(),
      });
    });

    (Object.keys(KIRO_MORPH_ALIASES) as KiroMorphRole[]).forEach((role) => {
      const bindings = findMorphBindings(this.root, KIRO_MORPH_ALIASES[role]);
      if (bindings.length > 0) this.morphs.set(role, bindings);
    });

    (Object.keys(KIRO_STATE_CLIP_KEYWORDS) as KiroAvatarState[]).forEach((state) => {
      const clip = findClipByKeywords(options.clips, KIRO_STATE_CLIP_KEYWORDS[state]);
      if (clip && clip.duration > 0.15) this.clipByState.set(state, clip);
    });

    this.capabilities = inspectKiroModel(options.modelUrl, this.root, options.clips);
    this.setState('idle', true);
  }

  setState(state: KiroAvatarState, immediate = false) {
    if (state === this.state && !immediate) return;

    this.state = state;
    this.stateChangedAt = this.lastElapsed;
    this.target = copyBehavior(KIRO_STATE_TARGETS[state]);

    if (immediate) Object.assign(this.current, this.target);
    this.playStateClip(state, immediate ? 0 : 0.28);
  }

  setLook(x: number, y: number) {
    this.lookX = clamp(x, -1, 1);
    this.lookY = clamp(y, -1, 1);
  }

  setTalking(talking: boolean) {
    this.talking = talking;
  }

  setReducedMotion(reducedMotion: boolean) {
    this.reducedMotion = reducedMotion;
  }

  update(deltaSeconds: number, elapsedSeconds: number) {
    const delta = clamp(deltaSeconds, 0, 0.05);
    this.lastElapsed = elapsedSeconds;
    this.mixer.update(delta);

    for (const key of STATE_KEYS) {
      this.current[key] = this.reducedMotion
        ? this.target[key]
        : damp(this.current[key], this.target[key], 8.5, delta);
    }

    this.modelContainer.position.copy(this.baseContainerPosition);

    this.applyHeadAndGaze();
    this.applyBody();
    this.applyHumanMotion(elapsedSeconds);
    this.applyFace(elapsedSeconds);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
  }

  private playStateClip(state: KiroAvatarState, fadeSeconds: number) {
    const clip = this.clipByState.get(state);

    if (!clip) {
      if (this.currentAction) {
        this.currentAction.fadeOut(fadeSeconds || 0.1);
        this.currentAction = undefined;
      }
      return;
    }

    const nextAction = this.mixer.clipAction(clip);
    const oneShot = state === 'success' || state === 'error';

    nextAction.enabled = true;
    nextAction.clampWhenFinished = oneShot;
    nextAction.setLoop(oneShot ? LoopOnce : LoopRepeat, oneShot ? 1 : Infinity);
    nextAction.reset();
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);

    if (this.currentAction && this.currentAction !== nextAction) {
      this.currentAction.crossFadeTo(nextAction, Math.max(0.05, fadeSeconds), false);
    } else if (fadeSeconds > 0) {
      nextAction.fadeIn(fadeSeconds);
    }

    nextAction.play();
    this.currentAction = nextAction;
  }

  private applyHeadAndGaze() {
    if (this.currentAction) return;

    const head = this.bones.get('head') ?? this.bones.get('neck');
    const hasEyeBones = this.bones.has('leftEye') || this.bones.has('rightEye');

    if (head) {
      const pointerYaw = hasEyeBones ? 0 : this.lookX * 0.36;
      const pointerPitch = hasEyeBones ? 0 : -this.lookY * 0.24;

      const delta = new Quaternion().setFromEuler(new Euler(
        (this.current.headPitch + pointerPitch) * KIRO_LIMITS.headPitchRadians,
        (this.current.headYaw + pointerYaw) * KIRO_LIMITS.headYawRadians,
        this.current.headRoll * KIRO_LIMITS.headRollRadians,
        'XYZ',
      ));

      head.object.quaternion.copy(head.quaternion).multiply(delta);
    }

    const gazeX = clamp(this.current.gazeX + this.lookX * 0.45, -1, 1);
    const gazeY = clamp(this.current.gazeY + this.lookY * 0.35, -1, 1);

    (['leftEye', 'rightEye'] as const).forEach((role) => {
      const eye = this.bones.get(role);
      if (!eye) return;

      const delta = new Quaternion().setFromEuler(new Euler(
        -gazeY * KIRO_LIMITS.eyePitchRadians,
        gazeX * KIRO_LIMITS.eyeYawRadians,
        0,
        'XYZ',
      ));

      eye.object.quaternion.copy(eye.quaternion).multiply(delta);
    });
  }

  private applyBody() {
    if (this.currentAction) return;

    const spine = this.bones.get('spine');
    if (!spine) return;

    const delta = new Quaternion().setFromEuler(new Euler(
      0,
      0,
      this.current.bodyLean * KIRO_LIMITS.bodyLeanRadians,
    ));

    spine.object.quaternion.copy(spine.quaternion).multiply(delta);
  }

  private applyHumanMotion(elapsedSeconds: number) {
    if (this.currentAction) return;

    const motionScale = this.reducedMotion ? 0.12 : 1;
    const stateAge = Math.max(0, elapsedSeconds - this.stateChangedAt);

    this.applyBreathing(elapsedSeconds, motionScale);
    this.applyStateHeadMotion(elapsedSeconds, stateAge, motionScale);
    this.applyArmPose(elapsedSeconds, stateAge, motionScale);
  }

  private applyBreathing(elapsedSeconds: number, motionScale: number) {
    const spine = this.bones.get('spine');
    if (!spine) return;

    const breathing = Math.sin(elapsedSeconds * 1.55) * 0.018 * motionScale;
    const conversationalSway = this.state === 'answering'
      ? Math.sin(elapsedSeconds * 0.9) * 0.012 * motionScale
      : 0;

    const delta = new Quaternion().setFromEuler(new Euler(
      breathing,
      conversationalSway,
      0,
      'XYZ',
    ));

    spine.object.quaternion.multiply(delta);
  }

  private applyStateHeadMotion(elapsedSeconds: number, stateAge: number, motionScale: number) {
    const head = this.bones.get('head') ?? this.bones.get('neck');
    if (!head) return;

    let pitch = 0;
    let yaw = 0;
    let roll = 0;

    if (this.state === 'retrieving') {
      yaw = Math.sin(elapsedSeconds * 1.05) * 0.075;
      pitch = 0.018 + Math.sin(elapsedSeconds * 1.8) * 0.012;
    } else if (this.state === 'answering') {
      pitch = Math.sin(elapsedSeconds * 2.25) * 0.022;
      yaw = Math.sin(elapsedSeconds * 1.15) * 0.025;
    } else if (this.state === 'thinking') {
      yaw = 0.045 + Math.sin(elapsedSeconds * 0.85) * 0.018;
      roll = -0.025;
    } else if (this.state === 'success' && stateAge < 1.35) {
      const pulse = Math.sin(Math.min(1, stateAge / 1.35) * Math.PI);
      pitch = -pulse * 0.095;
    } else if (this.state === 'error' && stateAge < 1.4) {
      const envelope = Math.sin(Math.min(1, stateAge / 1.4) * Math.PI);
      yaw = Math.sin(stateAge * 9.5) * 0.075 * envelope;
      roll = 0.022 * envelope;
    }

    const delta = new Quaternion().setFromEuler(new Euler(
      pitch * motionScale,
      yaw * motionScale,
      roll * motionScale,
      'XYZ',
    ));

    head.object.quaternion.multiply(delta);
  }

  private applyArmPose(elapsedSeconds: number, stateAge: number, motionScale: number) {
    const leftSide = this.sideForBone('leftUpperArm', -1);
    const rightSide = this.sideForBone('rightUpperArm', 1);

    const baseUpper = (side: number) => new Vector3(side * 0.24, -0.965, 0.11).normalize();
    const baseFore = (side: number) => new Vector3(side * 0.08, -0.99, 0.12).normalize();

    let leftUpper = baseUpper(leftSide);
    let rightUpper = baseUpper(rightSide);
    let leftFore = baseFore(leftSide);
    let rightFore = baseFore(rightSide);

    if (!this.reducedMotion && this.state === 'answering') {
      const intro = Math.min(1, stateAge / 0.45);
      const exchange = 0.5 + 0.5 * Math.sin(elapsedSeconds * 1.35);
      const pulse = 0.5 + 0.5 * Math.sin(elapsedSeconds * 2.7);

      const leftGestureUpper = new Vector3(leftSide * 0.42, -0.5 + pulse * 0.12, 0.75).normalize();
      const rightGestureUpper = new Vector3(rightSide * 0.42, -0.5 + (1 - pulse) * 0.12, 0.75).normalize();
      const leftGestureFore = new Vector3(leftSide * 0.12, -0.04 + pulse * 0.1, 0.99).normalize();
      const rightGestureFore = new Vector3(rightSide * 0.12, -0.04 + (1 - pulse) * 0.1, 0.99).normalize();

      leftUpper = leftUpper.clone().lerp(leftGestureUpper, intro * (0.22 + exchange * 0.56)).normalize();
      rightUpper = rightUpper.clone().lerp(rightGestureUpper, intro * (0.22 + (1 - exchange) * 0.56)).normalize();
      leftFore = leftFore.clone().lerp(leftGestureFore, intro * (0.18 + exchange * 0.62)).normalize();
      rightFore = rightFore.clone().lerp(rightGestureFore, intro * (0.18 + (1 - exchange) * 0.62)).normalize();
    } else if (!this.reducedMotion && this.state === 'thinking') {
      const thinkingUpper = new Vector3(rightSide * 0.34, -0.48, 0.81).normalize();
      const thinkingFore = new Vector3(-rightSide * 0.18, 0.62, 0.76).normalize();

      const intro = Math.min(1, stateAge / 0.4);
      rightUpper = rightUpper.clone().lerp(thinkingUpper, intro * 0.5).normalize();
      rightFore = rightFore.clone().lerp(thinkingFore, intro * 0.64).normalize();
    } else if (!this.reducedMotion && this.state === 'success' && stateAge < 1.35) {
      const envelope = Math.sin(Math.min(1, stateAge / 1.35) * Math.PI);
      const leftOpenUpper = new Vector3(leftSide * 0.6, -0.5, 0.62).normalize();
      const rightOpenUpper = new Vector3(rightSide * 0.6, -0.5, 0.62).normalize();
      const leftOpenFore = new Vector3(leftSide * 0.34, -0.42, 0.84).normalize();
      const rightOpenFore = new Vector3(rightSide * 0.34, -0.42, 0.84).normalize();

      leftUpper = leftUpper.clone().lerp(leftOpenUpper, envelope * 0.58).normalize();
      rightUpper = rightUpper.clone().lerp(rightOpenUpper, envelope * 0.58).normalize();
      leftFore = leftFore.clone().lerp(leftOpenFore, envelope * 0.48).normalize();
      rightFore = rightFore.clone().lerp(rightOpenFore, envelope * 0.48).normalize();
    }

    const basePoseStrength = 0.9;
    const dynamicStrength = this.reducedMotion ? basePoseStrength : 0.96 * motionScale;

    this.poseBoneTowardChild('leftUpperArm', leftUpper, dynamicStrength);
    this.poseBoneTowardChild('rightUpperArm', rightUpper, dynamicStrength);

    this.root.updateMatrixWorld(true);

    this.poseBoneTowardChild('leftForearm', leftFore, dynamicStrength);
    this.poseBoneTowardChild('rightForearm', rightFore, dynamicStrength);
  }

  private sideForBone(role: 'leftUpperArm' | 'rightUpperArm', fallback: number) {
    const binding = this.bones.get(role);
    if (!binding) return fallback;

    const position = new Vector3();
    binding.object.getWorldPosition(position);

    if (Math.abs(position.x) < 0.0001) return fallback;
    return Math.sign(position.x);
  }

  private poseBoneTowardChild(role: KiroBoneRole, desiredWorldDirection: Vector3, strength: number) {
    const binding = this.bones.get(role);
    if (!binding) return;

    const child = binding.object.children.find((candidate) => candidate.type === 'Bone');
    const parent = binding.object.parent;

    if (!child || !parent || child.position.lengthSq() < 1e-8) return;

    this.root.updateMatrixWorld(true);

    const parentWorld = new Quaternion();
    parent.getWorldQuaternion(parentWorld);

    const restWorld = parentWorld.clone().multiply(binding.quaternion);
    const restDirection = child.position
      .clone()
      .normalize()
      .applyQuaternion(restWorld)
      .normalize();

    const desiredDirection = desiredWorldDirection.clone().normalize();
    const correction = new Quaternion().setFromUnitVectors(restDirection, desiredDirection);
    const desiredWorld = correction.multiply(restWorld);
    const desiredLocal = parentWorld.clone().invert().multiply(desiredWorld);

    binding.object.quaternion
      .copy(binding.quaternion)
      .slerp(desiredLocal, clamp(strength, 0, 1));
  }

  private applyFace(elapsedSeconds: number) {
    const blink = this.proceduralBlink(elapsedSeconds);
    const talkPulse = this.talking || this.state === 'answering'
      ? (0.12 + Math.max(0, Math.sin(elapsedSeconds * 10.5)) * 0.22)
      : 0;

    this.setMorph('blinkLeft', Math.max(this.current.blinkLeft, blink));
    this.setMorph('blinkRight', Math.max(this.current.blinkRight, blink));
    this.setMorph('smile', clamp(Math.max(0, this.current.smile), 0, 1));
    this.setMorph('mouthOpen', clamp(Math.max(this.current.mouthOpen, talkPulse), 0, 0.72));
    this.setMorph('browUpLeft', clamp(Math.max(0, this.current.browLiftLeft), 0, 1));
    this.setMorph('browUpRight', clamp(Math.max(0, this.current.browLiftRight), 0, 1));
  }

  private proceduralBlink(elapsedSeconds: number) {
    if (this.reducedMotion) return 0;

    if (this.blinkStartedAt < 0 && elapsedSeconds >= this.nextBlinkAt) {
      this.blinkStartedAt = elapsedSeconds;
    }

    if (this.blinkStartedAt < 0) return 0;

    const blinkTime = elapsedSeconds - this.blinkStartedAt;
    const duration = 0.16;

    if (blinkTime >= duration) {
      this.blinkStartedAt = -1;
      this.nextBlinkAt = elapsedSeconds + 3.4 + ((Math.sin(elapsedSeconds * 12.9898) + 1) * 1.15);
      return 0;
    }

    const phase = blinkTime / duration;
    return phase < 0.5 ? phase * 2 : (1 - phase) * 2;
  }

  private setMorph(role: KiroMorphRole, value: number) {
    const bindings = this.morphs.get(role);
    if (!bindings) return;

    for (const binding of bindings) {
      const mesh = binding.mesh as Mesh;
      if (!mesh.morphTargetInfluences) continue;
      mesh.morphTargetInfluences[binding.index] = clamp(value, 0, 1);
    }
  }
}

export function isBone(object: Object3D): object is Bone {
  return object.type === 'Bone';
}
