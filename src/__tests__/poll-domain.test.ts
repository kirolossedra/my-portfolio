import { describe, expect, it } from 'vitest';
import {
  computeIntersections,
  filterIntersections,
  generatePollSlots,
  generateTimesForDefinition,
  parsePollXml,
  pollDefinitionToXml,
  validatePollDefinition,
  validateSelections,
  type ExpectedParticipant,
  type ParticipantResponse,
} from '../../shared/poll.ts';

const definition = validatePollDefinition({
  schemaVersion: 1,
  title: 'MASc examination',
  description: 'Choose every slot that works.',
  timezone: 'America/Toronto',
  participantNames: ['Professor A', 'Professor B', 'Professor C'],
  dates: ['2026-09-22', '2026-09-24'],
  timeRanges: [{ startTime: '09:00', endTime: '17:00' }],
  slotWidthMinutes: 90,
});

const participants: ExpectedParticipant[] = [
  { id: 1, displayName: 'Professor A', sortOrder: 0 },
  { id: 2, displayName: 'Professor B', sortOrder: 1 },
  { id: 3, displayName: 'Professor C', sortOrder: 2 },
];

function response(participantId: number, selections: ParticipantResponse['selections']): ParticipantResponse {
  return { participantId, revision: 1, createdAt: '2026-09-09T12:00:00Z', updatedAt: '2026-09-09T12:00:00Z', selections };
}

describe('poll definition and slots', () => {
  it('generates five 90-minute slots and deterministically drops the 30-minute trailing remainder', () => {
    expect(generateTimesForDefinition(definition)).toEqual([
      { startTime: '09:00', endTime: '10:30' },
      { startTime: '10:30', endTime: '12:00' },
      { startTime: '12:00', endTime: '13:30' },
      { startTime: '13:30', endTime: '15:00' },
      { startTime: '15:00', endTime: '16:30' },
    ]);
    expect(generatePollSlots(definition)).toHaveLength(10);
  });

  it('preserves arbitrary selected dates rather than expanding to a continuous date range', () => {
    expect([...new Set(generatePollSlots(definition).map((slot) => slot.date))]).toEqual(['2026-09-22', '2026-09-24']);
  });

  it('supports multiple non-overlapping time ranges', () => {
    const split = validatePollDefinition({ ...definition, timeRanges: [
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '16:00' },
    ] });
    expect(generateTimesForDefinition(split)).toHaveLength(4);
  });

  it('rejects duplicate participant names case-insensitively', () => {
    expect(() => validatePollDefinition({ ...definition, participantNames: ['Professor A', ' professor a '] })).toThrow(/unique/i);
  });

  it('rejects unsupported timezone input instead of relying on browser-local time', () => {
    expect(() => validatePollDefinition({ ...definition, timezone: 'UTC' })).toThrow(/America\/Toronto/);
  });

  it('rejects selections outside the generated grid', () => {
    expect(() => validateSelections(definition, [{ date: '2026-09-23', slotStart: '09:00', mode: 'online' }])).toThrow(/not part of this poll/i);
  });

  it('serializes XML from the same canonical definition', () => {
    const xml = pollDefinitionToXml(definition);
    expect(xml).toContain('<timezone>America/Toronto</timezone>');
    expect(xml).toContain('<participant>Professor A</participant>');
    expect(xml).toContain('<timeRange start="09:00" end="17:00" />');
  });


  it('round-trips valid XML through the same canonical definition', () => {
    expect(parsePollXml(pollDefinitionToXml(definition))).toEqual(definition);
  });

  it('rejects malformed or unsafe XML definitions', () => {
    expect(() => parsePollXml('<poll><title>broken</poll>')).toThrow(/root element|missing/i);
    expect(() => parsePollXml('<!DOCTYPE poll [<!ENTITY x "unsafe">]><poll></poll>')).toThrow(/DOCTYPE|ENTITY/i);
  });

  it('rejects nonexistent and ambiguous Toronto wall-clock slots at DST transitions', () => {
    expect(() => validatePollDefinition({
      ...definition,
      dates: ['2026-03-08'],
      timeRanges: [{ startTime: '02:00', endTime: '04:00' }],
      slotWidthMinutes: 60,
    })).toThrow(/daylight-saving/i);
    expect(() => validatePollDefinition({
      ...definition,
      dates: ['2026-11-01'],
      timeRanges: [{ startTime: '01:00', endTime: '03:00' }],
      slotWidthMinutes: 60,
    })).toThrow(/ambiguous/i);
  });
});

describe('intersection analysis', () => {
  const responses: ParticipantResponse[] = [
    response(1, [
      { date: '2026-09-22', slotStart: '09:00', mode: 'in_person' },
      { date: '2026-09-22', slotStart: '10:30', mode: 'either' },
    ]),
    response(2, [
      { date: '2026-09-22', slotStart: '09:00', mode: 'online' },
      { date: '2026-09-22', slotStart: '10:30', mode: 'either' },
    ]),
    response(3, [
      { date: '2026-09-22', slotStart: '09:00', mode: 'either' },
    ]),
  ];

  it('finds 100% common availability and preserves attendance-mode composition', () => {
    const full = filterIntersections(computeIntersections(definition, participants, responses), { kind: 'full' });
    expect(full).toHaveLength(1);
    expect(full[0]).toMatchObject({ availableCount: 3, totalParticipants: 3, inPersonCount: 1, onlineCount: 1, eitherCount: 1 });
  });

  it('filters by percentage threshold', () => {
    const matches = filterIntersections(computeIntersections(definition, participants, responses), { kind: 'threshold', percentage: 66 });
    expect(matches.some((slot) => slot.startTime === '10:30')).toBe(true);
  });

  it('returns every tied highest-overlap slot below 100%', () => {
    const tieResponses: ParticipantResponse[] = [
      response(1, [
        { date: '2026-09-22', slotStart: '09:00', mode: 'either' },
        { date: '2026-09-22', slotStart: '10:30', mode: 'either' },
      ]),
      response(2, [
        { date: '2026-09-22', slotStart: '09:00', mode: 'online' },
        { date: '2026-09-22', slotStart: '10:30', mode: 'in_person' },
      ]),
    ];
    const matches = filterIntersections(computeIntersections(definition, participants, tieResponses), { kind: 'highest_below_full' });
    expect(matches.filter((slot) => slot.date === '2026-09-22' && ['09:00', '10:30'].includes(slot.startTime))).toHaveLength(2);
  });

  it('handles no responses deterministically', () => {
    const slots = computeIntersections(definition, participants, []);
    expect(slots.every((slot) => slot.availableCount === 0 && slot.percentage === 0)).toBe(true);
  });


  it('does not call zero-overlap cells a highest partial intersection when nobody responded', () => {
    const matches = filterIntersections(computeIntersections(definition, participants, []), { kind: 'highest_below_full' });
    expect(matches).toEqual([]);
  });
});
