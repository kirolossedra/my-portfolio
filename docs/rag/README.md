# RAG Documentation

## Table of Contents

- [Purpose](#purpose)
- [Directory Responsibility](#directory-responsibility)
- [Three-Way RAG Directory Distinction](#three-way-rag-directory-distinction)
- [Current Runtime Truth](#current-runtime-truth)
- [Current Documentation](#current-documentation)
- [Deployment Documentation](#deployment-documentation)
- [Quality-Control Boundary](#quality-control-boundary)
- [Implementation Boundary](#implementation-boundary)
- [Placement Rules](#placement-rules)

<a id="purpose"></a>
## Purpose

`docs/rag/` is the **canonical documentation domain for the portfolio RAG subsystem**. It contains RAG architecture, runtime/deployment reasoning, provider evaluations, migration designs, operational constraints and known design caveats.

It exists so RAG engineering documentation is not mixed with either Quality Control evidence or the implementation/code tree.

<a id="directory-responsibility"></a>
## Directory Responsibility

This folder answers questions such as:

- how the RAG subsystem is architected;
- what the currently validated runtime is;
- how Cloudflare, Pinecone, Nomic, Qwen, Vectorize, D1 and reranking fit into the design;
- what deployment paths were evaluated and why some were rejected;
- what hard cost/runtime constraints apply;
- what migration sequence is recommended;
- which architecture is current versus candidate;
- what implementation files would change if a candidate is approved.

<a id="three-way-rag-directory-distinction"></a>
## Three-Way RAG Directory Distinction

These paths have deliberately different meanings:

```text
docs/rag/
  DOCUMENTATION DOMAIN
  architecture, deployment decisions, migration analysis, provider/capacity design

docs/qc/rag/
  QUALITY CONTROL DOMAIN
  incidents, regressions, pass/fail validation, parity evidence, sanitized QC captures

rag/
  IMPLEMENTATION DOMAIN
  Python runtime, scripts, generated corpus, embeddings, retrieval artifacts and code-adjacent implementation files
```

A file must not be placed under `docs/qc/rag/` merely because it contains measurements. If its primary purpose is deciding **how RAG should be deployed**, it belongs here under `docs/rag/` or `docs/rag/deployment/`.

Likewise, documentation must not be packaged as a replacement top-level `rag/` directory when the task is to correct the documentation hierarchy.

<a id="current-runtime-truth"></a>
## Current Runtime Truth

The current validated baseline remains:

```text
2,808 evidence-aware retrieval documents
        ↓
Nomic v1.5 document/query embedding contract
        ↓
512-D normalized vectors
        ↓
Pinecone Serverless
        +
Python-owned BM25 / metadata / fusion / gates
        +
local CrossEncoder reranking
        +
dedupe / diversity / response shaping
```

The Cloudflare-native Qwen design is **CANDIDATE / NOT APPLIED**. It does not become current merely because its deployment shape is simpler.

<a id="current-documentation"></a>
## Current Documentation

- [Cloudflare / portfolio integration plan](cloudflare-integration.md)
- [Zero-cost Cloudflare-native migration analysis](cloudflare-native-zero-cost-migration.md)
- [Known issues, caveats and proposed hardening](known-issues.md)

The top-level `rag/` implementation tree is not modified by this package. The canonical current RAG documentation is consolidated here under `docs/rag/`. Any older documentation copies that still physically exist under the implementation tree are treated as implementation-adjacent/historical copies, not the canonical documentation location.

### Core RAG engineering documents

- [Active pipeline](pipeline.md)
- [Component interactions](component-interactions.md)
- [Chunking / retrieval-document history](chunking-and-document-history.md)
- [Embedding version history](embedding-version-history.md)
- [Retrieval version history](retrieval-version-history.md)
- [Pinecone dense backend](pinecone.md)
- [Testing and regressions](testing-and-regressions.md)
- [Regeneration matrix](regeneration-matrix.md)
- [Documentation history](history/README.md)

<a id="deployment-documentation"></a>
## Deployment Documentation

Detailed provider/hosting/runtime decision history lives in [`deployment/`](deployment/README.md):

- [2026-08-31 — Containerization and Hosting Evaluation](deployment/2026-08-31-containerization-and-hosting-evaluation.md)
- [2026-08-31 — Zero-Cost Cloudflare-Native Runtime Evaluation](deployment/2026-08-31-cloudflare-native-zero-cost-runtime-evaluation.md)

These records preserve both successful and rejected paths, including Docker, Cloudflare Containers, Render Free, Deno, hosted Nomic, Fireworks, Hugging Face provider availability, browser ONNX, personal-PC hosting, Workers AI, Pinecone, Vectorize and D1 considerations where applicable.

<a id="quality-control-boundary"></a>
## Quality-Control Boundary

Quality-control material belongs in [`../qc/rag/`](../qc/rag/README.md), including:

- retrieval false-positive/generalization incidents;
- parity/regression findings;
- pass/fail acceptance results;
- raw/sanitized runtime evidence;
- preservation-verification evidence.

A deployment decision record may cite QC evidence without becoming a QC document.

<a id="implementation-boundary"></a>
## Implementation Boundary

The top-level `rag/` directory remains the executable/data subsystem. Examples include:

```text
rag/runtime/
rag/scripts/
rag/rag-corpus/
rag/other/
rag/obsolete/
```

This `docs/` package does **not** modify or replace those implementation directories.

<a id="placement-rules"></a>
## Placement Rules

| Primary question answered by a document | Correct home |
|---|---|
| How is RAG designed? | `docs/rag/` |
| Which RAG hosting/provider/runtime path should be used? | `docs/rag/deployment/` |
| Did RAG retrieval/parity/quality pass or fail? | `docs/qc/rag/` |
| What concise evidence proves a RAG QC observation? | `docs/qc/rag/evidence/` |
| How is the whole portfolio deployed/released? | `docs/operations/` |
| Where is executable RAG code/data? | top-level `rag/` |

## Related Documentation

- Parent: [../README.md](../README.md)
- [Whole-project architecture](../architecture/README.md)
- [Whole-project operations](../operations/README.md)
- [RAG Quality Control](../qc/rag/README.md)
