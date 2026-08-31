# Trust Boundaries and Secrets

## Table of Contents

- [Browser Boundary](#browser-boundary)
- [Worker Boundary](#worker-boundary)
- [D1 Boundary](#d1-boundary)
- [Local Secret File](#local-secret-file)
- [Pinecone Boundary](#pinecone-boundary)
- [Model Supply-Chain Boundary](#model-supply-chain-boundary)
- [Future Generator Boundary](#future-generator-boundary)

<a id="browser-boundary"></a>
## Browser Boundary

Treat all browser input as untrusted. Public opinion data is validated server-side. Admin bearer sessions are sensitive and short-lived. Browser code must never receive Worker secrets, `PINECONE_API_KEY`, or future Gemini server credentials.

<a id="worker-boundary"></a>
## Worker Boundary

The Worker is the deployed security boundary for portfolio CRUD. Restricted browser routes enforce the configured frontend origin and require the signed admin session where applicable. GitHub OAuth secrets and `SESSION_SECRET` are Wrangler secrets.

<a id="d1-boundary"></a>
## D1 Boundary

D1 is trusted persistence behind the Worker, not a direct browser database. One-time OAuth exchange codes are stored hashed and consumed transactionally.

<a id="local-secret-file"></a>
## Local Secret File

`.dev.vars` is a local-only secret source and must never be committed. It can contain both Worker development credentials and `PINECONE_API_KEY`. Documentation may name variable names, but must never reproduce secret values.

<a id="pinecone-boundary"></a>
## Pinecone Boundary

Pinecone contains derived embedding vectors plus compact retrieval metadata, not the authoritative full corpus. `embedding-records.jsonl` and source analyses remain the content/provenance source of truth. Index deletion protection is enabled for `portfolio-career-rag-v1`.

<a id="model-supply-chain-boundary"></a>
## Model Supply-Chain Boundary

Nomic and the CrossEncoder are pinned by model revision. The Python runtime currently uses `trust_remote_code=True` for Nomic compatibility (and also for the reranker in the generated runtime). That is a deliberate deployment/security consideration: deployment should pin exact revisions, constrain build provenance, and avoid unreviewed upgrades.

<a id="future-generator-boundary"></a>
## Future Generator Boundary

Gemini 2.5 Flash-Lite is selected but not integrated. Generation credentials belong only on the server side. Retrieved evidence should be treated as data, not trusted instructions, and the generation prompt should explicitly constrain answers to provided evidence.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Deployment](../operations/deployment.md)
- [RAG documentation](../rag/README.md)
