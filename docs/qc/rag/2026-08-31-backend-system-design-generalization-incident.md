# RAG QC Incident — Backend/System-Design Generalization and Evidence-Semantics Finding

> **QC category:** Retrieval quality / architecture  
> **Incident date:** 2026-08-31  
> **Status:** Documented; implementation intentionally unchanged  
> **Authoritative implementation commit:** `6710a697390858b8dfbcdf7ec3d2e737f34263da`  
> **Commit message:** `feat(rag): reorganize pipeline and add Pinecone-backed runtime`  
> **Tested runtime file:** `rag/runtime/rag-api-pinecone-v1.py`  
> **Runtime File ID:** `RAG-PINECONE-API-de9841ed-372d-4111-aabf-3b470529bbc6`  
> **Runtime Version ID:** `RAG-PINECONE-API-v1.0.0-50de3f8b-ca98-4730-be0e-575e7afa3bc8`  
> **Runtime version:** `1.0.0`  
> **Retrieval schema:** `3.1.0-pinecone`  
> **Tested runtime blob SHA:** `76f7637a5afa734df746f8d864ed8c2477faf5d4`

---

## Table of Contents

1. [Purpose](#purpose)
2. [Executive Conclusion](#executive-conclusion)
3. [Implementation Baseline](#implementation-baseline)
4. [System State Before the Incident](#system-state-before-the-incident)
5. [What We Were Testing](#what-we-were-testing)
6. [Why We Deliberately Changed the Question](#why-we-deliberately-changed-the-question)
7. [Test Question](#test-question)
8. [Observed Runtime Path](#observed-runtime-path)
9. [What Worked](#what-worked)
10. [What the New Question Exposed](#what-the-new-question-exposed)
11. [False-Positive Pattern 1 — Absence Language](#false-positive-pattern-1--absence-language)
12. [False-Positive Pattern 2 — Negative Backend Mention in Frontend Evidence](#false-positive-pattern-2--negative-backend-mention-in-frontend-evidence)
13. [Why Broad Retrieval Was Not Wrong](#why-broad-retrieval-was-not-wrong)
14. [Why This Was Not a Pinecone Failure](#why-this-was-not-a-pinecone-failure)
15. [Why This Was Not an Embedding Failure](#why-this-was-not-an-embedding-failure)
16. [Why This Was Not a CrossEncoder Failure Alone](#why-this-was-not-a-crossencoder-failure-alone)
17. [The Initially Proposed Tactical Fix](#the-initially-proposed-tactical-fix)
18. [Why the Tactical Fix Was Rejected](#why-the-tactical-fix-was-rejected)
19. [Root Architectural Finding](#root-architectural-finding)
20. [Correct Separation of Responsibilities](#correct-separation-of-responsibilities)
21. [Recommended Structured Evidence Contract](#recommended-structured-evidence-contract)
22. [Examples of the Intended Contract](#examples-of-the-intended-contract)
23. [Correct File Boundary for the Future Redesign](#correct-file-boundary-for-the-future-redesign)
24. [Constraint: Do Not Re-run the Expensive Embedding Process](#constraint-do-not-re-run-the-expensive-embedding-process)
25. [What Must Remain Byte-Stable](#what-must-remain-byte-stable)
26. [What Can Change Without Re-embedding](#what-can-change-without-re-embedding)
27. [What Would Force Re-embedding](#what-would-force-re-embedding)
28. [Current Baseline Decision](#current-baseline-decision)
29. [Future Acceptance Criteria](#future-acceptance-criteria)
30. [Lessons From the Incident](#lessons-from-the-incident)
31. [Related Documentation](#related-documentation)

---

## Purpose

This document records a quality-control incident discovered while validating the first locally operational Pinecone-backed runtime of the portfolio RAG system.

The incident is important because it did **not** reveal that the runtime was broken. The runtime successfully handled a completely different natural-language question, exercised the full Pinecone/BM25/metadata/CrossEncoder retrieval path, and returned results. Instead, the new question exposed a deeper design weakness in how positive evidence was inferred from relevant documents.

The immediate temptation was to add another query-specific keyword rule. That approach was explicitly rejected because it would create a patch-driven retrieval architecture. The final conclusion was that the system needs a cleaner distinction between:

```text
semantic relevance
```

and:

```text
claim/evidence compatibility
```

The preferred future solution is therefore architectural: enrich the **offline retrieval-document evidence contract** while preserving the already-validated embedding text and vectors.

No RAG implementation file was modified as a consequence of this incident.

---

## Executive Conclusion

The test established all of the following at once:

```text
Arbitrary-question API handling             PASS
Nomic query embedding                       PASS
Pinecone dense recall                       PASS
BM25 recall                                 PASS
Metadata recall                             PASS
Candidate fusion                            PASS
CrossEncoder execution                      PASS
Semantic deduplication                      PASS
Repository diversity                        PASS
Generalization beyond authorization prompt  PASS

Positive-evidence claim compatibility       DESIGN WEAKNESS FOUND
```

The central finding is:

> **A document can be highly relevant to a concept without being valid positive evidence for a claim about that concept.**

For example:

```text
"This repository does not demonstrate backend maturity."
```

is highly relevant to `backend maturity`, but it is not evidence that the repository demonstrates backend maturity.

The runtime still relied too heavily on inferring this distinction from query-time textual heuristics. The future design should make claim direction and evidence semantics explicit in the offline retrieval documents.

---

## Implementation Baseline

The incident occurred against the exact repository implementation contained in commit:

```text
6710a697390858b8dfbcdf7ec3d2e737f34263da
```

Commit message:

```text
feat(rag): reorganize pipeline and add Pinecone-backed runtime
```

This commit is the **authoritative implementation baseline for this QC incident**.

The tested runtime was:

```text
rag/runtime/rag-api-pinecone-v1.py
```

with:

```text
Runtime File ID:
RAG-PINECONE-API-de9841ed-372d-4111-aabf-3b470529bbc6

Runtime Version ID:
RAG-PINECONE-API-v1.0.0-50de3f8b-ca98-4730-be0e-575e7afa3bc8

Runtime version:
1.0.0

Retrieval schema:
3.1.0-pinecone

Git blob SHA:
76f7637a5afa734df746f8d864ed8c2477faf5d4
```

Future comparisons should refer back to this commit rather than relying on a moving `main` branch.

---

## System State Before the Incident

Before the generalization test, the RAG system had already completed the following stages:

```text
134-repository analytical corpus
        ↓
canonical normalization
        ↓
evidence-aware retrieval documents
        ↓
2,808 local Nomic embeddings
        ↓
Retrieval v3
        ↓
Pinecone upsert
        ↓
Pinecone dense-backend validation
        ↓
Python HTTP retrieval runtime
        ↓
local startup validation
        ↓
HTTP /health validation
```

The active corpus contained:

```text
Repositories: 134
Retrieval documents: 2,808
Stored vectors: 2,808
Stored dimensions: 512
```

The embedding configuration was:

```text
Model: nomic-ai/nomic-embed-text-v1.5
Pinned revision: e9b6763023c676ca8431644204f50c2b100d9aab
Native dimensions: 768
Stored dimensions: 512
Document prefix: search_document:
Query prefix: search_query:
Similarity: cosine
```

The reranker was:

```text
cross-encoder/ms-marco-MiniLM-L6-v2
```

with pinned revision:

```text
4bebbd56fc380a66525f95b03d4ec1a4b41a4f1e
```

Pinecone state:

```text
Index: portfolio-career-rag-v1
Namespace: corpus-v1
Metric: cosine
Dimensions: 512
Vector count: 2,808
```

The corrected Pinecone parity validation had already established that the stored vectors were faithful to the local vectors and that ANN candidate overlap was sufficiently strong for Pinecone to replace the exact local dense-candidate lookup.

---

## What We Were Testing

The immediate goal was **not** to tune retrieval around a new prompt.

The goal was to verify that the newly operational runtime could accept an arbitrary portfolio question through:

```text
POST /api/rag/retrieve
```

and execute the complete production-shaped retrieval path.

Until this point, one question had been used repeatedly as a regression case:

```text
What evidence shows experience with authorization architecture?
```

That question was intentionally retained as a regression query because it had previously exposed:

- generic `architecture` matches;
- authorization/access-control ambiguity;
- limitations that could appear as positive security evidence;
- hardware `control` terminology that was unrelated to authorization.

However, a regression query is not supposed to become the system's effective design target.

---

## Why We Deliberately Changed the Question

The question was changed specifically to test generalization.

Repeatedly using one regression query can create a false sense of retrieval quality because successive improvements may accidentally optimize for that particular wording or facet.

The new question therefore needed to satisfy three conditions:

1. remain portfolio/career-evidence oriented;
2. require meaningful cross-repository reasoning;
3. test a different engineering concept from authorization.

This produced the backend/system-design test.

---

## Test Question

The exact question used was:

```text
What evidence shows strong backend engineering and system design experience?
```

This question asked for **positive evidence** and introduced several semantic requirements simultaneously:

```text
facet: backend engineering
facet: system design
request mode: evidence
polarity/claim direction: positive/supporting
strength qualifier: strong
scope: portfolio-wide
```

That made it a useful test of whether the retrieval system distinguished topical relevance from proof of a requested capability.

---

## Observed Runtime Path

The request successfully exercised the runtime.

Observed diagnostics were approximately:

```text
Pinecone dense candidates: 500
BM25 candidates:           500
Metadata candidates:       400
Fused candidate union:     899
CrossEncoder rerank pool:  120
Final returned results:    10
End-to-end latency:        ~8.17 seconds
```

The runtime path was therefore:

```text
Question
  ↓
query intent / concept analysis
  ↓
Nomic search_query embedding
  ↓
Pinecone dense ANN recall (top 500)
  +
BM25 lexical recall (top 500)
  +
metadata/topic/skill recall (top 400)
  ↓
reciprocal-rank fusion
  ↓
concept/evidence gates
  ↓
CrossEncoder reranking (bounded pool)
  ↓
negative-evidence handling
  ↓
semantic deduplication using Pinecone-fetched vectors
  ↓
repository diversity
  ↓
top 10 evidence documents
```

This is important: the incident happened **after the runtime successfully generalized operationally** to a new question.

---

## What Worked

### Arbitrary question handling

The API accepted a new question without code changes or prompt-specific configuration.

### Query embedding

The query was embedded in the same Nomic vector space as the indexed documents using the required `search_query:` prefix and the same 512-dimensional Matryoshka transformation.

### Pinecone dense recall

Pinecone returned broad semantically relevant candidates.

### BM25

Lexical retrieval contributed exact-term candidates independently of dense recall.

### Metadata recall

Topics, skills, repository metadata, and evidence metadata participated in candidate generation.

### Hybrid fusion

Candidates from different recall paths were successfully unified and ranked.

### CrossEncoder execution

The bounded rerank stage executed successfully on the candidate set.

### Finalization

Semantic deduplication and repository diversity successfully produced a bounded final result set.

### Most importantly: generalization worked

The runtime was **not built around one authorization prompt**. It processed a different backend/system-design question end-to-end.

---

## What the New Question Exposed

The new prompt exposed a design problem that the authorization regression query had not made sufficiently obvious.

The runtime still allowed a document to become strong positive evidence largely because it was highly relevant to the requested topic.

But these are separate questions:

```text
Is this document about backend engineering?
```

and:

```text
Does this document support the claim that the portfolio demonstrates backend engineering?
```

A robust evidence-oriented RAG system must answer both.

The new question surfaced documents where the answer was:

```text
Topically relevant?       YES
Positive supporting proof? NO
```

Two patterns were especially clear.

---

## False-Positive Pattern 1 — Absence Language

One early result discussed concepts such as:

```text
backend design
databases
distributed systems
```

but discussed them as **capabilities that were absent, missing, or not demonstrated**.

That document was therefore legitimately relevant to the topic.

The problem occurred when it remained too competitive for a positive-evidence query.

Conceptually:

```text
Query:
"What evidence shows strong backend engineering?"

Document meaning:
"This repository does not demonstrate backend/database/distributed-system depth."

Dense relevance:           legitimate
Lexical relevance:         legitimate
Topic relevance:           legitimate
Positive claim support:    false
```

The incident demonstrated that `relevant` must not be treated as synonymous with `supports`.

---

## False-Positive Pattern 2 — Negative Backend Mention in Frontend Evidence

A second result made the issue even clearer.

The document was primarily about frontend/presentation evidence. Its prose included wording equivalent to:

```text
not a new backend maturity maximum
```

The document therefore contained the literal concept `backend`, but it contained that term specifically to prevent an overclaim.

Observed behavior showed approximately:

```text
backend-related gate score:     ~0.54
backend semantic-area support:   none
backend metadata support:        none
```

The logic had effectively performed this transformation:

```text
"this is NOT backend maturity evidence"
              ↓
contains "backend"
              ↓
backend concept overlap
              ↓
survives too far into positive-evidence ranking
```

This is the most concise illustration of the incident.

---

## Why Broad Retrieval Was Not Wrong

It is important not to misdiagnose the system.

A dense retriever or BM25 engine **should** retrieve a sentence like:

```text
this repository does not demonstrate backend maturity
```

for a query about backend maturity.

That sentence is semantically and lexically relevant.

The error is not candidate generation.

The error is failing to distinguish, later in the pipeline, between:

```text
mentions / discusses concept
```

and:

```text
supports requested claim about concept
```

This distinction directly affects where the architectural fix belongs.

---

## Why This Was Not a Pinecone Failure

Pinecone's responsibility is dense candidate recall.

The Pinecone migration had already been validated separately for:

- vector-count integrity;
- 512-dimensional schema compatibility;
- exact stored-vector fidelity;
- top-1 candidate agreement;
- high overlap at top-10, top-25, and top-50.

For this incident, Pinecone did what a dense retriever should do: it returned documents semantically related to the question.

Pinecone has no responsibility for deciding whether:

```text
"backend is absent"
```

supports or contradicts:

```text
"show me backend strength"
```

That interpretation belongs to the evidence architecture.

Therefore:

> **This incident must not be recorded as a Pinecone quality failure.**

---

## Why This Was Not an Embedding Failure

The active Nomic embeddings also behaved as expected.

The embedding space is designed to encode semantic relatedness.

It is reasonable for:

```text
backend capability
```

and:

```text
absence of backend capability
```

to occupy nearby semantic regions.

Embeddings are not a formal claim-direction classifier.

The stored vectors were already validated for:

- dimensions;
- finite values;
- non-zero values;
- L2 normalization;
- referential integrity;
- source-document alignment;
- complete repository coverage.

Therefore:

> **The incident does not justify regenerating embeddings or replacing Nomic.**

---

## Why This Was Not a CrossEncoder Failure Alone

The CrossEncoder is responsible for higher-precision query-document relevance scoring.

But the same conceptual problem applies:

```text
Query: backend engineering evidence
Document: explicit statement that backend engineering is absent
```

is a highly related query-document pair.

A generic relevance reranker can correctly score it as related without understanding that the user's requested claim direction is positive/supporting.

Therefore, merely changing CrossEncoder weights or adding more reranking would not cleanly solve the architecture.

The system needs explicit evidence semantics.

---

## The Initially Proposed Tactical Fix

Immediately after the incident, a tactical fix was designed.

The proposed rule attempted to prevent off-area documents from passing a positive backend/system-design query based solely on generic terms such as:

```text
backend
architecture
```

It proposed requiring stronger backend-specific support such as:

```text
API
database
distributed
endpoint
REST
Worker
Hono
Spring
server
```

and combining that with existing information such as:

- semantic area;
- direct-evidence class;
- metadata hits;
- concrete-signal count.

Regression cases were also proposed for:

```text
reject frontend document with negative backend mention
reject explicit backend absence list
retain genuine backend architecture evidence
```

This would have produced a runtime/retrieval revision around:

```text
runtime 1.1.0
retrieval schema 3.1.1-pinecone
```

However, this proposed change was **not applied**.

---

## Why the Tactical Fix Was Rejected

The tactical fix could suppress the two observed false positives, but it introduced a larger engineering concern.

If every new query category requires a dedicated runtime term set, the architecture evolves into:

```text
backend query
  → backend-specific words

testing query
  → testing-specific words

deployment query
  → deployment-specific words

security query
  → security-specific words

product query
  → product-specific words
```

This is patch-driven design.

It creates several risks:

1. hidden special cases accumulate in runtime code;
2. correctness depends on hand-maintained vocabulary lists;
3. query behavior becomes difficult to reason about globally;
4. adding a new engineering concept requires changing code;
5. false positives are treated as isolated wording problems instead of schema problems;
6. regression complexity grows faster than the corpus;
7. the runtime becomes responsible for rediscovering evidence meaning that could have been encoded offline.

The tactical patch was therefore rejected as the primary design direction.

---

## Root Architectural Finding

The core architectural problem is:

> **Query understanding, topical relevance, and evidence semantics are not sufficiently separated.**

The current retrieval documents already contain valuable fields such as:

```text
retrieval_class
semantic_area
evidence_polarity
concrete_signal_count
topics
skills
source_fragments
```

But at runtime, too much claim interpretation is still reconstructed from natural-language text and query-specific lexical heuristics.

The future architecture should instead allow a retrieval document to explicitly state:

```text
what concept/facet it concerns
what claim direction it represents
what kind of evidence it contains
how strong/concrete the evidence is
what limitations qualify it
```

Then query time can perform generic **evidence compatibility**, rather than topic-specific patching.

---

## Correct Separation of Responsibilities

The preferred architecture is:

```text
                    OFFLINE
                    =======

Repository corpus
      ↓
Canonical normalization
      ↓
Evidence-document compiler
      ↓
Structured evidence semantics
      │
      ├── facets
      ├── claim mode
      ├── evidence kind
      ├── evidence strength
      ├── technologies
      ├── limitations
      └── provenance
      ↓
existing embedding text
      ↓
existing Nomic vectors
      ↓
Pinecone


                    ONLINE
                    ======

Question
      ↓
Query understanding
      ↓
requested facets + evidence mode
      ↓
Pinecone + BM25 + metadata
      ↓
broad candidate set
      ↓
GENERIC EVIDENCE COMPATIBILITY
      ↓
CrossEncoder
      ↓
dedupe + diversity
      ↓
evidence packet
      ↓
future Gemini generation
```

This architecture gives every component a clearer responsibility.

---

## Recommended Structured Evidence Contract

The future retrieval-document schema should be able to represent fields conceptually similar to:

```json
{
  "facets": [
    "backend_engineering",
    "system_design"
  ],
  "claim_mode": "supports",
  "evidence_kind": "direct_evidence",
  "evidence_strength": "concrete",
  "technologies": [
    "Cloudflare Workers",
    "D1"
  ],
  "limitations": [],
  "provenance": {
    "repository_index": 134,
    "source_document_id": "..."
  }
}
```

The exact field names are not yet approved. This document records the architectural requirement, not a final schema specification.

Likely generic claim modes include:

```text
supports
contradicts
mixed
neutral
```

or an equivalent representation.

The key property is that claim direction becomes explicit.

---

## Examples of the Intended Contract

### Genuine positive backend evidence

```json
{
  "facets": [
    "backend_engineering",
    "api_design",
    "system_design"
  ],
  "claim_mode": "supports",
  "evidence_kind": "direct_evidence",
  "evidence_strength": "concrete"
}
```

### Frontend evidence that merely mentions backend

```json
{
  "facets": [
    "frontend_engineering",
    "presentation"
  ],
  "claim_mode": "supports",
  "evidence_kind": "interpretation"
}
```

The document's prose may still contain the word `backend`, but the structured evidence contract does not misclassify the evidence itself as backend support.

### Explicit backend limitation

```json
{
  "facets": [
    "backend_engineering"
  ],
  "claim_mode": "contradicts",
  "evidence_kind": "limitation",
  "evidence_strength": "explicit"
}
```

This document remains retrievable for backend questions, especially questions about weaknesses, but no longer competes as positive backend proof.

---

## Correct File Boundary for the Future Redesign

The correct first implementation boundary is the retrieval-document compiler:

```text
rag/scripts/build-rag-retrieval-documents-v2.py
```

or, preferably, a new versioned successor such as:

```text
rag/scripts/build-rag-retrieval-documents-v3.py
```

The redesign should begin there because this is where evidence documents are created and classified.

It should **not** begin by adding more special-case rules to:

```text
rag/runtime/rag-api-pinecone-v1.py
```

The runtime should consume a stronger contract rather than repeatedly rediscovering document meaning.

Downstream consumers may eventually require compatibility updates:

```text
retrieval-document compiler
        ↓
retrieval document metadata
        ↓
Pinecone metadata/upsert
        ↓
local Retrieval v3 reference
        ↓
Pinecone runtime
```

But the architectural source of truth should begin at document construction.

---

## Constraint: Do Not Re-run the Expensive Embedding Process

A critical constraint established during this discussion is:

> **The redesign should not require re-running the already completed Nomic embedding generation unless absolutely necessary.**

The expensive/long process was:

```text
Step 3 — Local Nomic embedding generation
```

implemented by:

```text
rag/scripts/generate-rag-embeddings-v3-documents-local.py
```

That run produced:

```text
2,808 retrieval documents
× 512 dimensions
44 embedding batches
```

The vectors are already validated and uploaded to Pinecone.

There is no architectural reason to recompute them merely to improve structured evidence semantics.

---

## What Must Remain Byte-Stable

To avoid re-embedding, the redesign should preserve, for every active retrieval document:

```text
document ID
embedding_text
vector-space configuration
```

Most importantly:

> **`embedding_text` must remain byte-for-byte identical if the existing vector is to remain authoritative for that document.**

The relationship should remain:

```text
same document ID
+ same embedding_text
= same existing vector remains valid
```

---

## What Can Change Without Re-embedding

The following kinds of additive structured metadata can be changed or introduced without recomputing the Nomic vector, provided they do not alter `embedding_text`:

```text
facets
claim_mode
evidence_kind
evidence_strength
technologies
limitations
structured compatibility metadata
filterable Pinecone metadata
runtime evidence-selection metadata
```

The workflow can therefore be:

```text
existing retrieval document text
        ↓
add/recompute structured evidence metadata
        ↓
preserve document ID + embedding_text
        ↓
reuse existing local vector
        ↓
refresh Pinecone metadata if necessary
```

This is dramatically cheaper and safer than rebuilding the embedding corpus.

---

## What Would Force Re-embedding

Re-embedding becomes necessary if any of the following change:

```text
embedding_text
embedding model
embedding model revision
query/document prefix convention
Matryoshka truncation dimension
normalization method
vector dimension
corpus membership in a way that creates new documents
```

This QC incident does not require any of those changes.

Therefore, the preferred redesign must remain metadata-additive.

---

## Current Baseline Decision

The implementation baseline from commit:

```text
6710a697390858b8dfbcdf7ec3d2e737f34263da
```

remains the working reference implementation for this incident.

The proposed backend-specific gate patch was **not applied**.

Current status:

```text
Pinecone runtime v1.0.0                 ACTIVE BASELINE
Generalization test                     COMPLETED
Positive-evidence semantics issue       DOCUMENTED
Backend-specific tactical patch         REJECTED / NOT APPLIED
Structured evidence-contract redesign   FUTURE ARCHITECTURAL WORK
Nomic embedding regeneration            NOT REQUIRED BY THIS FINDING
Gemini integration                      NOT YET IMPLEMENTED AT INCIDENT TIME
```

This freeze is intentional. It gives future changes a clean before/after baseline instead of mixing the incident, the diagnosis, and the correction into one untraceable state.

---

## Future Acceptance Criteria

A future structured-evidence revision should not be considered successful merely because the two observed false positives disappear.

It should demonstrate a generic improvement across different query modes.

At minimum:

### Positive backend query

```text
What evidence shows strong backend engineering and system design experience?
```

Expected:

- genuine backend/system-design support ranks strongly;
- explicit absences do not rank as positive proof;
- frontend evidence that merely negates backend maturity does not qualify as backend support.

### Backend limitation query

```text
What backend engineering weaknesses or limitations appear in the portfolio?
```

Expected:

- the same negative/absence documents become valid and useful results;
- they should not be globally suppressed from retrieval.

### Authorization regression

```text
What evidence shows experience with authorization architecture?
```

Expected:

- existing strong authorization results remain strong;
- hardware `control` remains disambiguated;
- limitations remain distinguishable from positive implementation evidence.

### Unrelated engineering facets

Tests should cover at least:

```text
testing / quality
deployment / operations
frontend engineering
security
product responsibility
chronology / growth
```

The objective is to prove the solution is schema-driven rather than a backend-only patch.

---

## Lessons From the Incident

### 1. Changing regression questions is essential

A system that looks strong on one repeatedly used prompt may still contain generalization weaknesses.

### 2. Retrieval relevance is not evidence validity

A document can be perfectly relevant while contradicting the requested claim.

### 3. Negative evidence must remain retrievable

The solution is not to remove limitations from search. The solution is to classify their relationship to the requested claim.

### 4. Pinecone should remain a recall subsystem

Vector search should find relevant candidates. It should not become responsible for evidence interpretation.

### 5. Embeddings should remain semantic

It is not a defect that semantically opposed statements can be nearby in embedding space.

### 6. Runtime keyword growth is an architectural smell

Repeated facet-specific keyword patches indicate that structured semantics belong earlier in the pipeline.

### 7. Offline classification is the cleaner boundary

The retrieval-document compiler already sees the evidence in context and is the appropriate place to assign durable evidence semantics.

### 8. Preserve expensive validated artifacts when possible

A metadata-only redesign can improve reasoning without invalidating 2,808 validated vectors or repeating the 44-batch Nomic embedding run.

### 9. Freeze the failing baseline before redesign

Keeping commit `6710a697390858b8dfbcdf7ec3d2e737f34263da` as the exact incident baseline makes later quality comparisons reproducible.

---

## Related Documentation

- [`../../README.md`](../../README.md) — project documentation hub.
- [`../../architecture/system-overview.md`](../../architecture/system-overview.md) — whole-portfolio architecture.
- [`../../../rag/README.md`](../../../rag/README.md) — RAG subsystem source of truth.
- [`../../../rag/docs/pipeline.md`](../../../rag/docs/pipeline.md) — active RAG pipeline.
- [`../../../rag/docs/component-interactions.md`](../../../rag/docs/component-interactions.md) — component responsibilities and interactions.
- [`../../../rag/docs/retrieval-version-history.md`](../../../rag/docs/retrieval-version-history.md) — retrieval evolution.
- [`../../../rag/docs/testing-and-regressions.md`](../../../rag/docs/testing-and-regressions.md) — RAG validation and regression strategy.
- [`../../../rag/docs/known-issues.md`](../../../rag/docs/known-issues.md) — current and historical RAG quality findings.
- [`../../../rag/docs/regeneration-matrix.md`](../../../rag/docs/regeneration-matrix.md) — what changes require artifact regeneration.

---

## QC Record Summary

```text
Incident baseline:
6710a697390858b8dfbcdf7ec3d2e737f34263da

Question:
What evidence shows strong backend engineering and system design experience?

Result:
Runtime generalized successfully, but two false-positive patterns exposed
insufficient separation between topical relevance and positive claim support.

Rejected response:
Add backend-specific runtime keyword gates.

Architectural conclusion:
Move generic claim/evidence semantics into the offline retrieval-document
contract, preserve existing document IDs and embedding_text, reuse the existing
2,808 Nomic vectors, and make runtime evidence compatibility schema-driven.

Implementation change from this incident:
NONE.
```
