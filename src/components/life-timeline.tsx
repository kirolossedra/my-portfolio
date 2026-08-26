import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import MilestoneModal from './milestone-modal.tsx';
import {
  compareMilestoneDates,
  formatMilestoneDate,
  timelinePosition,
} from '../lib/date-utils.ts';
import type { TimelineMilestone } from '../../shared/milestone.ts';

const DEFAULT_PIXELS_PER_MONTH = 14;
const TOP_PADDING = 110;
const BOTTOM_PADDING = 150;

type TimelineSide = 'left' | 'right';

type PositionedMilestone = TimelineMilestone & {
  side: TimelineSide;
  y: number;
};

interface LifeTimelineProps {
  items: TimelineMilestone[];
  pixelsPerMonth?: number;
}

type TimelineStyle = CSSProperties & {
  '--timeline-height': string;
};

type EventStyle = CSSProperties & {
  '--event-y': string;
};

function isTouchInteraction(): boolean {
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

export default function LifeTimeline({
  items,
  pixelsPerMonth = DEFAULT_PIXELS_PER_MONTH,
}: LifeTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeMilestone, setActiveMilestone] = useState<TimelineMilestone | null>(null);

  const timeline = useMemo(() => {
    const sorted = [...items].sort(compareMilestoneDates);
    const first = sorted[0];
    const last = sorted.at(-1);

    if (!first || !last) {
      return { sorted: [] as PositionedMilestone[], height: 0 };
    }

    const positions: PositionedMilestone[] = sorted.map((item, index) => ({
      ...item,
      side: index % 2 === 0 ? 'left' : 'right',
      y: TOP_PADDING + timelinePosition(item.date, first.date, pixelsPerMonth),
    }));

    const height =
      TOP_PADDING +
      timelinePosition(last.date, first.date, pixelsPerMonth) +
      BOTTOM_PADDING;

    return { sorted: positions, height };
  }, [items, pixelsPerMonth]);

  useEffect(() => {
    const root = timelineRef.current;
    if (!root) return undefined;

    const events = root.querySelectorAll<HTMLElement>('[data-timeline-event]');
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -8% 0px' },
    );

    events.forEach((event) => revealObserver.observe(event));

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const viewportAnchor = window.innerHeight * 0.68;
      const traversed = viewportAnchor - rect.top;
      const progress = Math.min(1, Math.max(0, traversed / Math.max(rect.height, 1)));
      root.style.setProperty('--timeline-progress', progress.toFixed(4));
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
  }, [timeline.sorted]);

  if (!timeline.sorted.length) {
    return <p className="timeline-empty">No published milestones yet.</p>;
  }

  const openOnTouch = (milestone: TimelineMilestone) => {
    if (isTouchInteraction()) setActiveMilestone(milestone);
  };



  return (
    <>
      <div
        ref={timelineRef}
        className="timeline-canvas"
        style={{ '--timeline-height': `${timeline.height}px` } as TimelineStyle}
      >
        <div className="timeline-axis" aria-hidden="true">
          <span className="timeline-axis-progress" />
        </div>

        {timeline.sorted.map((milestone) => (
          <article
            className={`timeline-event timeline-event--${milestone.side}`}
            key={milestone.id}
            style={{ '--event-y': `${milestone.y}px` } as EventStyle}
            data-timeline-event
          >
            <button
              className="timeline-dot"
              type="button"
              aria-label={`Open ${milestone.title}`}
              onClick={() => openOnTouch(milestone)}
            />

            <div
              className="timeline-card"
              onClick={() => openOnTouch(milestone)}
            >
              <span className="timeline-date">{formatMilestoneDate(milestone.date)}</span>
              <strong>{milestone.title}</strong>
              <span className="timeline-summary">{milestone.summary}</span>
              <span className="timeline-touch-hint" aria-hidden="true">Tap to expand</span>

              <div className="timeline-hover-window">
                <div className="timeline-hover-media">
                  {milestone.imageSrc ? (
                    <img src={milestone.imageSrc} alt="" />
                  ) : (
                    <div className="timeline-hover-placeholder">
                      <span>{milestone.date.year}</span>
                    </div>
                  )}
                </div>

                <div className="timeline-hover-copy">
                  <p>{milestone.description}</p>
                  <a
                    className="timeline-story-link"
                    href={`/milestones/${encodeURIComponent(milestone.slug)}`}
                    onClick={(event: MouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
                  >
                    Read the full story <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <MilestoneModal
        milestone={activeMilestone}
        onClose={() => setActiveMilestone(null)}
      />
    </>
  );
}
