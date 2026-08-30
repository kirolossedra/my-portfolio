import { useState } from 'react';
import KiroAvatar from './features/kiro-rag/avatar/kiro-avatar.tsx';
import type {
  KiroAvatarState,
  KiroExpression,
  KiroPoseOverride,
} from './features/kiro-rag/avatar/kiro-avatar.types.ts';
import KiroRigLab from './features/kiro-rag/kiro-rig-lab.tsx';

const stateCards = [
  ['Idle', 'Autonomous hover, blink, subtle breathing and independent flame flicker.'],
  ['Thinking', 'Head tilt, upward gaze, asymmetric brows, thinking mouth and arrow pulse.'],
  ['Retrieving', 'Focused face, forward board pitch, brighter arrow and stronger dual thrust.'],
  ['Answering', 'Talking mouth cycle while the same face and rig stay under React control.'],
  ['Success', 'Lift, brighter expression, arm response, cape reaction and confirmation flash.'],
  ['Error', 'Asymmetric face, body wobble and intentionally unbalanced thruster response.'],
] as const;

export default function KiroRagPage() {
  const [state, setState] = useState<KiroAvatarState>('idle');
  const [expression, setExpression] = useState<KiroExpression | undefined>(undefined);
  const [pose, setPose] = useState<KiroPoseOverride>({});

  return (
    <div className="site-shell kiro-rag-shell">
      <header className="site-nav">
        <a className="brand" href="/" aria-label="kirolos.dev home">kirolos<span>.dev</span></a>
        <nav aria-label="Primary navigation">
          <a href="/#history">History</a>
          <a href="/skills">Skills</a>
          <a href="/opinions">Opinions</a>
          <a href="/kiro-rag" aria-current="page">Kiro Rag</a>
          <a href="https://github.com/kirolossedra" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>

      <main className="kiro-rag-page">
        <section className="kiro-rag-hero" aria-labelledby="kiro-rag-title">
          <div className="kiro-rag-copy">
            <p className="eyebrow">Portfolio intelligence</p>
            <h1 id="kiro-rag-title">Kiro Rag</h1>
            <p className="kiro-rag-lead">
              The approved Kiro artwork is now an articulated 2D React character: face, gaze, brows, mouth, head, arms, elbows, legs, knees, cape, board, arrow and both thrusters are independently addressable.
            </p>
            <div className="kiro-rag-principles" aria-label="Kiro Rag rig capabilities">
              <span>Source-derived visual identity</span>
              <span>Parameterized React rig</span>
              <span>State + pose overrides</span>
            </div>
          </div>

          <div className="kiro-rag-avatar-stage">
            <div className="kiro-rag-stage-glow" aria-hidden="true" />
            <KiroAvatar
              state={state}
              expression={expression}
              pose={pose}
              followPointer
              autoBlink
              showStateLabel
            />
          </div>

          <KiroRigLab
            state={state}
            setState={setState}
            expression={expression}
            setExpression={setExpression}
            pose={pose}
            setPose={setPose}
          />
        </section>

        <section className="kiro-rag-system" aria-labelledby="kiro-system-title">
          <div className="kiro-rag-system-copy">
            <p className="eyebrow">Real rig, not state images</p>
            <h2 id="kiro-system-title">Animations are combinations of parameters.</h2>
            <p>
              KiroRag can set a semantic state such as retrieval, then optionally override any pose parameter. New animations do not require generating a new Kiro image: they are sequences of the same reusable joints, facial controls and effects.
            </p>
          </div>

          <div className="kiro-rag-flow" aria-label="Kiro Rag control architecture">
            <div><span>01</span><strong>KiroRag state</strong><small>Idle, thinking, retrieval, answering, success or error</small></div>
            <b aria-hidden="true">→</b>
            <div><span>02</span><strong>Expression preset</strong><small>Eyes, brows, mouth and gaze resolve from semantic intent</small></div>
            <b aria-hidden="true">→</b>
            <div><span>03</span><strong>Pose overrides</strong><small>Any joint or effect can be changed continuously at runtime</small></div>
            <b aria-hidden="true">→</b>
            <div><span>04</span><strong>2D source rig</strong><small>One stable Kiro identity, many repeatable motions</small></div>
          </div>
        </section>

        <section className="kiro-rag-states" aria-labelledby="kiro-states-title">
          <div className="kiro-rag-states-heading">
            <p className="eyebrow">Semantic animation vocabulary</p>
            <h2 id="kiro-states-title">The presets are examples, not the limit.</h2>
            <p>
              Each state is just a named bundle of pose values. The same API can create new gestures, gaze targets, reactions and animation sequences without adding another rendered character.
            </p>
          </div>

          <div className="kiro-rag-state-grid">
            {stateCards.map(([name, description], index) => (
              <article className="kiro-rag-state-card" key={name}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{name}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>© 2026 Kirolos Sedra</span>
        <span>kirolos.dev</span>
      </footer>
    </div>
  );
}
