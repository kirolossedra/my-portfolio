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
import {
  buildEqualTimelineLayout,
  isTimelineMilestoneRevealed,
} from '../lib/timeline-layout.ts';
import { seasonForMonth, type Season } from '../lib/season-utils.ts';
import type { TimelineMilestone } from '../../shared/milestone.ts';

const DEFAULT_MILESTONE_GAP = 220;
const TOP_PADDING = 110;
const BOTTOM_PADDING = 150;
const HORIZONTAL_LEADING_PADDING = 170;
const HORIZONTAL_TRAILING_PADDING = 190;
const HORIZONTAL_MILESTONE_GAP = 300;

type TimelineSide = 'left' | 'right';
type TimelineOrientation = 'vertical' | 'horizontal';

type PositionedMilestone = TimelineMilestone & {
  side: TimelineSide;
  y: number;
  x: number;
};

interface LifeTimelineProps {
  items: TimelineMilestone[];
  milestoneGap?: number;
}

type TimelineStyle = CSSProperties & {
  '--timeline-height': string;
  '--timeline-width': string;
  '--timeline-axis-height': string;
};

type EventStyle = CSSProperties & {
  '--event-y': string;
  '--event-x': string;
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
  const [orientation, setOrientation] = useState<TimelineOrientation>('vertical');
  const closeMilestone = useCallback(() => setActiveMilestone(null), []);

  const timeline = useMemo(() => {
    const sorted = [...items].sort(compareMilestoneDates);
    const verticalLayout = buildEqualTimelineLayout(sorted.length, {
      topPadding: TOP_PADDING,
      gap: milestoneGap,
      bottomPadding: BOTTOM_PADDING,
    });
    const horizontalLayout = buildEqualTimelineLayout(sorted.length, {
      topPadding: HORIZONTAL_LEADING_PADDING,
      gap: HORIZONTAL_MILESTONE_GAP,
      bottomPadding: HORIZONTAL_TRAILING_PADDING,
    });

    const positions: PositionedMilestone[] = sorted.map((item, index) => ({
      ...item,
      side: index % 2 === 0 ? 'left' : 'right',
      y: verticalLayout.positions[index] ?? TOP_PADDING,
      x: horizontalLayout.positions[index] ?? HORIZONTAL_LEADING_PADDING,
    }));

    return {
      sorted: positions,
      height: verticalLayout.height,
      width: horizontalLayout.height,
    };
  }, [items, milestoneGap]);

  useEffect(() => {
    const root = timelineRef.current;
    if (!root) return undefined;

    lastSeasonRef.current = null;
    if (orientation === 'vertical') root.scrollLeft = 0;

    const events = Array.from(
      root.querySelectorAll<HTMLElement>('[data-timeline-event]'),
    );

    const revealAt = (traversed: number) => {
      events.forEach((event, index) => {
        const milestone = timeline.sorted[index];
        const position = orientation === 'vertical' ? milestone?.y : milestone?.x;
        event.classList.toggle(
          'is-visible',
          position !== undefined && isTimelineMilestoneRevealed(position, traversed),
        );
      });

      let active: PositionedMilestone | undefined;
      for (const milestone of timeline.sorted) {
        const position = orientation === 'vertical' ? milestone.y : milestone.x;
        if (position <= traversed) active = milestone;
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

    let frame = 0;
    const updateProgress = () => {
      frame = 0;

      if (orientation === 'horizontal') {
        const viewportAnchor = root.scrollLeft + root.clientWidth * 0.68;
        const progress = Math.min(
          1,
          Math.max(0, viewportAnchor / Math.max(timeline.width, 1)),
        );
        root.style.setProperty('--timeline-progress', progress.toFixed(4));
        revealAt(viewportAnchor);
        return;
      }

      const rect = root.getBoundingClientRect();
      const viewportAnchor = window.innerHeight * 0.68;
      const traversed = viewportAnchor - rect.top;
      const progress = Math.min(
        1,
        Math.max(0, traversed / Math.max(timeline.height, 1)),
      );
      root.style.setProperty('--timeline-progress', progress.toFixed(4));
      revealAt(traversed);
    };

    const requestProgressUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('resize', requestProgressUpdate);

    if (orientation === 'horizontal') {
      root.addEventListener('scroll', requestProgressUpdate, { passive: true });
    } else {
      window.addEventListener('scroll', requestProgressUpdate, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', requestProgressUpdate);
      root.removeEventListener('scroll', requestProgressUpdate);
      window.removeEventListener('scroll', requestProgressUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [orientation, timeline.sorted, timeline.height, timeline.width]);

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

  const toggleOrientation = () => {
    cancelScheduledHoverOpen();
    setOrientation((current) => (
      current === 'vertical' ? 'horizontal' : 'vertical'
    ));
  };

  const nextOrientation = orientation === 'vertical' ? 'Horizontal' : 'Vertical';

  return (
    <>
      <div className="timeline-toolbar">
        <span className="timeline-view-status" aria-live="polite">
          {orientation === 'vertical'
            ? 'Vertical timeline'
            : 'Horizontal timeline · swipe or scroll sideways'}
        </span>
        <button
          className="timeline-view-toggle"
          type="button"
          onClick={toggleOrientation}
          aria-label={`Switch to ${nextOrientation.toLowerCase()} timeline`}
        >
          <span className="timeline-view-toggle-icon" aria-hidden="true">
            {orientation === 'vertical' ? '↔' : '↕'}
          </span>
          {nextOrientation}
        </button>
      </div>

      <div
        ref={timelineRef}
        className={`timeline-canvas timeline-canvas--${orientation}`}
        role="region"
        aria-label={`${orientation} milestone timeline`}
        tabIndex={orientation === 'horizontal' ? 0 : undefined}
        style={
          {
            '--timeline-height': `${timeline.height}px`,
            '--timeline-width': `${timeline.width}px`,
            '--timeline-axis-height': `${timeline.height}px`,
          } as TimelineStyle
        }
      >
        <div className="timeline-track">
          <div className="timeline-axis" aria-hidden="true">
            <span className="timeline-axis-progress" />
          </div>

          {timeline.sorted.map((milestone) => (
            <article
              className={`timeline-event timeline-event--${milestone.side}`}
              key={milestone.id}
              style={
                {
                  '--event-y': `${milestone.y}px`,
                  '--event-x': `${milestone.x}px`,
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
              >
                <span className="timeline-date">{formatMilestoneDate(milestone.date)}</span>
                <strong>{milestone.title}</strong>
                <span className="timeline-summary">{milestone.summary}</span>
                <span className="timeline-touch-hint" aria-hidden="true">Tap to expand</span>
              </button>
            </article>
          ))}
        </div>
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
