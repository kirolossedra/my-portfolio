# RAG Scripts - Active Pipeline and Validation

## Table of Contents

- [Execution Order](#execution-order)
- [`prepare-rag-corpus.py`](#prepare-rag-corpuspy)
- [`build-rag-retrieval-documents-v2.py`](#build-rag-retrieval-documents-v2py)
- [`generate-rag-embeddings-v3-documents-local.py`](#generate-rag-embeddings-v3-documents-localpy)
- [`build-rag-retrieval-v3-evidence-aware-local.py`](#build-rag-retrieval-v3-evidence-aware-localpy)
- [`upsert-pinecone-v1.py`](#upsert-pinecone-v1py)
- [`validate-pinecone-dense-parity-v1.py`](#validate-pinecone-dense-parity-v1py)
- [`validate-pinecone-dense-parity-v2.py`](#validate-pinecone-dense-parity-v2py)
- [Secret Handling](#secret-handling)
- [Shell Safety Lesson](#shell-safety-lesson)

<a id="execution-order"></a>
## Execution Order

```text
prepare-rag-corpus.py
  -> build-rag-retrieval-documents-v2.py
  -> generate-rag-embeddings-v3-documents-local.py
  -> build-rag-retrieval-v3-evidence-aware-local.py
  -> upsert-pinecone-v1.py
  -> validate-pinecone-dense-parity-v2.py
```

`validate-pinecone-dense-parity-v1.py` is preserved as the first, flawed validator and should not be the acceptance gate.

<a id="prepare-rag-corpuspy"></a>
## `prepare-rag-corpus.py`

**Status:** active implementation, valid existing output, unsafe to rerun after folder relocation until path discovery is refactored. Input is the eleven source Markdown files; output is canonical `rag-corpus/` repository JSON/JSONL/catalog/manifest/validation. It previously generated 134 repositories, 11,823 sections, 975 tags and 535 skill-rating rows.

<a id="build-rag-retrieval-documents-v2py"></a>
## `build-rag-retrieval-documents-v2.py`

**Status:** active. Input `rag-corpus/repositories.jsonl`; output `rag-corpus/retrieval-documents-v2/`. It classifies evidence, suppresses repeated/tiny generic blocks only in derived retrieval units, preserves original corpus, and emits 2,808 documents from 30,930 retained evidence blocks.

<a id="generate-rag-embeddings-v3-documents-localpy"></a>
## `generate-rag-embeddings-v3-documents-local.py`

**Status:** active artifact generator, already successfully completed; do not rerun without upstream/embedding-contract change. It uses pinned Nomic v1.5 revision, `search_document:` prefix, 768 -> normalized 512 Matryoshka representation, 8192 max sequence length, batch size 64 and 44 batches.

<a id="build-rag-retrieval-v3-evidence-aware-localpy"></a>
## `build-rag-retrieval-v3-evidence-aware-local.py`

**Status:** active offline reference retriever. It uses exact matrix dense scores for all records, BM25, metadata, RRF, concept/evidence gates, pinned CrossEncoder, polarity handling, dedupe and repository diversity. Its exact-matrix behavior remains a useful reference against the Pinecone runtime.

<a id="upsert-pinecone-v1py"></a>
## `upsert-pinecone-v1.py`

**Status:** active remote mutation tool. It writes the 2,808 vectors to Pinecone index `portfolio-career-rag-v1`, namespace `corpus-v1`, in batches of 100. Running it requires `PINECONE_API_KEY` and changes remote state. Initial validation passed 29/29 batches and 2808/2808 remote freshness.

<a id="validate-pinecone-dense-parity-v1py"></a>
## `validate-pinecone-dense-parity-v1.py`

**Status:** superseded validator. It demonstrated strong ANN agreement but used an inappropriate <=0.001 ANN reported-score-delta acceptance rule. Preserve its report as evidence of the debugging process; do not interpret its final FAIL as Pinecone corruption.

<a id="validate-pinecone-dense-parity-v2py"></a>
## `validate-pinecone-dense-parity-v2.py`

**Status:** active acceptance validator. It requires same top-1, >=90% overlap at 10/25/50, then fetches vectors and proves exact stored-vector fidelity through direct value comparison and recomputed cosine. It passed with 100/96/98% overlap and zero fetched-vector/cosine delta.

<a id="secret-handling"></a>
## Secret Handling

No script should print the Pinecone API key. Local secret loading may use repository-root `.dev.vars`; production should use process/environment secret injection.

<a id="shell-safety-lesson"></a>
## Shell Safety Lesson

Do not paste multi-line Python via fragile PowerShell backtick continuation. Complex file transforms belong in a checked/versioned script; immediate shell actions should be simple one-line commands.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Regeneration matrix](../docs/regeneration-matrix.md)
- [Pinecone](../docs/pinecone.md)
