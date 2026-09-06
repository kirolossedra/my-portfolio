# RAG Quality Control

## Purpose

`docs/qc/rag/` contains RAG-specific quality-control incidents, regression findings and acceptance evidence. Architecture and rollout decisions belong under `docs/rag/`; executable code/data belongs under top-level `rag/` and `worker/`.

## Current QC records

- [2026-09-06 — Cloudflare Production RAG Validation](2026-09-06-cloudflare-production-rag-validation.md)
  - Cloudflare Qwen embedding acceptance;
  - Vectorize inventory and dense parity;
  - local/remote D1 integrity;
  - Worker verify/health;
  - first live generation failure;
  - GLM reasoning-mode fix;
  - first successful synchronous end-to-end production query.

- [2026-08-31 — Backend/System-Design Generalization Incident](2026-08-31-backend-system-design-generalization-incident.md)
  - retrieval-quality false-positive/generalization investigation for the earlier pipeline.

## Allowed content

- retrieval-quality incidents;
- false-positive/generalization investigations;
- parity/regression findings;
- validation and acceptance evidence;
- concise runtime evidence whose primary purpose is proving a behavior claim.

## Excluded content

Do not place hosting/provider comparisons, free-tier architecture decisions, migration strategy or production rollout reasoning here. Those belong under:

```text
docs/rag/
docs/rag/deployment/
```

## Evidence directory

`evidence/` retains concise RAG QC evidence when a separate capture is useful. Large implementation/generated artifacts remain in their implementation directories rather than being duplicated into documentation.

## Three-way distinction

```text
docs/rag/
  RAG architecture, current production truth, deployment/migration decisions

docs/qc/rag/
  RAG pass/fail evidence, incidents and regressions

rag/ + worker/
  implementation, scripts, runtime, corpus and generated artifacts
```

## Related documentation

- Parent QC guide: [../README.md](../README.md)
- [RAG documentation](../../rag/README.md)
- [Production architecture](../../rag/production-architecture.md)
- [RAG deployment history](../../rag/deployment/README.md)
