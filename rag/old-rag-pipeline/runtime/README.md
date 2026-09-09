# Cloudflare RAG Runtime Data

## Table of Contents

- [Purpose](#purpose)
- [Runtime Data Flow](#runtime-data-flow)
- [Files](#files)
- [Publish the D1 Evidence Corpus](#publish-the-d1-evidence-corpus)
- [Safety and Rerun Behavior](#safety-and-rerun-behavior)

## Purpose

The production Worker retrieves vector candidates from Cloudflare Vectorize, but authoritative evidence text and source provenance live in D1. This folder contains the one-time build step that converts the finalized Stage 02 evidence documents into a D1-compatible SQL import.

## Runtime Data Flow

```text
retrieval-documents-v2/documents.jsonl
        |
        | build-d1-rag-import.mjs
        v
rag-corpus/d1-runtime-v1/rag-documents.sql
        |
        | wrangler d1 execute --remote
        v
D1 rag_documents + rag_corpus_meta
```

No embeddings are regenerated here. The Cloudflare Qwen3 embedding generation and Vectorize index remain unchanged.

## Files

- `build-d1-rag-import.mjs` validates the exact 2,808-document / 134-repository corpus and generates the D1 SQL import.
- `rag/rag-corpus/d1-runtime-v1/rag-documents.sql` is generated locally and is not hand-authored.
- `rag/rag-corpus/d1-runtime-v1/d1-import-validation-report.txt` records corpus identity and counts.

## Publish the D1 Evidence Corpus

From the repository root:

```powershell
npm run rag:d1:build
npm run db:migrate:remote
npm run rag:d1:import:remote
```

Then verify the remote corpus count:

```powershell
npx wrangler d1 execute kirolos-portfolio-db --remote --command "SELECT COUNT(*) AS documents, COUNT(DISTINCT repository_index) AS repositories FROM rag_documents"
```

Expected result: `2808` documents and `134` repositories.

## Safety and Rerun Behavior

The generated SQL only replaces rows in the dedicated `rag_documents` and `rag_corpus_meta` tables. It does not touch portfolio milestones, authentication, opinions, Nomic artifacts, Pinecone artifacts, or Vectorize vectors. Rebuilding and re-importing the same finalized corpus is deterministic apart from the import timestamp.
