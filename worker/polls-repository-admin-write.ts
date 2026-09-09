import type { AdminPollDetail, FinalizePollInput, PollStatus } from '../shared/poll.ts';
import { findSlot, validatePollDefinition } from '../shared/poll.ts';
import { HttpError } from './http.ts';
import {
  generatePublicToken, getPollDefinition, getPollRowById, replaceDefinitionChildren,
} from './polls-repository-core.ts';
import { getAdminPoll } from './polls-repository-read.ts';

export async function createPoll(db: D1Database, definitionInput: unknown): Promise<AdminPollDetail> {
  const definition = validatePollDefinition(definitionInput);
  const publicToken = generatePublicToken();
  const result = await db.prepare(`
    INSERT INTO availability_polls (public_token, title, description, timezone, slot_width_minutes, status)
    VALUES (?1, ?2, ?3, ?4, ?5, 'draft')`)
    .bind(publicToken, definition.title, definition.description, definition.timezone, definition.slotWidthMinutes).run();
  const pollId = Number(result.meta.last_row_id);
  if (!Number.isInteger(pollId) || pollId <= 0) throw new HttpError(500, 'poll_create_failed', 'Poll identifier was unavailable.');
  try {
    await replaceDefinitionChildren(db, pollId, definition);
  } catch (error) {
    await db.prepare('DELETE FROM availability_polls WHERE id = ?1').bind(pollId).run();
    throw error;
  }
  return getAdminPoll(db, pollId);
}

export async function updatePollDefinition(db: D1Database, pollId: number, definitionInput: unknown): Promise<AdminPollDetail> {
  const definition = validatePollDefinition(definitionInput);
  const currentRow = await getPollRowById(db, pollId);
  const currentDefinition = await getPollDefinition(db, currentRow);
  const responseCountRow = await db.prepare('SELECT COUNT(*) AS count FROM availability_poll_responses WHERE poll_id = ?1')
    .bind(pollId).first<{ count: number }>();
  const responseCount = Number(responseCountRow?.count ?? 0);
  if (responseCount > 0 || currentRow.status === 'finalized') {
    const structure = (value: typeof definition) => JSON.stringify({
      participantNames: value.participantNames, dates: value.dates,
      timeRanges: value.timeRanges, slotWidthMinutes: value.slotWidthMinutes,
    });
    if (structure(currentDefinition) !== structure(definition)) {
      throw new HttpError(409, 'poll_structure_locked', 'Dates, time ranges, slot width, and participants cannot change after responses exist or the poll is finalized.');
    }
  }
  await db.prepare(`
    UPDATE availability_polls SET title = ?1, description = ?2, timezone = ?3,
      slot_width_minutes = ?4, updated_at = CURRENT_TIMESTAMP WHERE id = ?5`)
    .bind(definition.title, definition.description, definition.timezone, definition.slotWidthMinutes, pollId).run();
  if (responseCount === 0 && currentRow.status !== 'finalized') await replaceDefinitionChildren(db, pollId, definition);
  return getAdminPoll(db, pollId);
}

export async function deleteParticipantResponse(db: D1Database, pollId: number, participantId: number): Promise<void> {
  await getPollRowById(db, pollId);
  await db.prepare('DELETE FROM availability_poll_responses WHERE poll_id = ?1 AND expected_participant_id = ?2')
    .bind(pollId, participantId).run();
  await db.prepare('UPDATE availability_polls SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1').bind(pollId).run();
}

export async function setPollStatus(db: D1Database, pollId: number, status: PollStatus): Promise<AdminPollDetail> {
  const row = await getPollRowById(db, pollId);
  if (!['draft', 'open', 'closed'].includes(status)) throw new HttpError(400, 'invalid_status', 'Use the finalize operation to finalize a poll.');
  if (row.status === 'finalized') throw new HttpError(409, 'poll_finalized', 'A finalized poll cannot be reopened without clearing its finalization.');
  await db.prepare('UPDATE availability_polls SET status = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2').bind(status, pollId).run();
  return getAdminPoll(db, pollId);
}

export async function finalizePoll(db: D1Database, pollId: number, input: FinalizePollInput): Promise<AdminPollDetail> {
  const row = await getPollRowById(db, pollId);
  const definition = await getPollDefinition(db, row);
  const slot = findSlot(definition, input.date, input.startTime);
  if (!slot) throw new HttpError(400, 'invalid_final_slot', 'Final meeting slot must be one of the generated poll cells.');
  const location = input.location?.trim().slice(0, 240) || null;
  const meetingLink = input.meetingLink?.trim().slice(0, 1000) || null;
  if (meetingLink) {
    try {
      const parsed = new URL(meetingLink);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
    } catch {
      throw new HttpError(400, 'invalid_meeting_link', 'Meeting link must be a valid http(s) URL.');
    }
  }
  const note = input.note?.trim().slice(0, 2000) || null;
  await db.prepare(`
    UPDATE availability_polls SET status = 'finalized', finalized_date = ?1,
      finalized_start_time = ?2, finalized_end_time = ?3, finalized_location = ?4,
      finalized_meeting_link = ?5, finalized_note = ?6, updated_at = CURRENT_TIMESTAMP WHERE id = ?7`)
    .bind(slot.date, slot.startTime, slot.endTime, location, meetingLink, note, pollId).run();
  return getAdminPoll(db, pollId);
}

export async function rotatePollPublicToken(db: D1Database, pollId: number): Promise<AdminPollDetail> {
  await getPollRowById(db, pollId);
  await db.prepare('UPDATE availability_polls SET public_token = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2')
    .bind(generatePublicToken(), pollId).run();
  return getAdminPoll(db, pollId);
}

export async function deletePoll(db: D1Database, pollId: number): Promise<void> {
  await getPollRowById(db, pollId);
  await db.prepare('DELETE FROM availability_polls WHERE id = ?1').bind(pollId).run();
}
