import { useMemo, useState } from 'react';
import MilestoneModal from './milestone-modal';
import {
  compareMilestoneDates,
  formatMilestoneDate,
  timelinePosition,
} from '../lib/date-utils';

const DEFAULT_PIXELS_PER_MONTH = 9;
const TOP_PADDING = 80;
const BOTTOM_PADDING = 120;

export default function LifeTimeline({
  items,
  pixelsPerMonth = DEFAULT_PIXELS_PER_MONTH,
}) {
  const [activeMilestone, setActiveMilestone] = useState(null);

  const timeline = useMemo(() => {
    const sorted = [...items].sort(compareMilestoneDates);
    const first = sorted[0];
    const last = sorted.at(-1);

    if (!first || !last) {
      return { sorted: [], height: 0 };
    }

    const positions = sorted.map((item, index) => ({
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

  if (!timeline.sorted.length) {
    return <p className="timeline-empty">No milestones have been added yet.</p>;
  }

  return (
    <>
      <div
        className="timeline-canvas"
        style={{ '--timeline-height': `${timeline.height}px` }}
      >
        <div className="timeline-axis" aria-hidden="true" />

        {timeline.sorted.map((milestone) => (
          <article
            className={`timeline-event timeline-event--${milestone.side}`}
            key={milestone.id}
            style={{ '--event-y': `${milestone.y}px` }}
          >
            <button
              className="timeline-dot"
              type="button"
              aria-label={`Open ${milestone.title}`}
              onClick={() => setActiveMilestone(milestone)}
            />

            <button
              className="timeline-card"
              type="button"
              onClick={() => setActiveMilestone(milestone)}
            >
              <span className="timeline-date">
                {formatMilestoneDate(milestone.date)}
              </span>
              <strong>{milestone.title}</strong>
              <span className="timeline-summary">{milestone.summary}</span>
              <span className="timeline-open" aria-hidden="true">
                Open ↗
              </span>
            </button>
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
