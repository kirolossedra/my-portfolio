import type {
  AdminOpinion,
  OpinionModerationInput,
  OpinionSubmissionInput,
  PublicOpinion,
} from '../shared/opinion.ts';
import { HttpError } from './http.ts';

type OpinionRow = {
  id: number;
  display_name: string;
  relationship: string | null;
  opinion_text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
};

function toPublicOpinion(row: OpinionRow): PublicOpinion {
  return {
    id: row.id,
    displayName: row.display_name,
    relationship: row.relationship,
    opinion: row.opinion_text,
    createdAt: row.created_at,
  };
}

function toAdminOpinion(row: OpinionRow): AdminOpinion {
  return {
    ...toPublicOpinion(row),
    status: row.status,
    reviewedAt: row.reviewed_at,
  };
}

export async function listApprovedOpinions(db: D1Database): Promise<PublicOpinion[]> {
  const result = await db
    .prepare(`
      SELECT id, display_name, relationship, opinion_text, status, created_at, reviewed_at
      FROM opinions
      WHERE status = 'approved'
      ORDER BY COALESCE(reviewed_at, created_at) DESC, id DESC`)
    .all<OpinionRow>();

  return (result.results ?? []).map(toPublicOpinion);
}

export async function submitOpinion(
  db: D1Database,
  input: OpinionSubmissionInput,
): Promise<number> {
  const result = await db
    .prepare(`
      INSERT INTO opinions (
        display_name,
        relationship,
        opinion_text,
        status,
        consent_to_publish
      ) VALUES (?1, ?2, ?3, 'pending', 1)`)
    .bind(
      input.displayName,
      input.relationship ?? null,
      input.opinion,
    )
    .run();

  const id = Number(result.meta.last_row_id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(500, 'opinion_create_failed', 'Opinion was received but its identifier was unavailable.');
  }
  return id;
}

export async function listAdminOpinions(db: D1Database): Promise<AdminOpinion[]> {
  const result = await db
    .prepare(`
      SELECT id, display_name, relationship, opinion_text, status, created_at, reviewed_at
      FROM opinions
      ORDER BY
        CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
        created_at DESC,
        id DESC`)
    .all<OpinionRow>();

  return (result.results ?? []).map(toAdminOpinion);
}

async function opinionExists(db: D1Database, opinionId: number): Promise<void> {
  const row = await db
    .prepare('SELECT id FROM opinions WHERE id = ?1 LIMIT 1')
    .bind(opinionId)
    .first<{ id: number }>();
  if (!row) throw new HttpError(404, 'opinion_not_found', 'Opinion was not found.');
}

export async function moderateOpinion(
  db: D1Database,
  opinionId: number,
  input: OpinionModerationInput,
): Promise<void> {
  await opinionExists(db, opinionId);
  await db
    .prepare(`
      UPDATE opinions
      SET status = ?1, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?2`)
    .bind(input.status, opinionId)
    .run();
}

export async function deleteOpinion(db: D1Database, opinionId: number): Promise<void> {
  await opinionExists(db, opinionId);
  await db.prepare('DELETE FROM opinions WHERE id = ?1').bind(opinionId).run();
}
