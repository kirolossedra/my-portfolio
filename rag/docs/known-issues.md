# RAG Known Issues, Caveats and Proposed Hardening

## Table of Contents

- [Active Known Issues](#active-known-issues)
  - [Step 1 relocation](#step-1-relocation)
  - [Runtime dense-score equivalence](#runtime-dense-score-equivalence)
  - [Evidence polarity edge cases](#evidence-polarity-edge-cases)
  - [Broad backend/system-design facet](#broad-backendsystem-design-facet)
- [Proposed Patch - NOT APPLIED](#proposed-patch-not-applied)
- [Generation Not Integrated](#generation-not-integrated)
- [Browser Not Wired](#browser-not-wired)
- [Deployment Not Selected/Completed](#deployment-not-selectedcompleted)
- [Deployment Evaluation Addendum](#deployment-evaluation-addendum)
- [Cloudflare-Native Candidate Risks](#cloudflare-native-candidate-risks)

<a id="active-known-issues"></a>
## Active Known Issues

<a id="step-1-relocation"></a>
### Step 1 relocation

The normalizer's base-path design is stale after folder reorganization. Existing outputs are valid; a future full rebuild needs path refactoring first.

<a id="runtime-dense-score-equivalence"></a>
### Runtime dense-score equivalence

BM25/metadata-only union candidates outside Pinecone top 500 receive dense score zero in the runtime, whereas offline exact v3 has a cosine score for every record. Pinecone backend parity is proven; exact full-pipeline rank parity is not.

<a id="evidence-polarity-edge-cases"></a>
### Evidence polarity edge cases

Some repositories contain security debt, limitations or terms such as “control” that are semantically close to positive questions. Existing concept/polarity logic handles much of this, but surgical false-positive cases remain possible.

<a id="broad-backendsystem-design-facet"></a>
### Broad backend/system-design facet

A generic backend/architecture word can be too permissive when it appears in a negative comparison or absence list. The local v1.1 proposal adds `backend_positive_support` to demand stronger support for positive backend queries.

<a id="proposed-patch-not-applied"></a>
## Proposed Patch - NOT APPLIED

`rag-backend-positive-gate-v1` is a local proposal outside GitHub main. Runtime proposal: schema 1.1.0 / retrieval 3.1.1-pinecone. It adds three regression checks and annotates concept-gate diagnostics with backend-positive support details.

Do not merge documentation status ahead of code. If applied, first reconcile the offline script's still-3.0.0 retrieval schema constant, run its self-tests, rerun employer-style retrieval regressions, run HTTP smoke, then update the version map.

<a id="generation-not-integrated"></a>
## Generation Not Integrated

Gemini selection is complete but the runtime explicitly returns `generation: null`. Any UI copy implying live AI-generated answers would currently be misleading.

<a id="browser-not-wired"></a>
## Browser Not Wired

The Kiro query input is a timer-driven behavior probe. It simulates state transitions but does not call the runtime.

<a id="deployment-not-selectedcompleted"></a>
## Deployment Not Selected/Completed

The heavy Python runtime needs a persistent model-capable deployment target. Current Netlify + Cloudflare Worker deployment does not host it.

<a id="deployment-evaluation-addendum"></a>
## Deployment Evaluation Addendum

The existing statement above — that deployment is not selected/completed — remains correct. The following evidence narrows **why** it remains incomplete.

### Local Docker containerization — PASS

The active runtime has now been successfully built and exercised inside a Linux Docker container.

Validated:

- Pinecone connection and 2,808-vector namespace;
- Nomic query embedding on CPU;
- CrossEncoder loading on CPU;
- BM25 and metadata recall;
- evidence/concept gates;
- semantic dedupe through Pinecone-fetched vectors;
- `/health`;
- the real retrieval HTTP endpoint;
- no local `embeddings.npy` matrix loaded by the runtime.

Containerization itself is therefore no longer an open technical question.

### CPU-only PyTorch packaging requirement

The initial Docker build pulled large NVIDIA/CUDA packages through generic PyTorch dependency resolution and exhausted the local root filesystem.

The corrected build explicitly installed PyTorch from:

```text
https://download.pytorch.org/whl/cpu
```

This is now a concrete packaging rule for the current CPU deployment path.

### Measured runtime memory

The initialized container was measured at:

```text
1.293 GiB RAM
```

This is a measured baseline, not a claim that the runtime cannot be optimized further.

### Cloudflare Containers blocker

Wrangler successfully authenticated, but:

```text
npx wrangler containers list
```

returned an authorization error stating that Cloudflare Containers require the Workers Paid plan.

No Cloudflare Container, binding or RAG Worker route was deployed.

Status:

**BLOCKED BY CURRENT ACCOUNT PLAN.**

### Render Free blocker

Render's current Free web-service plan provides 512 MB RAM.

The current 1.293 GiB runtime footprint is approximately 2.6x that allocation.

No Render deployment was attempted because the resource mismatch was identified first.

Status:

**CURRENT RUNTIME DOES NOT FIT RENDER FREE AS-IS.**

### Hosting decision remains open

No replacement hosting architecture has been selected.

Do not document any of these as decided until implementation resumes:

- Render after memory optimization;
- ONNX;
- quantization;
- a smaller model;
- removing/replacing the CrossEncoder;
- another free host;
- paid Cloudflare Containers;
- another paid provider.

Full deployment evidence:

- [../../docs/qc/rag/2026-08-31-containerization-and-hosting-evaluation.md](../../docs/qc/rag/2026-08-31-containerization-and-hosting-evaluation.md)

<a id="cloudflare-native-candidate-risks"></a>
## Cloudflare-Native Candidate Risks

A later review identified a promising no-Python candidate, but it remains **unimplemented**. The following are open engineering risks rather than solved facts.

### Qwen retrieval equivalence — OPEN

Cloudflare-hosted Qwen3-Embedding-0.6B removes the need to run Nomic query inference ourselves, but it creates a new embedding space. It must be benchmarked against the current Nomic baseline on the real employer-style query suite.

### CrossEncoder replacement — OPEN

The current Python runtime also loads a CrossEncoder. Production Python cannot be retired merely by replacing Nomic. Cloudflare's BGE reranker is a candidate, but its ranking quality and truncation behavior must be compared against the pinned current model.

### D1 FTS5 vs current BM25 — OPEN

D1 is already part of the portfolio backend and supports FTS5, but SQLite FTS5/BM25 ranking is not guaranteed to match the current Python BM25 implementation. This is a retrieval algorithm change that requires regression, not just a storage migration.

### Worker Free CPU/bundle envelope — OPEN

Workers Free is suitable for orchestration but has a 10 ms CPU/request, 128 MB memory and 3 MB compressed-bundle limit. The current ~34 MB `embedding-records.jsonl` cannot simply be bundled as a Worker data file. A slim D1-backed runtime representation is the candidate approach.

### Vectorize topK mismatch — OPEN

Vectorize is a real vector database and the current corpus fits its dimensional limits, but the current retrieval stage asks for top 500 dense candidates. Vectorize currently returns at most 100 without values/metadata and 50 with values/full metadata. Switching the DB before evaluating this recall change would be premature.

### Full free-query capacity — OPEN until measured

Workers AI query embedding alone has large free capacity, but the complete system is bounded by reranking neurons, Pinecone read units or Vectorize dimensions, D1 rows, Worker requests and Gemini quota. The next benchmark must emit actual per-query usage before a full-RAG queries/day number is considered authoritative.

### Gemini Free-tier data handling — REVIEW REQUIRED

Gemini 2.5 Flash-Lite currently has Free-tier token pricing, but public rate-limit capacity is project-specific. Google also documents that Free-tier content may be used to improve its products. Public visitor queries should not be silently sent under an unclear privacy expectation; generation integration should include explicit data-minimization and disclosure decisions.

Full candidate architecture and caps:

- [cloudflare-native-zero-cost-migration.md](cloudflare-native-zero-cost-migration.md)

## Related Documentation

- Parent: [../README.md](../README.md)
- [Testing](testing-and-regressions.md)
- [Cloudflare integration](cloudflare-integration.md)
- [Zero-cost Cloudflare migration](cloudflare-native-zero-cost-migration.md)
