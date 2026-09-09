import { useMemo, useState, type CSSProperties } from 'react';
import type { AvailabilityMode, PollDefinition } from '../../shared/poll.ts';
import { generateTimesForDefinition } from '../../shared/poll.ts';
import { useDateWindow } from './date-window.ts';

export type AvailabilityPaintMode = AvailabilityMode | 'unavailable';

const MODE_META: Record<AvailabilityPaintMode, { label: string; symbol: string }> = {
  unavailable: { label: 'Unavailable', symbol: '×' },
  online: { label: 'Online', symbol: '◉' },
  in_person: { label: 'In person', symbol: '●' },
  either: { label: 'Either', symbol: '◐' },
};

function dateAnchor(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 16));
}

function longDate(date: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', weekday: 'short', month: 'short', day: 'numeric',
  }).format(dateAnchor(date));
}

function spokenDate(date: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', month: 'long', day: 'numeric', year: 'numeric',
  }).format(dateAnchor(date));
}

function displayTime(time: string): string {
  const [hourText = '0', minuteText = '0'] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function key(date: string, startTime: string): string {
  return `${date}|${startTime}`;
}

export default function AvailabilityGrid({
  definition,
  value,
  onChange,
  disabled = false,
}: {
  definition: PollDefinition;
  value: Map<string, AvailabilityMode>;
  onChange: (next: Map<string, AvailabilityMode>) => void;
  disabled?: boolean;
}) {
  const times = useMemo(() => generateTimesForDefinition(definition), [definition]);
  const [paintMode, setPaintMode] = useState<AvailabilityPaintMode>('either');
  const dateWindow = useDateWindow(definition.dates);

  const apply = (date: string, startTime: string) => {
    if (disabled) return;
    const next = new Map(value);
    const slotKey = key(date, startTime);
    if (paintMode === 'unavailable') next.delete(slotKey);
    else next.set(slotKey, paintMode);
    onChange(next);
  };

  const firstVisibleDate = dateWindow.visibleDates[0] ?? definition.dates[0] ?? '';
  const lastVisibleDate = dateWindow.visibleDates.at(-1) ?? firstVisibleDate;

  return (
    <section className="poll-grid-section" aria-label="Availability grid">
      <div className="poll-mode-toolbar" aria-label="Availability paint mode">
        <span>Mark as</span>
        {Object.entries(MODE_META).map(([mode, meta]) => (
          <button
            key={mode}
            type="button"
            className={`poll-mode-button mode-${mode}${paintMode === mode ? ' is-active' : ''}`}
            aria-pressed={paintMode === mode}
            onClick={() => setPaintMode(mode as AvailabilityPaintMode)}
            disabled={disabled}
          >
            <span aria-hidden="true">{meta.symbol}</span>{meta.label}
          </button>
        ))}
      </div>

      <div className="poll-date-window-nav" aria-label="Visible calendar days">
        <button type="button" onClick={dateWindow.previous} disabled={!dateWindow.canPrevious} aria-label="Previous days">←</button>
        <div>
          <strong>{longDate(firstVisibleDate)}{lastVisibleDate !== firstVisibleDate ? ` – ${longDate(lastVisibleDate)}` : ''}</strong>
          <span>Showing {dateWindow.startIndex + 1}–{dateWindow.endIndex} of {definition.dates.length} days</span>
        </div>
        <button type="button" onClick={dateWindow.next} disabled={!dateWindow.canNext} aria-label="Next days">→</button>
      </div>

      <div className="poll-grid" style={{ '--poll-date-count': dateWindow.visibleDates.length } as CSSProperties}>
        <div className="poll-grid-corner">Toronto time</div>
        {dateWindow.visibleDates.map((date) => (
          <div key={date} className="poll-grid-date">
            <strong>{longDate(date)}</strong>
          </div>
        ))}
        {times.flatMap((time) => [
          <div className="poll-grid-time" key={`time-${time.startTime}`}>
            <strong>{displayTime(time.startTime)}</strong>
            <span>{displayTime(time.endTime)}</span>
          </div>,
          ...dateWindow.visibleDates.map((date) => {
            const mode = value.get(key(date, time.startTime)) ?? 'unavailable';
            const meta = MODE_META[mode];
            return (
              <button
                type="button"
                key={`${date}-${time.startTime}`}
                className={`poll-grid-cell mode-${mode}`}
                aria-label={`${spokenDate(date)}, ${displayTime(time.startTime)} to ${displayTime(time.endTime)}, currently ${meta.label}`}
                title={`${longDate(date)} ${displayTime(time.startTime)}–${displayTime(time.endTime)}: ${meta.label}`}
                onClick={() => apply(date, time.startTime)}
                onPointerDown={(event) => {
                  if (event.pointerType === 'mouse') apply(date, time.startTime);
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse' && event.buttons === 1) apply(date, time.startTime);
                }}
                disabled={disabled}
              >
                <span className="poll-cell-symbol" aria-hidden="true">{meta.symbol}</span>
                <span className="poll-cell-label">{meta.label}</span>
              </button>
            );
          }),
        ])}
      </div>
      <p className="poll-grid-help">Choose a mode, then tap cells. Several days stay visible together; use the arrows to move through the date window. Desktop mouse users can hold and paint across cells. Unselected cells mean unavailable.</p>
    </section>
  );
}
