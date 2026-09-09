import type { PollDefinition, PollSlot } from './poll-types.ts';
import { minutesToTime, timeToMinutes } from './poll-time.ts';

export function generateTimesForDefinition(
  definition: Pick<PollDefinition, 'timeRanges' | 'slotWidthMinutes'>,
): Array<{ startTime: string; endTime: string }> {
  const slots: Array<{ startTime: string; endTime: string }> = [];
  for (const range of definition.timeRanges) {
    const start = timeToMinutes(range.startTime);
    const end = timeToMinutes(range.endTime);
    for (let cursor = start; cursor + definition.slotWidthMinutes <= end; cursor += definition.slotWidthMinutes) {
      slots.push({
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(cursor + definition.slotWidthMinutes),
      });
    }
  }
  return slots;
}

export function generatePollSlots(
  definition: Pick<PollDefinition, 'dates' | 'timeRanges' | 'slotWidthMinutes'>,
): PollSlot[] {
  const times = generateTimesForDefinition(definition);
  return definition.dates.flatMap((date) => times.map((time) => ({ date, ...time })));
}

export function findSlot(
  definition: Pick<PollDefinition, 'dates' | 'timeRanges' | 'slotWidthMinutes'>,
  date: string,
  startTime: string,
): PollSlot | undefined {
  return generatePollSlots(definition).find((slot) => slot.date === date && slot.startTime === startTime);
}
