import type {
  AdminPollSummary, AvailabilitySelection, ExpectedParticipant, ParticipantResponse,
  PollDefinition, PollFinalization, PollStatus,
} from '../shared/poll.ts';
import { POLL_TIMEZONE, validatePollDefinition } from '../shared/poll.ts';
import { HttpError } from './http.ts';

export type PollRow = {
  id: number; public_token: string; title: string; description: string;
  timezone: typeof POLL_TIMEZONE; slot_width_minutes: number; status: PollStatus;
  finalized_date: string | null; finalized_start_time: string | null; finalized_end_time: string | null;
  finalized_location: string | null; finalized_meeting_link: string | null; finalized_note: string | null;
  created_at: string; updated_at: string;
};
type ParticipantRow = { id: number; poll_id: number; display_name: string; sort_order: number };
type ResponseRow = {
  id: number; poll_id: number; expected_participant_id: number; revision: number;
  created_at: string; updated_at: string;
};
type SelectionRow = { response_id: number; poll_date: string; slot_start: string; mode: AvailabilitySelection['mode'] };
type SummaryRow = PollRow & { participant_count: number; response_count: number };

export function finalizationFromRow(row: PollRow): PollFinalization | null {
  if (!row.finalized_date || !row.finalized_start_time || !row.finalized_end_time) return null;
  return {
    date: row.finalized_date, startTime: row.finalized_start_time, endTime: row.finalized_end_time,
    timezone: POLL_TIMEZONE, location: row.finalized_location,
    meetingLink: row.finalized_meeting_link, note: row.finalized_note,
  };
}

export async function getPollRowById(db: D1Database, pollId: number): Promise<PollRow> {
  const row = await db.prepare(`
    SELECT id, public_token, title, description, timezone, slot_width_minutes, status,
      finalized_date, finalized_start_time, finalized_end_time,
      finalized_location, finalized_meeting_link, finalized_note, created_at, updated_at
    FROM availability_polls WHERE id = ?1 LIMIT 1`)
    .bind(pollId).first<PollRow>();
  if (!row) throw new HttpError(404, 'poll_not_found', 'Poll was not found.');
  return row;
}

export async function getPollRowByToken(db: D1Database, publicToken: string): Promise<PollRow> {
  const row = await db.prepare(`
    SELECT id, public_token, title, description, timezone, slot_width_minutes, status,
      finalized_date, finalized_start_time, finalized_end_time,
      finalized_location, finalized_meeting_link, finalized_note, created_at, updated_at
    FROM availability_polls WHERE public_token = ?1 LIMIT 1`)
    .bind(publicToken).first<PollRow>();
  if (!row || row.status === 'draft') throw new HttpError(404, 'poll_not_found', 'Poll was not found.');
  return row;
}

export async function getPollDefinition(db: D1Database, row: PollRow): Promise<PollDefinition> {
  const [dateResult, rangeResult, participantResult] = await Promise.all([
    db.prepare('SELECT poll_date FROM availability_poll_dates WHERE poll_id = ?1 ORDER BY sort_order, poll_date')
      .bind(row.id).all<{ poll_date: string }>(),
    db.prepare('SELECT start_time, end_time FROM availability_poll_time_ranges WHERE poll_id = ?1 ORDER BY sort_order, id')
      .bind(row.id).all<{ start_time: string; end_time: string }>(),
    db.prepare('SELECT display_name FROM availability_poll_participants WHERE poll_id = ?1 ORDER BY sort_order, id')
      .bind(row.id).all<{ display_name: string }>(),
  ]);
  return validatePollDefinition({
    schemaVersion: 1, title: row.title, description: row.description, timezone: row.timezone,
    participantNames: (participantResult.results ?? []).map((item) => item.display_name),
    dates: (dateResult.results ?? []).map((item) => item.poll_date),
    timeRanges: (rangeResult.results ?? []).map((item) => ({ startTime: item.start_time, endTime: item.end_time })),
    slotWidthMinutes: row.slot_width_minutes,
  });
}

export async function listParticipants(db: D1Database, pollId: number): Promise<ExpectedParticipant[]> {
  const result = await db.prepare(`
    SELECT id, poll_id, display_name, sort_order
    FROM availability_poll_participants WHERE poll_id = ?1 ORDER BY sort_order, id`)
    .bind(pollId).all<ParticipantRow>();
  return (result.results ?? []).map((row) => ({ id: row.id, displayName: row.display_name, sortOrder: row.sort_order }));
}

export async function listResponses(db: D1Database, pollId: number): Promise<ParticipantResponse[]> {
  const responseResult = await db.prepare(`
    SELECT id, poll_id, expected_participant_id, revision, created_at, updated_at
    FROM availability_poll_responses WHERE poll_id = ?1 ORDER BY expected_participant_id`)
    .bind(pollId).all<ResponseRow>();
  const responseRows = responseResult.results ?? [];
  if (responseRows.length === 0) return [];
  const selectionResult = await db.prepare(`
    SELECT s.response_id, s.poll_date, s.slot_start, s.mode
    FROM availability_poll_selections s JOIN availability_poll_responses r ON r.id = s.response_id
    WHERE r.poll_id = ?1 ORDER BY s.poll_date, s.slot_start`)
    .bind(pollId).all<SelectionRow>();
  const selectionsByResponse = new Map<number, AvailabilitySelection[]>();
  for (const selection of selectionResult.results ?? []) {
    const selections = selectionsByResponse.get(selection.response_id) ?? [];
    selections.push({ date: selection.poll_date, slotStart: selection.slot_start, mode: selection.mode });
    selectionsByResponse.set(selection.response_id, selections);
  }
  return responseRows.map((row) => ({
    participantId: row.expected_participant_id, revision: row.revision,
    createdAt: row.created_at, updatedAt: row.updated_at,
    selections: selectionsByResponse.get(row.id) ?? [],
  }));
}

export function toSummary(row: SummaryRow): AdminPollSummary {
  return {
    id: row.id, publicToken: row.public_token, title: row.title, description: row.description,
    timezone: row.timezone, status: row.status, slotWidthMinutes: row.slot_width_minutes,
    participantCount: row.participant_count, responseCount: row.response_count,
    createdAt: row.created_at, updatedAt: row.updated_at, finalization: finalizationFromRow(row),
  };
}

export async function pollSummary(db: D1Database, pollId: number): Promise<AdminPollSummary> {
  const row = await db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM availability_poll_participants ep WHERE ep.poll_id = p.id) AS participant_count,
      (SELECT COUNT(*) FROM availability_poll_responses pr WHERE pr.poll_id = p.id) AS response_count
    FROM availability_polls p WHERE p.id = ?1 LIMIT 1`)
    .bind(pollId).first<SummaryRow>();
  if (!row) throw new HttpError(404, 'poll_not_found', 'Poll was not found.');
  return toSummary(row);
}

export function generatePublicToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export async function replaceDefinitionChildren(db: D1Database, pollId: number, definition: PollDefinition): Promise<void> {
  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM availability_poll_dates WHERE poll_id = ?1').bind(pollId),
    db.prepare('DELETE FROM availability_poll_time_ranges WHERE poll_id = ?1').bind(pollId),
    db.prepare('DELETE FROM availability_poll_participants WHERE poll_id = ?1').bind(pollId),
  ];
  definition.dates.forEach((date, index) => statements.push(
    db.prepare('INSERT INTO availability_poll_dates (poll_id, poll_date, sort_order) VALUES (?1, ?2, ?3)').bind(pollId, date, index),
  ));
  definition.timeRanges.forEach((range, index) => statements.push(
    db.prepare('INSERT INTO availability_poll_time_ranges (poll_id, start_time, end_time, sort_order) VALUES (?1, ?2, ?3, ?4)')
      .bind(pollId, range.startTime, range.endTime, index),
  ));
  definition.participantNames.forEach((name, index) => statements.push(
    db.prepare('INSERT INTO availability_poll_participants (poll_id, display_name, normalized_name, sort_order) VALUES (?1, ?2, ?3, ?4)')
      .bind(pollId, name, name.trim().toLocaleLowerCase('en-CA'), index),
  ));
  await db.batch(statements);
}

export async function assertParticipant(db: D1Database, pollId: number, participantId: number): Promise<void> {
  const row = await db.prepare('SELECT id FROM availability_poll_participants WHERE id = ?1 AND poll_id = ?2 LIMIT 1')
    .bind(participantId, pollId).first<{ id: number }>();
  if (!row) throw new HttpError(400, 'invalid_participant', 'Expected participant is not part of this poll.');
}
