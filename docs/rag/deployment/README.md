# RAG Deployment and Hosting Decision History

## Table of Contents

- [Purpose](#purpose)
- [What Belongs Here](#what-belongs-here)
- [What Does Not Belong Here](#what-does-not-belong-here)
- [Decision Timeline](#decision-timeline)
- [Evidence Boundary](#evidence-boundary)
- [Current Recommendation](#current-recommendation)

<a id="purpose"></a>
## Purpose

`docs/rag/deployment/` is the canonical location for **RAG-specific deployment, hosting, provider and production-runtime decision records**.

These documents may contain benchmarks, resource measurements, quota tables and PASS/FAIL observations, but their primary purpose is operational/architectural decision-making for the RAG subsystem. That makes them RAG deployment documentation, not Quality Control documents.

<a id="what-belongs-here"></a>
## What Belongs Here

- hosting-provider feasibility comparisons;
- container/serverless/runtime architecture evaluations;
- free-tier and hard-cap analysis;
- deployment migration sequencing;
- rollback strategy;
- production topology options;
- model-serving choices when driven by deployment architecture;
- vector-database deployment decisions.

<a id="what-does-not-belong-here"></a>
## What Does Not Belong Here

- retrieval-quality incidents;
- regression/parity acceptance records;
- retrieval-QC captures whose primary role is proving retrieval quality;
- general whole-portfolio Netlify/Worker/D1 release procedure.

Those belong in [`../../qc/rag/`](../../qc/rag/README.md) and [`../../operations/`](../../operations/README.md), respectively.

<a id="decision-timeline"></a>
## Decision Timeline

1. [2026-08-31 — Containerization and Hosting Evaluation](2026-08-31-containerization-and-hosting-evaluation.md)
   - current Python/Pinecone runtime successfully containerized;
   - CPU-only PyTorch packaging validated;
   - measured initialized runtime ~1.293 GiB;
   - Cloudflare Containers blocked by paid-plan requirement;
   - Render Free 512 MB insufficient for the measured image.

2. [2026-08-31 — Zero-Cost Cloudflare-Native Runtime Evaluation](2026-08-31-cloudflare-native-zero-cost-runtime-evaluation.md)
   - deployment problem reframed around retrieval quality rather than preserving Nomic at any infrastructure cost;
   - Qwen3-Embedding-0.6B identified as the primary Cloudflare-native candidate;
   - replacing Nomic alone correctly identified as insufficient to remove Python;
   - Qwen + a parallel Pinecone candidate index selected as the first controlled experiment;
   - Vectorize deliberately deferred until after embedding/runtime quality is proven.

<a id="evidence-boundary"></a>
## Evidence Boundary

Deployment evidence lives beside the deployment decision history because it proves deployment/runtime feasibility rather than retrieval quality:

- [`evidence/2026-08-31-containerization-hosting-evidence.txt`](evidence/2026-08-31-containerization-hosting-evidence.txt)

Documentation-preservation verification is a different QC concern and lives under:

- [`../../qc/documentation/2026-08-31-document-preservation-verification.txt`](../../qc/documentation/2026-08-31-document-preservation-verification.txt)

Retrieval-quality evidence remains under:

- [`../../qc/rag/evidence/`](../../qc/rag/evidence/)

The separation is intentional:

```text
RAG deployment record/evidence
  -> hosting, runtime footprint, provider constraints, deployment viability

RAG QC record/evidence
  -> retrieval quality, parity, regression and evidence correctness

Documentation QC
  -> preservation and taxonomy verification
```

<a id="current-recommendation"></a>
## Current Recommendation

Do not perform a big-bang platform migration. Preserve the validated Nomic/Pinecone/Python baseline and first run a controlled Qwen embedding bake-off using the same 2,808 documents and the same retrieval-quality regression suite. If Qwen passes, then evaluate the Worker/D1/reranker port. Only after that should Pinecone-vs-Vectorize become a separate migration decision.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Canonical zero-cost migration analysis](../cloudflare-native-zero-cost-migration.md)
- [Cloudflare integration](../cloudflare-integration.md)
- [Known issues](../known-issues.md)
- [Whole-portfolio deployment overview](../../operations/deployment.md)
- [RAG Quality Control](../../qc/rag/README.md)
