import { AnimationAction, AnimationClip, AnimationMixer, Bone, Euler, Group, LoopOnce, Mesh, Object3D, Quaternion } from 'three';
import { KIRO_BONE_ALIASES, KIRO_MORPH_ALIASES } from './kiro-model-contract.ts';
import { findMorphBindings, findObjectByAliases, inspectKiroModel, type MorphBinding } from './kiro-model-inspector.ts';
import type { KiroBoneRole, KiroModelCapabilities, KiroMorphRole } from './kiro-model.types.ts';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smoothstep = (value: number) => { const x = clamp(value, 0, 1); return x * x * (3 - (2 * x)); };
type Vec3 = [number, number, number];
type MotionKind = 'calm' | 'gesture';
interface MotionPose { head: Vec3; spine: Vec3; hips: Vec3; leftUpper: Vec3; rightUpper: Vec3; leftFore: Vec3; rightFore: Vec3; leftLeg: Vec3; rightLeg: Vec3 }
interface ProceduralMotion { name: string; kind: MotionKind; duration: [number, number]; pose: MotionPose; pulse?: Partial<MotionPose>; pulseRate?: number }
interface ObjectRestPose { object: Object3D; quaternion: Quaternion }

const Z = (): Vec3 => [0, 0, 0];
const pose = (values: Partial<MotionPose>): MotionPose => ({ head: Z(), spine: Z(), hips: Z(), leftUpper: Z(), rightUpper: Z(), leftFore: Z(), rightFore: Z(), leftLeg: Z(), rightLeg: Z(), ...values });

const MOTIONS: readonly ProceduralMotion[] = [
  { name: 'relaxed-breathing', kind: 'calm', duration: [5.5, 9], pose: pose({ head: [-.025, -.05, .018], spine: [.018, .025, -.018], hips: [0, -.015, .025], leftUpper: [0, 0, -.05], rightUpper: [0, 0, .05] }), pulse: { spine: [.032, 0, 0], head: [-.012, 0, 0], leftUpper: [.012, 0, 0], rightUpper: [.012, 0, 0] }, pulseRate: 1.45 },
  { name: 'weight-shift-left', kind: 'calm', duration: [4.2, 7.2], pose: pose({ head: [.015, .08, -.035], spine: [.01, -.045, .045], hips: [0, .035, -.075], leftUpper: [.02, 0, -.09], rightUpper: [-.015, .02, .04], leftLeg: [0, 0, .035], rightLeg: [0, 0, -.022] }), pulse: { head: [0, .04, 0], spine: [.018, 0, 0] }, pulseRate: .72 },
  { name: 'look-around', kind: 'calm', duration: [3.8, 6.4], pose: pose({ head: [-.025, -.2, .035], spine: [.005, -.065, .012], hips: [0, .018, -.018], leftUpper: [0, 0, -.035], rightUpper: [0, 0, .035] }), pulse: { head: [.025, .3, -.025], spine: [0, .055, 0] }, pulseRate: .52 },
  { name: 'confident-stance', kind: 'calm', duration: [5, 8], pose: pose({ head: [-.055, .08, -.018], spine: [-.035, .025, 0], hips: [.015, -.025, .04], leftUpper: [-.035, -.025, -.1], rightUpper: [-.035, .025, .1], leftFore: [-.08, 0, -.05], rightFore: [-.08, 0, .05], leftLeg: [0, 0, -.025], rightLeg: [0, 0, .025] }), pulse: { spine: [.022, 0, 0], head: [.01, .025, 0] }, pulseRate: 1.3 },
  { name: 'open-hand-explain', kind: 'gesture', duration: [2.5, 4], pose: pose({ head: [-.035, -.08, .025], spine: [.035, -.04, .02], hips: [0, .02, -.025], leftUpper: [-.2, .12, -.42], rightUpper: [-.24, -.08, .38], leftFore: [-.18, .08, -.55], rightFore: [-.3, -.05, .48] }), pulse: { head: [.035, .08, 0], leftFore: [0, .15, -.12], rightFore: [0, -.15, .12] }, pulseRate: 1.7 },
  { name: 'one-hand-emphasis', kind: 'gesture', duration: [2.1, 3.4], pose: pose({ head: [-.045, .1, -.025], spine: [.035, .055, -.025], hips: [0, -.025, .025], leftUpper: [0, 0, -.04], rightUpper: [-.28, -.14, .5], rightFore: [-.42, -.12, .62] }), pulse: { head: [.07, 0, 0], rightUpper: [-.08, 0, .08], rightFore: [-.12, 0, .12] }, pulseRate: 2.1 },
  { name: 'broad-welcome', kind: 'gesture', duration: [2.6, 4.2], pose: pose({ head: [-.06, 0, 0], spine: [-.025, 0, 0], hips: [.015, 0, 0], leftUpper: [-.16, .08, -.62], rightUpper: [-.16, -.08, .62], leftFore: [-.12, .05, -.32], rightFore: [-.12, -.05, .32] }), pulse: { spine: [.035, 0, 0], leftUpper: [0, 0, -.08], rightUpper: [0, 0, .08] }, pulseRate: 1.25 },
  { name: 'thoughtful-chin', kind: 'gesture', duration: [2.8, 4.5], pose: pose({ head: [.035, -.12, .055], spine: [.025, -.035, .025], hips: [0, .02, -.02], rightUpper: [-.18, -.12, .34], rightFore: [-.68, -.18, .58], leftUpper: [0, 0, -.06] }), pulse: { head: [.018, .08, 0], rightFore: [-.04, .05, 0] }, pulseRate: .9 },
];
const RELAXED = MOTIONS[0]!;
const POSE_KEYS = Object.keys(pose({})) as (keyof MotionPose)[];

export interface KiroAnimationControllerOptions { modelUrl: string; root: Object3D; modelContainer: Group; clips: readonly AnimationClip[]; reducedMotion?: boolean; random?: () => number }

export class KiroAnimationController {
  readonly capabilities: KiroModelCapabilities;
  private readonly root: Object3D;
  private readonly modelContainer: Group;
  private readonly mixer: AnimationMixer;
  private readonly bones = new Map<KiroBoneRole, ObjectRestPose>();
  private readonly morphs = new Map<KiroMorphRole, MorphBinding[]>();
  private readonly authoredClips: AnimationClip[];
  private readonly random: () => number;
  private readonly currentPose = pose({});
  private readonly startPose = pose({});
  private readonly targetPose = pose({});
  private currentMotion = RELAXED;
  private currentAction?: AnimationAction;
  private currentName = '';
  private motionStartedAt = 0;
  private motionEndsAt = 0;
  private transitionEndsAt = 0;
  private preferCalm = false;
  private calmStreak = 0;
  private reducedMotion = false;
  private lookX = 0;
  private lookY = 0;
  private nextBlinkAt = 2.4;
  private blinkStartedAt = -1;

  constructor(options: KiroAnimationControllerOptions) {
    this.root = options.root; this.modelContainer = options.modelContainer; this.mixer = new AnimationMixer(this.root);
    this.reducedMotion = Boolean(options.reducedMotion); this.random = options.random ?? Math.random;
    this.authoredClips = options.clips.filter((clip) => clip.duration >= .4 && clip.tracks.length > 0);
    (Object.keys(KIRO_BONE_ALIASES) as KiroBoneRole[]).forEach((role) => { const object = findObjectByAliases(this.root, KIRO_BONE_ALIASES[role]); if (object) this.bones.set(role, { object, quaternion: object.quaternion.clone() }); });
    (Object.keys(KIRO_MORPH_ALIASES) as KiroMorphRole[]).forEach((role) => { const bindings = findMorphBindings(this.root, KIRO_MORPH_ALIASES[role]); if (bindings.length) this.morphs.set(role, bindings); });
    this.capabilities = inspectKiroModel(options.modelUrl, this.root, options.clips);
    this.beginProcedural(RELAXED, 0, true);
  }

  // Compatibility only. Chat state and streaming no longer choose animation.
  setState() {}
  setTalking() {}
  setLook(x: number, y: number) { this.lookX = clamp(x, -1, 1); this.lookY = clamp(y, -1, 1); }
  setReducedMotion(value: boolean) { this.reducedMotion = value; if (value) this.beginProcedural(RELAXED, this.motionStartedAt, true); }

  update(deltaSeconds: number, elapsed: number) {
    this.mixer.update(clamp(deltaSeconds, 0, .05));
    if (!this.reducedMotion && elapsed >= this.motionEndsAt) this.chooseNext(elapsed);
    this.applyProceduralPose(elapsed);
    this.applyBlink(elapsed);
  }
  dispose() { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.root); }

  private chooseNext(elapsed: number) {
    if (this.authoredClips.length && this.random() < .36) {
      const choices = this.authoredClips.filter((clip) => `clip:${clip.name}` !== this.currentName);
      this.beginAuthored(choices[Math.floor(this.random() * choices.length)] ?? this.authoredClips[0]!, elapsed); return;
    }
    const kind: MotionKind = this.preferCalm ? 'calm' : this.calmStreak >= 2 ? 'gesture' : this.random() < .64 ? 'calm' : 'gesture';
    let choices = MOTIONS.filter((motion) => motion.kind === kind && motion.name !== this.currentName);
    if (!choices.length) choices = MOTIONS.filter((motion) => motion.name !== this.currentName);
    this.beginProcedural(choices[Math.floor(this.random() * choices.length)] ?? RELAXED, elapsed);
  }

  private beginAuthored(clip: AnimationClip, elapsed: number) {
    const action = this.mixer.clipAction(clip); action.enabled = true; action.clampWhenFinished = false; action.setLoop(LoopOnce, 1); action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    if (this.currentAction && this.currentAction !== action) this.currentAction.crossFadeTo(action, .55, false); else action.fadeIn(.55);
    action.play(); this.currentAction = action; this.currentName = `clip:${clip.name}`; this.motionStartedAt = elapsed; this.motionEndsAt = elapsed + Math.max(.8, clip.duration - .3); this.preferCalm = true;
  }

  private beginProcedural(motion: ProceduralMotion, elapsed: number, immediate = false) {
    if (this.currentAction) { this.currentAction.fadeOut(immediate ? .05 : .5); this.currentAction = undefined; }
    for (const key of POSE_KEYS) { this.startPose[key] = [...this.currentPose[key]]; this.targetPose[key] = [...motion.pose[key]]; if (immediate) this.currentPose[key] = [...motion.pose[key]]; }
    this.currentMotion = motion; this.currentName = motion.name; this.motionStartedAt = elapsed;
    this.transitionEndsAt = elapsed + (immediate ? 0 : .7 + this.random() * .45);
    this.motionEndsAt = elapsed + motion.duration[0] + this.random() * (motion.duration[1] - motion.duration[0]);
    this.preferCalm = motion.kind === 'gesture';
    this.calmStreak = motion.kind === 'calm' ? this.calmStreak + 1 : 0;
  }

  private applyProceduralPose(elapsed: number) {
    if (this.currentAction) return;
    const blend = this.reducedMotion ? 1 : smoothstep((elapsed - this.motionStartedAt) / Math.max(.001, this.transitionEndsAt - this.motionStartedAt));
    const wave = this.reducedMotion ? 0 : Math.sin((elapsed - this.motionStartedAt) * (this.currentMotion.pulseRate ?? 1));
    for (const key of POSE_KEYS) {
      const extra = this.currentMotion.pulse?.[key] ?? Z(); const target = this.targetPose[key]; const start = this.startPose[key];
      this.currentPose[key] = [
        start[0] + ((target[0] - start[0]) * blend) + (extra[0] * wave * blend),
        start[1] + ((target[1] - start[1]) * blend) + (extra[1] * wave * blend),
        start[2] + ((target[2] - start[2]) * blend) + (extra[2] * wave * blend),
      ];
    }
    if (!this.reducedMotion) { this.currentPose.head[1] += this.lookX * .16; this.currentPose.head[0] -= this.lookY * .1; }
    this.applyBone('hips', this.currentPose.hips, .75); this.applyBone('spine', this.currentPose.spine); this.applyBone('head', this.currentPose.head);
    this.applyBone('leftUpperArm', this.currentPose.leftUpper); this.applyBone('rightUpperArm', this.currentPose.rightUpper); this.applyBone('leftForearm', this.currentPose.leftFore); this.applyBone('rightForearm', this.currentPose.rightFore);
    this.applyBone('leftUpperLeg', this.currentPose.leftLeg, .55); this.applyBone('rightUpperLeg', this.currentPose.rightLeg, .55);
    this.modelContainer.position.y = this.reducedMotion ? 0 : Math.sin(elapsed * 1.45) * .0014;
  }

  private applyBone(role: KiroBoneRole, rotation: Vec3, strength = 1) {
    const binding = this.bones.get(role); if (!binding) return;
    binding.object.quaternion.copy(binding.quaternion).multiply(new Quaternion().setFromEuler(new Euler(rotation[0] * strength, rotation[1] * strength, rotation[2] * strength, 'XYZ')));
  }

  private applyBlink(elapsed: number) {
    if (this.reducedMotion) { this.setMorph('blinkLeft', 0); this.setMorph('blinkRight', 0); return; }
    if (this.blinkStartedAt < 0 && elapsed >= this.nextBlinkAt) this.blinkStartedAt = elapsed;
    let amount = 0;
    if (this.blinkStartedAt >= 0) { const phase = (elapsed - this.blinkStartedAt) / .16; if (phase >= 1) { this.blinkStartedAt = -1; this.nextBlinkAt = elapsed + 2.7 + this.random() * 3.4; } else amount = phase < .5 ? phase * 2 : (1 - phase) * 2; }
    this.setMorph('blinkLeft', amount); this.setMorph('blinkRight', amount);
  }
  private setMorph(role: KiroMorphRole, value: number) { const bindings = this.morphs.get(role); if (!bindings) return; for (const binding of bindings) { const mesh = binding.mesh as Mesh; if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[binding.index] = clamp(value, 0, 1); } }
}

export function isBone(object: Object3D): object is Bone { return object.type === 'Bone'; }
