import type {
  AvailabilityMode, ExpectedParticipant, IntersectionFilter, IntersectionSlot,
  ParticipantResponse, PollDefinition,
} from './poll-types.ts';
import { generatePollSlots } from './poll-slots.ts';

export function computeIntersections(
  definition: PollDefinition,
  participants: ExpectedParticipant[],
  responses: ParticipantResponse[],
): IntersectionSlot[] {
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const selectionMap = new Map<string, Array<{ participantId: number; mode: AvailabilityMode }>>();
  for (const response of responses) {
    if (!participantById.has(response.participantId)) continue;
    for (const selection of response.selections) {
      const key = `${selection.date}|${selection.slotStart}`;
      const existing = selectionMap.get(key) ?? [];
      existing.push({ participantId: response.participantId, mode: selection.mode });
      selectionMap.set(key, existing);
    }
  }
  const totalParticipants = participants.length;
  return generatePollSlots(definition).map((slot) => {
    const selected = selectionMap.get(`${slot.date}|${slot.startTime}`) ?? [];
    const participantModes = selected.flatMap((entry) => {
      const participant = participantById.get(entry.participantId);
      return participant ? [{ participantId: entry.participantId, displayName: participant.displayName, mode: entry.mode }] : [];
    });
    const availableCount = participantModes.length;
    return {
      ...slot,
      availableCount,
      totalParticipants,
      percentage: totalParticipants === 0 ? 0 : Math.round((availableCount / totalParticipants) * 10000) / 100,
      onlineCount: participantModes.filter((entry) => entry.mode === 'online').length,
      inPersonCount: participantModes.filter((entry) => entry.mode === 'in_person').length,
      eitherCount: participantModes.filter((entry) => entry.mode === 'either').length,
      participantModes,
    };
  });
}

export function filterIntersections(slots: IntersectionSlot[], filter: IntersectionFilter): IntersectionSlot[] {
  if (filter.kind === 'all') return slots;
  if (filter.kind === 'full') return slots.filter((slot) => slot.totalParticipants > 0 && slot.availableCount === slot.totalParticipants);
  if (filter.kind === 'threshold') {
    const threshold = Math.min(100, Math.max(0, filter.percentage));
    return slots.filter((slot) => slot.percentage >= threshold);
  }
  const belowFull = slots.filter((slot) => slot.availableCount < slot.totalParticipants);
  const highest = Math.max(-1, ...belowFull.map((slot) => slot.availableCount));
  return highest <= 0 ? [] : belowFull.filter((slot) => slot.availableCount === highest);
}
