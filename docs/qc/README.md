# Quality Control Documentation

## Table of Contents

- [Purpose](#purpose)
- [Meaning of QC](#meaning-of-qc)
- [What Belongs Here](#what-belongs-here)
- [What Does Not Belong Here](#what-does-not-belong-here)
- [RAG QC](#rag-qc)
- [Documentation QC](#documentation-qc)
- [Placement Rule](#placement-rule)

<a id="purpose"></a>
## Purpose

`docs/qc/` contains **Quality Control** records: evidence and analysis used to establish whether implementation behavior satisfies quality, correctness, regression, preservation or acceptance expectations.

<a id="meaning-of-qc"></a>
## Meaning of QC

QC means **Quality Control**. In this repository, that includes concrete verification and incident analysis, not general architecture planning or deployment-provider selection.

<a id="what-belongs-here"></a>
## What Belongs Here

- regression and parity findings;
- validation reports and acceptance evidence;
- quality incidents/postmortems;
- smoke-test evidence when its purpose is to prove behavior;
- preservation/integrity verification;
- PASS/FAIL audit artifacts;
- sanitized evidence supporting technical claims.

<a id="what-does-not-belong-here"></a>
## What Does Not Belong Here

- RAG hosting-provider selection;
- RAG deployment migration strategy;
- free-tier/provider comparisons;
- production topology decisions;
- Docker/Render/Cloudflare deployment chronology as a decision record.

Those belong under [`../rag/deployment/`](../rag/deployment/README.md).

<a id="rag-qc"></a>
## RAG QC

RAG-specific quality records live under [`rag/`](rag/README.md).

<a id="documentation-qc"></a>
## Documentation QC

Documentation preservation/taxonomy verification lives under [`documentation/`](documentation/README.md).

<a id="placement-rule"></a>
## Placement Rule

If the document primarily answers **“did the implementation meet a quality/correctness expectation, and what evidence proves that?”**, it belongs in QC.

If it primarily answers **“which RAG deployment path should we use and why?”**, it belongs in `docs/rag/deployment/`.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG documentation](../rag/README.md)
- [RAG deployment history](../rag/deployment/README.md)
- [Operations](../operations/README.md)
- [Testing](../testing/README.md)
