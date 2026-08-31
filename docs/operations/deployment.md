# Deployment

## Table of Contents

- [Current Deployed Application](#current-deployed-application)
- [Netlify](#netlify)
- [Cloudflare](#cloudflare)
- [RAG Deployment Status](#rag-deployment-status)
- [External RAG State](#external-rag-state)
- [RAG Containerization and Hosting Evaluation — 2026-08-31](#rag-containerization-and-hosting-evaluation---2026-08-31)

<a id="current-deployed-application"></a>
## Current Deployed Application

Frontend deployment is Netlify; API deployment is a Cloudflare Worker; persistence is Cloudflare D1. CI/CD is repository-driven.

On pull requests and pushes, the quality job installs with Node 22, runs policy gates, lint, type checking, tests, local migration validation, a production Vite build, and a Worker dry-run. On a successful push to `main`, the workflow applies remote D1 migrations, deploys the Worker, then builds and deploys the frontend to Netlify.

<a id="netlify"></a>
## Netlify

`netlify.toml` runs `npm run verify && npm run build`, publishes `dist`, pins Node 22, injects the production Worker base URL at build time, and rewrites all routes to `index.html` for SPA navigation.

<a id="cloudflare"></a>
## Cloudflare

`wrangler.jsonc` names `worker/index.ts` as the Worker entry point, binds D1 as `DB`, versions the production frontend origin and GitHub callback URL, and enables observability.

<a id="rag-deployment-status"></a>
## RAG Deployment Status

The Python RAG runtime is **not part of the current Worker/Netlify deployment workflow**. It depends on PyTorch/SentenceTransformers and pinned local models, so the production host must support a persistent Python process with sufficient memory and model startup time. The browser cannot run this Python runtime directly, and the existing Cloudflare Worker should not be described as already hosting it.

A production integration should expose a narrow server-to-server path from the portfolio/gateway to the Python RAG service, add rate limiting, timeouts, structured errors and health checks, and keep Pinecone/Gemini secrets off the browser.

<a id="external-rag-state"></a>
## External RAG State

Pinecone is already populated and validated. Production deployment therefore has two release dimensions: code deployment and indexed-corpus state. The checked-in parity/upsert validation artifacts are the audit trail tying the local 2,808-record corpus to the remote namespace.


<a id="rag-containerization-and-hosting-evaluation---2026-08-31"></a>
## RAG Containerization and Hosting Evaluation — 2026-08-31

This section **appends the deployment history to the existing deployment model above**. It does not replace the earlier RAG deployment-status statement: the Python runtime is still not part of the production Worker/Netlify workflow.

### Objective

The immediate goal was to take the already validated Pinecone-backed Python runtime and prove that it could run reproducibly in a Linux container before coupling the portfolio Worker or browser to any particular hosting provider.

The intended order was:

```text
existing validated Python runtime
  -> Docker image
  -> local Docker health/retrieval validation
  -> production container host
  -> portfolio Worker gateway
  -> Gemini generation
  -> Kiro frontend wiring
```

This sequencing deliberately separated **runtime correctness** from **provider feasibility**.

### Linux and Docker baseline

The repository was freshly cloned on Ubuntu 24.04.3 LTS. Docker was available and healthy:

```text
Docker version 28.2.2
Architecture: x86_64
CPUs: 22
Host memory: 15.14 GiB
```

The active runtime files were confirmed:

```text
rag/runtime/rag-api-pinecone-v1.py
rag/runtime/requirements-rag-api-v1.txt
rag/rag-corpus/embeddings-v2/embedding-records.jsonl
rag/rag-corpus/embeddings-v2/embedding-manifest.json
```

The `embeddings-v2` directory name is correct even though the active embedding generator is Step 3 v3. The runtime uses the record/manifest outputs from that directory and intentionally does not load `embeddings.npy` for Pinecone-backed dense retrieval.

### First Docker build: dependency packaging failure

The first build used the general runtime dependency set directly. Installing `torch` through normal dependency resolution pulled large NVIDIA/CUDA dependency packages even though this runtime is CPU-only.

The build began pulling families such as:

```text
nvidia-cuda-runtime
nvidia-cudnn
nvidia-cublas
nvidia-cusparse
nvidia-cufft
nvidia-nccl
```

This consumed the remaining Linux root-disk space.

The failure was **not** a RAG algorithm failure and **not** a Docker incompatibility. It was a packaging mistake: CPU inference had not been enforced strongly enough at dependency-install time.

### CPU-only packaging correction

After recovering disk space, the Dockerfile explicitly installed the CPU PyTorch wheel from:

```text
https://download.pytorch.org/whl/cpu
```

before installing the rest of the runtime dependencies.

The corrected build succeeded:

```text
Successfully built 2c5148f0ab3c
Successfully tagged portfolio-rag:v1
```

The local image ID is only workstation evidence, not a durable release identifier.

### Container startup: PASS

The image was started with the Pinecone key injected as an environment variable through the local `.dev.vars` file.

Observed initialization:

```text
SUCCESS (cpu: CPU)
[8/9] Connect and validate Pinecone ....... SUCCESS (portfolio-career-rag-v1 / corpus-v1; 2,808 vectors)
[9/9] Run end-to-end retrieval smoke ...... SUCCESS (top=10; 6.380s)

RAG API RUNTIME INITIALIZATION: SUCCESS
Dense backend:      Pinecone
Local matrix:       NOT LOADED
BM25:               ENABLED
Metadata recall:    ENABLED
Concept gate:       ENABLED
Evidence gate:      ENABLED
CrossEncoder:       ENABLED
Semantic dedupe:    Pinecone fetched vectors
Gemini generation:  NOT YET WIRED
```

Uvicorn then served the container on `0.0.0.0:8000`.

### Container health: PASS

`GET /health` returned:

```json
{
  "status": "ok",
  "runtime_schema_version": "1.0.0",
  "retrieval_schema_version": "3.1.0-pinecone",
  "documents": 2808,
  "repositories": 134,
  "dense_backend": "pinecone",
  "pinecone_index": "portfolio-career-rag-v1",
  "pinecone_namespace": "corpus-v1",
  "pinecone_vector_count": 2808,
  "embedding_model": "nomic-ai/nomic-embed-text-v1.5",
  "embedding_dimensions": 512,
  "reranker_model": "cross-encoder/ms-marco-MiniLM-L6-v2",
  "generation_model": null,
  "generation_status": "not_integrated"
}
```

The real `POST /api/rag/retrieve` path was also exercised from the running container.

Therefore:

**The current RAG runtime has been successfully containerized and locally validated.**

### Node/Wrangler preparation

The Linux machine initially had Node 18. `npm ci` failed because the portfolio tooling expects a newer Node runtime and Netlify CLI dependencies used syntax unsupported by Node 18.

After moving to Node 22, `npm ci` succeeded and Wrangler authentication completed successfully.

This was an environment-preparation issue, not an application defect.

### Cloudflare Containers attempt

The initial production target was Cloudflare Containers because it would preserve the existing public backend boundary:

```text
browser
  -> existing Cloudflare Worker
  -> Cloudflare Container
  -> Python RAG runtime
  -> Pinecone
```

Before adding any Worker RAG route or container binding, access was probed with:

```text
npx wrangler containers list
```

Wrangler returned:

```text
Unauthorized: You do not have access to Cloudflare Containers.
Deploying containers requires the Workers Paid plan.
```

Cloudflare's current official pricing documentation also marks Container compute as unavailable on the Free plan and included as part of the Workers Paid plan.

**Result:** the Cloudflare Containers path was stopped before provider-specific application integration was written.

This is a **plan/access blocker**, not a technical failure of the container.

### Render Free feasibility check

Render was then considered as a Docker-capable free hosting target.

Before creating a service, the live local container was measured:

```text
CPU:       0.22%
RAM:       1.293 GiB
PIDS:      110
```

Render's current official compute-plan documentation lists its Free web-service plan as:

```text
CPU: 0.1
RAM: 512 MB
plan: free
```

The current container therefore uses roughly **2.6x** the RAM available to Render Free.

**Result:** no Render deployment was attempted at this checkpoint because the current unoptimized runtime does not fit the free memory budget.

This does not permanently reject Render. It means **Render Free is not viable for the current image as measured** unless runtime memory is reduced substantially.

### Current checkpoint

The production deployment state is now:

| Stage | Status |
|---|---|
| Python Pinecone runtime | **ACTIVE / VALIDATED** |
| Docker build | **PASS** |
| Docker startup | **PASS** |
| Pinecone from Docker | **PASS** |
| Docker `/health` | **PASS** |
| Docker retrieval endpoint | **EXERCISED** |
| CPU-only packaging | **REQUIRED / VALIDATED** |
| Cloudflare Containers | **BLOCKED BY CURRENT ACCOUNT PLAN** |
| Render Free | **CURRENT IMAGE EXCEEDS MEMORY LIMIT** |
| Production RAG host | **NOT SELECTED** |
| Worker RAG gateway | **NOT IMPLEMENTED** |
| Gemini generation | **NOT INTEGRATED** |
| Kiro live API wiring | **NOT INTEGRATED** |

### What remains undecided

No decision has yet been made to:

- optimize the PyTorch/SentenceTransformers runtime below 512 MB;
- use ONNX, quantization or another inference representation;
- use Render after optimization;
- choose another free host;
- split Nomic and CrossEncoder responsibilities;
- pay for Cloudflare Containers;
- move directly to Gemini/frontend integration before hosting is resolved.

Those are future architectural choices, not current implementation facts.

### Evidence

The complete decision record and sanitized terminal evidence are maintained under:

- [../qc/rag/2026-08-31-containerization-and-hosting-evaluation.md](../qc/rag/2026-08-31-containerization-and-hosting-evaluation.md)
- [../qc/rag/evidence/2026-08-31-containerization-hosting-evidence.txt](../qc/rag/evidence/2026-08-31-containerization-hosting-evidence.txt)

## Related Documentation

- Parent: [../README.md](../README.md)
- [Cloudflare integration](../../rag/docs/cloudflare-integration.md)
