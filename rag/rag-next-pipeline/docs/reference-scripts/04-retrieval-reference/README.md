# Stage 04 — Retrieval Reference

## Table of Contents
- [Responsibility](#responsibility)
- [Version History](#version-history)

## Responsibility
Maintain an offline retrieval-quality reference independent of the hosted vector database.

## Version History
- v1: exact cosine over old chunks.
- v2: hybrid BM25/metadata/RRF/CrossEncoder over old chunks.
- v3: evidence-aware documents, concept/evidence gates, hybrid recall, pinned CrossEncoder, polarity handling, dedupe and repository diversity.

Active script: `build-rag-retrieval-v3-evidence-aware-local.py`.
