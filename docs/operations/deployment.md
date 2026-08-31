# Deployment

## Table of Contents

- [Current Deployed Application](#current-deployed-application)
- [Netlify](#netlify)
- [Cloudflare](#cloudflare)
- [RAG Deployment Status](#rag-deployment-status)
- [External RAG State](#external-rag-state)

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

## Related Documentation

- Parent: [../README.md](../README.md)
- [Cloudflare integration](../../rag/docs/cloudflare-integration.md)
