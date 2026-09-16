export interface RagDocument {
  documentId: string;
  repositoryIndex: number;
  repositoryName: string;
  repositorySlug: string | null;
  repositoryUrl: string | null;
  retrievalClass: string;
  semanticArea: string;
  evidencePolarity: string;
  evidenceLevel: string;
  specificityScore: number;
  concreteSignalCount: number;
  wordCount: number;
  text: string;
  topics: string[];
  evidenceAreas: string[];
  relatedSkillRatings: unknown[];
  sourceFragments: Array<Record<string, unknown>>;
  provenance: Record<string, unknown>;
}

interface RagDocumentRow {
  document_id: string;
  repository_index: number;
  repository_name: string;
  repository_slug: string | null;
  repository_url: string | null;
  retrieval_class: string;
  semantic_area: string;
  evidence_polarity: string;
  evidence_level: string;
  specificity_score: number;
  concrete_signal_count: number;
  word_count: number;
  text: string;
  topics_json: string;
  evidence_areas_json: string;
  related_skill_ratings_json: string;
  source_fragments_json: string;
  provenance_json: string;
}

interface RagCorpusMetaRow {
  release_id: string;
  document_count: number;
  repository_count: number;
  documents_sha256: string;
  document_schema_version: string;
  imported_at: string;
}

export async function getActiveRagRelease(db: D1Database): Promise<string | null> {
  const row = await db.prepare("SELECT config_value FROM rag_runtime_config WHERE config_key = 'active_rag_release'").first<{ config_value: string }>();
  return row?.config_value ?? null;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapRow(row: RagDocumentRow): RagDocument {
  return {
    documentId: row.document_id,
    repositoryIndex: row.repository_index,
    repositoryName: row.repository_name,
    repositorySlug: row.repository_slug,
    repositoryUrl: row.repository_url,
    retrievalClass: row.retrieval_class,
    semanticArea: row.semantic_area,
    evidencePolarity: row.evidence_polarity,
    evidenceLevel: row.evidence_level,
    specificityScore: row.specificity_score,
    concreteSignalCount: row.concrete_signal_count,
    wordCount: row.word_count,
    text: row.text,
    topics: parseJson<string[]>(row.topics_json, []),
    evidenceAreas: parseJson<string[]>(row.evidence_areas_json, []),
    relatedSkillRatings: parseJson<unknown[]>(row.related_skill_ratings_json, []),
    sourceFragments: parseJson<Array<Record<string, unknown>>>(row.source_fragments_json, []),
    provenance: parseJson<Record<string, unknown>>(row.provenance_json, {}),
  };
}

export async function getRagCorpusMeta(db: D1Database, releaseId: string): Promise<RagCorpusMetaRow | null> {
  return db
    .prepare(`
      SELECT release_id, document_count, repository_count, retrieval_sha256 AS documents_sha256,
             document_schema_version, created_at AS imported_at
      FROM rag_releases WHERE release_id = ?
    `)
    .bind(releaseId)
    .first<RagCorpusMetaRow>();
}

export async function countRagDocuments(db: D1Database, releaseId: string): Promise<number> {
  const result = await db
    .prepare('SELECT COUNT(*) AS count FROM rag_documents WHERE release_id = ?1').bind(releaseId)
    .first<{ count: number }>();
  return Number(result?.count ?? 0);
}

export async function getRagDocumentsByIds(
  db: D1Database,
  releaseId: string,
  documentIds: string[],
): Promise<Map<string, RagDocument>> {
  const uniqueIds = [...new Set(documentIds)];
  const rows: RagDocumentRow[] = [];

  // Keep each statement deliberately small. The runtime candidate set is only 40,
  // and small batches make D1 parameter limits boring and predictable.
  for (let offset = 0; offset < uniqueIds.length; offset += 20) {
    const batch = uniqueIds.slice(offset, offset + 20);
    if (batch.length === 0) continue;
    const placeholders = batch.map(() => '?').join(',');
    const result = await db
      .prepare(`
        SELECT document_id, repository_index, repository_name, repository_slug,
               repository_url, retrieval_class, semantic_area, evidence_polarity,
               evidence_level, specificity_score, concrete_signal_count, word_count,
               text, topics_json, evidence_areas_json, related_skill_ratings_json,
               source_fragments_json, provenance_json
        FROM rag_documents
        WHERE release_id = ? AND document_id IN (${placeholders})
      `)
      .bind(releaseId, ...batch)
      .all<RagDocumentRow>();
    rows.push(...result.results);
  }

  return new Map(rows.map((row) => {
    const document = mapRow(row);
    return [releaseId === 'legacy-v1' ? document.documentId : `${releaseId}:${document.documentId}`, document];
  }));
}
