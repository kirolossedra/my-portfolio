# Cloudflare / Portfolio Integration Plan

## Table of Contents

- [Current State](#current-state)
- [Required Boundary](#required-boundary)
- [Recommended Request Lifecycle](#recommended-request-lifecycle)
- [Why Not Run Python in the Browser](#why-not-run-python-in-the-browser)
- [Why Not Pretend the Existing Worker Already Does It](#why-not-pretend-the-existing-worker-already-does-it)
- [Production Concerns](#production-concerns)
- [2026-08-31 Deployment Evaluation Update](#2026-08-31-deployment-evaluation-update)

<a id="current-state"></a>
## Current State

The portfolio Worker is deployed and owns the normal portfolio API. The Python RAG runtime is local/separate. The browser Kiro page is a GLB/state scaffold. There is no active Worker RAG route and no Gemini call.

<a id="required-boundary"></a>
## Required Boundary

The public browser should never call Pinecone with a secret or attempt to load Nomic/CrossEncoder. A browser-facing endpoint should enforce rate limits/request limits and call the Python RAG service server-to-server.

<a id="recommended-request-lifecycle"></a>
## Recommended Request Lifecycle

```text
Kiro submit
 -> portfolio RAG gateway
 -> Python /api/rag/... service
 -> retrieval
 -> Gemini generation
 -> response + evidence
 -> Kiro answering/success state
```

<a id="why-not-run-python-in-the-browser"></a>
## Why Not Run Python in the Browser

The runtime depends on Python, PyTorch, SentenceTransformers, model weights and Pinecone server credentials. React runs in the user's browser and cannot be treated as a secret-holding persistent Python environment.

<a id="why-not-pretend-the-existing-worker-already-does-it"></a>
## Why Not Pretend the Existing Worker Already Does It

`worker/index.ts` currently contains public/auth/admin portfolio routes only. Documentation must remain truthful until a RAG route/service binding is added.

<a id="production-concerns"></a>
## Production Concerns

- persistent process/model warmup;
- memory footprint for Nomic + CrossEncoder;
- timeout and retry policy around Pinecone/Gemini;
- server-side rate limiting;
- CORS/gateway ownership;
- observability for retrieval/generation latency separately;
- secret injection;
- health/readiness distinction;
- grounding/error schema understood by the Kiro UI.


<a id="2026-08-31-deployment-evaluation-update"></a>
## 2026-08-31 Deployment Evaluation Update

This update **adds subsequent deployment evidence without removing the integration plan above**.

### Containerization outcome

The existing Pinecone-backed FastAPI runtime was successfully built and run in Docker on Linux.

Validated inside the container:

```text
runtime schema:       1.0.0
retrieval schema:     3.1.0-pinecone
documents:            2,808
repositories:         134
dense backend:        Pinecone
Nomic query model:    loaded
CrossEncoder:         loaded
BM25/metadata:        enabled
local embeddings.npy: NOT LOADED
/health:              PASS
/api/rag/retrieve:    exercised
```

The first Docker build accidentally pulled CUDA/NVIDIA dependencies through generic PyTorch resolution. The deployment Dockerfile was corrected to install the CPU-only PyTorch wheel explicitly. The corrected image built and started successfully.

### Cloudflare Containers was evaluated, not deployed

The architecture originally proposed in this document remained technically coherent:

```text
portfolio Worker
  -> Cloudflare Container
  -> Python RAG runtime
  -> Pinecone
```

Wrangler authentication succeeded, but the account-level feasibility probe:

```text
npx wrangler containers list
```

returned:

```text
Unauthorized: You do not have access to Cloudflare Containers.
Deploying containers requires the Workers Paid plan.
```

Cloudflare's current official Containers pricing documentation likewise lists Container compute under Workers Paid, with Free shown as unavailable.

No Worker RAG proxy route, Durable Object/container binding or production container deployment was added after this blocker was discovered.

Therefore the plan above should now be read as:

**EVALUATED ARCHITECTURE — NOT AVAILABLE UNDER THE CURRENT ACCOUNT PLAN.**

### Render Free was checked next

The live local RAG container was measured at approximately:

```text
1.293 GiB RAM
```

Render's current official Free web-service allocation is:

```text
0.1 CPU
512 MB RAM
```

The current runtime is therefore about 2.6 times larger than Render Free's memory budget.

No Render deployment has been attempted yet. The current statement is:

**RENDER FREE: POSSIBLE PROVIDER CATEGORY, CURRENT CONTAINER DOES NOT FIT AS-IS.**

### Current architectural boundary remains valid

Even though Cloudflare Containers are currently blocked, the browser/security boundary from this document remains correct:

```text
browser
  -> server-side portfolio gateway
  -> private RAG service
  -> Pinecone
  -> future Gemini
```

The unresolved variable is the production host for the Python service.

### Current decision state

Production hosting is deliberately **UNSELECTED** while the project decides whether to:

- reduce runtime memory;
- select another free/no-card host;
- change the model inference representation;
- split inference responsibilities;
- or revisit hosting economics later.

None of those directions has been implemented or approved yet.

Full record:

- [../../docs/qc/rag/2026-08-31-containerization-and-hosting-evaluation.md](../../docs/qc/rag/2026-08-31-containerization-and-hosting-evaluation.md)

## Related Documentation

- Parent: [../README.md](../README.md)
- [Runtime](../runtime/README.md)
- [Portfolio deployment](../../docs/operations/deployment.md)
