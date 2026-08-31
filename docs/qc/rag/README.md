# RAG Quality Control

## Table of Contents

- [Purpose](#purpose)
- [Allowed Content](#allowed-content)
- [Excluded Content](#excluded-content)
- [Current QC Records](#current-qc-records)
- [Evidence Directory](#evidence-directory)
- [Deployment Records Live Elsewhere](#deployment-records-live-elsewhere)
- [Three-Way Directory Distinction](#three-way-directory-distinction)

<a id="purpose"></a>
## Purpose

`docs/qc/rag/` contains **RAG-specific quality-control incidents, regression findings and supporting validation evidence**.

<a id="allowed-content"></a>
## Allowed Content

- retrieval-quality incidents;
- false-positive/generalization investigations;
- parity/regression records;
- validation and acceptance evidence;
- concise returned-result/runtime evidence whose purpose is to prove a quality/behavior claim.

<a id="excluded-content"></a>
## Excluded Content

Do not place these here:

- deployment-provider comparisons;
- hosting feasibility decisions;
- free-tier/cost evaluations;
- migration-to-Cloudflare strategy;
- production deployment chronology.

Those belong in [`../../rag/deployment/`](../../rag/deployment/README.md).

<a id="current-qc-records"></a>
## Current QC Records

- [2026-08-31 — Backend/System-Design Generalization Incident](2026-08-31-backend-system-design-generalization-incident.md)

This incident remains correctly located in QC because its subject is retrieval-quality behavior and a false-positive/generalization finding.

<a id="evidence-directory"></a>
## Evidence Directory

[`evidence/`](evidence/) retains **RAG retrieval/quality evidence only**. For the backend/system-design incident, the retained evidence is intentionally concise: repository identity plus the returned explanation/passage needed to understand the finding.

Deployment/container evidence does **not** belong here; it lives with RAG deployment documentation under [`../../rag/deployment/evidence/`](../../rag/deployment/evidence/).

<a id="deployment-records-live-elsewhere"></a>
## Deployment Records Live Elsewhere

The following are **RAG deployment/hosting decision records**, not QC documents:

- [Containerization and Hosting Evaluation](../../rag/deployment/2026-08-31-containerization-and-hosting-evaluation.md)
- [Zero-Cost Cloudflare-Native Runtime Evaluation](../../rag/deployment/2026-08-31-cloudflare-native-zero-cost-runtime-evaluation.md)

They are intentionally absent from `docs/qc/rag/` in the corrected hierarchy.

<a id="three-way-directory-distinction"></a>
## Three-Way Directory Distinction

```text
docs/rag/
  RAG engineering/design/deployment documentation

docs/qc/rag/
  RAG quality-control incidents, regressions and evidence

rag/
  actual RAG implementation, scripts, runtime, corpus and generated artifacts
```

The top-level `rag/` implementation directory is not a documentation category and is not part of this `docs/` replacement package.

## Related Documentation

- Parent QC guide: [../README.md](../README.md)
- [RAG documentation](../../rag/README.md)
- [RAG deployment history](../../rag/deployment/README.md)
