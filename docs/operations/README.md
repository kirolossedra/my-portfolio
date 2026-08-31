# Operations Documentation

## Table of Contents

- [Purpose](#purpose)
- [What Belongs Here](#what-belongs-here)
- [What Does Not Belong Here](#what-does-not-belong-here)
- [RAG Operations Boundary](#rag-operations-boundary)
- [Current Documents](#current-documents)
- [Placement Rule](#placement-rule)

<a id="purpose"></a>
## Purpose

`docs/operations/` documents **whole-portfolio operational procedures**: how the application is built, run, deployed, maintained and released.

<a id="what-belongs-here"></a>
## What Belongs Here

- portfolio-wide deployment/release procedure;
- Netlify + Cloudflare Worker + D1 operational ownership;
- local-development procedure;
- change-impact guidance;
- production maintenance/run guidance that spans multiple subsystems.

<a id="what-does-not-belong-here"></a>
## What Does Not Belong Here

- RAG-specific provider comparisons and migration decisions;
- RAG embedding/vector-DB/reranker deployment tradeoffs;
- raw QC evidence or RAG retrieval incidents;
- stable component topology that belongs in Architecture.

RAG-specific deployment architecture belongs in [`../rag/deployment/`](../rag/deployment/README.md). RAG quality-control evidence belongs in [`../qc/rag/`](../qc/rag/README.md).

<a id="rag-operations-boundary"></a>
## RAG Operations Boundary

`deployment.md` may summarize the RAG deployment state because it is the whole-portfolio deployment overview. The detailed RAG hosting/provider decision history is canonical under:

```text
docs/rag/deployment/
```

This deliberately prevents the two different questions from collapsing together:

```text
docs/operations/
  = how the whole portfolio is operated and released

docs/rag/deployment/
  = how the RAG subsystem itself could/should be deployed

docs/qc/rag/
  = whether RAG behavior/quality passed, failed, regressed or was validated
```

<a id="current-documents"></a>
## Current Documents

- [Deployment overview](deployment.md)
- [Local development](local-development.md)
- [Change-impact matrix](change-impact-matrix.md)

<a id="placement-rule"></a>
## Placement Rule

If the primary question is **“how do we operate/release the portfolio as a whole?”**, place it here. If the primary question is **“which RAG runtime/provider/hosting architecture should we choose?”**, place it under `docs/rag/deployment/`.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG documentation](../rag/README.md)
- [RAG deployment history](../rag/deployment/README.md)
- [Quality Control](../qc/README.md)
