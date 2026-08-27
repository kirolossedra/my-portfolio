import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import MilestoneModal from './milestone-modal.tsx';
import SeasonTransitionEffect from './season-transition-effect.tsx';
import {
  compareMilestoneDates,
  formatMilestoneDate,
} from '../lib/date-utils.ts';
import { buildEqualTimelineLayout } from '../lib/timeline-layout.ts';
import { seasonForMonth, type Season } from '../lib/season-utils.ts';
import type { TimelineMilestone } from '../../shared/milestone.ts';

const DEFAULT_MILESTONE_GAP = 220;
const TOP_PADDING = 110;
const BOTTOM_PADDING = 150;

type TimelineSide = 'left' | 'right';

type PositionedMilestone = TimelineMilestone & {
  side: TimelineSide;
  y: number;
};

interface LifeTimelineProps {
  items: TimelineMilestone[];
  milestoneGap?: number;
}

type TimelineStyle = CSSProperties & {
  '--timeline-height': string;
  '--timeline-axis-height': string;
};

type EventStyle = CSSProperties & {
  '--event-y': string;
};

type SeasonEffect = {
  season: Season;
  key: number;
};

function supportsDesktopHover(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function LifeTimeline({
  items,
  milestoneGap = DEFAULT_MILESTONE_GAP,
}: LifeTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const lastSeasonRef = useRef<Season | null>(null);
  const effectSequenceRef = useRef(0);
  const hoverOpenTimerRef = useRef<number | null>(null);
  const [activeMilestone, setActiveMilestone] = useState<TimelineMilestone | null>(null);
  const [seasonEffect, setSeasonEffect] = useState<SeasonEffect | null>(null);
  const closeMilestone = useCallback(() => setActiveMilestone(null), []);

  const timeline = useMemo(() => {
    const sorted = [...items].sort(compareMilestoneDates);
    const layout = buildEqualTimelineLayout(sorted.length, {
      topPadding: TOP_PADDING,
      gap: milestoneGap,
      bottomPadding: BOTTOM_PADDING,
    });

    const positions: PositionedMilestone[] = sorted.map((item, index) => ({
      ...item,
      side: index % 2 === 0 ? 'left' : 'right',
      y: layout.positions[index] ?? TOP_PADDING,
    }));

    return { sorted: positions, height: layout.height };
  }, [items, milestoneGap]);

  useEffect(() => {
    const root = timelineRef.current;
    if (!root) return undefined;

    lastSeasonRef.current = null;

    const cards = root.querySelectorAll<HTMLElement>('.timeline-card');
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.closest<HTMLElement>('[data-timeline-event]')?.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.22, rootMargin: '0px 0px -7% 0px' },
    );

    cards.forEach((card) => revealObserver.observe(card));

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const viewportAnchor = window.innerHeight * 0.68;
      const traversed = viewportAnchor - rect.top;
      const progress = Math.min(1, Math.max(0, traversed / Math.max(timeline.height, 1)));
      root.style.setProperty('--timeline-progress', progress.toFixed(4));

      let active: PositionedMilestone | undefined;
      for (const milestone of timeline.sorted) {
        if (milestone.y <= traversed) active = milestone;
        else break;
      }

      if (!active && traversed >= 0) active = timeline.sorted[0];
      if (!active) return;

      const season = seasonForMonth(active.date.month);
      if (lastSeasonRef.current === null) {
        lastSeasonRef.current = season;
      } else if (lastSeasonRef.current !== season) {
        lastSeasonRef.current = season;
        effectSequenceRef.current += 1;
        setSeasonEffect({ season, key: effectSequenceRef.current });
      }
    };

    const requestProgressUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestProgressUpdate, { passive: true });
    window.addEventListener('resize', requestProgressUpdate);

    return () => {
      revealObserver.disconnect();
      window.removeEventListener('scroll', requestProgressUpdate);
      window.removeEventListener('resize', requestProgressUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [timeline.sorted, timeline.height]);

  useEffect(() => () => {
    if (hoverOpenTimerRef.current !== null) {
      window.clearTimeout(hoverOpenTimerRef.current);
    }
  }, []);

  if (!timeline.sorted.length) {
    return <p className="timeline-empty">No published milestones yet.</p>;
  }

  const cancelScheduledHoverOpen = () => {
    if (hoverOpenTimerRef.current === null) return;
    window.clearTimeout(hoverOpenTimerRef.current);
    hoverOpenTimerRef.current = null;
  };

  const openMilestone = (milestone: TimelineMilestone) => {
    cancelScheduledHoverOpen();
    setActiveMilestone(milestone);
  };

  const scheduleHoverOpen = (milestone: TimelineMilestone) => {
    if (!supportsDesktopHover()) return;
    cancelScheduledHoverOpen();
    hoverOpenTimerRef.current = window.setTimeout(() => {
      hoverOpenTimerRef.current = null;
      setActiveMilestone(milestone);
    }, 160);
  };

  return (
    <>
      <div
        ref={timelineRef}
        className="timeline-canvas"
        style={
          {
            '--timeline-height': `${timeline.height}px`,
            '--timeline-axis-height': `${timeline.height}px`,
          } as TimelineStyle
        }
      >
        <div className="timeline-axis" aria-hidden="true">
          <span className="timeline-axis-progress" />
        </div>

        {timeline.sorted.map((milestone) => {
          return (
            <article
              className={`timeline-event timeline-event--${milestone.side}`}
              key={milestone.id}
              style={
                {
                  '--event-y': `${milestone.y}px`,
                } as EventStyle
              }
              data-timeline-event
              data-milestone-id={milestone.id}
            >
              <button
                className="timeline-dot"
                type="button"
                aria-label={`Open ${milestone.title}`}
                aria-haspopup="dialog"
                onClick={() => openMilestone(milestone)}
                onMouseEnter={() => scheduleHoverOpen(milestone)}
                onMouseLeave={cancelScheduledHoverOpen}
              />

              <button
                className="timeline-card"
                type="button"
                aria-haspopup="dialog"
                aria-expanded={activeMilestone?.id === milestone.id}
                onClick={() => openMilestone(milestone)}
                onMouseEnter={() => scheduleHoverOpen(milestone)}
                onMouseLeave={cancelScheduledHoverOpen}
              >
                <span className="timeline-date">{formatMilestoneDate(milestone.date)}</span>
                <strong>{milestone.title}</strong>
                <span className="timeline-summary">{milestone.summary}</span>
                <span className="timeline-touch-hint" aria-hidden="true">Tap to expand</span>
              </button>
            </article>
          );
        })}
      </div>

      {seasonEffect && (
        <SeasonTransitionEffect
          season={seasonEffect.season}
          effectKey={seasonEffect.key}
          onComplete={() => setSeasonEffect(null)}
        />
      )}

      <MilestoneModal
        milestone={activeMilestone}
        onClose={closeMilestone}
      />
    </>
  );
}
