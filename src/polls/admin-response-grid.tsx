import type { CSSProperties } from 'react';
import type { AdminPollDetail, PollDefinition } from '../../shared/poll.ts';
import { computeIntersections, generateTimesForDefinition } from '../../shared/poll.ts';
import { formatTime, modeLabel, modeSymbol, participantColorClass, participantOrdinal } from './admin-poll-utils.ts';
import { compactDateParts, formatDatePageRange, POLL_DATE_PAGE_SIZE, useDateWindow } from './date-window.ts';

function DateWindowPager({ window }: { window: ReturnType<typeof useDateWindow> }) {
  return (
    <div className="poll-date-window-nav poll-week-nav" aria-label="Calendar week">
      <button type="button" onClick={window.previous} disabled={!window.canPrevious} aria-label="Previous week">‹</button>
      <div>
        <strong>{formatDatePageRange(window.visibleDates)}</strong>
        <span>Week {window.pageIndex + 1} of {window.totalPages}</span>
      </div>
      <button type="button" onClick={window.next} disabled={!window.canNext} aria-label="Next week">›</button>
    </div>
  );
}

function DateHeader({ date }: { date: string }) {
  const parts = compactDateParts(date);
  return <><span className="poll-date-weekday">{parts.weekday}</span><strong className="poll-date-day">{parts.day}</strong></>;
}

function weekHeaderCells(window: ReturnType<typeof useDateWindow>) {
  return window.pageDates.map((date, index) => date
    ? <div className="poll-grid-date" key={date}><DateHeader date={date} /></div>
    : <div className="poll-grid-date poll-grid-date--empty" key={`blank-head-${index}`} aria-hidden="true" />);
}

export function PollPreview({ definition }: { definition: PollDefinition }) {
  const times = generateTimesForDefinition(definition);
  const dateWindow = useDateWindow(definition.dates);
  return (
    <div className="poll-preview-wrap">
      <DateWindowPager window={dateWindow} />
      <div className="poll-preview-grid poll-week-grid" style={{ '--poll-date-count': POLL_DATE_PAGE_SIZE } as CSSProperties}>
        <div className="poll-grid-corner">Toronto</div>
        {weekHeaderCells(dateWindow)}
        {times.flatMap((time) => [
          <div className="poll-grid-time" key={`time-${time.startTime}`}><strong>{formatTime(time.startTime)}</strong><span>{formatTime(time.endTime)}</span></div>,
          ...dateWindow.pageDates.map((date, index) => date
            ? <div className="poll-preview-cell" key={`${date}-${time.startTime}`}>Available?</div>
            : <div className="poll-preview-cell poll-grid-cell--empty" key={`blank-${index}-${time.startTime}`} aria-hidden="true" />),
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
      <DateWindowPager window={dateWindow} />
      <div className="poll-admin-grid poll-week-grid" style={{ '--poll-date-count': POLL_DATE_PAGE_SIZE } as CSSProperties}>
        <div className="poll-grid-corner">Toronto</div>
        {weekHeaderCells(dateWindow)}
        {times.flatMap((time) => [
          <div className="poll-grid-time" key={`time-${time.startTime}`}><strong>{formatTime(time.startTime)}</strong><span>{formatTime(time.endTime)}</span></div>,
          ...dateWindow.pageDates.map((date, index) => {
            if (!date) return <div className="poll-admin-cell poll-grid-cell--empty" key={`blank-${index}-${time.startTime}`} aria-hidden="true" />;
            const slot = slotByKey.get(`${date}|${time.startTime}`);
            return (
              <div className="poll-admin-cell" key={`${date}-${time.startTime}`} tabIndex={0} aria-label={`${date} ${formatTime(time.startTime)}, ${slot?.availableCount ?? 0} of ${poll.participants.length} available`}>
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
