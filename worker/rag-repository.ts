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
  document_count: number;
  repository_count: number;
  documents_sha256: string;
  document_schema_version: string;
  imported_at: string;
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

export async function getRagCorpusMeta(db: D1Database): Promise<RagCorpusMetaRow | null> {
  return db
    .prepare(`
      SELECT document_count, repository_count, documents_sha256,
             document_schema_version, imported_at
      FROM rag_corpus_meta
      WHERE corpus_key = ?
    `)
    .bind('portfolio-career-rag-v1')
    .first<RagCorpusMetaRow>();
}

export async function countRagDocuments(db: D1Database): Promise<number> {
  const result = await db
    .prepare('SELECT COUNT(*) AS count FROM rag_documents')
    .first<{ count: number }>();
  return Number(result?.count ?? 0);
}

export async function getRagDocumentsByIds(
  db: D1Database,
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
        WHERE document_id IN (${placeholders})
      `)
      .bind(...batch)
      .all<RagDocumentRow>();
    rows.push(...result.results);
  }

  return new Map(rows.map((row) => {
    const document = mapRow(row);
    return [document.documentId, document];
  }));
}
