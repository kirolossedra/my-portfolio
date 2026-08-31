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

## Related Documentation

- Parent: [../README.md](../README.md)
- [Testing](testing-and-regressions.md)
- [Cloudflare integration](cloudflare-integration.md)
