# Stage 01 — Corpus Preparation

## Table of Contents
- [Responsibility](#responsibility)
- [Active Script](#active-script)
- [Path Behavior](#path-behavior)

## Responsibility
Transform the repository-analysis Markdown batches into the canonical normalized `rag-corpus/` representation while preserving complete source analysis and provenance.

## Active Script
`prepare-rag-corpus.py` — Corpus preparation generation v1.

## Path Behavior
The script locates the enclosing `rag/` root independently of its own nested location. Source batches are discovered as `repositories-*.md` under the portfolio project tree, excluding generated/build/archive/script trees; output always goes to `rag/rag-corpus/`.
