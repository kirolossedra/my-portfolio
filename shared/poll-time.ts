import { POLL_TIMEZONE, PollDefinitionError } from './poll-types.ts';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const TORONTO_PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: POLL_TIMEZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function torontoLocalInstantCount(date: string, time: string): number {
  const [yearText, monthText, dayText] = date.split('-');
  const [hourText, minuteText] = time.split(':');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  let matches = 0;
  for (const utcOffsetHours of [4, 5]) {
    const candidate = new Date(Date.UTC(year, month - 1, day, hour + utcOffsetHours, minute));
    const parts = Object.fromEntries(
      TORONTO_PARTS_FORMATTER.formatToParts(candidate)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    );
    if (
      Number(parts.year) === year && Number(parts.month) === month && Number(parts.day) === day
      && Number(parts.hour) === hour && Number(parts.minute) === minute
    ) matches += 1;
  }
  return matches;
}

export function timeToMinutes(value: string): number {
  if (!TIME_RE.test(value)) throw new PollDefinitionError(`Invalid time: ${value}.`);
  const [hoursText, minutesText] = value.split(':');
  return Number(hoursText) * 60 + Number(minutesText);
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
