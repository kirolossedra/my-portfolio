# Stage 03 embedding implementations

The active Cloudflare generator derives corpus counts from the finalized Stage 02 manifest. Current input: 1,429 documents covering 134 repositories.

- [Cloudflare](cloudflare/README.md): explicit validation/generation modes, 1,024-D Qwen vectors, checkpoints and persistent text/contract cache. Real generation has not run.
- `nomic/`: preserved historical local reference, not the active rehearsal entry point.

No Stage 01/02 rebuild is needed. See the Cloudflare README for execution, credentials, reuse, paths and offline tests.
