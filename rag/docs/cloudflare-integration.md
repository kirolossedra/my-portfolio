# Cloudflare / Portfolio Integration Plan

## Table of Contents

- [Current State](#current-state)
- [Required Boundary](#required-boundary)
- [Recommended Request Lifecycle](#recommended-request-lifecycle)
- [Why Not Run Python in the Browser](#why-not-run-python-in-the-browser)
- [Why Not Pretend the Existing Worker Already Does It](#why-not-pretend-the-existing-worker-already-does-it)
- [Production Concerns](#production-concerns)

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

## Related Documentation

- Parent: [../README.md](../README.md)
- [Runtime](../runtime/README.md)
- [Portfolio deployment](../../docs/operations/deployment.md)
