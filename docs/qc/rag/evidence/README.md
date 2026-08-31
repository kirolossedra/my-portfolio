# RAG QC Evidence

## Table of Contents

- [Purpose](#purpose)
- [Current Evidence](#current-evidence)
- [Retention Rule](#retention-rule)

<a id="purpose"></a>
## Purpose

`docs/qc/rag/evidence/` contains concise evidence needed to reproduce or understand RAG retrieval-quality, regression and generalization findings.

<a id="current-evidence"></a>
## Current Evidence

- [`2026-08-31-backend-system-design-relevant-results.txt`](2026-08-31-backend-system-design-relevant-results.txt) — relevant returned repository names and explanations from the backend/system-design generalization incident.

<a id="retention-rule"></a>
## Retention Rule

Preserve the evidence needed for the QC finding—query, result identity, returned explanation/passage and interpretation—without duplicating entire transport-level API payloads when those fields add no diagnostic value.

Deployment/container evidence belongs under [`../../../rag/deployment/evidence/`](../../../rag/deployment/evidence/).

## Related Documentation

- Parent: [RAG QC](../README.md)
- [Incident](../2026-08-31-backend-system-design-generalization-incident.md)
