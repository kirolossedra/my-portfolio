# RAG Known Issues and Operational Caveats

**Current status:** backend production path is deployed and operational. The items below are active limitations/hardening work, not stale migration candidates.

## 1. Frontend is not wired

The Kiro RAG page is still an interaction/GLB runtime surface. It does not yet call the production RAG API.

This is the immediate product boundary after the backend documentation checkpoint.

## 2. Retrieval is approximate; weak tail evidence is expected

Vector similarity and reranking are not perfect. A final eight-document evidence packet can contain strong top evidence plus weaker tail evidence.

Current policy deliberately allows the generator to ignore weak tail documents rather than requiring every retrieved item to appear in the answer.

This is acceptable only while these conditions hold:

- important evidence has sufficient recall to reach the final packet;
- the generator is grounded to supplied evidence only;
- unused weak evidence is not cited as support;
- missing evidence is not replaced with invented claims.

A generator cannot recover relevant evidence that retrieval completely omitted.

## 3. One successful live query is not a full quality benchmark

The production backend is proven operational, but answer quality has not yet been measured across a broad employer-style suite.

The existing dense-parity suite validates Vectorize against exact cosine, while the first successful live generation query proves one full request path. These are different validation layers.

## 4. Streaming route needs live validation

`POST /api/rag/query/stream` shares the retrieval/reranking implementation and has parser tests, but the current production acceptance record covers the synchronous `POST /api/rag/query` route.

Run a dedicated stream test before the frontend depends on it.

## 5. Citation presence is not complete factual verification

The API extracts which `[E#]` labels appear and emits a grounding warning when none appear. That is useful but does not formally prove that every sentence/clause is supported by the cited evidence.

A stronger future QC layer could score claim-to-citation entailment or perform deterministic checks for certain structured claims.

## 6. Initial latency is about 10 seconds

The first successful synchronous production query observed roughly 10 seconds client latency.

This is a single observation, not a representative latency distribution. Likely contributors include query embedding, Vectorize, D1 hydration, reranking and generation wall time; Worker CPU was only 22 ms for the observed request.

The streaming endpoint may improve perceived latency even if total wall time is similar.

## 7. Generation-model response shape must remain defensive

The first deployment exposed a GLM reasoning-mode failure at the response-normalization boundary.

Current safeguards:

- GLM thinking explicitly disabled;
- visible string/text/output-text content accepted;
- `reasoning_content` never exposed as answer text;
- reasoning-only response treated as failure;
- diagnostics log structural metadata only.

A future model/provider contract change can still require parser updates.

## 8. Full rebuild path retains an old path-discovery caveat

The Stage 1 normalizer historically moved relative to its source files. Existing normalized/retrieval outputs are valid, but a future full corpus rebuild should verify path discovery before regenerating upstream stages.

Do not rebuild the entire RAG pipeline merely for a Worker or frontend change.

## 9. Embedding contract is tightly coupled

The production vectors were generated with a specific document/query Qwen contract. Changing any of these creates a new vector space:

- model;
- dimensions;
- document/query modes;
- query instruction;
- normalization behavior;
- similarity metric.

Do not silently query the existing Vectorize index with a different embedding contract.

## 10. D1 and Vectorize can drift if regenerated independently

The system depends on stable document IDs shared by the retrieval corpus, vector index and D1 rows.

Current protections include source SHA metadata, exact-ID publication validation, D1 corpus readiness checks and a runtime D1/Vectorize mismatch guard.

Regeneration still requires disciplined sequencing.

## 11. Public cost/quota exposure remains bounded, not eliminated

The live route is rate limited to 10 requests per 60 seconds per connecting IP and generation is capped at 700 completion tokens.

This reduces abuse and cost exposure but does not make provider quotas infinite. Free/low-cost sustainability should be validated from observed usage and current Cloudflare limits whenever traffic changes materially.

## 12. Historical Nomic/Pinecone/Python docs can be mistaken for current truth

The old pipeline is intentionally preserved as engineering history/reference. Some older deep-dive documents describe it in present-tense language because they were accurate when written.

The canonical current-state references are now:

- `docs/rag/README.md`;
- `docs/rag/production-architecture.md`;
- `docs/rag/pipeline.md`.

When historical documents conflict with those current-state documents, the current-state documents win.

## 13. Browser/API privacy boundary

The generator receives only the final evidence packet rather than the full portfolio corpus. Visitor questions remain public-input data and should not be treated as secret.

Generation diagnostics must continue to avoid logging prompt/evidence/answer/reasoning text unless there is an explicit, reviewed need.

## 14. Current non-issues that were previously open

The following items are no longer open migration risks:

- Qwen embedding generation: completed and validated;
- Vectorize publication: completed and validated;
- Vectorize dense parity: passed;
- D1 runtime representation: built and populated locally/remotely;
- Workers AI BGE reranker: integrated in production path;
- Cloudflare Worker orchestration: deployed;
- GLM generation: integrated and production-tested;
- Python/Docker hosting requirement: removed from the live request path.

## Related documentation

- [Production architecture](production-architecture.md)
- [Testing and regressions](testing-and-regressions.md)
- [Deployment history](deployment/README.md)
- [RAG QC](../qc/rag/README.md)
