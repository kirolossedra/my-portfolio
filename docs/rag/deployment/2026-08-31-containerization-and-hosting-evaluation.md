# RAG Deployment Record — Containerization and Hosting Evaluation

> **File ID:** `RAG-DEPLOYMENT-363c0606-8915-444e-9f4a-ea4fd50554d8`  
> **Document version:** `2.1.0`  
> **Date:** `2026-08-31`  
> **Status:** `DOCUMENTED CHECKPOINT — PRODUCTION HOSTING DECISION PENDING`  
> **Runtime baseline:** `1.0.0`  
> **Retrieval baseline:** `3.1.0-pinecone`  
> **Taxonomy:** RAG deployment/hosting decision record under `docs/rag/deployment/`; supporting deployment/runtime evidence lives under `docs/rag/deployment/evidence/`; retrieval-quality QC remains separate.

## Table of Contents

- [1. Purpose](#1-purpose)
- [2. Why This Record Belongs Under RAG Deployment Documentation](#2-why-this-record-belongs-under-rag-deployment-documentation)
- [3. Starting System State](#3-starting-system-state)
- [4. Deployment Goal](#4-deployment-goal)
- [5. Why Containerization Was the Next Step](#5-why-containerization-was-the-next-step)
- [6. Linux Preparation](#6-linux-preparation)
- [7. Active Runtime Inputs Confirmed](#7-active-runtime-inputs-confirmed)
- [8. First Docker Build](#8-first-docker-build)
- [9. CUDA Dependency Expansion and Disk Pressure](#9-cuda-dependency-expansion-and-disk-pressure)
- [10. CPU-Only PyTorch Correction](#10-cpu-only-pytorch-correction)
- [11. Successful Docker Build](#11-successful-docker-build)
- [12. Container Startup](#12-container-startup)
- [13. Pinecone Validation Inside Docker](#13-pinecone-validation-inside-docker)
- [14. Health Endpoint Validation](#14-health-endpoint-validation)
- [15. Retrieval Endpoint Validation](#15-retrieval-endpoint-validation)
- [16. Measured Runtime Footprint](#16-measured-runtime-footprint)
- [17. Cloudflare Containers Intended Architecture](#17-cloudflare-containers-intended-architecture)
- [18. Node and Wrangler Preparation](#18-node-and-wrangler-preparation)
- [19. Cloudflare Containers Blocker](#19-cloudflare-containers-blocker)
- [20. Why No Cloudflare Integration Code Was Added](#20-why-no-cloudflare-integration-code-was-added)
- [21. Render Free Feasibility Evaluation](#21-render-free-feasibility-evaluation)
- [22. Why Render Was Not Deployed](#22-why-render-was-not-deployed)
- [23. What Was Proven](#23-what-was-proven)
- [24. What Remains Unproven](#24-what-remains-unproven)
- [25. Current Blockers](#25-current-blockers)
- [26. Explicit Non-Decisions](#26-explicit-non-decisions)
- [27. Current Architecture Checkpoint](#27-current-architecture-checkpoint)
- [28. Requirements for the Next Hosting Decision](#28-requirements-for-the-next-hosting-decision)
- [29. Engineering Lessons](#29-engineering-lessons)
- [30. Evidence Map](#30-evidence-map)
- [31. Related Documentation](#31-related-documentation)

<a id="1-purpose"></a>
## 1. Purpose

This record documents the deployment endeavour performed after the Pinecone-backed RAG runtime had already passed local runtime validation.

The work was deliberately infrastructure-focused. It did **not** attempt to redesign retrieval semantics, integrate Gemini or connect the browser. The immediate question was:

> Can the exact current RAG runtime be packaged into a reproducible Linux container and hosted somewhere that fits the project's operating constraints?

The answer split into two parts:

1. **Containerization: yes.**
2. **Production hosting: unresolved at this checkpoint.**

<a id="2-why-this-record-belongs-under-rag-deployment-documentation"></a>
## 2. Why This Record Belongs Under RAG Deployment Documentation

The primary subject is **deployment feasibility and hosting choice**, not quality control. The document uses measured deployment/runtime evidence, but its conclusion is operational: which production-hosting paths fit or fail the runtime's measured resource envelope.

Therefore:

```text
docs/rag/deployment/
  -> this RAG deployment/hosting decision/evaluation record

docs/rag/deployment/evidence/
  -> supporting sanitized validation and measurement evidence
```

<a id="3-starting-system-state"></a>
## 3. Starting System State

Before Docker work began, the active retrieval stack was:

```text
134-repository career corpus
  -> evidence-aware retrieval documents
  -> Nomic document embedding space
  -> Pinecone serverless vector index
  -> Python FastAPI runtime
  -> Nomic query embedding
  -> Pinecone dense recall
  -> BM25
  -> metadata/topic/skill recall
  -> reciprocal rank fusion
  -> concept/evidence gates
  -> CrossEncoder reranking
  -> semantic dedupe
  -> evidence/provenance response
```

| Property | Value |
|---|---|
| runtime schema | `1.0.0` |
| retrieval schema | `3.1.0-pinecone` |
| documents | `2,808` |
| repositories | `134` |
| Pinecone index | `portfolio-career-rag-v1` |
| namespace | `corpus-v1` |
| embedding model | `nomic-ai/nomic-embed-text-v1.5` |
| embedding dimensions | `512` |
| reranker | `cross-encoder/ms-marco-MiniLM-L6-v2` |
| generator | Gemini 2.5 Flash-Lite selected, not integrated |

<a id="4-deployment-goal"></a>
## 4. Deployment Goal

The target sequence was:

```text
validated Python retrieval runtime
  -> Dockerize unchanged runtime
  -> test Docker locally
  -> select/deploy container host
  -> expose through existing portfolio backend boundary
  -> integrate Gemini
  -> integrate Kiro frontend
  -> production QA
```

The deployment work intentionally stopped before Worker/frontend integration until a viable runtime host was proven.

<a id="5-why-containerization-was-the-next-step"></a>
## 5. Why Containerization Was the Next Step

The runtime depends on Python, PyTorch, SentenceTransformers, Nomic model code/weights, CrossEncoder model code/weights, FastAPI/Uvicorn and Pinecone.

That dependency shape is much heavier than a normal Cloudflare Worker isolate. Containerization offered:

1. reproducible Linux packaging;
2. a clear Python/model dependency boundary;
3. provider portability without redesigning retrieval first.

<a id="6-linux-preparation"></a>
## 6. Linux Preparation

A fresh repository clone was created on Linux.

```text
Docker version 28.2.2
Ubuntu 24.04.3 LTS
x86_64
22 CPUs
15.14 GiB host RAM
```

Docker daemon health passed before application packaging started.

<a id="7-active-runtime-inputs-confirmed"></a>
## 7. Active Runtime Inputs Confirmed

```text
rag/runtime/
  rag-api-pinecone-v1.py
  requirements-rag-api-v1.txt

rag/rag-corpus/embeddings-v2/
  embedding-manifest.json
  embedding-records.jsonl
  embeddings.npy
  embedding-validation-report.txt
```

For the Pinecone runtime only `embedding-records.jsonl` and `embedding-manifest.json` are needed locally. `embeddings.npy` is intentionally not loaded because Pinecone serves dense recall and fetched vectors support semantic dedupe.

<a id="8-first-docker-build"></a>
## 8. First Docker Build

The first Dockerfile used Python 3.12 slim and installed the general runtime requirements. The approach was conceptually valid, but dependency resolution was too broad.

<a id="9-cuda-dependency-expansion-and-disk-pressure"></a>
## 9. CUDA Dependency Expansion and Disk Pressure

Generic `torch` resolution pulled large NVIDIA/CUDA package families even though the deployment target was CPU-only:

```text
nvidia-cuda-runtime
nvidia-cudnn
nvidia-cublas
nvidia-cusparse
nvidia-cufft
nvidia-nccl
```

The build exhausted the remaining Linux root-filesystem space. The root cause was dependency-selection/packaging, not RAG logic or Docker incompatibility.

<a id="10-cpu-only-pytorch-correction"></a>
## 10. CPU-Only PyTorch Correction

Disk space was recovered and PyTorch installation was made explicit:

```text
pip install --index-url https://download.pytorch.org/whl/cpu torch
```

This prevented CPU deployment from resolving unnecessary CUDA dependencies. Approximately 13 GB free space was recovered before the corrected build.

<a id="11-successful-docker-build"></a>
## 11. Successful Docker Build

The corrected image built successfully:

```text
Successfully built 2c5148f0ab3c
Successfully tagged portfolio-rag:v1
```

The local image ID is workstation evidence rather than a durable release identifier.

<a id="12-container-startup"></a>
## 12. Container Startup

The image was run with the Pinecone secret injected through the environment. Startup loaded Nomic and CrossEncoder components on CPU and reached:

```text
RAG API RUNTIME INITIALIZATION: SUCCESS
```

Uvicorn then served on port 8000.

<a id="13-pinecone-validation-inside-docker"></a>
## 13. Pinecone Validation Inside Docker

The container connected to:

```text
portfolio-career-rag-v1
namespace: corpus-v1
vectors: 2,808
```

The internal end-to-end retrieval smoke test passed:

```text
SUCCESS (top=10; 6.380s)
```

This proved working outbound connectivity and access to the already validated Pinecone state.

<a id="14-health-endpoint-validation"></a>
## 14. Health Endpoint Validation

`GET /health` returned `status: ok` with the expected runtime identity:

```text
runtime_schema_version:   1.0.0
retrieval_schema_version: 3.1.0-pinecone
documents:                2808
repositories:             134
dense_backend:            pinecone
pinecone_vector_count:    2808
embedding_dimensions:     512
generation_status:        not_integrated
```

<a id="15-retrieval-endpoint-validation"></a>
## 15. Retrieval Endpoint Validation

`POST /api/rag/retrieve` was exercised against the running container with the backend/system-design employer-style question used in prior QC. The endpoint executed successfully from Docker.

The purpose was deployment equivalence, not retrieval redesign; detailed retrieval-quality analysis remains a QC concern.

<a id="16-measured-runtime-footprint"></a>
## 16. Measured Runtime Footprint

The initialized container was measured at:

```text
CPU %:             0.22%
MEM USAGE:         1.293 GiB
HOST MEMORY LIMIT: 15.14 GiB
PIDS:              110
```

**Measured current runtime RAM: approximately 1.293 GiB.**

This is a measured baseline for the implementation at this checkpoint, not a theoretical minimum.

<a id="17-cloudflare-containers-intended-architecture"></a>
## 17. Cloudflare Containers Intended Architecture

Cloudflare Containers were the first intended production target because the portfolio already has a Cloudflare Worker:

```text
kirolos.dev browser
  -> existing Cloudflare Worker
  -> Cloudflare Container
  -> Python FastAPI RAG runtime
  -> Pinecone
```

The design preserved the Worker as the public API/security gateway.

<a id="18-node-and-wrangler-preparation"></a>
## 18. Node and Wrangler Preparation

The Linux environment initially had Node 18. `npm ci` failed because project tooling expected a newer runtime and a Netlify CLI dependency used syntax unsupported by Node 18.

After upgrading to Node 22, `npm ci` completed successfully. Wrangler login also succeeded.

<a id="19-cloudflare-containers-blocker"></a>
## 19. Cloudflare Containers Blocker

Before any RAG Worker integration was implemented, account capability was probed:

```text
npx wrangler containers list
```

Wrangler returned:

```text
Unauthorized: You do not have access to Cloudflare Containers.
Deploying containers requires the Workers Paid plan.
```

The official Containers pricing state at the time also showed Container compute unavailable on Free and available through Workers Paid.

**Result:** Cloudflare Containers remained technically coherent but violated the current `$0` account-plan constraint.

<a id="20-why-no-cloudflare-integration-code-was-added"></a>
## 20. Why No Cloudflare Integration Code Was Added

The account limitation was discovered before modifying `worker/index.ts` or `wrangler.jsonc` for RAG container routing. This sequencing avoided provider-specific integration for an unavailable deployment path.

<a id="21-render-free-feasibility-evaluation"></a>
## 21. Render Free Feasibility Evaluation

Render Free was evaluated as a Docker-capable alternative.

```text
Render Free web service
CPU: 0.1
RAM: 512 MB

Current initialized RAG container
RAM: ~1.293 GiB
```

The current runtime uses roughly **2.6x** the available Render Free memory.

<a id="22-why-render-was-not-deployed"></a>
## 22. Why Render Was Not Deployed

No Render service was created because the resource mismatch was already clear. Deploying the unchanged image would not be a meaningful provider test.

**Conclusion:** Render Free cannot host the current runtime as-is. This does not prove that an optimized/changed runtime could never fit.

<a id="23-what-was-proven"></a>
## 23. What Was Proven

1. the active runtime containerizes successfully;
2. Python 3.12 works for the image;
3. Nomic loads on CPU;
4. CrossEncoder loads on CPU;
5. Pinecone works from inside Docker;
6. local `embeddings.npy` is unnecessary for the production Pinecone runtime;
7. startup smoke passes;
8. `/health` passes;
9. `/api/rag/retrieve` executes inside Docker;
10. CPU-only PyTorch installation must be explicit;
11. the initialized runtime uses about 1.293 GiB RAM;
12. Cloudflare Containers are unavailable under the current Free-plan constraint;
13. Render Free has insufficient RAM for the current image.

<a id="24-what-remains-unproven"></a>
## 24. What Remains Unproven

- production concurrency behavior;
- cold-start behavior on a real host;
- long-lived memory stability;
- minimum achievable RAM;
- whether ONNX preserves retrieval behavior;
- whether quantization preserves retrieval behavior;
- whether a smaller/different reranker preserves quality;
- whether another free host with sufficient RAM is operationally acceptable;
- Gemini latency/cost behavior;
- final browser-to-answer latency.

<a id="25-current-blockers"></a>
## 25. Current Blockers

| Path | Blocker type | Checkpoint conclusion |
|---|---|---|
| Cloudflare Containers | account/plan access | paid plan required; violates current `$0` constraint |
| Render Free | memory/resource fit | 512 MB is below measured ~1.293 GiB runtime |

These are different blockers and should remain distinct in future reasoning.

<a id="26-explicit-non-decisions"></a>
## 26. Explicit Non-Decisions

At this checkpoint no decision had been made to:

- purchase Workers Paid;
- deploy to Render;
- permanently abandon Render;
- optimize below 512 MB;
- move to ONNX;
- quantize Nomic or CrossEncoder;
- replace either model;
- split inference responsibilities;
- use another provider;
- integrate Gemini before hosting was settled.

A later deployment record evaluates a Cloudflare-native decomposition; that later record does not invalidate the measurements in this one.

<a id="27-current-architecture-checkpoint"></a>
## 27. Current Architecture Checkpoint

```text
COMPLETE
--------
corpus
retrieval documents
Nomic embeddings
Pinecone
Pinecone parity
Python runtime
local HTTP runtime validation
Docker build/startup/health/retrieval

OPEN AT THIS CHECKPOINT
-----------------------
production Python host
gateway routing
rate limiting
production readiness
Gemini
frontend API integration
production QA
```

<a id="28-requirements-for-the-next-hosting-decision"></a>
## 28. Requirements for the Next Hosting Decision

| Dimension | Why it matters |
|---|---|
| ongoing cost / account requirement | must fit the project's operating constraint |
| RAM | baseline is ~1.293 GiB |
| CPU | Nomic + CrossEncoder are CPU workloads in this implementation |
| cold start | model load is non-trivial |
| image/build limits | PyTorch/model dependencies are large |
| outbound networking | Pinecone and future generation require it |
| secret handling | secrets cannot reach the browser |
| timeout ceiling | retrieval is multi-second |
| health/readiness | required for reliable deployment |
| integration burden | should fit the existing Worker/frontend boundary |
| reproducibility | model/runtime versions must remain controlled |

<a id="29-engineering-lessons"></a>
## 29. Engineering Lessons

### 29.1 Runtime correctness and hosting feasibility are independent

Docker passed even though the first production-hosting options did not.

### 29.2 Dependency intent must be explicit

CPU deployment should not rely on generic PyTorch package resolution.

### 29.3 Provider feasibility belongs before integration work

Checking Cloudflare Container access before writing Worker bindings prevented unnecessary coupling.

### 29.4 Resource measurement belongs before deployment

Measuring 1.293 GiB before attempting Render Free avoided a predictable memory failure.

### 29.5 Operational decisions, deployment evidence and retrieval QC are different document classes

This record belongs under `docs/rag/deployment/`. Its container/hosting logs live under `docs/rag/deployment/evidence/`. Retrieval-quality incidents and regression evidence remain under `docs/qc/rag/`.

<a id="30-evidence-map"></a>
## 30. Evidence Map

Supporting sanitized evidence remains in QC:

- [Containerization/hosting evidence](evidence/2026-08-31-containerization-hosting-evidence.txt)
- [Document-preservation verification](../../qc/documentation/2026-08-31-document-preservation-verification.txt)

No API keys, secret values or Cloudflare account identifiers are intentionally included.

<a id="31-related-documentation"></a>
## 31. Related Documentation

- [Deployment history index](README.md)
- [Portfolio deployment overview](../../operations/deployment.md)
- [Later zero-cost Cloudflare-native runtime evaluation](2026-08-31-cloudflare-native-zero-cost-runtime-evaluation.md)
- [RAG provider integration](../cloudflare-integration.md)
- [RAG known issues](../known-issues.md)
- [RAG QC incident](../../qc/rag/2026-08-31-backend-system-design-generalization-incident.md)
- [RAG root documentation](../README.md)
