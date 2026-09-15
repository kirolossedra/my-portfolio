# Other RAG locations

Read-only audit on September 14, 2026. No external directories were moved, edited or deleted. The canonical location for this 1,429-document rehearsal is `P:/Github/AI-accelerated/my-portfolio/rag/rag-next-pipeline/`. The working copy was subsequently transferred here; the older trees were left untouched.

| Location | Inspected contents | Relationship |
|---|---|---|
| `P:/Github/AI-accelerated/my-portfolio/rag/new-rag-pipeline/portfolio-rag-main/` | 96 repository READMEs; manifest lists 96 processed / 134 total | Older source snapshot. All 96 README bytes and relative paths match a subset of the canonical 134-input source. It does not contain this rehearsal's Stage 01/02 outputs. |
| `P:/Github/AI-accelerated/my-portfolio/rag/old-rag-pipeline/` | 134 normalized records; 2,808 retrieval documents; Nomic and Cloudflare embedding matrices plus retrieval, index and D1 artifacts | A different pipeline generation. Retrieval JSONL SHA-256 is `a10c2b2d9d4e79e8a6e6629cc15b18cb1123513b45df44dc73e668b44c1bee58`, different from this rehearsal. Cloudflare matrix is 11,501,648 bytes; Nomic matrix is 5,750,912 bytes. These artifacts are absent from the canonical rehearsal and must not be treated as disposable duplicates. Their remote publication status was not independently validated. |
| `P:/Github/AI-accelerated/my-portfolio/docs/rag/` | Documentation location found by directory inventory | Left untouched; not established as a duplicate corpus. |
| `P:/Github/AI-accelerated/my-portfolio/docs/qc/rag/` | Quality-check documentation location found by directory inventory | Left untouched; not established as a duplicate corpus. |

`P:/Github/my-portfolio/rag/new-rag-pipeline/portfolio-rag-main/` does not exist in this workspace. The similarly named location exists under the separate `AI-accelerated/my-portfolio` checkout. The central checkout has Git metadata; the rehearsal is now inside it. The former standalone working root had no Git metadata.

No directory is approved for deletion by this audit. Older generated outputs contain unique artifacts, and a naming convention alone does not prove obsolescence.
