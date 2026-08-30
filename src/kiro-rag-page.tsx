import { useState } from 'react';
import KiroAvatar from './features/kiro-rag/avatar/kiro-avatar.tsx';
import type { KiroAvatarState } from './features/kiro-rag/avatar/kiro-avatar.types.ts';
import KiroInteractionDemo from './features/kiro-rag/kiro-interaction-demo.tsx';

const capabilities = [
  ['Mesh deformation', 'The character is warped as continuous image surfaces instead of rotating disconnected PNG body parts.'],
  ['Bounded face model', 'Gaze, blink, brows, mouth and head movement are constrained to ranges that preserve the approved Kiro identity.'],
  ['Continuous parameters', 'KiroRag drives normalized parameters; named states are only targets, not separate animations or images.'],
  ['Spring motion', 'Changes settle through damped interpolation, avoiding abrupt jumps when application state changes.'],
] as const;

export default function KiroRagPage() {
  const [state, setState] = useState<KiroAvatarState>('idle');

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

      <main className="kiro-rag-page kiro-rag-page--model-v3">
        <section className="kiro-rag-hero kiro-rag-hero--model-v3" aria-labelledby="kiro-rag-title">
          <div className="kiro-rag-copy">
            <p className="eyebrow">Portfolio intelligence</p>
            <h1 id="kiro-rag-title">Kiro Rag</h1>
            <p className="kiro-rag-lead">
              Kiro is now rendered as a constrained 2D deformation model inside React. The canonical artwork remains the texture source; behavior comes from continuous parameters rather than sliced body parts or canned GIFs.
            </p>
            <div className="kiro-rag-principles" aria-label="Kiro model principles">
              <span>Canonical artwork</span>
              <span>Continuous mesh</span>
              <span>State-driven behavior</span>
            </div>
            <KiroInteractionDemo state={state} onStateChange={setState} />
          </div>

          <div className="kiro-rag-avatar-stage kiro-rag-avatar-stage--model-v3">
            <KiroAvatar
              state={state}
              interactiveGaze
              autoBlink
              showStateLabel
            />
          </div>
        </section>

        <section className="kiro-rag-system" aria-labelledby="kiro-system-title">
          <div className="kiro-rag-system-copy">
            <p className="eyebrow">Model architecture</p>
            <h2 id="kiro-system-title">React controls intent. The renderer controls deformation.</h2>
            <p>
              Application state is converted into bounded model parameters, smoothed through a small physics layer, then rendered onto one canvas. Arms, cape, body and board use weighted surface deformation; face parts follow the same head deformation field so they cannot drift away from the face.
            </p>
          </div>

          <div className="kiro-rag-flow" aria-label="Kiro Rag control architecture">
            <div><span>01</span><strong>KiroRag event</strong><small>Question, retrieval, answer, completion or failure</small></div>
            <b aria-hidden="true">→</b>
            <div><span>02</span><strong>Parameter target</strong><small>Gaze, expression, body energy, board and effects</small></div>
            <b aria-hidden="true">→</b>
            <div><span>03</span><strong>Damped controller</strong><small>Continuous transitions with safe parameter bounds</small></div>
            <b aria-hidden="true">→</b>
            <div><span>04</span><strong>Canvas mesh</strong><small>One Kiro texture system, smoothly deformed at runtime</small></div>
          </div>
        </section>

        <section className="kiro-model-capabilities" aria-labelledby="kiro-capabilities-title">
          <div className="kiro-rag-states-heading">
            <p className="eyebrow">Why this version is different</p>
            <h2 id="kiro-capabilities-title">No raw joint sliders in the product UI.</h2>
            <p>
              The model exposes normalized behavior dimensions to code, while the visible experience stays restrained. That keeps Kiro expressive without asking users to manipulate anatomy or allowing invalid poses.
            </p>
          </div>
          <div className="kiro-model-capabilities__grid">
            {capabilities.map(([title, description], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
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
