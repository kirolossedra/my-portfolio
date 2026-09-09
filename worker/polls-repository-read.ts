import type {
  AdminParticipantStatus, AdminPollDetail, AdminPollSummary, ParticipantResponse, PublicPoll,
} from '../shared/poll.ts';
import { POLL_TIMEZONE } from '../shared/poll.ts';
import {
  assertParticipant, finalizationFromRow, getPollDefinition, getPollRowById, getPollRowByToken,
  listParticipants, listResponses, pollSummary, toSummary,
} from './polls-repository-core.ts';

export async function listAdminPolls(db: D1Database): Promise<AdminPollSummary[]> {
  const result = await db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM availability_poll_participants ep WHERE ep.poll_id = p.id) AS participant_count,
      (SELECT COUNT(*) FROM availability_poll_responses pr WHERE pr.poll_id = p.id) AS response_count
    FROM availability_polls p ORDER BY p.updated_at DESC, p.id DESC`).all<Parameters<typeof toSummary>[0]>();
  return (result.results ?? []).map(toSummary);
}

export async function getAdminPoll(db: D1Database, pollId: number): Promise<AdminPollDetail> {
  const row = await getPollRowById(db, pollId);
  const [summary, definition, participants, responses] = await Promise.all([
    pollSummary(db, pollId), getPollDefinition(db, row), listParticipants(db, pollId), listResponses(db, pollId),
  ]);
  const responseByParticipant = new Map(responses.map((response) => [response.participantId, response]));
  const adminParticipants: AdminParticipantStatus[] = participants.map((participant) => {
    const response = responseByParticipant.get(participant.id);
    return {
      ...participant, responded: Boolean(response), responseRevision: response?.revision ?? null,
      updatedAt: response?.updatedAt ?? null,
    };
  });
  return { ...summary, definition, participants: adminParticipants, responses };
}

export async function getPublicPoll(db: D1Database, publicToken: string): Promise<PublicPoll> {
  const row = await getPollRowByToken(db, publicToken);
  const [definition, participants] = await Promise.all([getPollDefinition(db, row), listParticipants(db, row.id)]);
  return {
    publicToken: row.public_token, title: row.title, description: row.description,
    timezone: POLL_TIMEZONE, status: row.status as PublicPoll['status'],
    slotWidthMinutes: row.slot_width_minutes, dates: definition.dates, timeRanges: definition.timeRanges,
    participants, finalization: finalizationFromRow(row),
  };
}

export async function getPublicParticipantResponse(
  db: D1Database,
  publicToken: string,
  participantId: number,
): Promise<ParticipantResponse | null> {
  const row = await getPollRowByToken(db, publicToken);
  await assertParticipant(db, row.id, participantId);
  const response = await db.prepare(`
    SELECT id, poll_id, expected_participant_id, revision, created_at, updated_at
    FROM availability_poll_responses WHERE poll_id = ?1 AND expected_participant_id = ?2 LIMIT 1`)
    .bind(row.id, participantId).first<{
      id: number; revision: number; created_at: string; updated_at: string;
    }>();
  if (!response) return null;
  const selections = await db.prepare(`
    SELECT response_id, poll_date, slot_start, mode FROM availability_poll_selections
    WHERE response_id = ?1 ORDER BY poll_date, slot_start`)
    .bind(response.id).all<{ poll_date: string; slot_start: string; mode: ParticipantResponse['selections'][number]['mode'] }>();
  return {
    participantId, revision: response.revision, createdAt: response.created_at, updatedAt: response.updated_at,
    selections: (selections.results ?? []).map((selection) => ({
      date: selection.poll_date, slotStart: selection.slot_start, mode: selection.mode,
    })),
  };
}
