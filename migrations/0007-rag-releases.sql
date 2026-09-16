PRAGMA foreign_keys = OFF;

ALTER TABLE rag_documents RENAME TO rag_documents_legacy;

CREATE TABLE rag_documents (
  release_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
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
  provenance_json TEXT NOT NULL,
  PRIMARY KEY (release_id, document_id)
);

INSERT INTO rag_documents (
  release_id, document_id, repository_index, repository_name, repository_slug,
  repository_url, retrieval_class, semantic_area, evidence_polarity, evidence_level,
  specificity_score, concrete_signal_count, word_count, text, topics_json,
  evidence_areas_json, related_skill_ratings_json, source_fragments_json, provenance_json
)
SELECT
  'legacy-v1', document_id, repository_index, repository_name, repository_slug,
  repository_url, retrieval_class, semantic_area, evidence_polarity, evidence_level,
  specificity_score, concrete_signal_count, word_count, text, topics_json,
  evidence_areas_json, related_skill_ratings_json, source_fragments_json, provenance_json
FROM rag_documents_legacy;

DROP TABLE rag_documents_legacy;

CREATE INDEX idx_rag_documents_release_repository ON rag_documents(release_id, repository_index);
CREATE INDEX idx_rag_documents_release_class ON rag_documents(release_id, retrieval_class);
CREATE INDEX idx_rag_documents_release_polarity ON rag_documents(release_id, evidence_polarity);

CREATE TABLE rag_releases (
  release_id TEXT PRIMARY KEY,
  source_commit TEXT NOT NULL,
  retrieval_sha256 TEXT NOT NULL,
  document_count INTEGER NOT NULL,
  repository_count INTEGER NOT NULL,
  document_schema_version TEXT NOT NULL,
  embedding_manifest_sha256 TEXT,
  d1_published INTEGER NOT NULL DEFAULT 0 CHECK (d1_published IN (0, 1)),
  vectorize_published INTEGER NOT NULL DEFAULT 0 CHECK (vectorize_published IN (0, 1)),
  created_at TEXT NOT NULL,
  activated_at TEXT
);

INSERT INTO rag_releases (
  release_id, source_commit, retrieval_sha256, document_count, repository_count,
  document_schema_version, d1_published, vectorize_published, created_at, activated_at
)
SELECT
  'legacy-v1', 'pre-release-versioning', documents_sha256, document_count,
  repository_count, document_schema_version, 1, 1, imported_at, imported_at
FROM rag_corpus_meta
WHERE corpus_key = 'portfolio-career-rag-v1';

CREATE TABLE rag_runtime_config (
  config_key TEXT PRIMARY KEY,
  config_value TEXT,
  updated_at TEXT NOT NULL
);

INSERT OR REPLACE INTO rag_runtime_config (config_key, config_value, updated_at)
VALUES ('active_rag_release', 'legacy-v1', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO rag_runtime_config (config_key, config_value, updated_at)
VALUES ('previous_rag_release', NULL, CURRENT_TIMESTAMP);

PRAGMA foreign_keys = ON;
