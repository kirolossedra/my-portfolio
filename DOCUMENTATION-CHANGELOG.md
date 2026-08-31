# Documentation Overhaul Changelog

## Table of Contents

- [Scope](#scope)
- [Main Changes](#main-changes)
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

<a id="preservation-guarantee"></a>
## Preservation Guarantee

The overhaul is additive/reorganizational: existing project behavior is not removed. The prior RAG README is retained in full as a historical snapshot, and previously documented root-portfolio operational details are carried forward into the expanded root README. Facts from the existing root README and `rag/other/README.md` were retained in the new hierarchy, while stale RAG status statements (for example “vector DB provider not selected”) were updated rather than preserved as current truth. Historical states remain in version/evolution documents.

## Related Documentation

- Parent: [README.md](README.md)
- [Manifest](DOCUMENTATION-MANIFEST.json)
