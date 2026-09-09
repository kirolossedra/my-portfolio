import type { AvailabilityMode, ExpectedParticipant, PollDefinition } from '../../shared/poll.ts';
import { POLL_TIMEZONE, validatePollDefinition } from '../../shared/poll.ts';

export type BuilderModel = {
  title: string;
  description: string;
  participantsText: string;
  dates: string[];
  startTime: string;
  endTime: string;
  extraRanges: Array<{ startTime: string; endTime: string }>;
  slotWidthMinutes: number;
};

export type AdminView = 'responses' | 'intersection' | 'definition';
export type CreateMethod = 'gui' | 'structured';

export const emptyBuilder = (): BuilderModel => ({
  title: '', description: '', participantsText: '', dates: [],
  startTime: '09:00', endTime: '17:00', extraRanges: [], slotWidthMinutes: 90,
});

export function builderToDefinition(model: BuilderModel): PollDefinition {
  return validatePollDefinition({
    schemaVersion: 1,
    title: model.title,
    description: model.description,
    timezone: POLL_TIMEZONE,
    participantNames: model.participantsText.split('\n').map((name) => name.trim()).filter(Boolean),
    dates: model.dates,
    timeRanges: [{ startTime: model.startTime, endTime: model.endTime }, ...model.extraRanges],
    slotWidthMinutes: model.slotWidthMinutes,
  });
}

export function definitionToBuilder(definition: PollDefinition): BuilderModel {
  const [firstRange, ...extraRanges] = definition.timeRanges;
  return {
    title: definition.title,
    description: definition.description,
    participantsText: definition.participantNames.join('\n'),
    dates: [...definition.dates],
    startTime: firstRange?.startTime ?? '09:00',
    endTime: firstRange?.endTime ?? '17:00',
    extraRanges: extraRanges.map((range) => ({ ...range })),
    slotWidthMinutes: definition.slotWidthMinutes,
  };
}

export function formatTime(value: string): string {
  const [hoursText = '0', minutesText = '0'] = value.split(':');
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutesText} ${suffix}`;
}

export function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: POLL_TIMEZONE, weekday: 'short', month: 'short', day: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 16)));
}

export function modeSymbol(mode: AvailabilityMode): string {
  if (mode === 'online') return '◉';
  if (mode === 'in_person') return '●';
  return '◐';
}
export function modeLabel(mode: AvailabilityMode): string {
  if (mode === 'in_person') return 'In person';
  if (mode === 'online') return 'Online';
  return 'Either';
}
export function participantColorClass(participants: ExpectedParticipant[], participantId: number): string {
  const index = participants.findIndex((participant) => participant.id === participantId);
  return `participant-color-${Math.max(0, index) % 8}`;
}
export function participantOrdinal(participants: ExpectedParticipant[], participantId: number): number {
  const index = participants.findIndex((participant) => participant.id === participantId);
  return Math.max(0, index) + 1;
}
