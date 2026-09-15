# Production RAG pipeline

Canonical location: `P:/Github/AI-accelerated/my-portfolio/rag/rag-next-pipeline/`. All further RAG work belongs in this central project. Run the documented `rag-next-pipeline/...` commands from `P:/Github/AI-accelerated/my-portfolio/rag/`.

## Pipeline state

**00 Source → 01 Corpus → 02 Retrieval Documents → 03 Embeddings → D1 → Vectorize → Worker**

| Stage | Location | Verified state |
|---|---|---|
| 00 Source | `00-source/portfolio-rag/` | 134 unchanged repository-analysis READMEs; source manifest lists 137 total, 3 remaining |
| 01 Corpus | `01-corpus/output/` | Complete: 134 records, 5,706 sections, 3,764 tags |
| 02 Retrieval Documents | `02-retrieval-documents/output/` | Complete: 1,429 documents, 134/134 coverage |
| 03 Embeddings | `03-embeddings/output/embeddings-cloudflare-v1/` | Complete: vectors generated with the manifest-defined corpus count and 1,024-dimension contract |
| Runtime metadata | `04-runtime-metadata/output/d1-runtime-v1/` | Production D1 corpus build/import implemented |
| Vector index | `05-vector-index/output/vectorize-cloudflare-v1/` | Production Vectorize publication implemented |
| Worker | project `worker/` and `wrangler.jsonc` | Production runtime deployed and serving the current corpus |

## PowerShell orchestrator

Run the pipeline from `P:/Github/AI-accelerated/my-portfolio/rag/`:

```powershell
# Sync origin/main, then run; prompts once before Workers AI can be called
.\run-rag-pipeline.ps1

# Sync origin/main, run/reuse local stages, validate embedding inputs, then stop
.\run-rag-pipeline.ps1 -LocalOnly

# Resume the recorded source commit and completed stages/checkpoints; does not fetch
.\run-rag-pipeline.ps1 -Resume

# Deliberately use the current clean source checkout without contacting GitHub
.\run-rag-pipeline.ps1 -SkipSourceSync
```

For an already authorized unattended job, pass `-ApproveRemote` explicitly:

```powershell
.\run-rag-pipeline.ps1 -Resume -ApproveRemote
```

Stage 00 uses the existing central checkout configuration: remote `origin` (`https://github.com/kirolossedra/my-portfolio.git`) and branch `main`. The canonical input is `rag-next-pipeline/00-source/portfolio-rag/`. Before updating, the runner rejects tracked changes and untracked files in that subtree. It updates with a fast-forward-only pull and never resets source files. `-SkipSourceSync` requires a clean source but performs no fetch or pull.

The runner calls the existing Python, Node, npm, and Wrangler-backed implementations. It does not duplicate their pipeline logic. It records the source repository, branch, exact commit SHA, source-tree SHA-256, and completed-stage fingerprints in `rag-next-pipeline/logs/pipeline-run-state.json`. The same source provenance is written to the timestamped run directory and as `source-provenance.json` alongside generated stage outputs. With `-Resume`, Stage 00 performs no network operation and requires both the current commit and source-tree fingerprint to match the interrupted run before any stage continues. Stage 03 otherwise uses its existing completed-build, persistent-cache, and checkpoint behavior.

Every run writes `overall.log` and separate stage logs under `rag-next-pipeline/logs/runs/<timestamp>/`. A failed native command stops the run immediately, and its command, output, exit code, and working directory remain in that stage log.

The only approval boundary appears immediately before Stage 03 can invoke Workers AI. After approval, D1 import, Vectorize publication, and Worker deployment continue without another prompt. `-LocalOnly` never crosses this boundary. Corpus counts are read by the existing stage implementations from their manifests; the runner contains no corpus-count constant.

## Layout

```text
rag-next-pipeline/
|-- 00-source/portfolio-rag/         # source snapshot and original corpus ledgers
|-- 01-corpus/
|   |-- scripts/                     # corpus generator and shared helpers
|   `-- output/                      # repositories, JSONL, catalog, manifest, report
|-- 02-retrieval-documents/
|   |-- scripts/
|   `-- output/                      # retrieval documents and manifest
|-- 03-embeddings/
|   |-- scripts/cloudflare/          # validation/generation entry point
|   |-- validation/
|   `-- output/embeddings-cloudflare-v1/
|-- 04-runtime-metadata/
|   |-- scripts/
|   `-- output/d1-runtime-v1/
|-- 05-vector-index/
|   |-- scripts/cloudflare-vectorize/
|   `-- output/vectorize-cloudflare-v1/
|-- tests/
|-- logs/                            # historical and orchestrated run logs
|-- docs/
`-- README.md
```

## Resume behavior

The generator supports explicit `--validate-only` and `--generate` modes, completed-build reuse, interrupted-run checkpoints, and a persistent text/contract cache. The PowerShell runner adds stage-level resume state without changing those implementations.

The relocated local validation command is shown for reference only; it rewrites the saved validation report:

```powershell
node rag-next-pipeline/03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs --validate-only
```

Reorganization did not run any stage, test that builds data, or remote API. All original files were copied and SHA-256 verified before old copies were removed. Source files, generated artifacts, manifests, logs and saved validation reports remain byte-identical. Historical path strings inside these files are intentionally preserved; current scripts resolve physical paths from this root. Shared Python imports resolve through `01-corpus/scripts/`.

The ZIP-based audit in `tests/validate_rehearsal.py` still requires the original Downloads source archive, currently absent. Archived provider and later-stage scripts are references, not validated production entry points. This pipeline is now inside the central Git checkout; it has no nested Git repository.

See [pipeline details](docs/pipeline.md), [move map](docs/move-map.md), [preservation verification](docs/reorganization-validation.json), and [other RAG locations](docs/duplicate-directory-audit.md).

See [transfer verification](docs/transfer-verification.json) for copy hashes, path checks, and preservation of historical trees. Historical source-root paths remain in original artifacts as provenance.

Stage 03 execution and cache/checkpoint details: [Cloudflare README](03-embeddings/scripts/cloudflare/README.md). Offline tests: `node --test rag-next-pipeline/tests/test_stage03.mjs` from the central `rag/` directory.
