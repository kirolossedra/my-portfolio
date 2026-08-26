import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import MilestoneModal from './milestone-modal.tsx';
import SeasonTransitionEffect from './season-transition-effect.tsx';
import {
  compareMilestoneDates,
  formatMilestoneDate,
  timelinePosition,
} from '../lib/date-utils.ts';
import { resolveTimelineLabelLayout } from '../lib/timeline-layout.ts';
import { seasonForMonth, type Season } from '../lib/season-utils.ts';
import type { TimelineMilestone } from '../../shared/milestone.ts';

const DEFAULT_PIXELS_PER_MONTH = 14;
const TOP_PADDING = 110;
const BOTTOM_PADDING = 150;
const MOBILE_BREAKPOINT = '(max-width: 760px)';
const MOBILE_NATURAL_CARD_OFFSET = -18;
const MOBILE_CARD_GAP = 28;
const MOBILE_CARD_ANCHOR_Y = 18;
const MOBILE_CONNECTOR_WIDTH = 54;

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
  '--timeline-axis-height': string;
};

type EventStyle = CSSProperties & {
  '--event-y': string;
  '--mobile-card-offset': string;
};

type SeasonEffect = {
  season: Season;
  key: number;
};

type MobileTimelineLayout = {
  offsets: Record<number, number>;
  height: number;
};

function isTouchInteraction(): boolean {
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

function layoutsMatch(a: MobileTimelineLayout | null, b: MobileTimelineLayout | null): boolean {
  if (a === b) return true;
  if (!a || !b || a.height !== b.height) return false;

  const aEntries = Object.entries(a.offsets);
  const bEntries = Object.entries(b.offsets);
  if (aEntries.length !== bEntries.length) return false;

  return aEntries.every(([id, value]) => b.offsets[Number(id)] === value);
}

function MobileTimelineConnector({ drop }: { drop: number }) {
  const clampedDrop = Math.max(0, drop);
  const height = Math.max(1, clampedDrop + 1);
  const endY = clampedDrop + 0.5;
  const branchX = clampedDrop > 4 ? 12 : 0;
  const curveY = Math.min(16, Math.max(4, clampedDrop * 0.35));
  const path = clampedDrop <= 1
    ? `M 0 0.5 H ${MOBILE_CONNECTOR_WIDTH}`
    : `M 0 0.5 C ${branchX} 0.5 ${branchX} ${curveY} ${branchX} ${curveY} V ${Math.max(curveY, endY - curveY)} C ${branchX} ${endY} ${branchX + 8} ${endY} ${branchX + 16} ${endY} H ${MOBILE_CONNECTOR_WIDTH}`;

  return (
    <svg
      className="timeline-mobile-connector"
      aria-hidden="true"
      width={MOBILE_CONNECTOR_WIDTH}
      height={height}
      viewBox={`0 0 ${MOBILE_CONNECTOR_WIDTH} ${height}`}
      preserveAspectRatio="none"
    >
      <path d={path} />
    </svg>
  );
}

export default function LifeTimeline({
  items,
  pixelsPerMonth = DEFAULT_PIXELS_PER_MONTH,
}: LifeTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const lastSeasonRef = useRef<Season | null>(null);
  const effectSequenceRef = useRef(0);
  const [activeMilestone, setActiveMilestone] = useState<TimelineMilestone | null>(null);
  const [seasonEffect, setSeasonEffect] = useState<SeasonEffect | null>(null);
  const [mobileLayout, setMobileLayout] = useState<MobileTimelineLayout | null>(null);

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

  useLayoutEffect(() => {
    const root = timelineRef.current;
    if (!root || !timeline.sorted.length) {
      setMobileLayout(null);
      return undefined;
    }

    const mobileQuery = window.matchMedia(MOBILE_BREAKPOINT);
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;

    const calculate = () => {
      frame = 0;

      if (!mobileQuery.matches) {
        setMobileLayout((current) => (current === null ? current : null));
        return;
      }

      const measurements = timeline.sorted.map((milestone) => {
        const card = root.querySelector<HTMLElement>(
          `[data-milestone-id="${milestone.id}"] .timeline-card`,
        );

        return {
          id: milestone.id,
          anchorY: milestone.y,
          height: card?.getBoundingClientRect().height ?? 0,
        };
      });

      const resolved = resolveTimelineLabelLayout(measurements, {
        naturalOffset: MOBILE_NATURAL_CARD_OFFSET,
        minimumGap: MOBILE_CARD_GAP,
      });

      const nextLayout: MobileTimelineLayout = {
        offsets: resolved.offsets,
        height: Math.max(timeline.height, resolved.contentBottom + BOTTOM_PADDING),
      };

      setMobileLayout((current) => (layoutsMatch(current, nextLayout) ? current : nextLayout));
    };

    const requestCalculate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(calculate);
    };

    resizeObserver = new ResizeObserver(requestCalculate);
    root.querySelectorAll<HTMLElement>('.timeline-card').forEach((card) => resizeObserver?.observe(card));
    mobileQuery.addEventListener('change', requestCalculate);
    window.addEventListener('resize', requestCalculate);
    requestCalculate();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mobileQuery.removeEventListener('change', requestCalculate);
      window.removeEventListener('resize', requestCalculate);
    };
  }, [timeline]);

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
  }, [timeline.sorted, timeline.height, mobileLayout?.height]);

  if (!timeline.sorted.length) {
    return <p className="timeline-empty">No published milestones yet.</p>;
  }

  const openOnTouch = (milestone: TimelineMilestone) => {
    if (isTouchInteraction()) setActiveMilestone(milestone);
  };

  const renderedHeight = mobileLayout?.height ?? timeline.height;

  return (
    <>
      <div
        ref={timelineRef}
        className="timeline-canvas"
        style={
          {
            '--timeline-height': `${renderedHeight}px`,
            '--timeline-axis-height': `${timeline.height}px`,
          } as TimelineStyle
        }
      >
        <div className="timeline-axis" aria-hidden="true">
          <span className="timeline-axis-progress" />
        </div>

        {timeline.sorted.map((milestone) => {
          const mobileCardOffset = mobileLayout?.offsets[milestone.id] ?? MOBILE_NATURAL_CARD_OFFSET;
          const connectorDrop = Math.max(0, mobileCardOffset + MOBILE_CARD_ANCHOR_Y);

          return (
            <article
              className={`timeline-event timeline-event--${milestone.side}`}
              key={milestone.id}
              style={
                {
                  '--event-y': `${milestone.y}px`,
                  '--mobile-card-offset': `${mobileCardOffset}px`,
                } as EventStyle
              }
              data-timeline-event
              data-milestone-id={milestone.id}
            >
              <button
                className="timeline-dot"
                type="button"
                aria-label={`Open ${milestone.title}`}
                onClick={() => openOnTouch(milestone)}
              />

              <MobileTimelineConnector drop={connectorDrop} />

              <div className="timeline-card" onClick={() => openOnTouch(milestone)}>
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
        onClose={() => setActiveMilestone(null)}
      />
    </>
  );
}
