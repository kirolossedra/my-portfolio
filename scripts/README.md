# Portfolio-Level Scripts

## Table of Contents

- [Scope](#scope)
- [Current Scripts](#current-scripts)
- [Why Policy Gates Exist](#why-policy-gates-exist)
- [RAG Scripts Are Different](#rag-scripts-are-different)

<a id="scope"></a>
## Scope

These are Node-based portfolio operations and policy gates. They are separate from the Python RAG pipeline under `rag/scripts/`.

<a id="current-scripts"></a>
## Current Scripts

| Script | Purpose |
|---|---|
| `milestone-cli.mjs` | owner milestone/section/image authoring through HTTP API using short-lived session |
| `check-no-legacy.mjs` | reject obsolete JavaScript migration artifacts |
| `check-no-r2.mjs` | reject active R2 integration while D1 Base64 is the chosen image design |
| `check-no-legacy-auth.mjs` | reject reintroduction of permanent admin-token auth |
| `cleanup-legacy.mjs` | explicit legacy cleanup helper |
| `legacy-files.mjs` | shared legacy-file inventory |

<a id="why-policy-gates-exist"></a>
## Why Policy Gates Exist

The gates turn architectural history into executable constraints. Rather than relying on documentation saying “we no longer use R2” or “we no longer use a permanent admin token,” CI fails if those retired patterns reappear.

<a id="rag-scripts-are-different"></a>
## RAG Scripts Are Different

RAG build scripts transform a large evidence corpus and can regenerate large derived artifacts or mutate Pinecone. Their input/output/rerun safety is documented in [`../rag/scripts/README.md`](../rag/scripts/README.md).

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG scripts](../rag/scripts/README.md)
