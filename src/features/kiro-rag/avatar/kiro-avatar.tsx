import type { CSSProperties, PointerEvent } from 'react';
import { KIRO_CANVAS_SIZE, KIRO_STATE_LABELS, resolveKiroRig } from './kiro-rig.ts';
import type {
  KiroAvatarState,
  KiroExpression,
  KiroPoseOverride,
  KiroTransformPose,
} from './kiro-avatar.types.ts';

export type { KiroAvatarState, KiroExpression, KiroPose, KiroPoseOverride } from './kiro-avatar.types.ts';

interface KiroAvatarProps {
  state?: KiroAvatarState;
  expression?: KiroExpression;
  pose?: KiroPoseOverride;
  className?: string;
  followPointer?: boolean;
  autoBlink?: boolean;
  talking?: boolean;
  showStateLabel?: boolean;
}

const RIG_ROOT = '/media/kiro-rag/rig-v2';

const PIVOTS = {
  head: [626, 540],
  cape: [438, 560],
  board: [630, 1038],
  leftShoulder: [480, 575],
  leftElbow: [414, 593],
  rightShoulder: [760, 585],
  rightElbow: [865, 682],
  leftHip: [488, 810],
  leftKnee: [454, 894],
  rightHip: [704, 810],
  rightKnee: [770, 886],
  leftEye: [562, 382],
  rightEye: [706, 394],
  leftBrow: [554, 333],
  rightBrow: [706, 347],
  mouth: [630, 501],
  arrow: [654, 278],
  leftThruster: [357, 1111],
  rightThruster: [895, 1092],
} as const;

function pct(value: number) {
  return `${(value / KIRO_CANVAS_SIZE) * 100}%`;
}

function logical(value: number) {
  return `${(value / KIRO_CANVAS_SIZE) * 100}%`;
}

function origin(point: readonly [number, number]) {
  return `${pct(point[0])} ${pct(point[1])}`;
}

function transformStyle(pose: KiroTransformPose, transformOrigin?: string): CSSProperties {
  return {
    transformOrigin,
    transform: `translate3d(${logical(pose.x)}, ${logical(pose.y)}, 0) rotate(${pose.rotate}deg) scale(${pose.scale})`,
  };
}

function asset(name: string, className = '') {
  return (
    <img
      className={`kiro-rig__asset ${className}`.trim()}
      src={`${RIG_ROOT}/${name}`}
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  );
}

export default function KiroAvatar({
  state = 'idle',
  expression,
  pose: poseOverride,
  className = '',
  followPointer = true,
  autoBlink = true,
  talking,
  showStateLabel = false,
}: KiroAvatarProps) {
  const rig = resolveKiroRig(state, expression, poseOverride, talking);
  const { pose } = rig;

  const rootStyle = {
    '--kiro-gaze-x': `${pose.face.gaze.x * 0.62}%`,
    '--kiro-gaze-y': `${pose.face.gaze.y * 0.5}%`,
    '--kiro-pointer-gaze-x': '0%',
    '--kiro-pointer-gaze-y': '0%',
    '--kiro-arrow-intensity': pose.arrowIntensity,
    '--kiro-arrow-brightness': 0.86 + pose.arrowIntensity * 0.28,
    '--kiro-arrow-glow': `${5 + pose.arrowIntensity * 4}px`,
  } as CSSProperties;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!followPointer || event.pointerType === 'touch') return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
    event.currentTarget.style.setProperty('--kiro-pointer-gaze-x', `${x * 0.42}%`);
    event.currentTarget.style.setProperty('--kiro-pointer-gaze-y', `${y * 0.32}%`);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--kiro-pointer-gaze-x', '0%');
    event.currentTarget.style.setProperty('--kiro-pointer-gaze-y', '0%');
  };

  const leftEyeStyle = {
    transformOrigin: origin(PIVOTS.leftEye),
    transform: `scaleY(${pose.face.leftEyeOpen})`,
  } as CSSProperties;
  const rightEyeStyle = {
    transformOrigin: origin(PIVOTS.rightEye),
    transform: `scaleY(${pose.face.rightEyeOpen})`,
  } as CSSProperties;

  const leftBrowStyle = {
    transformOrigin: origin(PIVOTS.leftBrow),
    transform: `translateY(${logical(-pose.face.leftBrowLift)}) rotate(${pose.face.leftBrowRotate}deg)`,
  } as CSSProperties;
  const rightBrowStyle = {
    transformOrigin: origin(PIVOTS.rightBrow),
    transform: `translateY(${logical(-pose.face.rightBrowLift)}) rotate(${pose.face.rightBrowRotate}deg)`,
  } as CSSProperties;
  const mouthStyle = {
    transformOrigin: origin(PIVOTS.mouth),
    transform: `translate3d(${logical(pose.face.mouthX)}, ${logical(pose.face.mouthY)}, 0) rotate(${pose.face.mouthRotate}deg) scale(${pose.face.mouthScaleX}, ${pose.face.mouthScaleY})`,
  } as CSSProperties;
  const arrowStyle = {
    transformOrigin: origin(PIVOTS.arrow),
    transform: `scale(${pose.arrowScale})`,
    opacity: Math.min(1, 0.42 + pose.arrowIntensity * 0.45),
  } as CSSProperties;

  return (
    <figure
      className={`kiro-avatar kiro-avatar--rig-v2 ${className}`.trim()}
      data-kiro-state={rig.state}
      data-kiro-expression={rig.expression}
      data-kiro-talking={rig.talking ? 'true' : 'false'}
      aria-label={`Kiro Rag avatar. ${KIRO_STATE_LABELS[rig.state]} state.`}
    >
      <div
        className="kiro-avatar-frame"
        style={rootStyle}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {asset('backdrop.jpg', 'kiro-rig__backdrop')}
        <div className="kiro-rig__speed-lines" aria-hidden="true" />

        <div className="kiro-rig__character-pose" style={transformStyle(pose.body)} aria-hidden="true">
          <div className="kiro-rig__character-motion">
            <div className="kiro-rig__board-pose" style={transformStyle(pose.board, origin(PIVOTS.board))}>
              <div className="kiro-rig__board-motion">
                <div
                  className="kiro-rig__thruster kiro-rig__thruster--left"
                  style={{ transformOrigin: origin(PIVOTS.leftThruster), transform: `scaleY(${pose.leftThrust})` }}
                >
                  {asset('left-thruster.png', 'kiro-rig__thruster-asset')}
                </div>
                <div
                  className="kiro-rig__thruster kiro-rig__thruster--right"
                  style={{ transformOrigin: origin(PIVOTS.rightThruster), transform: `scaleY(${pose.rightThrust})` }}
                >
                  {asset('right-thruster.png', 'kiro-rig__thruster-asset')}
                </div>
                {asset('board.png', 'kiro-rig__board')}
              </div>
            </div>

            <div className="kiro-rig__body">
              {asset('torso-underpaint.png', 'kiro-rig__underpaint')}

              <div className="kiro-rig__cape" style={transformStyle(pose.cape, origin(PIVOTS.cape))}>
                {asset('cape-tail.png')}
              </div>

              {asset('torso-surface.png', 'kiro-rig__torso')}

              <div
                className="kiro-rig__limb kiro-rig__limb--left-leg"
                style={{ transformOrigin: origin(PIVOTS.leftHip), transform: `rotate(${pose.leftLeg.upperRotate}deg)` }}
              >
                {asset('left-upper-leg.png')}
                <div
                  className="kiro-rig__limb-segment"
                  style={{ transformOrigin: origin(PIVOTS.leftKnee), transform: `rotate(${pose.leftLeg.lowerRotate}deg)` }}
                >
                  {asset('left-lower-leg.png')}
                </div>
              </div>

              <div
                className="kiro-rig__limb kiro-rig__limb--right-leg"
                style={{ transformOrigin: origin(PIVOTS.rightHip), transform: `rotate(${pose.rightLeg.upperRotate}deg)` }}
              >
                {asset('right-upper-leg.png')}
                <div
                  className="kiro-rig__limb-segment"
                  style={{ transformOrigin: origin(PIVOTS.rightKnee), transform: `rotate(${pose.rightLeg.lowerRotate}deg)` }}
                >
                  {asset('right-lower-leg.png')}
                </div>
              </div>

              <div
                className="kiro-rig__limb kiro-rig__limb--left-arm"
                style={{ transformOrigin: origin(PIVOTS.leftShoulder), transform: `rotate(${pose.leftArm.upperRotate}deg)` }}
              >
                {asset('left-upper-arm.png')}
                <div
                  className="kiro-rig__limb-segment"
                  style={{ transformOrigin: origin(PIVOTS.leftElbow), transform: `rotate(${pose.leftArm.lowerRotate}deg)` }}
                >
                  {asset('left-forearm.png')}
                </div>
              </div>

              <div
                className="kiro-rig__limb kiro-rig__limb--right-arm"
                style={{ transformOrigin: origin(PIVOTS.rightShoulder), transform: `rotate(${pose.rightArm.upperRotate}deg)` }}
              >
                {asset('right-upper-arm.png')}
                <div
                  className="kiro-rig__limb-segment"
                  style={{ transformOrigin: origin(PIVOTS.rightElbow), transform: `rotate(${pose.rightArm.lowerRotate}deg)` }}
                >
                  {asset('right-forearm.png')}
                </div>
              </div>

              <div className="kiro-rig__head-pose" style={transformStyle(pose.head, origin(PIVOTS.head))}>
                <div className="kiro-rig__head-motion">
                  {asset('head-underpaint.png', 'kiro-rig__underpaint')}
                  {asset('head-surface.png', 'kiro-rig__head-surface')}

                  <div className="kiro-rig__eye-pose" style={leftEyeStyle}>
                    <div className={autoBlink ? 'kiro-rig__eye-blink kiro-rig__eye-blink--left' : ''}>
                      {asset('left-eye.png')}
                      <div className="kiro-rig__pupil-pose">
                        {asset('left-pupil.png', 'kiro-rig__pupil kiro-rig__pupil--left')}
                      </div>
                    </div>
                  </div>

                  <div className="kiro-rig__eye-pose" style={rightEyeStyle}>
                    <div className={autoBlink ? 'kiro-rig__eye-blink kiro-rig__eye-blink--right' : ''}>
                      {asset('right-eye.png')}
                      <div className="kiro-rig__pupil-pose">
                        {asset('right-pupil.png', 'kiro-rig__pupil kiro-rig__pupil--right')}
                      </div>
                    </div>
                  </div>

                  <div className="kiro-rig__brow" style={leftBrowStyle}>{asset('left-brow.png')}</div>
                  <div className="kiro-rig__brow" style={rightBrowStyle}>{asset('right-brow.png')}</div>

                  <div className="kiro-rig__mouth" style={mouthStyle}>
                    {asset('mouth.png', rig.talking ? 'kiro-rig__mouth-asset kiro-rig__mouth-asset--talking' : 'kiro-rig__mouth-asset')}
                  </div>

                  <div className="kiro-rig__arrow" style={arrowStyle}>{asset('arrow.png')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="kiro-rig__state-effect" aria-hidden="true" />
        {showStateLabel ? (
          <div className="kiro-rig__state-readout" aria-live="polite">
            <span>{rig.expression}</span>
            <strong>{KIRO_STATE_LABELS[rig.state]}</strong>
          </div>
        ) : null}
      </div>
      <figcaption>Articulated source-derived React rig · gaze, face, limbs, board and dual thrust</figcaption>
    </figure>
  );
}
