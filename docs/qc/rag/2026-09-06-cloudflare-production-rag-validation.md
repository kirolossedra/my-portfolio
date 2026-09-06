# 2026-09-06 — Cloudflare Production RAG Validation

## Scope

This record captures acceptance evidence for the Cloudflare-native portfolio RAG backend through the first successful live synchronous query. It does not claim that the browser frontend or streaming route is validated.

## 1. Embedding acceptance

Cloudflare Workers AI Qwen generation:

```text
STATUS: PASS
Documents: 2,808
Repositories: 134/134
Model: @cf/qwen/qwen3-embedding-0.6b
Dimensions: 1,024
Matrix shape: (2808, 1024)
Valid vectors: 2,808/2,808
Missing: 0
Duplicate IDs: 0
NaN/Inf: 0
Zero vectors: 0
```

Document/query API smoke contracts passed.

## 2. Vectorize publication acceptance

Index:

```text
portfolio-career-rag-cloudflare-v1
```

Results:

```text
Remote vectors: 2,808/2,808 — PASS
Exact remote ID set: 2,808/2,808 — PASS
Stored-vector round-trip samples: 32 — PASS
Compact metadata round-trip: PASS
```

## 3. Vectorize dense-parity acceptance

Five canonical Qwen-space queries were compared with exact local cosine.

```text
Minimum overlap@10: 100%
Minimum overlap@25: 96%
Minimum overlap@50: 100%
Stratified stored-vector samples: 64
Metadata failures: 0
All hard checks: PASS
```

## 4. Local D1 acceptance

```text
Documents: 2,808
Unique document IDs: 2,808
Repositories: 134
Repository index range: 1–134
Invalid required rows: 0
Invalid JSON fields: 0
Inconsistent repository mappings: 0
Schema version: 2.0.0
SHA-256: a10c2b2d9d4e79e8a6e6629cc15b18cb1123513b45df44dc73e668b44c1bee58
```

The apparent initial build problem was caused by a stale local workspace path, not a code defect. The current checkout already contained the parse-error improvement and required no tracked change for the D1 builder.

## 5. Remote D1 acceptance

Remote migrations were current and the complete corpus imported successfully.

```text
rag_documents: 2,808
Unique document IDs: 2,808
Distinct repositories: 134
Repository indices: 1–134
Metadata rows: 1
Invalid required rows: 0
Invalid JSON fields: 0
Inconsistent repository mappings: 0
```

The metadata SHA matched the authoritative source corpus.

## 6. Worker verification and health

The introduction of required RAG bindings exposed stale legacy env fixtures. The fixtures were corrected in:

```text
e125ea7 test(worker): add RAG bindings to legacy env fixtures
```

Then:

```text
npm run verify: PASS
Worker dry-run: PASS
Worker deployment: PASS
GET /api/rag/health: HTTP 200
Health documents: 2,808
Health repositories: 134
Vector index: portfolio-career-rag-cloudflare-v1
```

Health actively checks D1 corpus state. It does not itself execute a Vectorize search.

## 7. First end-to-end query failure

Question:

```text
Which projects provide the strongest evidence of backend engineering?
```

First production result:

```text
HTTP 502
generation_invalid
Workers AI returned an unrecognized generation response.
Client-observed latency: 11,410 ms
```

No answer/citations were emitted.

Because `retrieveEvidence()` completes before generation, the error proved the request had progressed through query embedding, Vectorize, D1 hydration, BGE reranking and evidence selection. The failure was therefore scoped to generation-response handling.

## 8. GLM correction

The corrected generation contract added:

```text
chat_template_kwargs.enable_thinking = false
```

while preserving:

```text
temperature = 0.2
top_p = 0.9
max_completion_tokens = 700
```

The parser was hardened to accept legitimate visible string/text/output-text content, equivalent streaming deltas, reject reasoning-only output and never expose `reasoning_content`.

Commit:

```text
2b230596 fix(rag): disable GLM thinking and normalize generation output
```

## 9. Successful live query acceptance

After the fix:

```text
npm run verify: PASS
Tests: 64/64
Test files: 11/11
Worker dry-run: PASS
Worker version: 0c62658d-4de3-4b66-9a1e-85c0afafb951
POST /api/rag/query: HTTP 200
Client latency: 10,032 ms
Worker wall time: 9,771 ms
Worker CPU time: 22 ms
Grounding warning: null
```

Generation response shape:

```text
response type: object
choices: 1
message.content: string
reasoning_content: present, null
finish_reason: stop
prompt_tokens: 3,031
completion_tokens: 229
total_tokens: 3,260
```

The returned API payload included:

- grounded answer;
- eight citation/evidence objects;
- inline cited labels;
- repository names/URLs;
- dense and rerank scores;
- source-fragment provenance;
- retrieval diagnostics;
- model identities.

## 10. Retrieval-quality observation

For the backend-engineering question, the final eight selected evidence documents included a very strong LiNC pair plus weaker tail results from other repositories.

The generated answer did not blindly summarize every selected document. It primarily cited the strong `LInC-Church-Management` evidence and a bounded `Prompt-management` testing limitation, while ignoring several weak tail candidates.

This behavior is accepted as the intended generator-filtering policy. The acceptance criterion is not “all top-8 documents are perfect.” It is:

1. strong relevant evidence is present;
2. generation remains grounded to supplied evidence;
3. weak evidence can be ignored;
4. unsupported evidence is not invented;
5. provenance remains available to inspect.

## 11. Acceptance conclusion

**Production synchronous backend RAG: PASS.**

Proven live chain:

```text
question
-> Qwen query embedding
-> Vectorize
-> D1
-> BGE reranker
-> evidence selection
-> GLM generation
-> cited answer
```

Not covered by this acceptance record:

- live streaming endpoint validation;
- broad multi-question answer-quality benchmark;
- frontend integration;
- long-run latency/cost/traffic measurements.

## Related documentation

- [Production architecture](../../rag/production-architecture.md)
- [Testing summary](../../rag/testing-and-regressions.md)
- [Production rollout record](../../rag/deployment/2026-09-06-cloudflare-native-production-rollout.md)
