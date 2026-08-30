import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type {
  KiroAvatarState,
  KiroExpression,
  KiroPoseOverride,
} from './avatar/kiro-avatar.types.ts';

const states: KiroAvatarState[] = ['idle', 'thinking', 'retrieving', 'answering', 'success', 'error'];
const expressions: KiroExpression[] = ['neutral', 'happy', 'thinking', 'focused', 'confused', 'surprised', 'error'];

interface KiroRigLabProps {
  state: KiroAvatarState;
  setState: Dispatch<SetStateAction<KiroAvatarState>>;
  expression: KiroExpression | undefined;
  setExpression: Dispatch<SetStateAction<KiroExpression | undefined>>;
  pose: KiroPoseOverride;
  setPose: Dispatch<SetStateAction<KiroPoseOverride>>;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step = 1, onChange }: SliderProps) {
  return (
    <label className="kiro-rig-slider">
      <span>{label}<output>{value.toFixed(step < 1 ? 2 : 0)}</output></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default function KiroRigLab({ state, setState, expression, setExpression, pose, setPose }: KiroRigLabProps) {
  const update = (next: KiroPoseOverride) => {
    setPose((current) => ({
      ...current,
      ...next,
      body: { ...current.body, ...next.body },
      head: { ...current.head, ...next.head },
      face: {
        ...current.face,
        ...next.face,
        gaze: { ...current.face?.gaze, ...next.face?.gaze },
      },
      leftArm: { ...current.leftArm, ...next.leftArm },
      rightArm: { ...current.rightArm, ...next.rightArm },
      leftLeg: { ...current.leftLeg, ...next.leftLeg },
      rightLeg: { ...current.rightLeg, ...next.rightLeg },
      cape: { ...current.cape, ...next.cape },
      board: { ...current.board, ...next.board },
    }));
  };

  return (
    <div className="kiro-rig-lab">
      <div className="kiro-rig-lab__states" aria-label="Kiro semantic states">
        {states.map((item) => (
          <button
            key={item}
            type="button"
            className={item === state ? 'is-active' : ''}
            onClick={() => setState(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <details>
        <summary>Open full rig controls</summary>
        <div className="kiro-rig-lab__panel">
          <label className="kiro-rig-select">
            <span>Expression override</span>
            <select value={expression ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => setExpression((event.target.value || undefined) as KiroExpression | undefined)}>
              <option value="">Follow state</option>
              {expressions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <div className="kiro-rig-lab__grid">
            <Slider label="Head tilt" value={pose.head?.rotate ?? 0} min={-16} max={16} onChange={(rotate) => update({ head: { rotate } })} />
            <Slider label="Gaze X" value={pose.face?.gaze?.x ?? 0} min={-1} max={1} step={0.05} onChange={(x) => update({ face: { gaze: { x } } })} />
            <Slider label="Gaze Y" value={pose.face?.gaze?.y ?? 0} min={-1} max={1} step={0.05} onChange={(y) => update({ face: { gaze: { y } } })} />
            <Slider label="Mouth shape" value={pose.face?.mouthScaleY ?? 1} min={-1} max={1.5} step={0.05} onChange={(mouthScaleY) => update({ face: { mouthScaleY } })} />
            <Slider label="Left shoulder" value={pose.leftArm?.upperRotate ?? 0} min={-18} max={18} onChange={(upperRotate) => update({ leftArm: { upperRotate } })} />
            <Slider label="Left elbow" value={pose.leftArm?.lowerRotate ?? 0} min={-22} max={22} onChange={(lowerRotate) => update({ leftArm: { lowerRotate } })} />
            <Slider label="Right shoulder" value={pose.rightArm?.upperRotate ?? 0} min={-18} max={18} onChange={(upperRotate) => update({ rightArm: { upperRotate } })} />
            <Slider label="Right elbow" value={pose.rightArm?.lowerRotate ?? 0} min={-22} max={22} onChange={(lowerRotate) => update({ rightArm: { lowerRotate } })} />
            <Slider label="Left hip" value={pose.leftLeg?.upperRotate ?? 0} min={-10} max={10} onChange={(upperRotate) => update({ leftLeg: { upperRotate } })} />
            <Slider label="Left knee" value={pose.leftLeg?.lowerRotate ?? 0} min={-12} max={12} onChange={(lowerRotate) => update({ leftLeg: { lowerRotate } })} />
            <Slider label="Right hip" value={pose.rightLeg?.upperRotate ?? 0} min={-10} max={10} onChange={(upperRotate) => update({ rightLeg: { upperRotate } })} />
            <Slider label="Right knee" value={pose.rightLeg?.lowerRotate ?? 0} min={-12} max={12} onChange={(lowerRotate) => update({ rightLeg: { lowerRotate } })} />
            <Slider label="Cape" value={pose.cape?.rotate ?? 0} min={-12} max={12} onChange={(rotate) => update({ cape: { rotate } })} />
            <Slider label="Board tilt" value={pose.board?.rotate ?? 0} min={-8} max={8} step={0.25} onChange={(rotate) => update({ board: { rotate } })} />
            <Slider label="Left thrust" value={pose.leftThrust ?? 1} min={0.35} max={1.65} step={0.05} onChange={(leftThrust) => update({ leftThrust })} />
            <Slider label="Right thrust" value={pose.rightThrust ?? 1} min={0.35} max={1.65} step={0.05} onChange={(rightThrust) => update({ rightThrust })} />
          </div>

          <button
            type="button"
            className="kiro-rig-lab__reset"
            onClick={() => {
              setExpression(undefined);
              setPose({});
            }}
          >
            Reset manual overrides
          </button>
        </div>
      </details>
    </div>
  );
}
