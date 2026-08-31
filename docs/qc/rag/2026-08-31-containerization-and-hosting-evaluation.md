# RAG QC / Deployment Record — Containerization and Hosting Evaluation

> **File ID:** `RAG-DEPLOYMENT-QC-363c0606-8915-444e-9f4a-ea4fd50554d8`  
> **Version ID:** `RAG-DEPLOYMENT-QC-v2.0.0-4a0ad539-2f60-4383-bc53-c81c33eb2d66`  
> **Document version:** `2.0.0`  
> **Date:** `2026-08-31`  
> **Status:** `DOCUMENTED CHECKPOINT — PRODUCTION HOSTING DECISION PENDING`  
> **Runtime baseline:** `1.0.0`  
> **Retrieval baseline:** `3.1.0-pinecone`  
> **Documentation method:** existing documentation preserved; this record adds the deployment chronology rather than replacing prior history.

## Table of Contents

- [1. Purpose](#1-purpose)
- [2. Starting System State](#2-starting-system-state)
- [3. Deployment Goal](#3-deployment-goal)
- [4. Why Containerization Was the Next Step](#4-why-containerization-was-the-next-step)
- [5. Linux Preparation](#5-linux-preparation)
- [6. Active Runtime Inputs Confirmed](#6-active-runtime-inputs-confirmed)
- [7. First Docker Build](#7-first-docker-build)
- [8. CUDA Dependency Expansion and Disk Pressure](#8-cuda-dependency-expansion-and-disk-pressure)
- [9. CPU-Only PyTorch Correction](#9-cpu-only-pytorch-correction)
- [10. Successful Docker Build](#10-successful-docker-build)
- [11. Container Startup](#11-container-startup)
- [12. Pinecone Validation Inside Docker](#12-pinecone-validation-inside-docker)
- [13. Health Endpoint Validation](#13-health-endpoint-validation)
- [14. Retrieval Endpoint Validation](#14-retrieval-endpoint-validation)
- [15. Measured Runtime Footprint](#15-measured-runtime-footprint)
- [16. Cloudflare Containers Intended Architecture](#16-cloudflare-containers-intended-architecture)
- [17. Node and Wrangler Preparation](#17-node-and-wrangler-preparation)
- [18. Cloudflare Containers Blocker](#18-cloudflare-containers-blocker)
- [19. Why No Cloudflare Integration Code Was Added](#19-why-no-cloudflare-integration-code-was-added)
- [20. Render Free Feasibility Evaluation](#20-render-free-feasibility-evaluation)
- [21. Why Render Was Not Deployed](#21-why-render-was-not-deployed)
- [22. What Was Proven](#22-what-was-proven)
- [23. What Remains Unproven](#23-what-remains-unproven)
- [24. Current Blockers](#24-current-blockers)
- [25. Explicit Non-Decisions](#25-explicit-non-decisions)
- [26. Current Architecture Checkpoint](#26-current-architecture-checkpoint)
- [27. Requirements for the Next Hosting Decision](#27-requirements-for-the-next-hosting-decision)
- [28. Engineering Lessons](#28-engineering-lessons)
- [29. Evidence Map](#29-evidence-map)
- [30. Related Documentation](#30-related-documentation)

<a id="1-purpose"></a>
## 1. Purpose

This record documents the deployment endeavour performed after the Pinecone-backed RAG runtime had already passed local runtime validation.

The work was deliberately infrastructure-focused. It did **not** attempt to fix the previously documented backend/system-design evidence-semantics issue, integrate Gemini, or connect the browser. The immediate question was simpler and more foundational:

**Can the exact current RAG runtime be packaged into a reproducible Linux container and then hosted somewhere that fits the project's operating constraints?**

The answer split into two parts:

1. **Containerization: yes.**
2. **Production hosting: unresolved.**

The remainder of this document preserves the experiments and explains exactly where the deployment path stopped.

<a id="2-starting-system-state"></a>
## 2. Starting System State

Before Docker work began, the active retrieval stack was already:

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

Key runtime identities:

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

<a id="3-deployment-goal"></a>
## 3. Deployment Goal

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

<a id="4-why-containerization-was-the-next-step"></a>
## 4. Why Containerization Was the Next Step

The runtime depends on Python, PyTorch, SentenceTransformers, Nomic model code/weights, CrossEncoder model code/weights, FastAPI/Uvicorn and Pinecone.

That dependency shape is much heavier than a normal Cloudflare Worker isolate.

Containerization offered three benefits:

1. a reproducible Linux environment;
2. a clean boundary around Python/model dependencies;
3. the ability to test hosting providers without redesigning retrieval first.

<a id="5-linux-preparation"></a>
## 5. Linux Preparation

A fresh repository clone was created on Linux.

Docker baseline:

```text
Docker version 28.2.2
Ubuntu 24.04.3 LTS
x86_64
22 CPUs
15.14 GiB host RAM
```

Docker daemon health passed before application packaging started.

<a id="6-active-runtime-inputs-confirmed"></a>
## 6. Active Runtime Inputs Confirmed

The active runtime files were confirmed:

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

For the Pinecone runtime, only:

```text
embedding-records.jsonl
embedding-manifest.json
```

are needed locally.

`embeddings.npy` is intentionally not loaded because Pinecone serves dense vector recall and fetched vectors support semantic dedupe.

<a id="7-first-docker-build"></a>
## 7. First Docker Build

The first Dockerfile used a Python 3.12 slim image and installed the runtime requirements.

The initial approach was conceptually correct but dependency resolution was too broad.

<a id="8-cuda-dependency-expansion-and-disk-pressure"></a>
## 8. CUDA Dependency Expansion and Disk Pressure

The generic `torch` dependency path pulled large NVIDIA/CUDA packages despite the fact that this runtime is intended to run on CPU.

Observed package families included:

```text
nvidia-cuda-runtime
nvidia-cudnn
nvidia-cublas
nvidia-cusparse
nvidia-cufft
nvidia-nccl
```

The build consumed the remaining space on the Linux root filesystem.

The root cause was not Docker itself and not any RAG algorithm. It was an avoidable dependency-selection problem.

<a id="9-cpu-only-pytorch-correction"></a>
## 9. CPU-Only PyTorch Correction

Disk space was recovered, failed build state was cleaned, and PyTorch installation was made explicit:

```text
pip install --index-url https://download.pytorch.org/whl/cpu torch
```

This prevented the CPU deployment from unnecessarily resolving GPU/CUDA packages.

After recovery the root filesystem showed approximately 13 GB free.

<a id="10-successful-docker-build"></a>
## 10. Successful Docker Build

The corrected image completed successfully:

```text
Successfully built 2c5148f0ab3c
Successfully tagged portfolio-rag:v1
```

This established that the active RAG runtime can be packaged into a Linux Docker image.

<a id="11-container-startup"></a>
## 11. Container Startup

The image was run with the Pinecone secret injected through the environment.

The startup path loaded Nomic and CrossEncoder model components on CPU.

Observed completion:

```text
RAG API RUNTIME INITIALIZATION: SUCCESS
```

Uvicorn then served on port 8000.

<a id="12-pinecone-validation-inside-docker"></a>
## 12. Pinecone Validation Inside Docker

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

This proved that the container had working outbound connectivity and the runtime could access the already validated Pinecone state.

<a id="13-health-endpoint-validation"></a>
## 13. Health Endpoint Validation

The container's `GET /health` endpoint returned `status: ok`.

Important returned values:

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

<a id="14-retrieval-endpoint-validation"></a>
## 14. Retrieval Endpoint Validation

`POST /api/rag/retrieve` was exercised against the running container using the backend/system-design employer-style question used in previous QC.

The purpose of this test was deployment equivalence, not retrieval redesign.

The endpoint executed successfully from Docker.

<a id="15-measured-runtime-footprint"></a>
## 15. Measured Runtime Footprint

The running initialized container was measured:

```text
CPU %:             0.22%
MEM USAGE:         1.293 GiB
HOST MEMORY LIMIT: 15.14 GiB
PIDS:              110
```

The most important hosting input is therefore:

**Current measured runtime RAM: approximately 1.293 GiB.**

This is a baseline for the current implementation, not a theoretical minimum.

<a id="16-cloudflare-containers-intended-architecture"></a>
## 16. Cloudflare Containers Intended Architecture

Cloudflare Containers were the first intended production target because the portfolio already has a Cloudflare Worker.

The planned shape was:

```text
kirolos.dev browser
  -> existing Cloudflare Worker
  -> Cloudflare Container
  -> Python FastAPI RAG runtime
  -> Pinecone
```

That design would preserve the Worker as the public API/security gateway.

<a id="17-node-and-wrangler-preparation"></a>
## 17. Node and Wrangler Preparation

The Linux environment initially had Node 18.

`npm ci` failed because project tooling expected a newer Node runtime and a Netlify CLI dependency used syntax not supported by Node 18.

After upgrading to Node 22:

```text
npm ci
```

completed successfully.

Wrangler login then succeeded and the token exposed a Containers write permission.

<a id="18-cloudflare-containers-blocker"></a>
## 18. Cloudflare Containers Blocker

Before any RAG Worker integration was implemented, the account capability was probed:

```text
npx wrangler containers list
```

Wrangler returned:

```text
Unauthorized: You do not have access to Cloudflare Containers.
Deploying containers requires the Workers Paid plan.
```

Cloudflare's official Containers pricing documentation currently shows:

```text
Free:         Container compute N/A
Workers Paid: Container compute included allowance
```

This ended the Cloudflare Containers attempt.

<a id="19-why-no-cloudflare-integration-code-was-added"></a>
## 19. Why No Cloudflare Integration Code Was Added

The account limitation was discovered **before** modifying:

```text
worker/index.ts
wrangler.jsonc
```

for RAG container routing.

That was the correct sequencing because it prevented provider-specific integration code from being added for an unavailable provider path.

The existing production Worker remains untouched by this experiment.

<a id="20-render-free-feasibility-evaluation"></a>
## 20. Render Free Feasibility Evaluation

Render was considered next because it supports Docker web services and has a Free web-service compute plan.

The provider was evaluated against the measured local runtime before deployment.

Current official Render compute-plan documentation lists:

```text
Free web service
CPU: 0.1
RAM: 512 MB
```

Current runtime:

```text
RAM: ~1.293 GiB
```

Ratio:

```text
~2.6x Render Free RAM
```

<a id="21-why-render-was-not-deployed"></a>
## 21. Why Render Was Not Deployed

No Render service was created at this checkpoint.

The resource mismatch was already clear enough that deploying the existing image unchanged would be an invalid test of the provider.

The correct conclusion is:

**Render Free cannot host the current runtime as-is at its measured memory footprint.**

This does not answer whether the runtime can be reduced enough to fit.

<a id="22-what-was-proven"></a>
## 22. What Was Proven

The endeavour proved:

1. the active runtime containerizes successfully;
2. Python 3.12 works for the image;
3. Nomic loads on CPU;
4. CrossEncoder loads on CPU;
5. Pinecone works from inside Docker;
6. local `embeddings.npy` is unnecessary for the production Pinecone runtime;
7. the startup smoke test passes;
8. `/health` passes;
9. `/api/rag/retrieve` can execute inside Docker;
10. CPU-only PyTorch must be installed explicitly;
11. the current runtime uses about 1.293 GiB RAM after initialization;
12. Cloudflare Containers are not available under the current account plan;
13. Render Free has insufficient RAM for the current runtime.

<a id="23-what-remains-unproven"></a>
## 23. What Remains Unproven

The endeavour did not prove:

- production concurrency behavior;
- cold-start behavior on a real host;
- long-lived memory stability;
- minimum achievable RAM;
- whether ONNX preserves the same retrieval behavior;
- whether quantization preserves the same retrieval behavior;
- whether a smaller reranker would preserve quality;
- whether a host with ~2 GiB RAM and no card requirement is available and operationally acceptable;
- Gemini latency/cost behavior;
- final browser-to-answer latency.

<a id="24-current-blockers"></a>
## 24. Current Blockers

Two provider paths are blocked for different reasons:

### Cloudflare Containers

**Blocker type:** account/plan access.

### Render Free

**Blocker type:** memory/resource fit.

Those must remain separate in future reasoning.

<a id="25-explicit-non-decisions"></a>
## 25. Explicit Non-Decisions

No decision has been made to:

- purchase Workers Paid;
- use Render;
- abandon Render;
- optimize below 512 MB;
- move to ONNX;
- quantize Nomic;
- quantize CrossEncoder;
- replace either model;
- split inference across services;
- use another cloud provider;
- integrate Gemini before hosting is settled.

<a id="26-current-architecture-checkpoint"></a>
## 26. Current Architecture Checkpoint

```text
COMPLETE
--------
corpus
retrieval documents
embeddings
Pinecone
Pinecone parity
Python runtime
local HTTP runtime validation
Docker build
Docker startup
Docker health
Docker retrieval

OPEN
----
production Python host
gateway routing
rate limiting
production readiness
Gemini
frontend API integration
production QA
```

<a id="27-requirements-for-the-next-hosting-decision"></a>
## 27. Requirements for the Next Hosting Decision

The next decision should compare candidate approaches using:

| Dimension | Why it matters |
|---|---|
| account/card requirement | must match the project's operating constraint |
| RAM | current baseline is ~1.293 GiB |
| CPU | Nomic + CrossEncoder are CPU workloads |
| cold start | model load is non-trivial |
| image/build limits | PyTorch/model dependencies are large |
| outbound networking | Pinecone and Gemini require it |
| secret handling | secrets cannot reach the browser |
| timeout ceiling | retrieval is multi-second |
| health/readiness | required for reliable deployment |
| integration burden | should fit the existing Worker/frontend architecture |
| reproducibility | model/runtime versions must stay controlled |

<a id="28-engineering-lessons"></a>
## 28. Engineering Lessons

### 28.1 Runtime correctness and hosting feasibility are independent

Docker passed while the first two provider paths did not.

### 28.2 Dependency intent must be explicit

CPU-only deployment should not rely on generic PyTorch package resolution.

### 28.3 Provider feasibility belongs before integration work

Checking Cloudflare Container access before changing Worker routing prevented unnecessary coupling.

### 28.4 Resource measurement belongs before deployment

Measuring 1.293 GiB before trying Render Free avoided a predictable memory failure.

### 28.5 Blocked experiments should stay in the record

The history explains why the next architecture decision exists and prevents future work from repeating the same provider checks.

<a id="29-evidence-map"></a>
## 29. Evidence Map

Sanitized terminal evidence:

- [evidence/2026-08-31-containerization-hosting-evidence.txt](evidence/2026-08-31-containerization-hosting-evidence.txt)

Preservation verification:

- [evidence/2026-08-31-document-preservation-verification.txt](evidence/2026-08-31-document-preservation-verification.txt)

No API keys, secret values or Cloudflare account identifiers are included.

<a id="30-related-documentation"></a>
## 30. Related Documentation

- [Portfolio deployment](../../operations/deployment.md)
- [RAG provider integration plan/update](../../../rag/docs/cloudflare-integration.md)
- [RAG known issues](../../../rag/docs/known-issues.md)
- [Prior retrieval generalization incident](2026-08-31-backend-system-design-generalization-incident.md)
- [RAG root documentation](../../../rag/README.md)
