# Architecture Evolution History

## Table of Contents

- [Portfolio Evolution Themes](#portfolio-evolution-themes)
- [Why History Is Kept](#why-history-is-kept)

<a id="portfolio-evolution-themes"></a>
## Portfolio Evolution Themes

The repository records several explicit architectural replacements rather than silently deleting the old decisions from history:

- image persistence moved away from active R2 integration to D1 Base64 storage and a repository gate now rejects accidental R2 reintroduction;
- permanent application-admin tokens were replaced by GitHub OAuth, numeric-user-ID authorization, one-time exchange codes and signed short-lived sessions;
- the timeline/portfolio matured into multiple public surfaces including opinions, skills and Kiro RAG;
- Kiro visual behavior moved from an image-cutout concept to a real GLB contract with runtime inspection and bounded animation controls;
- the RAG pipeline evolved from tiny chunks + cosine to evidence-aware retrieval documents + hybrid reranking + Pinecone-backed runtime.

<a id="why-history-is-kept"></a>
## Why History Is Kept

Superseded implementations remain important engineering evidence because they explain why current constraints exist. The RAG subsystem preserves old scripts/generated folders rather than pretending the final architecture was obvious from the start. The portfolio-level policy gates similarly encode previous mistakes/abandoned designs as executable regression constraints.

## Related Documentation

- Parent: [../README.md](../README.md)
- [RAG evolution](../../rag/docs/retrieval-version-history.md)
