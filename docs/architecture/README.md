# Architecture Documentation

## Table of Contents

- [Purpose](#purpose)
- [What Belongs Here](#what-belongs-here)
- [What Does Not Belong Here](#what-does-not-belong-here)
- [Current Documents](#current-documents)
- [Placement Rule](#placement-rule)

<a id="purpose"></a>
## Purpose

`docs/architecture/` describes the **stable structural design** of the portfolio: major components, responsibility boundaries, trust boundaries and request/data flows.

<a id="what-belongs-here"></a>
## What Belongs Here

- system-level topology;
- component ownership and interfaces;
- trust/security boundaries;
- request and data flows;
- architectural constraints that remain meaningful across deployment providers;
- accepted architectural decisions when the decision is primarily about system structure.

<a id="what-does-not-belong-here"></a>
## What Does Not Belong Here

- chronological provider experiments;
- Render/Cloudflare/Deno pricing or free-tier feasibility;
- Docker deployment logs;
- deployment runbooks;
- PASS/FAIL regression evidence;
- QC incident reports.

RAG-specific deployment/provider material belongs in [`../rag/deployment/`](../rag/deployment/README.md); whole-project run/deploy procedure belongs in [`../operations/`](../operations/README.md); quality evidence belongs in [`../qc/`](../qc/README.md).

<a id="current-documents"></a>
## Current Documents

- [System overview](system-overview.md)
- [Component interactions](component-interactions.md)
- [Request and data flows](request-data-flows.md)
- [Trust boundaries](trust-boundaries.md)

<a id="placement-rule"></a>
## Placement Rule

If a document answers **“how is the system fundamentally arranged?”**, place it here. RAG-specific deployment/provider decisions go to `docs/rag/deployment/`; whole-project operational procedure goes to `docs/operations/`.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG documentation](../rag/README.md)
- [RAG deployment](../rag/deployment/README.md)
- [Operations](../operations/README.md)
- [Quality Control](../qc/README.md)
