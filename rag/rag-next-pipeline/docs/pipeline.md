Stage 03 update: explicit --validate-only / --generate modes and persistent reuse are implemented and tested with offline mocks. No real generation has run. See the Cloudflare README for current behavior. The handoff below records the previous validation-only boundary.

Current canonical pipeline: P:/Github/AI-accelerated/my-portfolio/rag/rag-next-pipeline/. All further RAG work uses this central project. The former standalone root described in the historical inputs section was removed after transfer verification.

This handoff describes the September 9 rehearsal. Command paths below have been relocated; none were rerun during reorganization. Generated manifests and saved logs retain their historical path strings. See the root README for current layout and docs/duplicate-directory-audit.md for other workspaces.

# Isolated RAG rehearsal handoff

PASS: 134/134 processed repositories (100% coverage), 1429 retrieval documents, 18 tests passing. All generated artifacts are inside this directory. No Cloudflare authentication, embedding requests, Vectorize writes, D1 import, Worker deployment, or production corpus replacement occurred.

## Inputs and workspace

The configured P:/Github/my-portfolio directory did not exist. It was created, and only the rehearsal was populated from the Downloads archives; this is not a Git checkout. Pipeline scripts were copied from my-portfolio-main.zip. Source files were extracted unchanged from portfolio-rag-main (1).zip (manifest schema 22: processedRepositories=134, totalRepositories=137, remainingRepositories=3). The older portfolio-rag-main.zip contains only 96 processed repositories and was not used.

The actual snapshot has 68 indexed repository H1s and 66 title-only H1s with explicit Repository Identity indexes. The isolated parser accepts both, checks index/name against the repo directory, and allows the observed Project Tags section H1. Missing/malformed identity, duplicate index/path, multiple analyses, manifest mismatch and noncontiguous inventories fail. Legacy batch H1s remain unsupported in this isolated path; archived production code is unchanged.

## Implementation files changed relative to archive

- `01-corpus/scripts/manifest_contract.py`
- `01-corpus/scripts/retrieval_clean.py`
- `01-corpus/scripts/prepare-rag-corpus.py`
- `02-retrieval-documents/scripts/build-rag-retrieval-documents-v2.py`
- `03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs`

Additional new files: tests/test_rehearsal.py, validate_rehearsal.py, the root README, docs/changed-files.json, source snapshot, normalized/retrieval artifacts, logs and audit reports. Other copied scripts are archive references, not validated entry points for this rehearsal.

Stage 01 preserves exact raw UTF-8 source text (including CRLF/trailing whitespace), source-relative paths, complete line ranges, names, indexes and SHA-256. It records source-manifest and generated-artifact hashes. Stage 02 validates the upstream manifest and source/artifact hashes before using its count. Raw fragments remain separate from cleaned authoritative and embedding text. Negative/mixed evidence bypasses generic/template suppression. Stage 03 consumes Stage 02 counts and hashes dynamically and permits only --validate-only; remote execution is disabled in its entry point.

## Exact final commands run

Current working directory: P:/Github/AI-accelerated/my-portfolio/rag. Commands below have updated physical paths; original September 9 logs retain the former working directory. PowerShell redirection writes logs under the rehearsal.

```powershell
python rag-next-pipeline/01-corpus/scripts/prepare-rag-corpus.py *> rag-next-pipeline/logs/stage-01-run.log
python rag-next-pipeline/02-retrieval-documents/scripts/build-rag-retrieval-documents-v2.py *> rag-next-pipeline/logs/stage-02-run.log
python -m unittest discover -s rag-next-pipeline/tests -v *> rag-next-pipeline/logs/tests-run.log
python rag-next-pipeline/tests/validate_rehearsal.py *> rag-next-pipeline/logs/local-validation-run.log
node --check rag-next-pipeline/03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs
node rag-next-pipeline/03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs --validate-only *> rag-next-pipeline/logs/stage-03-run.log
```

Earlier failed development runs were corrected before these final checks. The test suite also runs isolated two-repository builds and deliberate tampering cases in temporary directories, proving counts are not fixed at 134/2808 and that changed upstream bytes/counts are rejected.

## Results

- Stage 01: 134 records; 5706 sections; 3764 tags. Structured numeric skill-rating rows: 0 (legacy table extractor; all prose skill evidence remains in raw analyses/sections).
- Stage 02: 1429 documents; 134 repositories; 0 fallback documents. Generated document count is recorded in document-manifest.json and consumed by Stage 03.
- Markdown audit: 0 syntax issues across both retrieval fields. Every retained source fragment's cleaned content appears in its document; authoritative text is present unchanged in embedding_text. Tests cover headings, emphasis, lists, tables, links, inline/fenced code, separators, dates, measurements, filenames and negative evidence.
- Literal code/path syntax (2**n, **/*.tex, worker/__tests__/) is deliberately preserved, not treated as Markdown decoration.
- All 134 README byte hashes match the source ZIP; raw_analysis matches each original file exactly. Provenance spot checks: 001 lines 1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“292; 067 lines 1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“70; 132 lines 1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“1932; 134 lines 1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“760. Samples of both retrieval fields are in tests/results/local-validation.json.
- Unit/integration tests: 18 passing. Node syntax check: pass. Stage 03 local document validation: pass, 1429 documents, 134 repositories, 0 remote calls.

## Artifacts and next boundary

- 01-corpus/output/manifest.json and repositories.jsonl: Stage 01 output.
- 02-retrieval-documents/output/document-manifest.json and documents.jsonl: Stage 02 output.
- tests/results/local-validation.json: source immutability, text audit, statistics and representative samples.
- 03-embeddings/validation/local-validation.json: downstream count/hash validation and stopped boundary.
- tests-run.log and stage-01/02/03-run.log: execution evidence.

No failing local code check remains for the requested rehearsal. The next boundary is a separate decision to enable Cloudflare-hosted embedding. Credentials/access have not been checked. Remote embeddings, retrieval quality evaluation against those embeddings, publication, and production migration are unperformed. The legacy semantic classifiers and numeric skill-table extractor have not been redesigned; this validation establishes ingestion, provenance, cleaning and local manifest/count integrity, not production retrieval quality.
