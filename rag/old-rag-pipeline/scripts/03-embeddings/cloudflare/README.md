# Cloudflare Workers AI Embeddings

## Table of Contents

- [Purpose](#purpose)
- [Active Candidate](#active-candidate)
- [Vector-Space Contract](#vector-space-contract)
- [Authentication](#authentication)
- [Input and Output](#input-and-output)
- [Run](#run)
- [Checkpoint and Resume](#checkpoint-and-resume)
- [Validation Guarantees](#validation-guarantees)
- [Preservation Rule](#preservation-rule)
- [Next Stage](#next-stage)

## Purpose

This provider branch generates the Cloudflare-native candidate embedding space for the finalized 2,808 Stage 02 evidence-aware retrieval documents.

It is intentionally parallel to the validated Nomic generation. It does not overwrite, convert, or delete the existing Nomic vectors.

## Active Candidate

`generate-rag-embeddings-v4-cloudflare.mjs`

Embedding-family version: **v4**.

Cloudflare-provider artifact generation: **cloudflare-v1**.

Those labels are intentionally distinct:

- `v4` means the fourth embedding-space generation in the RAG pipeline history.
- `cloudflare-v1` means the first artifact generation using Cloudflare Workers AI.

## Vector-Space Contract

The implementation uses:

- provider: Cloudflare Workers AI
- model: `@cf/qwen/qwen3-embedding-0.6b`
- dimensions: 1,024
- document API mode: `documents`
- runtime query API mode: `queries`
- query instruction: `Given a web search query, retrieve relevant passages that answer the query`
- explicit post-processing: L2 normalization
- similarity: cosine
- stored dtype: float32

The runtime query implementation must reproduce this contract exactly before querying Vectorize.

Cloudflare model documentation verified for this implementation on 2026-08-31:

- https://developers.cloudflare.com/workers-ai/models/qwen3-embedding-0.6b/
- https://developers.cloudflare.com/workers-ai/get-started/rest-api/

## Authentication

No Cloudflare secret is written into this folder or generated embedding artifacts.

The script resolves authentication in this order:

1. `CLOUDFLARE_ACCOUNT_ID` if already present in the environment; otherwise `npx wrangler whoami --json`.
2. Existing Cloudflare environment credentials if present; otherwise `npx wrangler auth token --json`.

If Wrangler returns multiple accounts, set `CLOUDFLARE_ACCOUNT_ID` for that terminal session so the script cannot choose the wrong account.

## Input and Output

Input:

```text
rag/rag-corpus/retrieval-documents-v2/documents.jsonl
```

Output:

```text
rag/rag-corpus/embeddings-cloudflare-v1/
├── embeddings.npy
├── embedding-records.jsonl
├── embedding-manifest.json
└── embedding-validation-report.txt
```

The existing directory remains untouched:

```text
rag/rag-corpus/embeddings-v2/
```

## Run

From the portfolio repository root:

```powershell
node rag/scripts/03-embeddings/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs
```

The script accepts zero arguments and can also be launched from another working directory because it discovers the enclosing `rag/` root from its own location.

## Checkpoint and Resume

While generation is incomplete, the script uses:

```text
rag/rag-corpus/.embedding-cloudflare-v1-checkpoint/
```

Each logical Workers AI batch is checkpointed after successful validation. If a network failure, rate limit, or free-usage quota interruption occurs, successful prior batches remain available.

Rerun the same command to resume.

The checkpoint directory is deleted only after final artifact publication and verification succeeds.

A checkpoint identity binds the saved batches to:

- source corpus SHA-256
- ordered document IDs
- provider/model
- dimensions
- document/query input modes
- query instruction
- post-processing contract
- logical batch size

This prevents vectors from different embedding spaces from being mixed accidentally.

## Validation Guarantees

Before sending the corpus, the generator validates:

- exactly 2,808 retrieval documents
- 134/134 repository coverage
- unique document IDs
- Stage 02 schema compatibility
- `embedding_text` presence and provenance hash
- declared embedding word counts
- a generous UTF-8 size sanity guard for accidental giant/corrupt records

The generator does **not** truncate `embedding_text` locally. Workers AI receives the complete Stage 02 string. The REST response does not expose exact Qwen tokenizer counts, so the byte-size check is documented as a sanity guard rather than misrepresented as exact token validation.

Before corpus generation, it performs tiny live Workers AI smoke tests for both:

- document embedding mode
- future query embedding mode

For every returned vector it validates:

- exactly 1,024 dimensions
- finite numeric values
- non-zero L2 norm
- explicit L2 normalization

Before publication it validates:

- NPY shape `(2808, 1024)`
- float32 storage
- no NaN/Inf vectors
- no zero vectors
- unit-normalized vectors
- `vector_index` to `document_id` alignment
- preservation of authoritative `text`
- preservation of `embedding_text`
- preservation of `source_fragments`
- artifact SHA-256 hashes

## Preservation Rule

Do not remove the Nomic artifacts yet.

Cloudflare v1 must first pass:

1. embedding generation validation;
2. Vectorize ingestion validation;
3. retrieval comparison against the current reference pipeline.

Only after that should the production retrieval path stop depending on the old Nomic/Pinecone stack.

## Next Stage

After this generator completes successfully, Stage 05 should create a **1,024-dimensional cosine Vectorize index** and publish `embeddings-cloudflare-v1` into it.
