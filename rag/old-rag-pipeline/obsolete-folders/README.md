# Archived Whole-Workspace Snapshots

## Table of Contents

- [Purpose](#purpose)
- [Historical Root Change](#historical-root-change)
- [Restore Warning](#restore-warning)

<a id="purpose"></a>
## Purpose

This directory is different from `rag/obsolete/`. `obsolete/` holds specifically retired scripts and generated stages. `obsolete-folders/` preserves older whole-workspace snapshots/archives such as `portfolio-career-analysis-through-134.zip` and the former nested project directory.

<a id="historical-root-change"></a>
## Historical Root Change

The working RAG root used to be nested at `rag/portfolio-career-analysis-through-134`. It was later reorganized so `rag/` itself became the subsystem root. Current documentation and new scripts should use `rag/`; references to the nested path are historical unless they appear inside archived outputs.

<a id="restore-warning"></a>
## Restore Warning

Do not copy an archived snapshot wholesale over the active RAG tree. It can reintroduce old path assumptions, obsolete chunk/embedding/retrieval stages and duplicate scripts.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Obsolete implementations](../obsolete/README.md)
