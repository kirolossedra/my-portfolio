import { useState, type CSSProperties } from 'react';
import type { AdminPollDetail, PollDefinition } from '../../shared/poll.ts';
import { computeIntersections, generateTimesForDefinition } from '../../shared/poll.ts';
import { formatDate, formatTime, modeLabel, modeSymbol, participantColorClass, participantOrdinal } from './admin-poll-utils.ts';

export function PollPreview({ definition }: { definition: PollDefinition }) {
  const times = generateTimesForDefinition(definition);
  const [mobileDateIndex, setMobileDateIndex] = useState(0);
  return (
    <div className="poll-preview-wrap">
      <MobileDatePager
        dates={definition.dates}
        activeIndex={mobileDateIndex}
        onChange={setMobileDateIndex}
        label="Preview date"
      />
      <div className="poll-preview-grid" style={{ '--poll-date-count': definition.dates.length } as CSSProperties}>
        <div className="poll-grid-corner">Toronto time</div>
        {definition.dates.map((date, dateIndex) => <div className={`poll-grid-date${dateIndex === mobileDateIndex ? ' is-mobile-active' : ''}`} key={date}><strong>{formatDate(date)}</strong></div>)}
        {times.flatMap((time) => [
          <div className="poll-grid-time" key={`time-${time.startTime}`}><strong>{formatTime(time.startTime)}</strong><span>{formatTime(time.endTime)}</span></div>,
          ...definition.dates.map((date, dateIndex) => <div className={`poll-preview-cell${dateIndex === mobileDateIndex ? ' is-mobile-active' : ''}`} key={`${date}-${time.startTime}`}>Available?</div>),
        ])}
      </div>
      <p className="poll-grid-help">Only complete slots are generated. A trailing remainder shorter than {definition.slotWidthMinutes} minutes is intentionally discarded.</p>
    </div>
  );
}

function MobileDatePager({
  dates,
  activeIndex,
  onChange,
  label,
}: {
  dates: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  label: string;
}) {
  const activeDate = dates[activeIndex] ?? dates[0] ?? '';
  return (
    <div className="poll-mobile-date-nav" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} aria-label="Previous date">←</button>
      <strong>{formatDate(activeDate)}</strong>
      <button type="button" onClick={() => onChange(Math.min(dates.length - 1, activeIndex + 1))} disabled={activeIndex >= dates.length - 1} aria-label="Next date">→</button>
    </div>
  );
}

export function AdminResponseGrid({ poll }: { poll: AdminPollDetail }) {
  const intersections = computeIntersections(poll.definition, poll.participants, poll.responses);
  const times = generateTimesForDefinition(poll.definition);
  const slotByKey = new Map(intersections.map((slot) => [`${slot.date}|${slot.startTime}`, slot]));
  const [mobileDateIndex, setMobileDateIndex] = useState(0);
  return (
    <div className="poll-admin-grid-wrap">
      <MobileDatePager
        dates={poll.definition.dates}
        activeIndex={mobileDateIndex}
        onChange={setMobileDateIndex}
        label="Response grid date"
      />
      <div className="poll-admin-grid" style={{ '--poll-date-count': poll.definition.dates.length } as CSSProperties}>
        <div className="poll-grid-corner">Toronto time</div>
        {poll.definition.dates.map((date, dateIndex) => <div className={`poll-grid-date${dateIndex === mobileDateIndex ? ' is-mobile-active' : ''}`} key={date}><strong>{formatDate(date)}</strong></div>)}
        {times.flatMap((time) => [
          <div className="poll-grid-time" key={`time-${time.startTime}`}><strong>{formatTime(time.startTime)}</strong><span>{formatTime(time.endTime)}</span></div>,
          ...poll.definition.dates.map((date, dateIndex) => {
            const slot = slotByKey.get(`${date}|${time.startTime}`);
            return (
              <div className={`poll-admin-cell${dateIndex === mobileDateIndex ? ' is-mobile-active' : ''}`} key={`${date}-${time.startTime}`} tabIndex={0} aria-label={`${formatDate(date)} ${formatTime(time.startTime)}, ${slot?.availableCount ?? 0} of ${poll.participants.length} available`}>
                <strong>{slot?.availableCount ?? 0}/{poll.participants.length}</strong>
                <div className="poll-participant-chips">
                  {slot?.participantModes.map((entry) => (
                    <span
                      key={entry.participantId}
                      className={`poll-participant-chip ${participantColorClass(poll.participants, entry.participantId)}`}
                      title={`${entry.displayName}: ${modeLabel(entry.mode)}`}
                    >
                      <b>{participantOrdinal(poll.participants, entry.participantId)}</b>
                      <span aria-hidden="true">{modeSymbol(entry.mode)}</span>
                      <span className="sr-only">{entry.displayName}, {modeLabel(entry.mode)}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          }),
        ])}
      </div>
    </div>
  );
}
