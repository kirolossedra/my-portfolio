# Cloudflare embedding generation — Stage 03

Counts come from the Stage 02 manifest. Current finalized input: 1,429 retrieval documents covering 134 repositories. Stage 01 and Stage 02 are already complete and require no rebuild.

## Explicit modes

From `P:/Github/AI-accelerated/my-portfolio/rag/`:

```powershell
node rag-next-pipeline/03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs --validate-only
node rag-next-pipeline/03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs --generate
```

Exactly one mode is required. Generation is implemented but has not been authorized or run against Cloudflare. Validation writes `03-embeddings/validation/local-validation.json` and exits before authentication/network activity. Both modes verify upstream manifest/input SHA-256, Stage 02 artifact hashes, document counts, coverage, input sizes, and embedding-text provenance.

## Generation flow

1. Validate finalized input.
2. Inspect checkpoint identity and every saved batch before authentication.
3. Verify completed output contract, artifact hashes, matrix shape/normalization and current record/document mapping. Reuse identical input successfully with zero authentication/requests. Valid output for an earlier corpus does not satisfy the current input; incompatible or corrupt output fails.
4. Inspect persistent text cache and cache/checkpoint conflicts. Prepare the checkpoint locally. If all vectors are available locally, skip authentication and smoke requests.
5. For missing vectors, resolve account/authentication and perform one document-mode and one query-mode smoke request.
6. Resume saved batches; request only uncached unique texts in remaining batches. Atomically save vectors and completed batches.
7. Assemble temporary float32 NPY and current evidence records, validate and publish locally, then verify final output. Remove successful-run checkpoints while retaining the cache.

## Contract

- Workers AI model: `@cf/qwen/qwen3-embedding-0.6b`
- 1,024 dimensions, float32, explicit L2 normalization, cosine retrieval
- Complete `embedding_text` submitted as `documents`, without client-side truncation
- Query mode: `queries`
- Query instruction: `Given a web search query, retrieve relevant passages that answer the query`

Matrix shape: `(manifest.statistics.documents, 1024)`. Logical batches contain at most 16 documents. Current input requires at most 90 corpus requests plus two smoke requests before retries; reuse reduces these. Repeated identical text shares a vector but retains an ordered output row per document.

## Credentials and services

Account: `CLOUDFLARE_ACCOUNT_ID`, otherwise `npx wrangler whoami --json`. Authentication: `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_AUTH_TOKEN`; alternatively `CLOUDFLARE_API_KEY` plus `CLOUDFLARE_EMAIL`; otherwise `npx wrangler auth token --json`. Multiple accounts require explicit account selection. Wrangler runs from the central project root. Secrets are not saved to artifacts.

Stage 03 calls Workers AI REST and writes local files. It does not publish Vectorize, import D1, deploy a Worker or require R2 storage. Live credentials, permissions and quota remain unchecked.

## Locations and reuse

Paths are relative to `rag-next-pipeline/`:

- Input: `02-retrieval-documents/output/documents.jsonl`
- Validation: `03-embeddings/validation/local-validation.json`
- Checkpoint: `03-embeddings/.embedding-cloudflare-v1-checkpoint/identity.json` and `batch-START-END.json`
- Persistent cache: `03-embeddings/cache/cloudflare-v1/<contract-sha256>/<embedding-text-sha256>.json`
- Temporary output: `03-embeddings/.embeddings-cloudflare-v1.tmp/`
- Completed output: `03-embeddings/output/embeddings-cloudflare-v1/` containing `embeddings.npy`, `embedding-records.jsonl`, `embedding-manifest.json`, `embedding-validation-report.txt`

Cache keys bind text SHA-256 to provider/model/dimensions/dtype/normalization/similarity/document-mode/query-mode/instruction/field. IDs, ordering, corpus hash and batch size do not invalidate text reuse. Entries validate schema, contract, text hash, vector digest, dimensions and unit norm. Corrupt matching-key entries fail; genuinely different contracts occupy separate namespaces.

Checkpoint identity additionally binds whole input hash, ordered IDs, count, generation/schema and batch size. Changed input or contract rejects an interrupted checkpoint before authentication/requests and preserves it for inspection. Saved batch ranges, IDs, counts and vectors, plus cache conflicts, are checked locally. Rerun the same `--generate` command to resume unchanged input. An interruption between receiving a response and durable save can repeat unsaved work. Use one generation process at a time.

## Offline tests

```powershell
node --test rag-next-pipeline/tests/test_stage03.mjs
```

Tests use temporary fixtures, synthetic vectors, mocked account/authentication/HTTP and a fail-closed global fetch guard. They never rebuild the actual source/corpus/retrieval data or contact Cloudflare. The archived Python integration suite builds Stage 01/02 fixtures and is not part of this Stage 03-only command.

Historical embedding artifacts remain untouched and are not automatically imported into this cache. Evaluation and index/runtime migration remain separate work after authorization.
