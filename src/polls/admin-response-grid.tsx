import type { CSSProperties } from 'react';
import type { AdminPollDetail, PollDefinition } from '../../shared/poll.ts';
import { computeIntersections, generateTimesForDefinition } from '../../shared/poll.ts';
import { formatDate, formatTime, modeLabel, modeSymbol, participantColorClass, participantOrdinal } from './admin-poll-utils.ts';
import { useDateWindow } from './date-window.ts';

function DateWindowPager({ dates, window }: { dates: string[]; window: ReturnType<typeof useDateWindow> }) {
  const first = window.visibleDates[0] ?? dates[0] ?? '';
  const last = window.visibleDates.at(-1) ?? first;
  return (
    <div className="poll-date-window-nav" aria-label="Visible calendar days">
      <button type="button" onClick={window.previous} disabled={!window.canPrevious} aria-label="Previous days">←</button>
      <div>
        <strong>{formatDate(first)}{last !== first ? ` – ${formatDate(last)}` : ''}</strong>
        <span>Showing {window.startIndex + 1}–{window.endIndex} of {dates.length} days</span>
      </div>
      <button type="button" onClick={window.next} disabled={!window.canNext} aria-label="Next days">→</button>
    </div>
  );
}

export function PollPreview({ definition }: { definition: PollDefinition }) {
  const times = generateTimesForDefinition(definition);
  const dateWindow = useDateWindow(definition.dates);
  return (
    <div className="poll-preview-wrap">
      <DateWindowPager dates={definition.dates} window={dateWindow} />
      <div className="poll-preview-grid" style={{ '--poll-date-count': dateWindow.visibleDates.length } as CSSProperties}>
        <div className="poll-grid-corner">Toronto time</div>
        {dateWindow.visibleDates.map((date) => <div className="poll-grid-date" key={date}><strong>{formatDate(date)}</strong></div>)}
        {times.flatMap((time) => [
          <div className="poll-grid-time" key={`time-${time.startTime}`}><strong>{formatTime(time.startTime)}</strong><span>{formatTime(time.endTime)}</span></div>,
          ...dateWindow.visibleDates.map((date) => <div className="poll-preview-cell" key={`${date}-${time.startTime}`}>Available?</div>),
        ])}
      </div>
      <p className="poll-grid-help">Only complete slots are generated. A trailing remainder shorter than {definition.slotWidthMinutes} minutes is intentionally discarded.</p>
    </div>
  );
}

export function ParticipantColorLegend({ poll }: { poll: AdminPollDetail }) {
  return (
    <div className="poll-participant-color-legend" aria-label="Participant color legend">
      {poll.participants.map((participant) => (
        <span key={participant.id} className={participantColorClass(poll.participants, participant.id)}>
          <b>{participantOrdinal(poll.participants, participant.id)}</b>
          <span>{participant.displayName}</span>
        </span>
      ))}
    </div>
  );
}

export function AdminResponseGrid({ poll }: { poll: AdminPollDetail }) {
  const intersections = computeIntersections(poll.definition, poll.participants, poll.responses);
  const times = generateTimesForDefinition(poll.definition);
  const slotByKey = new Map(intersections.map((slot) => [`${slot.date}|${slot.startTime}`, slot]));
  const dateWindow = useDateWindow(poll.definition.dates);
  return (
    <div className="poll-admin-grid-wrap">
      <ParticipantColorLegend poll={poll} />
      <DateWindowPager dates={poll.definition.dates} window={dateWindow} />
      <div className="poll-admin-grid" style={{ '--poll-date-count': dateWindow.visibleDates.length } as CSSProperties}>
        <div className="poll-grid-corner">Toronto time</div>
        {dateWindow.visibleDates.map((date) => <div className="poll-grid-date" key={date}><strong>{formatDate(date)}</strong></div>)}
        {times.flatMap((time) => [
          <div className="poll-grid-time" key={`time-${time.startTime}`}><strong>{formatTime(time.startTime)}</strong><span>{formatTime(time.endTime)}</span></div>,
          ...dateWindow.visibleDates.map((date) => {
            const slot = slotByKey.get(`${date}|${time.startTime}`);
            return (
              <div className="poll-admin-cell" key={`${date}-${time.startTime}`} tabIndex={0} aria-label={`${formatDate(date)} ${formatTime(time.startTime)}, ${slot?.availableCount ?? 0} of ${poll.participants.length} available`}>
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
