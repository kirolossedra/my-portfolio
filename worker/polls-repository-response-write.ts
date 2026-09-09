import type { ParticipantResponse, ParticipantResponseWriteInput } from '../shared/poll.ts';
import { validateSelections } from '../shared/poll.ts';
import { HttpError } from './http.ts';
import { assertParticipant, getPollDefinition, getPollRowByToken } from './polls-repository-core.ts';
import { getPublicParticipantResponse } from './polls-repository-read.ts';

export async function savePublicParticipantResponse(
  db: D1Database,
  publicToken: string,
  input: ParticipantResponseWriteInput,
): Promise<ParticipantResponse> {
  const row = await getPollRowByToken(db, publicToken);
  if (row.status !== 'open') throw new HttpError(409, 'poll_not_open', 'This poll is not accepting response changes.');
  await assertParticipant(db, row.id, input.participantId);
  const selections = validateSelections(await getPollDefinition(db, row), input.selections);
  let responseId: number;
  let createdNew = false;
  let priorRevision: number | null = null;
  if (input.revision === null) {
    const insert = await db.prepare(`
      INSERT INTO availability_poll_responses (poll_id, expected_participant_id, revision)
      VALUES (?1, ?2, 1) ON CONFLICT(poll_id, expected_participant_id) DO NOTHING`)
      .bind(row.id, input.participantId).run();
    if (Number(insert.meta.changes ?? 0) !== 1) {
      throw new HttpError(409, 'response_conflict', 'A response already exists for this participant. Reload it before editing.');
    }
    responseId = Number(insert.meta.last_row_id);
    createdNew = true;
  } else {
    if (!Number.isInteger(input.revision) || input.revision < 1) throw new HttpError(400, 'invalid_revision', 'Response revision is invalid.');
    const existing = await db.prepare(`
      SELECT id FROM availability_poll_responses
      WHERE poll_id = ?1 AND expected_participant_id = ?2 LIMIT 1`)
      .bind(row.id, input.participantId).first<{ id: number }>();
    if (!existing) throw new HttpError(409, 'response_conflict', 'The previous response no longer exists. Reload before editing.');
    responseId = existing.id;
    priorRevision = input.revision;
    const update = await db.prepare(`
      UPDATE availability_poll_responses SET revision = revision + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?1 AND revision = ?2`).bind(responseId, input.revision).run();
    if (Number(update.meta.changes ?? 0) !== 1) {
      throw new HttpError(409, 'response_conflict', 'This response changed elsewhere. Reload before overwriting it.');
    }
  }
  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM availability_poll_selections WHERE response_id = ?1').bind(responseId),
  ];
  for (const selection of selections) {
    statements.push(db.prepare(`
      INSERT INTO availability_poll_selections (response_id, poll_date, slot_start, mode)
      VALUES (?1, ?2, ?3, ?4)`).bind(responseId, selection.date, selection.slotStart, selection.mode));
  }
  try {
    await db.batch(statements);
  } catch (error) {
    if (createdNew) await db.prepare('DELETE FROM availability_poll_responses WHERE id = ?1').bind(responseId).run();
    else if (priorRevision !== null) {
      await db.prepare('UPDATE availability_poll_responses SET revision = ?1 WHERE id = ?2 AND revision = ?3')
        .bind(priorRevision, responseId, priorRevision + 1).run();
    }
    throw error;
  }
  await db.prepare('UPDATE availability_polls SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1').bind(row.id).run();
  const saved = await getPublicParticipantResponse(db, publicToken, input.participantId);
  if (!saved) throw new HttpError(500, 'response_save_failed', 'Response could not be reloaded after saving.');
  return saved;
}
