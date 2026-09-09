import type { AvailabilityMode, AvailabilitySelection } from '../../shared/poll.ts';

function selectionKey(date: string, startTime: string): string {
  return `${date}|${startTime}`;
}

export function selectionsToMap(selections: AvailabilitySelection[]): Map<string, AvailabilityMode> {
  return new Map(selections.map((selection) => [selectionKey(selection.date, selection.slotStart), selection.mode]));
}

export function mapToSelections(value: Map<string, AvailabilityMode>): AvailabilitySelection[] {
  return [...value.entries()].map(([slotKey, mode]) => {
    const [date = '', slotStart = ''] = slotKey.split('|');
    return { date, slotStart, mode };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.slotStart.localeCompare(b.slotStart));
}
