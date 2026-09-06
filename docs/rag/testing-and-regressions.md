# RAG Testing and Regression Evidence

This document summarizes the current validation layers. Detailed incident/acceptance records live under `docs/qc/rag/`.

## 1. Corpus invariants

Current authoritative retrieval corpus:

```text
Documents: 2,808
Unique document IDs: 2,808
Repositories: 134
Repository indices: 1–134
Schema: 2.0.0
SHA-256: a10c2b2d9d4e79e8a6e6629cc15b18cb1123513b45df44dc73e668b44c1bee58
```

These values are reused as cross-stage acceptance invariants rather than trusting each generated artifact independently.

## 2. Cloudflare embedding validation

Stage 03 Cloudflare/Qwen validation passed:

- 2,808/2,808 vectors;
- 134/134 repositories;
- matrix shape `(2808, 1024)`;
- no missing vectors;
- no duplicate document IDs;
- no NaN/Inf values;
- no zero vectors;
- normalized L2 norms;
- document and query API contract smoke tests passed.

Model:

```text
@cf/qwen/qwen3-embedding-0.6b
```

## 3. Vectorize publication validation

Production index:

```text
portfolio-career-rag-cloudflare-v1
```

Publication validation passed:

- remote vector count 2,808/2,808;
- exact ID set 2,808/2,808;
- exhaustive `get_by_ids` proof used because a list snapshot observed only 1,000 entries;
- 32 stored-vector round-trip samples passed;
- compact metadata round-trip passed;
- old Nomic/Pinecone artifacts were not modified.

## 4. Vectorize dense parity

Stage 06 compared remote Vectorize retrieval against exact local cosine in the same Qwen vector space.

| Metric | Result |
|---|---:|
| regression queries | 5 |
| minimum overlap@10 | 100% |
| minimum overlap@25 | 96% |
| minimum overlap@50 | 100% |
| stored-vector stratified samples | 64 |
| metadata failures | 0 |
| all hard checks | PASS |

Canonical questions covered authorization architecture, testing evolution, backend engineering, weaknesses and product ownership.

## 5. D1 local validation

The D1 build/import path was validated without changing tracked code.

Checks passed:

- 2,808 documents;
- 2,808 unique IDs;
- 134 repositories;
- repository indices 1–134;
- zero invalid required rows;
- zero invalid JSON fields;
- zero inconsistent mappings;
- schema version `2.0.0`;
- metadata SHA matches the authoritative source.

The earlier apparent failure was environmental: the configured workspace path was stale. The actual checkout was under `P:\Github\AI-accelerated\my-portfolio`; once the correct workspace was used, the existing builder passed unchanged.

## 6. D1 remote validation

Remote migration/import also passed with the same invariants:

- migrations current;
- 2,808 `rag_documents` rows;
- 2,808 unique IDs;
- 134 distinct repositories;
- repository indices 1–134;
- one metadata row;
- zero invalid required/JSON/mapping rows;
- source SHA-256 matched.

## 7. Worker verification and health

Before the first production query:

- `npm run verify`: PASS;
- Worker dry-run: PASS;
- legacy env fixtures were updated to include the required RAG bindings;
- live Worker deployment: PASS;
- `GET /api/rag/health`: HTTP 200;
- health response reported 2,808 documents, 134 repositories and `portfolio-career-rag-cloudflare-v1`.

The health endpoint actively queries D1. It does not perform a live Vectorize search, so health success alone was not treated as end-to-end RAG success.

## 8. First production query incident

Test question:

```text
Which projects provide the strongest evidence of backend engineering?
```

The first live call returned HTTP 502:

```text
generation_invalid
Workers AI returned an unrecognized generation response.
```

Because generation occurs after query embedding, Vectorize retrieval, D1 hydration, BGE reranking and final evidence selection, the error isolated the failure to the generation response boundary.

The fix:

- disabled GLM thinking with `chat_template_kwargs.enable_thinking = false`;
- preserved the 700-token completion cap;
- hardened visible-content normalization;
- explicitly prevented `reasoning_content` from becoming the user answer;
- added structural-only generation diagnostics.

## 9. Post-fix production acceptance

After the GLM fix:

- `npm run verify`: PASS;
- tests: 64/64;
- test files: 11/11;
- Worker dry-run: PASS;
- deployed Worker version: `0c62658d-4de3-4b66-9a1e-85c0afafb951`;
- repeated single production query: HTTP 200;
- grounded answer returned: PASS;
- inline citations returned: PASS;
- retrieval diagnostics returned: PASS;
- model identities returned: PASS;
- grounding warning: `null`.

Observed generation response structure after the fix:

```text
choices: 1
message.content: string
reasoning_content: present but null
finish_reason: stop
prompt_tokens: 3031
completion_tokens: 229
total_tokens: 3260
```

Observed timing for this one successful request:

```text
client: ~10,032 ms
Worker wall: ~9,771 ms
Worker CPU: 22 ms
```

Treat this as an initial observation, not a performance benchmark.

## 10. Retrieval-quality interpretation

The successful backend-engineering query produced a strong top pair from `LInC-Church-Management`, while the final eight-document packet also contained weaker tail material from unrelated/less relevant repositories.

This is acceptable under the current product policy:

- retrieval should provide sufficient recall;
- reranking/selection should put strong evidence near the top;
- GLM may ignore weak tail evidence;
- GLM must not fabricate missing evidence;
- the response should cite only evidence actually used.

The successful answer followed this pattern: it relied mainly on the strong LiNC evidence plus a bounded Prompt-management limitation and did not blindly summarize every selected document.

This does not eliminate the need for retrieval testing. A serious failure is still possible when the *relevant* evidence never reaches the final packet.

## 11. Remaining validation work

Before calling the entire product experience complete:

1. validate `POST /api/rag/query/stream` live end-to-end;
2. run a broader employer-style query suite across backend, testing, security/authorization, product ownership, chronology, strengths and limitations;
3. evaluate citation correctness claim-by-claim, not only citation presence;
4. collect a small latency distribution rather than relying on one ~10-second observation;
5. test rate-limit behavior and graceful quota/provider failures;
6. after frontend integration, validate network/stream lifecycle and avatar state transitions.

These are hardening/quality tasks, not blockers to documenting the backend as production-operational.

## Related documentation

- [Production architecture](production-architecture.md)
- [Known issues](known-issues.md)
- [RAG QC](../qc/rag/README.md)
- [2026-09-06 production validation record](../qc/rag/2026-09-06-cloudflare-production-rag-validation.md)
