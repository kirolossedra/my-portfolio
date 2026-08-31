# Documentation Overhaul Changelog

## Table of Contents

- [Scope](#scope)
- [Main Changes](#main-changes)
- [2026-08-31 Zero-Cost RAG Runtime Addendum](#2026-08-31-zero-cost-rag-runtime-addendum)
- [Manifest Note](#manifest-note)
- [Preservation Guarantee](#preservation-guarantee)

<a id="scope"></a>
## Scope

Documentation-only overlay. No Python, TypeScript, SQL, Cloudflare, Netlify, Pinecone or model behavior is changed by this package.

<a id="main-changes"></a>
## Main Changes

- rewrote the repository root README so it remains a whole-portfolio README while incorporating the RAG subsystem accurately;
- added a whole-project `docs/` architecture/operations/data/testing/version hierarchy;
- added frontend, Kiro RAG, Worker, shared-contract and root-script documentation;
- upgraded the RAG README from its earlier pre-Pinecone/pre-runtime status to the current Pinecone-backed local-runtime status;
- preserved the complete previous 83,762-byte RAG README as `rag/docs/historical-rag-readme-v1.md`, so none of its model comparisons, schemas, security rules, lessons, acceptance criteria, provider-planning state or cleanup history is lost;
- documented every major RAG generation: source analysis, Step 1, old chunker, paid embedding attempt, old local embeddings, retrieval v1, retrieval v2, evidence-document pivot, active embeddings, Retrieval v3, Pinecone upsert/parity, runtime API, Gemini choice, Kiro UI integration and proposed backend-positive gate;
- preserved failure history including PowerShell cleanup/quoting problems and the flawed parity-v1 acceptance criterion;
- created explicit regeneration/change-impact matrices so future work does not unnecessarily rebuild validated embeddings;
- marked the v1.1 positive-backend gate proposal as **PROPOSED - NOT APPLIED**, because GitHub main still carries runtime 1.0.0 / retrieval 3.1.0-pinecone.

<a id="2026-08-31-zero-cost-rag-runtime-addendum"></a>
## 2026-08-31 Zero-Cost RAG Runtime Addendum

A later documentation-only architecture review adds the next deployment decision without changing active code or deleting the containerization history.

Added/updated documentation now records:

- the hard target of sustainable `$0` ongoing runtime infrastructure rather than temporary credits;
- why Pinecone/vector databases are not the reason Python/Docker became necessary;
- why Nomic query inference is only one of several Python runtime responsibilities;
- Cloudflare-hosted Qwen3-Embedding-0.6B as a **candidate**, not an active model;
- Cloudflare-hosted BGE reranker as a **candidate**, not an active replacement for the pinned CrossEncoder;
- the existing D1 binding as a candidate home for slim evidence metadata and FTS5 lexical recall;
- a complete provider/pathway table covering Cloudflare Containers, Render Free, Nomic API, Fireworks, Hugging Face provider status, browser ONNX, Cloudflare Worker/Python Worker, Deno Deploy, Qwen + Pinecone and Qwen + Vectorize;
- explicit free-tier caps and why embedding-only query counts must not be presented as full-RAG capacity;
- Vectorize's 30M queried-dimension / 5M stored-dimension Free allocation and the current topK mismatch with the pipeline's top-500 dense candidate stage;
- Pinecone Starter read-unit capacity as a quantity that must be measured using `usage.read_units` on the real workload;
- an end-to-end candidate pipeline diagram and reversible migration diagram;
- the expected future TypeScript/D1/Worker file-change surface;
- acceptance gates that prevent the current validated Nomic/Pinecone/Python baseline from being retired prematurely.

Canonical new decision document:

- [rag/docs/cloudflare-native-zero-cost-migration.md](rag/docs/cloudflare-native-zero-cost-migration.md)

QC checkpoint:

- [docs/qc/rag/2026-08-31-cloudflare-native-zero-cost-runtime-evaluation.md](docs/qc/rag/2026-08-31-cloudflare-native-zero-cost-runtime-evaluation.md)

<a id="manifest-note"></a>
## Manifest Note

`DOCUMENTATION-MANIFEST.json` is **not modified by this addendum**. It is the retained manifest of the earlier documentation-overhaul package and was already older than later append-only deployment documentation before this update. Hand-editing only a subset of its byte/line/hash records would make it look authoritative while leaving other entries stale. If a current whole-documentation manifest is required, regenerate it from the complete repository documentation tree as a separate deterministic packaging step.

<a id="preservation-guarantee"></a>
## Preservation Guarantee

The overhaul is additive/reorganizational: existing project behavior is not removed. The prior RAG README is retained in full as a historical snapshot, and previously documented root-portfolio operational details are carried forward into the expanded root README. Facts from the existing root README and `rag/other/README.md` were retained in the new hierarchy, while stale RAG status statements (for example “vector DB provider not selected”) were updated rather than preserved as current truth. Historical states remain in version/evolution documents.

The zero-cost RAG addendum follows the same rule: Docker success, the 1.293 GiB measurement, Cloudflare Containers' paid-plan blocker, Render Free's resource mismatch, current Nomic embeddings, current Pinecone index and current Python runtime remain part of the record. Qwen/Worker/D1/BGE is documented only as the next candidate architecture until quantitative regression gates pass.

## Related Documentation

- Parent: [README.md](README.md)
- [Manifest](DOCUMENTATION-MANIFEST.json)
- [Zero-cost RAG migration](rag/docs/cloudflare-native-zero-cost-migration.md)
