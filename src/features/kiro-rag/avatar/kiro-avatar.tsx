import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import {
  KIRO_PARAMETER_KEYS,
  KIRO_STATE_LABELS,
  resolveKiroModel,
} from './kiro-model.ts';
import {
  drawWarpedGrid,
  gaussianWeight,
  rotateAround,
  smoothstep,
  type KiroBounds,
  type KiroPoint,
} from './kiro-mesh.ts';
import type {
  KiroAvatarState,
  KiroGazeTarget,
  KiroModelParameters,
  KiroParameterOverride,
} from './kiro-avatar.types.ts';

export type { KiroAvatarState, KiroGazeTarget, KiroModelParameters, KiroParameterOverride } from './kiro-avatar.types.ts';

const CANVAS_SIZE = 1254;
const RIG_ROOT = '/media/kiro-rag/rig-v3';
const BODY_BOUNDS: KiroBounds = { x: 135, y: 420, width: 955, height: 834 };
const HEAD_BOUNDS: KiroBounds = { x: 372, y: 46, width: 496, height: 526 };

const LANDMARKS = {
  neck: { x: 626, y: 544 },
  headCenter: { x: 628, y: 310 },
  leftEye: { x: 560, y: 383 },
  rightEye: { x: 706, y: 394 },
  leftBrow: { x: 555, y: 330 },
  rightBrow: { x: 708, y: 343 },
  mouth: { x: 630, y: 501 },
  arrow: { x: 654, y: 278 },
  torso: { x: 625, y: 690 },
  leftShoulder: { x: 473, y: 580 },
  leftElbow: { x: 404, y: 595 },
  leftHand: { x: 346, y: 505 },
  rightShoulder: { x: 760, y: 590 },
  rightElbow: { x: 855, y: 675 },
  rightHand: { x: 930, y: 694 },
  leftHip: { x: 493, y: 810 },
  leftKnee: { x: 458, y: 896 },
  rightHip: { x: 704, y: 810 },
  rightKnee: { x: 770, y: 887 },
  hipCenter: { x: 599, y: 810 },
  boardCenter: { x: 630, y: 1035 },
  leftThruster: { x: 357, y: 1110 },
  rightThruster: { x: 895, y: 1092 },
} as const;

const ASSET_NAMES = [
  'body-base.png',
  'head-base.png',
  'left-eye.png',
  'right-eye.png',
  'left-pupil.png',
  'right-pupil.png',
  'left-brow.png',
  'right-brow.png',
  'mouth.png',
  'arrow.png',
] as const;

type AssetName = (typeof ASSET_NAMES)[number];
type AssetMap = Record<AssetName, HTMLImageElement>;

interface KiroAvatarProps {
  state?: KiroAvatarState;
  parameters?: KiroParameterOverride;
  gazeTarget?: KiroGazeTarget;
  talking?: boolean;
  interactiveGaze?: boolean;
  autoBlink?: boolean;
  className?: string;
  showStateLabel?: boolean;
}

interface SpringState {
  value: KiroModelParameters;
  velocity: KiroModelParameters;
}

const zeroParameters = (): KiroModelParameters => ({
  headYaw: 0,
  headPitch: 0,
  headTilt: 0,
  gazeX: 0,
  gazeY: 0,
  eyeOpenL: 0,
  eyeOpenR: 0,
  browLiftL: 0,
  browLiftR: 0,
  browTiltL: 0,
  browTiltR: 0,
  mouthOpen: 0,
  mouthSmile: 0,
  bodyLean: 0,
  bodyRise: 0,
  crouch: 0,
  pointEmphasis: 0,
  rightArmEnergy: 0,
  capeWind: 0,
  boardPitch: 0,
  boardRoll: 0,
  thrustL: 0,
  thrustR: 0,
  arrowIntensity: 0,
});

const cloneParameters = (value: KiroModelParameters): KiroModelParameters => ({ ...value });
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function springStep(
  spring: SpringState,
  target: KiroModelParameters,
  deltaSeconds: number,
  reducedMotion: boolean,
) {
  if (reducedMotion) {
    spring.value = cloneParameters(target);
    spring.velocity = zeroParameters();
    return;
  }

  const stiffness = 110;
  const damping = 20;
  for (const key of KIRO_PARAMETER_KEYS) {
    const displacement = spring.value[key] - target[key];
    const acceleration = -stiffness * displacement - damping * spring.velocity[key];
    spring.velocity[key] += acceleration * deltaSeconds;
    spring.value[key] += spring.velocity[key] * deltaSeconds;
  }
}

function headWarp(point: KiroPoint, parameters: KiroModelParameters): KiroPoint {
  const center = LANDMARKS.headCenter;
  const yaw = parameters.headYaw;
  const pitch = parameters.headPitch;
  const tilt = parameters.headTilt * 0.11;
  const relativeX = point.x - center.x;
  const relativeY = point.y - center.y;
  const normalizedX = relativeX / 250;
  const normalizedY = relativeY / 255;

  const widthScale = 1 - Math.abs(yaw) * 0.055;
  const heightScale = 1 - Math.abs(pitch) * 0.035;
  const centerShift = yaw * 14 * (1 - Math.min(1, Math.abs(normalizedX)));
  const cheekShear = yaw * normalizedY * 5;
  const pitchShift = pitch * 11 * (1 - Math.min(1, Math.abs(normalizedY)));

  let output = {
    x: center.x + relativeX * widthScale + centerShift + cheekShear,
    y: center.y + relativeY * heightScale + pitchShift,
  };
  output = rotateAround(output, LANDMARKS.neck, tilt);
  return output;
}

function bodyWarp(point: KiroPoint, parameters: KiroModelParameters, timeSeconds: number): KiroPoint {
  let output = { ...point };

  const upperWeight = 1 - smoothstep(760, 980, point.y);
  const leanRadians = parameters.bodyLean * 0.045 * upperWeight;
  output = rotateAround(output, LANDMARKS.hipCenter, leanRadians * 0.45);
  output.x += parameters.bodyLean * 12 * upperWeight;
  output.y += parameters.bodyRise * 20 * upperWeight;

  const crouchWeight = smoothstep(730, 960, point.y) * (1 - smoothstep(1040, 1180, point.y));
  output.y += parameters.crouch * 16 * crouchWeight;
  output.x += parameters.crouch * (point.x < 620 ? -6 : 6) * crouchWeight;

  const leftHandWeight = gaussianWeight(point, LANDMARKS.leftHand, 125, 120);
  const leftElbowWeight = gaussianWeight(point, LANDMARKS.leftElbow, 135, 115);
  const leftShoulderWeight = gaussianWeight(point, LANDMARKS.leftShoulder, 145, 120);
  const pointStrength = parameters.pointEmphasis;
  output.x += pointStrength * (-18 * leftHandWeight - 8 * leftElbowWeight + 2 * leftShoulderWeight);
  output.y += pointStrength * (-13 * leftHandWeight - 5 * leftElbowWeight);

  const rightHandWeight = gaussianWeight(point, LANDMARKS.rightHand, 118, 110);
  const rightElbowWeight = gaussianWeight(point, LANDMARKS.rightElbow, 135, 120);
  output.x += parameters.rightArmEnergy * (8 * rightHandWeight + 3 * rightElbowWeight);
  output.y += parameters.rightArmEnergy * (-10 * rightHandWeight - 4 * rightElbowWeight);

  const capeWeight = gaussianWeight(point, { x: 330, y: 730 }, 260, 230)
    * (1 - smoothstep(720, 920, point.x));
  const capeWave = Math.sin(timeSeconds * 1.2 + point.y * 0.014) * 3.5;
  output.x += parameters.capeWind * capeWeight * (-18 + capeWave);
  output.y += parameters.capeWind * capeWeight * -3;

  const boardWeight = smoothstep(930, 1050, point.y);
  if (boardWeight > 0) {
    const pitched = rotateAround(output, LANDMARKS.boardCenter, parameters.boardPitch * 0.035 * boardWeight);
    const rolled = rotateAround(pitched, LANDMARKS.boardCenter, parameters.boardRoll * 0.028 * boardWeight);
    output = rolled;
  }

  return output;
}

function featureWarp(
  point: KiroPoint,
  parameters: KiroModelParameters,
  center: KiroPoint,
  options: {
    translateX?: number;
    translateY?: number;
    rotate?: number;
    scaleX?: number;
    scaleY?: number;
    cornerSmile?: number;
  } = {},
): KiroPoint {
  let output = { ...point };
  const localX = output.x - center.x;
  const localY = output.y - center.y;
  const scaleX = options.scaleX ?? 1;
  const scaleY = options.scaleY ?? 1;
  output.x = center.x + localX * scaleX;
  output.y = center.y + localY * scaleY;

  if (options.cornerSmile) {
    const normalized = clamp(Math.abs(localX) / 90, 0, 1);
    output.y -= options.cornerSmile * normalized * normalized * 7;
  }
  if (options.rotate) output = rotateAround(output, center, options.rotate);
  output.x += options.translateX ?? 0;
  output.y += options.translateY ?? 0;
  return headWarp(output, parameters);
}

function drawBackground(ctx: CanvasRenderingContext2D, timeSeconds: number, state: KiroAvatarState) {
  const radial = ctx.createRadialGradient(615, 510, 70, 620, 530, 760);
  radial.addColorStop(0, '#204f82');
  radial.addColorStop(0.38, '#0d3158');
  radial.addColorStop(0.78, '#061a34');
  radial.addColorStop(1, '#020a18');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const lineAlpha = state === 'retrieving' ? 0.24 : 0.11;
  const drift = Math.sin(timeSeconds * 0.28) * 9;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = lineAlpha;
  const beams = [
    { x: 70, y: 300, angle: -0.65, length: 300, width: 20 },
    { x: 1060, y: 475, angle: 2.32, length: 230, width: 16 },
    { x: 1030, y: 760, angle: 2.55, length: 360, width: 18 },
  ];
  for (const beam of beams) {
    ctx.save();
    ctx.translate(beam.x + drift, beam.y);
    ctx.rotate(beam.angle);
    const gradient = ctx.createLinearGradient(0, 0, beam.length, 0);
    gradient.addColorStop(0, 'rgba(80,180,255,0)');
    gradient.addColorStop(0.45, 'rgba(80,180,255,0.85)');
    gradient.addColorStop(1, 'rgba(80,180,255,0)');
    ctx.fillStyle = gradient;
    ctx.filter = 'blur(6px)';
    ctx.fillRect(0, -beam.width / 2, beam.length, beam.width);
    ctx.restore();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(627, 590, 390, 627, 590, 830);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.52)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function drawThrusterGlow(
  ctx: CanvasRenderingContext2D,
  center: KiroPoint,
  intensity: number,
  timeSeconds: number,
) {
  const pulse = 0.96 + Math.sin(timeSeconds * 11 + center.x * 0.01) * 0.035;
  const strength = clamp(intensity * pulse, 0, 1);
  if (strength < 0.05) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const radius = 64 + strength * 42;
  const gradient = ctx.createRadialGradient(center.x, center.y + 35, 4, center.x, center.y + 42, radius);
  gradient.addColorStop(0, `rgba(255,245,190,${0.56 * strength})`);
  gradient.addColorStop(0.24, `rgba(255,167,58,${0.42 * strength})`);
  gradient.addColorStop(1, 'rgba(255,92,20,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y + 48, radius * 0.7, radius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBlinkLine(
  ctx: CanvasRenderingContext2D,
  center: KiroPoint,
  openness: number,
  parameters: KiroModelParameters,
) {
  if (openness > 0.24) return;
  const left = headWarp({ x: center.x - 33, y: center.y }, parameters);
  const middle = headWarp({ x: center.x, y: center.y + 6 }, parameters);
  const right = headWarp({ x: center.x + 33, y: center.y }, parameters);
  ctx.save();
  ctx.strokeStyle = 'rgba(81, 43, 28, 0.72)';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.quadraticCurveTo(middle.x, middle.y, right.x, right.y);
  ctx.stroke();
  ctx.restore();
}

function renderKiro(
  ctx: CanvasRenderingContext2D,
  assets: AssetMap,
  parameters: KiroModelParameters,
  state: KiroAvatarState,
  timeSeconds: number,
  blink: number,
) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  drawBackground(ctx, timeSeconds, state);

  const hover = Math.sin(timeSeconds * 1.25) * 2.4;
  ctx.save();
  ctx.translate(0, hover);
  drawWarpedGrid(
    ctx,
    assets['body-base.png'],
    BODY_BOUNDS,
    8,
    9,
    (point) => bodyWarp(point, parameters, timeSeconds),
  );

  drawThrusterGlow(ctx, LANDMARKS.leftThruster, parameters.thrustL, timeSeconds);
  drawThrusterGlow(ctx, LANDMARKS.rightThruster, parameters.thrustR, timeSeconds);

  drawWarpedGrid(ctx, assets['head-base.png'], HEAD_BOUNDS, 6, 6, (point) => headWarp(point, parameters));

  const eyeOpenL = clamp(parameters.eyeOpenL * blink, 0.035, 1.08);
  const eyeOpenR = clamp(parameters.eyeOpenR * blink, 0.035, 1.08);

  drawWarpedGrid(ctx, assets['left-eye.png'], { x: 500, y: 335, width: 120, height: 94 }, 2, 2, (point) =>
    featureWarp(point, parameters, LANDMARKS.leftEye, { scaleY: eyeOpenL }),
  );
  drawWarpedGrid(ctx, assets['right-eye.png'], { x: 646, y: 345, width: 122, height: 96 }, 2, 2, (point) =>
    featureWarp(point, parameters, LANDMARKS.rightEye, { scaleY: eyeOpenR }),
  );

  const gazeX = parameters.gazeX * 11;
  const gazeY = parameters.gazeY * 7;
  drawWarpedGrid(ctx, assets['left-pupil.png'], { x: 534, y: 350, width: 63, height: 66 }, 2, 2, (point) =>
    featureWarp(point, parameters, LANDMARKS.leftEye, {
      translateX: gazeX,
      translateY: gazeY,
      scaleY: eyeOpenL,
    }),
  );
  drawWarpedGrid(ctx, assets['right-pupil.png'], { x: 673, y: 362, width: 64, height: 67 }, 2, 2, (point) =>
    featureWarp(point, parameters, LANDMARKS.rightEye, {
      translateX: gazeX,
      translateY: gazeY,
      scaleY: eyeOpenR,
    }),
  );

  drawBlinkLine(ctx, LANDMARKS.leftEye, eyeOpenL, parameters);
  drawBlinkLine(ctx, LANDMARKS.rightEye, eyeOpenR, parameters);

  drawWarpedGrid(ctx, assets['left-brow.png'], { x: 495, y: 304, width: 118, height: 54 }, 2, 2, (point) =>
    featureWarp(point, parameters, LANDMARKS.leftBrow, {
      translateY: -parameters.browLiftL * 8,
      rotate: parameters.browTiltL * 0.12,
    }),
  );
  drawWarpedGrid(ctx, assets['right-brow.png'], { x: 649, y: 316, width: 122, height: 55 }, 2, 2, (point) =>
    featureWarp(point, parameters, LANDMARKS.rightBrow, {
      translateY: -parameters.browLiftR * 8,
      rotate: parameters.browTiltR * 0.12,
    }),
  );

  const mouthOpen = clamp(parameters.mouthOpen, 0, 1);
  if (mouthOpen > 0.035) {
    const mouthCenter = headWarp(LANDMARKS.mouth, parameters);
    ctx.save();
    ctx.fillStyle = `rgba(73, 24, 25, ${0.46 * mouthOpen})`;
    ctx.beginPath();
    ctx.ellipse(mouthCenter.x, mouthCenter.y + 2, 49 + mouthOpen * 4, 6 + mouthOpen * 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawWarpedGrid(ctx, assets['mouth.png'], { x: 541, y: 456, width: 178, height: 92 }, 3, 2, (point) =>
    featureWarp(point, parameters, LANDMARKS.mouth, {
      scaleX: 1 + Math.abs(parameters.mouthSmile) * 0.025,
      scaleY: 1 + mouthOpen * 0.22,
      cornerSmile: parameters.mouthSmile,
    }),
  );

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.52 + parameters.arrowIntensity * 0.48;
  ctx.shadowBlur = 6 + parameters.arrowIntensity * 13;
  ctx.shadowColor = 'rgba(255, 226, 146, 0.92)';
  drawWarpedGrid(ctx, assets['arrow.png'], { x: 608, y: 213, width: 95, height: 127 }, 2, 2, (point) =>
    featureWarp(point, parameters, LANDMARKS.arrow, {
      scaleX: 0.98 + parameters.arrowIntensity * 0.035,
      scaleY: 0.98 + parameters.arrowIntensity * 0.035,
    }),
  );
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function KiroAvatar({
  state = 'idle',
  parameters,
  gazeTarget,
  talking,
  interactiveGaze = true,
  autoBlink = true,
  className = '',
  showStateLabel = false,
}: KiroAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerGaze = useRef<KiroGazeTarget>({ x: 0, y: 0 });
  const assetsRef = useRef<AssetMap | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const blinkRef = useRef({ next: 2.8, started: -1 });
  const [ready, setReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const model = useMemo(() => resolveKiroModel(state, parameters, talking), [state, parameters, talking]);
  const modelRef = useRef(model);
  modelRef.current = model;
  const gazeTargetRef = useRef(gazeTarget);
  gazeTargetRef.current = gazeTarget;
  const springRef = useRef<SpringState>({
    value: cloneParameters(model.target),
    velocity: zeroParameters(),
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      ASSET_NAMES.map((name) => new Promise<[AssetName, HTMLImageElement]>((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => resolve([name, image]);
        image.onerror = () => reject(new Error(`Unable to load Kiro model asset: ${name}`));
        image.src = `${RIG_ROOT}/${name}`;
      })),
    )
      .then((entries) => {
        if (cancelled) return;
        assetsRef.current = Object.fromEntries(entries) as AssetMap;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const canvas = canvasRef.current;
    const assets = assetsRef.current;
    if (!canvas || !assets) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const animate = (timestamp: number) => {
      const last = lastTimeRef.current ?? timestamp;
      const delta = clamp((timestamp - last) / 1000, 0, 1 / 24);
      lastTimeRef.current = timestamp;
      const time = timestamp / 1000;
      const resolved = modelRef.current;
      const target = { ...resolved.target };

      const explicitGaze = gazeTargetRef.current;
      const gaze = explicitGaze ?? pointerGaze.current;
      if (interactiveGaze || explicitGaze) {
        target.gazeX = clamp(target.gazeX + gaze.x * 0.42, -1, 1);
        target.gazeY = clamp(target.gazeY + gaze.y * 0.34, -1, 1);
      }

      if (!reducedMotion) {
        const quiet = resolved.state === 'idle' || resolved.state === 'answering';
        if (quiet) {
          target.headTilt += Math.sin(time * 0.62) * 0.018;
          target.headPitch += Math.sin(time * 0.47 + 0.6) * 0.015;
          target.bodyRise += Math.sin(time * 1.18) * 0.018;
          target.capeWind += Math.sin(time * 0.7 + 1.5) * 0.025;
        }
        if (resolved.talking) {
          const syllable = Math.max(0, Math.sin(time * 8.2) * 0.55 + Math.sin(time * 13.7 + 0.8) * 0.22);
          target.mouthOpen = clamp(0.08 + syllable * 0.32, 0, 0.46);
        }
      }

      let blink = 1;
      if (autoBlink && !reducedMotion) {
        const blinkState = blinkRef.current;
        if (blinkState.started < 0 && time >= blinkState.next) {
          blinkState.started = time;
        }
        if (blinkState.started >= 0) {
          const progress = (time - blinkState.started) / 0.15;
          if (progress >= 1) {
            blinkState.started = -1;
            blinkState.next = time + 2.7 + Math.random() * 3.4;
          } else {
            blink = progress < 0.5 ? lerp(1, 0.12, progress * 2) : lerp(0.12, 1, (progress - 0.5) * 2);
          }
        }
      }

      springStep(springRef.current, target, delta, reducedMotion);
      renderKiro(context, assets, springRef.current.value, resolved.state, time, blink);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastTimeRef.current = null;
    };
  }, [autoBlink, interactiveGaze, ready, reducedMotion]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactiveGaze || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    pointerGaze.current = {
      x: clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1),
      y: clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1),
    };
  };

  const handlePointerLeave = () => {
    pointerGaze.current = { x: 0, y: 0 };
  };

  const frameStyle = { '--kiro-model-ready': ready ? 1 : 0 } as CSSProperties;

  return (
    <figure
      className={`kiro-avatar kiro-avatar--model-v3 ${className}`.trim()}
      data-kiro-state={state}
      aria-label={`Kiro Rag avatar. ${KIRO_STATE_LABELS[state]} state.`}
    >
      <div
        className="kiro-model-stage"
        style={frameStyle}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <canvas
          ref={canvasRef}
          className="kiro-model-canvas"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          aria-hidden="true"
        />
        {!ready && <div className="kiro-model-loading" aria-live="polite">Preparing Kiro…</div>}
      </div>
      {showStateLabel && (
        <figcaption className="kiro-model-state">
          <span>State</span>
          <strong>{KIRO_STATE_LABELS[state]}</strong>
        </figcaption>
      )}
    </figure>
  );
}
