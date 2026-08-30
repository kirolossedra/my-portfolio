import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Bone,
  Box3,
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
  private readonly clips: readonly AnimationClip[];
  private readonly bones = new Map<KiroBoneRole, ObjectRestPose>();
  private readonly morphs = new Map<KiroMorphRole, MorphBinding[]>();
  private readonly clipByState = new Map<KiroAvatarState, AnimationClip>();
  private readonly baseContainerPosition: Vector3;
  private readonly modelHeight: number;
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

  constructor(options: KiroAnimationControllerOptions) {
    this.root = options.root;
    this.modelContainer = options.modelContainer;
    this.clips = options.clips;
    this.mixer = new AnimationMixer(this.root);
    this.baseContainerPosition = this.modelContainer.position.clone();
    this.modelHeight = Math.max(0.1, new Box3().setFromObject(this.root).getSize(new Vector3()).y);
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
      const clip = findClipByKeywords(this.clips, KIRO_STATE_CLIP_KEYWORDS[state]);
      if (clip) this.clipByState.set(state, clip);
    });

    this.capabilities = inspectKiroModel(options.modelUrl, this.root, this.clips);
    this.setState('idle', true);
  }

  setState(state: KiroAvatarState, immediate = false) {
    this.state = state;
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
    this.mixer.update(delta);

    for (const key of STATE_KEYS) {
      this.current[key] = this.reducedMotion
        ? this.target[key]
        : damp(this.current[key], this.target[key], 8.5, delta);
    }

    this.applyContainerMotion(elapsedSeconds);
    this.applyHeadAndGaze();
    this.applyBodyAndBoard();
    this.applyFace(elapsedSeconds);
    this.applyThrusters();
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

  private applyContainerMotion(elapsedSeconds: number) {
    const hover = this.reducedMotion ? 0 : Math.sin(elapsedSeconds * 1.45) * this.current.hoverAmount;
    this.modelContainer.position.copy(this.baseContainerPosition);
    this.modelContainer.position.y += hover * KIRO_LIMITS.hoverDistanceRatio * this.modelHeight;
  }

  private applyHeadAndGaze() {
    const head = this.bones.get('head') ?? this.bones.get('neck');
    if (head && !this.currentAction) {
      const delta = new Quaternion().setFromEuler(new Euler(
        this.current.headPitch * KIRO_LIMITS.headPitchRadians,
        this.current.headYaw * KIRO_LIMITS.headYawRadians,
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

  private applyBodyAndBoard() {
    if (this.currentAction) return;

    const spine = this.bones.get('spine');
    if (spine) {
      const delta = new Quaternion().setFromEuler(new Euler(
        0,
        0,
        this.current.bodyLean * KIRO_LIMITS.bodyLeanRadians,
      ));
      spine.object.quaternion.copy(spine.quaternion).multiply(delta);
    }

    const board = this.bones.get('board');
    if (board) {
      const delta = new Quaternion().setFromEuler(new Euler(
        this.current.boardPitch * KIRO_LIMITS.boardPitchRadians,
        0,
        this.current.boardRoll * KIRO_LIMITS.boardRollRadians,
      ));
      board.object.quaternion.copy(board.quaternion).multiply(delta);
    }
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

  private applyThrusters() {
    const min = KIRO_LIMITS.thrusterScaleMin;
    const max = KIRO_LIMITS.thrusterScaleMax;
    this.scaleThruster('leftThruster', min + (max - min) * this.current.leftThrust);
    this.scaleThruster('rightThruster', min + (max - min) * this.current.rightThrust);
  }

  private scaleThruster(role: 'leftThruster' | 'rightThruster', targetScale: number) {
    const binding = this.bones.get(role);
    if (!binding) return;
    const base = binding.scale;
    binding.object.scale.set(base.x, base.y * targetScale, base.z);
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
