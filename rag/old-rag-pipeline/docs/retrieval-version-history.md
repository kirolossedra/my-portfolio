# Retrieval Version History

## Table of Contents

- [Version Timeline](#version-timeline)
- [v1 Failure Example](#v1-failure-example)
- [v2 Improvement and Limit](#v2-improvement-and-limit)
- [v3 Architectural Pivot](#v3-architectural-pivot)
- [Pinecone Runtime Evolution](#pinecone-runtime-evolution)
- [Proposed Backend Gate](#proposed-backend-gate)

<a id="version-timeline"></a>
## Version Timeline

| Generation | Retrieval units | Dense | Lexical/meta | Reranker | Key outcome |
|---|---|---|---|---|---|
| v1 | 11,642 tiny chunks | exact cosine | no | no | fast but template/negative false positives |
| v2 | same tiny chunks | exact | BM25 + metadata + RRF | CrossEncoder top 80 | much better, still representation-limited |
| v3 offline | 2,808 evidence docs | exact all-record cosine | BM25 + metadata + RRF | CrossEncoder top 120 | strong evidence-aware baseline |
| v3.1 runtime | same docs | Pinecone top 500 ANN | local BM25/meta + same gates | same pinned CrossEncoder | production-style dense serving |
| proposed 3.1.1 runtime | same | Pinecone | adds backend-positive support gate | same | hardening proposal, not applied |

<a id="v1-failure-example"></a>
## v1 Failure Example

The authorization query placed an absence/skills ledger from Relational-Database-Administration at rank 1. This exposed representation/template problems.

<a id="v2-improvement-and-limit"></a>
## v2 Improvement and Limit

v2 ranked LInC direct authorization evidence high, but generic/limitation architecture passages still appeared because tiny chunks had already lost useful local context.

<a id="v3-architectural-pivot"></a>
## v3 Architectural Pivot

Instead of further tuning weights, Step 2 was rebuilt around evidence-aware documents. This reduced active units from 11,642 to 2,808 and made evidence class/semantic area/polarity explicit before ranking.

<a id="pinecone-runtime-evolution"></a>
## Pinecone Runtime Evolution

Pinecone did not change the conceptual ranking stack; it replaced exact dense candidate infrastructure and provided remote vector fetch for dedupe. Correct parity testing proved the remote vectors are exact copies while ANN candidate order is appropriately approximate.

<a id="proposed-backend-gate"></a>
## Proposed Backend Gate

The v1.1 local proposal adds stricter positive support for the broad `backend_api` facet. It is not active until merged and retested.

## Historical Source Snapshot

For the complete pre-Pinecone/pre-runtime documentation state, including original model/provider comparisons, target API/vector schemas, security rules and acceptance criteria, see [Historical RAG README v1.0.0](historical-rag-readme-v1.md).

## Related Documentation

- Parent: [../README.md](../README.md)
- [Chunking history](chunking-and-document-history.md)
- [Known issues](known-issues.md)
