import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { AvailabilityMode, PollDefinition } from '../../shared/poll.ts';
import { generateTimesForDefinition } from '../../shared/poll.ts';
import { compactDateParts, formatDatePageRange, POLL_DATE_PAGE_SIZE, useDateWindow } from './date-window.ts';

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

function compactTime(time: string): string {
  const [hourText = '0', minuteText = '0'] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return minute === 0 ? `${displayHour} ${suffix}` : `${displayHour}:${String(minute).padStart(2, '0')}`;
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
  const [paintEnabled, setPaintEnabled] = useState(false);
  const dateWindow = useDateWindow(definition.dates);
  const gridRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const paintedCells = useRef(new Set<string>());
  const valueRef = useRef(value);
  valueRef.current = value;

  const apply = (date: string, startTime: string) => {
    if (disabled) return;
    const next = new Map(valueRef.current);
    const slotKey = key(date, startTime);
    if (paintMode === 'unavailable') next.delete(slotKey);
    else next.set(slotKey, paintMode);
    valueRef.current = next;
    onChange(next);
  };

  const paintCell = (cell: HTMLElement) => {
    const date = cell.dataset.pollDate;
    const startTime = cell.dataset.pollStart;
    if (!date || !startTime) return;
    const slotKey = key(date, startTime);
    if (paintedCells.current.has(slotKey)) return;
    paintedCells.current.add(slotKey);
    apply(date, startTime);
  };

  const cellAtPoint = (clientX: number, clientY: number): HTMLElement | null => {
    const hit = document.elementFromPoint(clientX, clientY);
    const cell = hit?.closest<HTMLElement>('[data-poll-paint-cell="true"]') ?? null;
    return cell && gridRef.current?.contains(cell) ? cell : null;
  };

  const startPainting = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!paintEnabled || disabled) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-poll-paint-cell="true"]')
      : null;
    if (!target || !event.currentTarget.contains(target)) return;

    event.preventDefault();
    activePointerId.current = event.pointerId;
    paintedCells.current.clear();
    event.currentTarget.setPointerCapture(event.pointerId);
    paintCell(target);
  };

  const continuePainting = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!paintEnabled || activePointerId.current !== event.pointerId) return;
    event.preventDefault();
    const cell = cellAtPoint(event.clientX, event.clientY);
    if (cell) paintCell(cell);
  };

  const stopPainting = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerId.current = null;
    paintedCells.current.clear();
  };

  const togglePaint = () => {
    activePointerId.current = null;
    paintedCells.current.clear();
    setPaintEnabled((current) => !current);
  };

  return (
    <section className="poll-grid-section" aria-label="Availability grid">
      <div className="poll-paint-control">
        <button
          type="button"
          className={`poll-paint-toggle${paintEnabled ? ' is-active' : ''}`}
          aria-pressed={paintEnabled}
          onClick={togglePaint}
          disabled={disabled}
        >
          <span className="poll-paint-icon" aria-hidden="true">✦</span>
          <span className="poll-paint-copy">
            <strong>Paint availability</strong>
            <small>{paintEnabled ? 'ON · drag across slots' : 'Tap to paint multiple slots'}</small>
          </span>
          <span className="poll-paint-state" aria-hidden="true">{paintEnabled ? 'ON' : 'OFF'}</span>
        </button>
        {paintEnabled && <span className="poll-paint-lock" role="status">Calendar scrolling locked while painting</span>}
      </div>

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

      <div className="poll-date-window-nav poll-week-nav" aria-label="Calendar week">
        <button type="button" onClick={dateWindow.previous} disabled={!dateWindow.canPrevious} aria-label="Previous week">‹</button>
        <div>
          <strong>{formatDatePageRange(dateWindow.visibleDates)}</strong>
          <span>Week {dateWindow.pageIndex + 1} of {dateWindow.totalPages}</span>
        </div>
        <button type="button" onClick={dateWindow.next} disabled={!dateWindow.canNext} aria-label="Next week">›</button>
      </div>

      <div
        ref={gridRef}
        className={`poll-grid poll-week-grid${paintEnabled ? ' is-paint-enabled' : ''}`}
        style={{ '--poll-date-count': POLL_DATE_PAGE_SIZE } as CSSProperties}
        onPointerDown={startPainting}
        onPointerMove={continuePainting}
        onPointerUp={stopPainting}
        onPointerCancel={stopPainting}
        onLostPointerCapture={() => {
          activePointerId.current = null;
          paintedCells.current.clear();
        }}
      >
        <div className="poll-grid-corner">Toronto</div>
        {dateWindow.pageDates.map((date, index) => {
          if (!date) return <div key={`blank-head-${index}`} className="poll-grid-date poll-grid-date--empty" aria-hidden="true" />;
          const parts = compactDateParts(date);
          return (
            <div key={date} className="poll-grid-date" title={longDate(date)}>
              <span className="poll-date-weekday">{parts.weekday}</span>
              <strong className="poll-date-day">{parts.day}</strong>
            </div>
          );
        })}
        {times.flatMap((time) => [
          <div className="poll-grid-time" key={`time-${time.startTime}`} title={`${displayTime(time.startTime)}–${displayTime(time.endTime)}`}>
            <strong>{compactTime(time.startTime)}</strong>
            <span>{compactTime(time.endTime)}</span>
          </div>,
          ...dateWindow.pageDates.map((date, index) => {
            if (!date) return <div className="poll-grid-cell poll-grid-cell--empty" key={`blank-${index}-${time.startTime}`} aria-hidden="true" />;
            const mode = value.get(key(date, time.startTime)) ?? 'unavailable';
            const meta = MODE_META[mode];
            return (
              <button
                type="button"
                key={`${date}-${time.startTime}`}
                className={`poll-grid-cell mode-${mode}`}
                data-poll-paint-cell="true"
                data-poll-date={date}
                data-poll-start={time.startTime}
                aria-label={`${spokenDate(date)}, ${displayTime(time.startTime)} to ${displayTime(time.endTime)}, currently ${meta.label}`}
                title={`${longDate(date)} ${displayTime(time.startTime)}–${displayTime(time.endTime)}: ${meta.label}`}
                onClick={(event) => {
                  if (!paintEnabled || event.detail === 0) apply(date, time.startTime);
                }}
                onPointerEnter={(event) => {
                  if (!paintEnabled && event.pointerType === 'mouse' && event.buttons === 1) apply(date, time.startTime);
                }}
                disabled={disabled}
              >
                {mode !== 'unavailable' && <span className="poll-cell-symbol" aria-hidden="true">{meta.symbol}</span>}
                <span className="poll-cell-label">{meta.label}</span>
              </button>
            );
          }),
        ])}
      </div>
      <p className="poll-grid-help">
        {paintEnabled
          ? 'Paint is on. Choose a mode, then press and drag across slots. The calendar will not scroll while your finger or pen is on it.'
          : `Choose a mode, then tap the grid. Seven dates stay visible as one week page; use the arrows for the next week. Only complete ${definition.slotWidthMinutes}-minute slots are shown.`}
      </p>
    </section>
  );
}
