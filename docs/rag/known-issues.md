# RAG Known Issues, Caveats and Proposed Hardening

## Table of Contents

- [Active Known Issues](#active-known-issues)
  - [Step 1 Relocation](#step-1-relocation)
  - [Runtime Dense-Score Equivalence](#runtime-dense-score-equivalence)
  - [Evidence Polarity Edge Cases](#evidence-polarity-edge-cases)
  - [Broad Backend/System-Design Facet](#broad-backendsystem-design-facet)
- [Proposed Patch - NOT APPLIED](#proposed-patch---not-applied)
- [Generation Not Integrated](#generation-not-integrated)
- [Browser Not Wired](#browser-not-wired)
- [Deployment Not Selected/Completed](#deployment-not-selectedcompleted)
- [Deployment Evaluation Summary](#deployment-evaluation-summary)
- [Cloudflare-Native Candidate Risks](#cloudflare-native-candidate-risks)
- [Documentation Placement](#documentation-placement)

<a id="active-known-issues"></a>
## Active Known Issues

<a id="step-1-relocation"></a>
### Step 1 Relocation

The normalizer's base-path design is stale after folder reorganization. Existing outputs are valid; a future full rebuild needs path refactoring first.

<a id="runtime-dense-score-equivalence"></a>
### Runtime Dense-Score Equivalence

BM25/metadata-only union candidates outside Pinecone top 500 receive dense score zero in the runtime, whereas offline exact v3 has a cosine score for every record. Pinecone backend parity is proven; exact full-pipeline rank parity is not.

<a id="evidence-polarity-edge-cases"></a>
### Evidence Polarity Edge Cases

Some repositories contain security debt, limitations or words such as “control” that are semantically close to positive questions. Existing concept/polarity logic handles much of this, but surgical false positives remain possible.

<a id="broad-backendsystem-design-facet"></a>
### Broad Backend/System-Design Facet

A generic backend/architecture word can be too permissive when it appears in a negative comparison or absence list. The local v1.1 proposal adds stronger positive-support checks for backend-positive queries.

<a id="proposed-patch---not-applied"></a>
## Proposed Patch - NOT APPLIED

`rag-backend-positive-gate-v1` remains a local proposal outside GitHub main. Do not advance documentation status ahead of code. If applied, reconcile schema constants, run self-tests, rerun employer-style regressions and exercise the HTTP runtime before updating the component-version map.

<a id="generation-not-integrated"></a>
## Generation Not Integrated

Gemini selection is complete but the active runtime still returns no generated answer. UI copy must not imply live generation before it exists.

<a id="browser-not-wired"></a>
## Browser Not Wired

The Kiro query experience is not yet connected to a production RAG endpoint.

<a id="deployment-not-selectedcompleted"></a>
## Deployment Not Selected/Completed

The active Nomic/Pinecone/Python retrieval runtime is validated but not production-hosted behind the portfolio Worker.

<a id="deployment-evaluation-summary"></a>
## Deployment Evaluation Summary

RAG deployment records now live under `docs/rag/deployment/`:

- [Containerization and Hosting Evaluation](deployment/2026-08-31-containerization-and-hosting-evaluation.md)
- [Zero-Cost Cloudflare-Native Runtime Evaluation](deployment/2026-08-31-cloudflare-native-zero-cost-runtime-evaluation.md)

Important facts retained from those records:

- local Docker containerization: **PASS**;
- CPU-only PyTorch packaging: required;
- initialized runtime memory: **~1.293 GiB measured**;
- Cloudflare Containers: blocked by current paid-plan requirement;
- Render Free: 512 MB, below current runtime footprint;
- no-Python Cloudflare-native path: candidate only, not implemented.

Retrieval-quality evidence remains under [`../qc/rag/evidence/`](../qc/rag/evidence/); deployment/container evidence lives under [`deployment/evidence/`](deployment/evidence/).

<a id="cloudflare-native-candidate-risks"></a>
## Cloudflare-Native Candidate Risks

### Qwen retrieval equivalence — OPEN

Qwen creates a new embedding space. It must be benchmarked against the validated Nomic baseline on real employer-style queries.

### CrossEncoder replacement — OPEN

Replacing Nomic does not remove the Python CrossEncoder. The serverless reranker candidate must be benchmarked for ranking quality and truncation behavior.

### D1 FTS5 vs current BM25 — OPEN

D1 FTS5 is plausible but is not guaranteed to reproduce Python BM25 ranking. This is a retrieval-algorithm change requiring regression evidence.

### Worker resource envelope — OPEN

The Worker should orchestrate slim state rather than bundle the current large embedding-record document payload. A D1-backed runtime representation is the candidate approach.

### Vectorize top-K mismatch — OPEN

The current pipeline asks for top-500 dense candidates. Vectorize result limits differ, so switching the database before measuring recall impact is premature.

### Full free-query capacity — OPEN until measured

Embedding inference alone has high free capacity. Complete RAG capacity is bounded by reranking, vector-store usage, D1, Worker limits and generation quota. Actual per-query usage must be measured.

### Generation privacy/data handling — REVIEW REQUIRED

Public visitor questions should be handled with explicit data minimization and clear provider/privacy assumptions when generation is integrated.

<a id="documentation-placement"></a>
## Documentation Placement

The taxonomy is now explicit:

```text
docs/rag/deployment/
  -> deployment/provider evaluations and production-path decisions

docs/qc/rag/
  -> retrieval quality incidents, regression findings and validation evidence
```

## Related Documentation

- Parent: [RAG documentation](README.md)
- [RAG QC](../qc/rag/README.md)
- [Cloudflare integration](cloudflare-integration.md)
- [Zero-cost Cloudflare migration](cloudflare-native-zero-cost-migration.md)
- [RAG deployment history](deployment/README.md)
- [RAG QC guide](../qc/rag/README.md)
