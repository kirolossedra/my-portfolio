# RAG Testing and Regression Evidence

## Table of Contents

- [Structural Validations](#structural-validations)
- [Retrieval Regression Query](#retrieval-regression-query)
- [Pinecone Acceptance Numbers](#pinecone-acceptance-numbers)
- [Runtime HTTP Smoke](#runtime-http-smoke)
- [What Still Needs Regression](#what-still-needs-regression)
- [Proposed Backend Gate Tests](#proposed-backend-gate-tests)

<a id="structural-validations"></a>
## Structural Validations

- Step 1: 134/134 normalized repositories, section/tag/rating counts;
- Step 2: repo coverage, block accounting, no failures/fallbacks;
- Step 3: token length, shape/dtype, finite/nonzero values, norms, ID/reference integrity;
- Pinecone upsert: index shape, namespace count/freshness;
- Pinecone v2: ANN overlap + exact fetched-vector fidelity;
- runtime: initialization, model loading, Pinecone auth/search, HTTP health/retrieve serialization.

<a id="retrieval-regression-query"></a>
## Retrieval Regression Query

Authorization architecture remains a canonical quality query because old systems exposed three distinct failure modes: generic template similarity, negative/absence evidence and broad `architecture/control` vocabulary.

Offline v3: union 940 -> concept pass 612 -> rerank 120 -> top 10, with strong LInC/my-portfolio-class evidence replacing v1's unrelated rank-1 result.

The backend/system-design generalization test is now a second canonical regression family because it exposed the difference between topical relevance and positive claim support. See [`../qc/rag/2026-08-31-backend-system-design-generalization-incident.md`](../qc/rag/2026-08-31-backend-system-design-generalization-incident.md).

<a id="pinecone-acceptance-numbers"></a>
## Pinecone Acceptance Numbers

| Metric | v2 result | Acceptance |
|---|---:|---:|
| same top-1 | true | required |
| overlap@10 | 100% | >=90% |
| overlap@25 | 96% | >=90% |
| overlap@50 | 98% | >=90% |
| max fetched vector delta | 0 | exact fidelity |
| max recomputed cosine delta | 0 | exact fidelity |

<a id="runtime-http-smoke"></a>
## Runtime HTTP Smoke

The backend/system-design HTTP call returned status OK with current schema IDs and a plausible top ranking. Generation was null, correctly proving only retrieval runtime behavior. The QC record retains the relevant returned repository names and explanations rather than duplicating the entire transport JSON.

<a id="what-still-needs-regression"></a>
## What Still Needs Regression

Before public integration: run a broader employer-style suite covering backend, authorization, testing evolution, product ownership, weaknesses/limitations, deployment/operations, chronology and skill-specific questions. After Gemini integration, add answer-grounding tests that compare claims against returned evidence rather than scoring prose style alone.

The Qwen candidate must be evaluated against this same suite before it can replace Nomic.

<a id="proposed-backend-gate-tests"></a>
## Proposed Backend Gate Tests

The unmerged v1.1 proposal adds three explicit unit-style regression cases for broad backend positive queries: reject negative/comparative frontend mention, reject an absence ledger, retain true Worker/API/persistence evidence. The incident record explains why the long-term architectural fix should be generic evidence compatibility rather than accumulating query-specific vocabulary patches.

## Related Documentation

- Parent: [RAG documentation](README.md)
- [Known issues](known-issues.md)
- [Pinecone](pinecone.md)
- [RAG QC](../qc/rag/README.md)
