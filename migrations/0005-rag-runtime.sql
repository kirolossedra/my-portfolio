CREATE TABLE IF NOT EXISTS rag_documents (
  document_id TEXT PRIMARY KEY,
  repository_index INTEGER NOT NULL,
  repository_name TEXT NOT NULL,
  repository_slug TEXT,
  repository_url TEXT,
  retrieval_class TEXT NOT NULL,
  semantic_area TEXT NOT NULL,
  evidence_polarity TEXT NOT NULL,
  evidence_level TEXT NOT NULL,
  specificity_score REAL NOT NULL,
  concrete_signal_count INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL,
  text TEXT NOT NULL,
  topics_json TEXT NOT NULL,
  evidence_areas_json TEXT NOT NULL,
  related_skill_ratings_json TEXT NOT NULL,
  source_fragments_json TEXT NOT NULL,
  provenance_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rag_documents_repository
  ON rag_documents(repository_index);

CREATE INDEX IF NOT EXISTS idx_rag_documents_class
  ON rag_documents(retrieval_class);

CREATE INDEX IF NOT EXISTS idx_rag_documents_polarity
  ON rag_documents(evidence_polarity);

CREATE TABLE IF NOT EXISTS rag_corpus_meta (
  corpus_key TEXT PRIMARY KEY,
  document_count INTEGER NOT NULL,
  repository_count INTEGER NOT NULL,
  documents_sha256 TEXT NOT NULL,
  document_schema_version TEXT NOT NULL,
  imported_at TEXT NOT NULL
);
