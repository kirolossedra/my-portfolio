# Local Development

## Table of Contents

- [Node Application](#node-application)
- [Local Worker](#local-worker)
- [Python RAG Runtime](#python-rag-runtime)
- [Do Not Accidentally Run Build-Time Scripts](#do-not-accidentally-run-build-time-scripts)

<a id="node-application"></a>
## Node Application

From repository root:

```powershell
npm install
npm run verify
npm run dev
```

The project requires Node `>=22.13.0`. `npm run verify` runs repository policy gates, lint, frontend/Worker type checking, Vitest, and a Wrangler dry-run.

<a id="local-worker"></a>
## Local Worker

Authenticate Wrangler once, apply local D1 migrations, copy `.dev.vars.example` to `.dev.vars` and populate local-only secrets, then run `npm run worker:dev`. Never commit `.dev.vars`.

<a id="python-rag-runtime"></a>
## Python RAG Runtime

The current runtime has its own dependency list:

```powershell
python -m pip install -r .\rag\runtime\requirements-rag-api-v1.txt
python .\rag\runtime\rag-api-pinecone-v1.py
```

The Nomic and CrossEncoder model files may be downloaded from their public model repositories on first use. `einops` is required by the Nomic model implementation; it is a tensor-rearrangement dependency, not a second embedding model and not a Pinecone dependency.

Runtime prerequisites include a valid `PINECONE_API_KEY` in the process environment or the nearest parent `.dev.vars`. The active index defaults to `portfolio-career-rag-v1` and namespace `corpus-v1`.

Test in another PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Then exercise retrieval with `POST /api/rag/retrieve`. Current v1 returns evidence with `generation: null`.

<a id="do-not-accidentally-run-build-time-scripts"></a>
## Do Not Accidentally Run Build-Time Scripts

The RAG preprocessing scripts are not server startup steps. In particular, do not rerun `prepare-rag-corpus.py` from its reorganized `rag/scripts/` location without first fixing its base-directory assumptions, and do not regenerate embeddings unless upstream data or embedding contract changed.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG runtime](../../rag/runtime/README.md)
- [RAG scripts](../../rag/scripts/README.md)
