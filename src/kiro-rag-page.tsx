import KiroAvatar from './features/kiro-rag/avatar/kiro-avatar.tsx';

const states = [
  ['Idle', 'Calm presence while the interface is waiting.'],
  ['Thinking', 'A semantic state for reasoning before retrieval.'],
  ['Retrieving', 'Signals that portfolio context is being searched.'],
  ['Answering', 'Represents synthesis and response generation.'],
  ['Success', 'A short confirmation state when the task completes.'],
  ['Error', 'A clear recovery state instead of a silent failure.'],
] as const;

export default function KiroRagPage() {
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
              A retrieval interface for the work behind this portfolio, represented by a 2D avatar whose behavior can eventually reflect what the system is actually doing.
            </p>
            <div className="kiro-rag-principles" aria-label="Kiro Rag implementation principles">
              <span>Canonical visual first</span>
              <span>2D React architecture</span>
              <span>State-driven behavior</span>
            </div>
          </div>

          <div className="kiro-rag-avatar-stage">
            <div className="kiro-rag-stage-glow" aria-hidden="true" />
            <KiroAvatar />
          </div>
        </section>

        <section className="kiro-rag-system" aria-labelledby="kiro-system-title">
          <div className="kiro-rag-system-copy">
            <p className="eyebrow">Built as a subsystem</p>
            <h2 id="kiro-system-title">The character is an interface, not a GIF.</h2>
            <p>
              The approved artwork is locked as the visual contract first. The next rigging layer can split face, gaze, arrow, body, board, and both thrusters into independent 2D controls while keeping the React API stable.
            </p>
          </div>

          <div className="kiro-rag-flow" aria-label="Kiro Rag architecture flow">
            <div><span>01</span><strong>Portfolio corpus</strong><small>Projects, history, skills, evidence</small></div>
            <b aria-hidden="true">→</b>
            <div><span>02</span><strong>Retrieval</strong><small>Find the context relevant to the question</small></div>
            <b aria-hidden="true">→</b>
            <div><span>03</span><strong>Kiro state</strong><small>Translate product state into avatar semantics</small></div>
            <b aria-hidden="true">→</b>
            <div><span>04</span><strong>2D avatar</strong><small>Expression, gaze, arrow, board, thrusters</small></div>
          </div>
        </section>

        <section className="kiro-rag-states" aria-labelledby="kiro-states-title">
          <div className="kiro-rag-states-heading">
            <p className="eyebrow">State vocabulary</p>
            <h2 id="kiro-states-title">One character. Different system states.</h2>
            <p>
              These are semantic states for the future rig. They are intentionally separated from the artwork so retrieval logic never manipulates presentation details directly.
            </p>
          </div>

          <div className="kiro-rag-state-grid">
            {states.map(([name, description], index) => (
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
