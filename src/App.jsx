import { useEffect, useMemo, useState } from 'react';
import LifeTimeline from './components/life-timeline';
import MilestoneDetailPage from './components/milestone-detail-page';
import { loadMilestones } from './data/milestones';

function getMilestoneSlugFromPath() {
  const match = window.location.pathname.match(/^\/milestones\/([^/]+)\/?$/);
  return match ? match[1] : undefined;
}

export default function App() {
  const [milestones, setMilestones] = useState([]);
  const [timelineStatus, setTimelineStatus] = useState('loading');
  const [timelineError, setTimelineError] = useState('');
  const milestoneSlug = getMilestoneSlugFromPath();

  useEffect(() => {
    let cancelled = false;

    loadMilestones()
      .then((items) => {
        if (cancelled) return;
        setMilestones(items);
        setTimelineStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setTimelineError(error instanceof Error ? error.message : 'Could not load timeline.');
        setTimelineStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const routedMilestone = useMemo(() => {
    if (milestoneSlug === undefined || timelineStatus !== 'ready') return undefined;
    return milestones.find((milestone) => milestone.slug === milestoneSlug) ?? null;
  }, [milestoneSlug, milestones, timelineStatus]);

  if (milestoneSlug !== undefined) {
    if (timelineStatus === 'loading') {
      return <main className="detail-page detail-page--loading">Loading story…</main>;
    }

    if (timelineStatus === 'error') {
      return (
        <main className="detail-page detail-page--missing">
          <a className="back-link" href="/">← Back to timeline</a>
          <p className="eyebrow">Timeline unavailable</p>
          <h1>Story could not be loaded.</h1>
          <p>{timelineError}</p>
        </main>
      );
    }

    return <MilestoneDetailPage milestone={routedMilestone} />;
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
          <h1 id="hero-title">A career is more than a list of outputs.</h1>
          <p className="hero-copy">
            A living record of the work, transitions, people, and ideas that shaped
            the engineer behind them.
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
              The line grows with the page. Milestones reveal themselves as they enter
              view, and the distance between dots reflects the calendar time between them.
              Hover on desktop; tap on touch devices.
            </p>
          </div>

          {timelineStatus === 'loading' && (
            <p className="timeline-state">Loading timeline…</p>
          )}
          {timelineStatus === 'error' && (
            <p className="timeline-state timeline-state--error">{timelineError}</p>
          )}
          {timelineStatus === 'ready' && <LifeTimeline items={milestones} />}
        </section>
      </main>

      <footer className="site-footer">
        <span>© 2026 Kirolos Sedra</span>
        <span>kirolos.dev</span>
      </footer>
    </div>
  );
}
