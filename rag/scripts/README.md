# RAG Scripts — Stage-Organized Pipeline

## Table of Contents

- [Purpose](#purpose)
- [Versioning Rule](#versioning-rule)
- [Directory Map](#directory-map)
- [Current Execution Order](#current-execution-order)
- [Stage 01 — Corpus](#stage-01--corpus)
- [Stage 02 — Retrieval Documents](#stage-02--retrieval-documents)
- [Stage 03 — Embeddings](#stage-03--embeddings)
- [Stage 04 — Retrieval Reference](#stage-04--retrieval-reference)
- [Stage 05 — Vector Index](#stage-05--vector-index)
- [Stage 06 — Validation](#stage-06--validation)
- [Path Resolution Contract](#path-resolution-contract)
- [Cloudflare Migration Rule](#cloudflare-migration-rule)

## Purpose

The scripts directory is organized by **pipeline responsibility**, not by the date a script happened to be written. There are intentionally no executable Python scripts directly in this directory.

## Versioning Rule

Three concepts must stay separate:

1. **Stage number** (`01`–`06`) = where the responsibility sits in the RAG pipeline.
2. **Filename version** (`v1`, `v2`, `v3`, …) = a generation of that responsibility/implementation.
3. **Backend/provider directory** (`nomic`, `pinecone`, `cloudflare`, `cloudflare-vectorize`) = an independent implementation family.

Therefore, Pinecone v1 and Vectorize v1 can coexist; Vectorize is not "Pinecone v2". Likewise, Retrieval v3 and Embedding v3 are different version families even though they share the number 3.

## Directory Map

```text
scripts/
├── README.md
├── 01-corpus/
│   ├── README.md
│   └── prepare-rag-corpus.py
├── 02-retrieval-documents/
│   ├── README.md
│   └── build-rag-retrieval-documents-v2.py
├── 03-embeddings/
│   ├── README.md
│   ├── nomic/
│   │   └── generate-rag-embeddings-v3-documents-local.py
│   └── cloudflare/
│       └── README.md
├── 04-retrieval-reference/
│   ├── README.md
│   └── build-rag-retrieval-v3-evidence-aware-local.py
├── 05-vector-index/
│   ├── README.md
│   ├── pinecone/
│   │   └── upsert-pinecone-v1.py
│   └── cloudflare-vectorize/
│       └── README.md
└── 06-validation/
    ├── README.md
    ├── pinecone/
    │   ├── validate-pinecone-dense-parity-v1.py
    │   └── validate-pinecone-dense-parity-v2.py
    └── cloudflare-vectorize/
        └── README.md
```

## Current Execution Order

The existing Nomic/Pinecone reference path is:

```text
python rag/scripts/01-corpus/prepare-rag-corpus.py
  -> python rag/scripts/02-retrieval-documents/build-rag-retrieval-documents-v2.py
  -> python rag/scripts/03-embeddings/nomic/generate-rag-embeddings-v3-documents-local.py
  -> python rag/scripts/04-retrieval-reference/build-rag-retrieval-v3-evidence-aware-local.py
  -> python rag/scripts/05-vector-index/pinecone/upsert-pinecone-v1.py
  -> python rag/scripts/06-validation/pinecone/validate-pinecone-dense-parity-v2.py
```

`validate-pinecone-dense-parity-v1.py` is retained as historical debugging evidence. It is **not** the Pinecone acceptance gate.

## Stage 01 — Corpus

Converts the repository-analysis Markdown source batches into the canonical normalized corpus under `rag-corpus/`.

Current generation: **Corpus preparation v1**.

## Stage 02 — Retrieval Documents

Defines what a searchable evidence unit is.

- Historical v1: tiny Markdown-derived chunks; structurally valid but retrieval-poor for this repetitive analytical corpus.
- Active v2: evidence-aware documents with provenance, evidence class, polarity, specificity and semantic area.

Current active output: `rag-corpus/retrieval-documents-v2/`.

## Stage 03 — Embeddings

Converts retrieval documents into vector representations.

- Historical v1: hosted/paid embedding path.
- Historical v2: local Nomic over the old tiny chunks.
- Active v3/Nomic: pinned local Nomic over the 2,808 evidence-aware documents.
- Next candidate: Cloudflare Workers AI/Qwen. It must be added under `03-embeddings/cloudflare/` as a **parallel embedding generation**, not by overwriting the validated Nomic artifacts.

## Stage 04 — Retrieval Reference

The offline reference implementation used to evaluate retrieval quality independently of a hosted vector backend.

- v1: exact cosine only over old chunks.
- v2: hybrid BM25/metadata/RRF/CrossEncoder over old chunks.
- active v3: evidence-aware documents plus dense, lexical, metadata, gates, pinned CrossEncoder, polarity handling, dedupe and repository diversity.

This is a reference/validation implementation, not the final Cloudflare production runtime.

## Stage 05 — Vector Index

Publishes validated vectors to a hosted vector backend.

- `pinecone/`: current Pinecone publication family.
- `cloudflare-vectorize/`: reserved for the Cloudflare-native replacement.

Backend generations are independent. A future `cloudflare-vectorize-v1` should not be named as a Pinecone revision.

## Stage 06 — Validation

Validates that a hosted vector backend preserves the expected retrieval/storage behavior.

Pinecone history:

- v1: flawed acceptance criterion required ANN-reported scores to numerically match exhaustive local cosine within `0.001`.
- v2: correct separation of ANN candidate parity from exact stored-vector fidelity; this is the active acceptance gate.

Cloudflare Vectorize gets its own validator family under `06-validation/cloudflare-vectorize/`.

## Path Resolution Contract

All executable scripts in this tree resolve paths from the enclosing `rag/` directory rather than assuming that `rag-corpus/` is beside the script.

The invariant is:

```text
<script anywhere below rag/scripts/...>
             ↓
walk upward to enclosing rag/
             ↓
RAG_ROOT = .../rag
             ↓
corpus I/O = RAG_ROOT / rag-corpus / ...
```

This means the scripts can be run from the portfolio repository root, from `rag/`, or from another working directory without changing their corpus paths.

Stage 01 additionally searches the portfolio project tree for `repositories-*.md` source batches while excluding generated/build/archive trees. This fixes the previous assumption that the source Markdown must sit beside the script.

Pinecone scripts continue to locate `.dev.vars` by walking upward, so repository-root secret placement remains valid.

## Cloudflare Migration Rule

Until the Cloudflare candidate passes embedding, Vectorize, retrieval and end-to-end validation, do not overwrite:

```text
rag/rag-corpus/embeddings-v2/
portfolio-career-rag-v1
corpus-v1
```

The next implementation belongs in the already-reserved Cloudflare stage directories.
