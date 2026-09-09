import { describe, expect, it } from 'vitest';
import type { AdminPollDetail } from '../../shared/poll.ts';
import { validatePollDefinition } from '../../shared/poll.ts';
import { renderPollPdf } from '../poll-pdf.ts';

const definition = validatePollDefinition({
  schemaVersion: 1,
  title: 'MASc examination',
  description: 'Academic committee availability poll.',
  timezone: 'America/Toronto',
  participantNames: ['Professor A'],
  dates: ['2026-09-22'],
  timeRanges: [{ startTime: '09:00', endTime: '12:00' }],
  slotWidthMinutes: 90,
});

const poll: AdminPollDetail = {
  id: 1,
  publicToken: '0123456789abcdef0123456789abcdef',
  title: definition.title,
  description: definition.description,
  timezone: definition.timezone,
  status: 'open',
  slotWidthMinutes: definition.slotWidthMinutes,
  participantCount: 1,
  responseCount: 1,
  createdAt: '2026-09-09T12:00:00Z',
  updatedAt: '2026-09-09T12:00:00Z',
  finalization: null,
  definition,
  participants: [{ id: 10, displayName: 'Professor A', sortOrder: 0, responded: true, responseRevision: 1, updatedAt: '2026-09-09T12:00:00Z' }],
  responses: [{ participantId: 10, revision: 1, createdAt: '2026-09-09T12:00:00Z', updatedAt: '2026-09-09T12:00:00Z', selections: [{ date: '2026-09-22', slotStart: '09:00', mode: 'either' }] }],
};

describe('poll PDF', () => {
  it('generates a real PDF document from poll data', () => {
    const bytes = renderPollPdf(poll);
    const text = new TextDecoder().decode(bytes);
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('MASc examination');
    expect(text).toContain('America/Toronto');
    expect(text).toContain('Professor A');
    expect(text).toContain('xref');
  });
});
