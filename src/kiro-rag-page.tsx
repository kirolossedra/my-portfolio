import { useCallback, useState } from 'react';
import KiroInteractionDemo from './features/kiro-rag/kiro-interaction-demo.tsx';
import KiroGlbAvatar from './features/kiro-rag/model3d/kiro-glb-avatar.tsx';
import KiroModelDiagnostics from './features/kiro-rag/model3d/kiro-model-diagnostics.tsx';
import type {
  KiroAvatarState,
  KiroModelCapabilities,
} from './features/kiro-rag/model3d/kiro-model.types.ts';

const backbone = [
  ['GLB first', 'Kiro is now expected as a real model at public/models/kiro/kiro.glb. React no longer manufactures anatomy from a flattened picture.'],
  ['Runtime inspection', 'The loader discovers the actual bones, morph targets and authored clips in the model before trying to control it.'],
  ['Safe controller', 'Application state goes through bounded head, gaze, face, body, board and thruster controls rather than writing arbitrary transforms.'],
  ['Authored + procedural', 'Existing GLB animation clips are cross-faded when available; small procedural behaviors fill only the controls the rig actually exposes.'],
] as const;

export default function KiroRagPage() {
  const [state, setState] = useState<KiroAvatarState>('idle');
  const [capabilities, setCapabilities] = useState<KiroModelCapabilities | null>(null);
  const receiveCapabilities = useCallback((next: KiroModelCapabilities) => setCapabilities(next), []);

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

      <main className="kiro-rag-page kiro-rag-page--glb">
        <section className="kiro-rag-hero kiro-rag-hero--glb" aria-labelledby="kiro-rag-title">
          <div className="kiro-rag-copy">
            <p className="eyebrow">Portfolio intelligence</p>
            <h1 id="kiro-rag-title">Kiro Rag</h1>
            <p className="kiro-rag-lead">
              Kiro now has a real 3D-model runtime boundary. Put the rigged GLB in the model slot and this page will render it, inspect what the rig actually contains, then drive its authored animations and bounded procedural controls from KiroRag state.
            </p>
            <div className="kiro-rag-principles" aria-label="Kiro model principles">
              <span>Rigged GLB</span>
              <span>Controlled animation</span>
              <span>React state adapter</span>
            </div>
            <KiroInteractionDemo state={state} onStateChange={setState} />
          </div>

          <div className="kiro-rag-avatar-stage kiro-rag-avatar-stage--glb">
            <KiroGlbAvatar
              state={state}
              talking={state === 'answering'}
              interactiveGaze
              onCapabilities={receiveCapabilities}
            />
          </div>
        </section>

        <KiroModelDiagnostics capabilities={capabilities} />

        <section className="kiro-rag-system" aria-labelledby="kiro-system-title">
          <div className="kiro-rag-system-copy">
            <p className="eyebrow">Animation backbone</p>
            <h2 id="kiro-system-title">The GLB owns the body. The controller owns the limits.</h2>
            <p>
              The runtime never invents missing anatomy. It loads the model, resolves common bone and morph names, cross-fades authored clips when they exist, and applies only small bounded additions such as gaze, head intent, talking, board pitch and thruster response.
            </p>
          </div>

          <div className="kiro-rag-flow" aria-label="Kiro GLB control architecture">
            <div><span>01</span><strong>KiroRag event</strong><small>Thinking, retrieval, answering, completion or failure</small></div>
            <b aria-hidden="true">→</b>
            <div><span>02</span><strong>Behavior target</strong><small>Semantic intent, never arbitrary bone transforms</small></div>
            <b aria-hidden="true">→</b>
            <div><span>03</span><strong>Rig controller</strong><small>Alias resolution, limits, clip blending and procedural layers</small></div>
            <b aria-hidden="true">→</b>
            <div><span>04</span><strong>kiro.glb</strong><small>Skeleton, meshes, morph targets, board and authored clips</small></div>
          </div>
        </section>

        <section className="kiro-model-capabilities" aria-labelledby="kiro-capabilities-title">
          <div className="kiro-rag-states-heading">
            <p className="eyebrow">Backbone responsibilities</p>
            <h2 id="kiro-capabilities-title">No more image-cutout animation path.</h2>
            <p>
              The React layer treats the model as an authored asset with a contract. If a capability is missing from the GLB, diagnostics report it instead of faking the missing geometry.
            </p>
          </div>
          <div className="kiro-model-capabilities__grid">
            {backbone.map(([title, description], index) => (
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
