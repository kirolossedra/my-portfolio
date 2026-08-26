import LifeTimeline from './components/life-timeline';
import MilestoneDetailPage from './components/milestone-detail-page';
import { milestones } from './data/milestones';

function getMilestoneFromPath() {
  const match = window.location.pathname.match(/^\/milestones\/([^/]+)\/?$/);
  if (!match) return undefined;

  return milestones.find((milestone) => milestone.slug === match[1]) ?? null;
}

export default function App() {
  const milestoneRoute = getMilestoneFromPath();

  if (milestoneRoute !== undefined) {
    return <MilestoneDetailPage milestone={milestoneRoute} />;
  }

  return (
    <div className="site-shell">
      <header className="site-nav">
        <a className="brand" href="/" aria-label="kirolos.dev home">
          kirolos<span>.dev</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#history">History</a>
          <a href="https://github.com/kirolossedra" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">Personal portfolio</p>
          <h1 id="hero-title">
            A career is more than a list of outputs.
          </h1>
          <p className="hero-copy">
            This portfolio is being built as a living record of the work,
            transitions, people, and ideas that shaped the engineer behind it.
          </p>
          <a className="hero-link" href="#history">
            Follow the timeline <span aria-hidden="true">↓</span>
          </a>
        </section>

        <section className="history-section" id="history" aria-labelledby="history-title">
          <div className="section-heading">
            <p className="eyebrow">History</p>
            <h2 id="history-title">The path, in actual time.</h2>
            <p>
              Distance between milestones is proportional to the number of
              calendar months between them. Select any point to expand it.
            </p>
          </div>

          <LifeTimeline items={milestones} />
        </section>
      </main>

      <footer className="site-footer">
        <span>© 2026 Kirolos Sedra</span>
        <span>kirolos.dev</span>
      </footer>
    </div>
  );
}
