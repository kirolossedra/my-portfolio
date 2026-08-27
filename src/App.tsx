import { useEffect, useState } from 'react';
import AdminPage from './admin/admin-page.tsx';
import AuthCallbackPage from './admin/auth-callback-page.tsx';
import LifeTimeline from './components/life-timeline.tsx';
import MilestoneDetailPage from './components/milestone-detail-page.tsx';
import OpinionsPage from './opinions-page.tsx';
import { loadMilestone, loadMilestones } from './data/milestones.ts';
import type { MilestoneDetail, TimelineMilestone } from '../shared/milestone.ts';

type LoadStatus = 'loading' | 'ready' | 'error';

function getMilestoneSlugFromPath(): string | undefined {
  const match = window.location.pathname.match(/^\/milestones\/([^/]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function PublicPortfolio() {
  const milestoneSlug = getMilestoneSlugFromPath();
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([]);
  const [milestoneDetail, setMilestoneDetail] = useState<MilestoneDetail | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setErrorMessage('');

    const request = milestoneSlug
      ? loadMilestone(milestoneSlug).then((item) => {
          if (!cancelled) setMilestoneDetail(item);
        })
      : loadMilestones().then((items) => {
          if (!cancelled) setMilestones(items);
        });

    request
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : 'Could not load portfolio content.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [milestoneSlug]);

  if (milestoneSlug) {
    if (status === 'loading') {
      return <main className="detail-page detail-page--loading">Loading story…</main>;
    }

    if (status === 'error') {
      return (
        <main className="detail-page detail-page--missing">
          <a className="back-link" href="/">← Back to timeline</a>
          <p className="eyebrow">Timeline unavailable</p>
          <h1>Story could not be loaded.</h1>
          <p>{errorMessage}</p>
        </main>
      );
    }

    return <MilestoneDetailPage milestone={milestoneDetail} />;
  }

  return (
    <div className="site-shell">
      <header className="site-nav">
        <a className="brand" href="/" aria-label="kirolos.dev home">
          kirolos<span>.dev</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#history">History</a>
          <a href="/opinions">Opinions</a>
          <a href="https://github.com/kirolossedra" target="_blank" rel="noreferrer">GitHub ↗</a>
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
          <a className="hero-link" href="#history">Follow the timeline <span aria-hidden="true">↓</span></a>
        </section>

        <section className="history-section" id="history" aria-labelledby="history-title">
          <div className="section-heading">
            <p className="eyebrow">History</p>
            <h2 id="history-title">The path, milestone by milestone.</h2>
            <p>
              The line grows with the page. Milestones reveal themselves as they enter
              view, with every dot spaced evenly for a calm, readable rhythm on every screen.
              Dates preserve the chronology. Hover on desktop; tap on touch devices.
            </p>
          </div>

          {status === 'loading' && <p className="timeline-state">Loading timeline…</p>}
          {status === 'error' && <p className="timeline-state timeline-state--error">{errorMessage}</p>}
          {status === 'ready' && <LifeTimeline items={milestones} />}
        </section>
      </main>

      <footer className="site-footer">
        <span>© 2026 Kirolos Sedra</span>
        <span>kirolos.dev</span>
      </footer>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  if (path === '/admin/auth/callback') return <AuthCallbackPage />;
  if (/^\/admin\/?$/.test(path)) return <AdminPage />;
  if (/^\/opinions\/?$/.test(path)) return <OpinionsPage />;
  return <PublicPortfolio />;
}
