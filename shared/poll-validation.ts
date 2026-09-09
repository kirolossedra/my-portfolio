import {
  AVAILABILITY_MODES, POLL_TIMEZONE, PollDefinitionError,
  type AvailabilityMode, type AvailabilitySelection, type PollDefinition, type PollTimeRange,
} from './poll-types.ts';
import { generatePollSlots } from './poll-slots.ts';
import { isValidDate, timeToMinutes, torontoLocalInstantCount } from './poll-time.ts';

const MAX_DATES = 31;
const MAX_PARTICIPANTS = 25;
const MAX_TIME_RANGES = 8;
const MAX_GRID_CELLS = 600;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PollDefinitionError('Poll definition must be an object.');
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== 'string') throw new PollDefinitionError(`${name} must be a string.`);
  const normalized = value.trim();
  if (!normalized) throw new PollDefinitionError(`${name} is required.`);
  if (normalized.length > maxLength) throw new PollDefinitionError(`${name} is too long.`);
  return normalized;
}

function normalizeDates(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new PollDefinitionError('At least one date is required.');
  if (value.length > MAX_DATES) throw new PollDefinitionError(`A poll can contain at most ${MAX_DATES} dates.`);
  const dates = value.map((item) => {
    if (typeof item !== 'string' || !isValidDate(item)) throw new PollDefinitionError(`Invalid date: ${String(item)}.`);
    return item;
  });
  return [...new Set(dates)].sort();
}

function normalizeParticipants(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new PollDefinitionError('At least one expected participant is required.');
  if (value.length > MAX_PARTICIPANTS) throw new PollDefinitionError(`A poll can contain at most ${MAX_PARTICIPANTS} expected participants.`);
  const names = value.map((item) => requiredString(item, 'Participant name', 120));
  const normalizedNames = names.map((name) => name.toLocaleLowerCase('en-CA'));
  if (new Set(normalizedNames).size !== names.length) throw new PollDefinitionError('Expected participant names must be unique.');
  return names;
}

function normalizeTimeRanges(value: unknown): PollTimeRange[] {
  if (!Array.isArray(value) || value.length === 0) throw new PollDefinitionError('At least one time range is required.');
  if (value.length > MAX_TIME_RANGES) throw new PollDefinitionError(`A poll can contain at most ${MAX_TIME_RANGES} time ranges.`);
  const ranges = value.map((item) => {
    const record = asRecord(item);
    const startTime = requiredString(record.startTime, 'Start time', 5);
    const endTime = requiredString(record.endTime, 'End time', 5);
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (end <= start) throw new PollDefinitionError(`Time range ${startTime}–${endTime} must end after it starts.`);
    return { startTime, endTime };
  });
  const sorted = [...ranges].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (previous && current && timeToMinutes(current.startTime) < timeToMinutes(previous.endTime)) {
      throw new PollDefinitionError('Time ranges must not overlap.');
    }
  }
  return sorted;
}

function assertUnambiguousTorontoSlots(definition: Pick<PollDefinition, 'dates' | 'timeRanges' | 'slotWidthMinutes'>): void {
  for (const slot of generatePollSlots(definition)) {
    for (const boundary of [slot.startTime, slot.endTime]) {
      const count = torontoLocalInstantCount(slot.date, boundary);
      if (count === 0) throw new PollDefinitionError(`${slot.date} ${boundary} does not exist in ${POLL_TIMEZONE} because of a daylight-saving transition.`);
      if (count > 1) throw new PollDefinitionError(`${slot.date} ${boundary} is ambiguous in ${POLL_TIMEZONE} because of a daylight-saving transition.`);
    }
  }
}

export function validatePollDefinition(value: unknown): PollDefinition {
  const input = asRecord(value);
  const schemaVersion = input.schemaVersion ?? 1;
  if (schemaVersion !== 1) throw new PollDefinitionError('Only poll schemaVersion 1 is supported.');
  const timezone = input.timezone ?? POLL_TIMEZONE;
  if (timezone !== POLL_TIMEZONE) throw new PollDefinitionError(`V1 supports only ${POLL_TIMEZONE}.`);
  const slotWidthMinutes = Number(input.slotWidthMinutes);
  if (!Number.isInteger(slotWidthMinutes) || slotWidthMinutes < 15 || slotWidthMinutes > 480 || slotWidthMinutes % 5 !== 0) {
    throw new PollDefinitionError('slotWidthMinutes must be a whole multiple of 5 between 15 and 480 minutes.');
  }
  const definition: PollDefinition = {
    schemaVersion: 1,
    title: requiredString(input.title, 'Title', 160),
    description: (() => {
      if (input.description === undefined || input.description === null) return '';
      if (typeof input.description !== 'string') throw new PollDefinitionError('Description must be a string.');
      const description = input.description.trim();
      if (description.length > 4000) throw new PollDefinitionError('Description is too long.');
      return description;
    })(),
    timezone: POLL_TIMEZONE,
    participantNames: normalizeParticipants(input.participantNames),
    dates: normalizeDates(input.dates),
    timeRanges: normalizeTimeRanges(input.timeRanges),
    slotWidthMinutes,
  };
  const cells = generatePollSlots(definition).length;
  if (cells === 0) throw new PollDefinitionError('The selected ranges do not produce any complete slots.');
  if (cells > MAX_GRID_CELLS) throw new PollDefinitionError(`The poll grid is too large (${cells} cells; maximum ${MAX_GRID_CELLS}).`);
  assertUnambiguousTorontoSlots(definition);
  return definition;
}

export function validateSelections(
  definition: Pick<PollDefinition, 'dates' | 'timeRanges' | 'slotWidthMinutes'>,
  value: unknown,
): AvailabilitySelection[] {
  if (!Array.isArray(value)) throw new PollDefinitionError('Selections must be an array.');
  const possible = new Set(generatePollSlots(definition).map((slot) => `${slot.date}|${slot.startTime}`));
  const seen = new Set<string>();
  return value.map((item) => {
    const record = asRecord(item);
    const date = requiredString(record.date, 'Selection date', 10);
    const slotStart = requiredString(record.slotStart, 'Selection slotStart', 5);
    const mode = record.mode;
    if (!AVAILABILITY_MODES.includes(mode as AvailabilityMode)) throw new PollDefinitionError(`Invalid availability mode: ${String(mode)}.`);
    const key = `${date}|${slotStart}`;
    if (!possible.has(key)) throw new PollDefinitionError(`Selection ${date} ${slotStart} is not part of this poll.`);
    if (seen.has(key)) throw new PollDefinitionError(`Selection ${date} ${slotStart} is duplicated.`);
    seen.add(key);
    return { date, slotStart, mode: mode as AvailabilityMode };
  });
}
