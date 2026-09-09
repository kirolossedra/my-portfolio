# Chunking and Retrieval-Document History

## Table of Contents

- [Why the First Chunks Looked Reasonable](#why-the-first-chunks-looked-reasonable)
- [Why It Failed Here](#why-it-failed-here)
- [Evidence-Aware Document Design](#evidence-aware-document-design)
- [Quantitative Pivot](#quantitative-pivot)
- [Key Lesson](#key-lesson)

<a id="why-the-first-chunks-looked-reasonable"></a>
## Why the First Chunks Looked Reasonable

A normal RAG recipe suggests splitting long Markdown into manageable semantic chunks. The first compiler did exactly that and produced valid IDs/catalog/manifests. The average retrieval system might have stopped there.

<a id="why-it-failed-here"></a>
## Why It Failed Here

The corpus itself is a repeated analytical framework across 134 repositories. A 53-word median chunk often contained generic phrases such as architecture review, evidence limitation, implementation proof or career signal without enough repository-specific context. Dense similarity faithfully found those shared semantics, which is precisely why irrelevant templates rose.

<a id="evidence-aware-document-design"></a>
## Evidence-Aware Document Design

The replacement compiler aggregates enough related evidence to preserve a claim's local context and labels its retrieval class, semantic area, polarity/level, topics and source fragments. Repeated template fingerprints and tiny generic blocks are suppressed only in the derived retrieval layer.

<a id="quantitative-pivot"></a>
## Quantitative Pivot

```text
old chunks: 11,642
old median words: 53
active evidence documents: 2,808
active median words: 138
active max words: 705
retained evidence blocks: 30,930
repeated template blocks suppressed: 39,342
tiny generic blocks suppressed: 7,340
```

<a id="key-lesson"></a>
## Key Lesson

A sophisticated ranker cannot fully repair an impoverished retrieval unit. Improving the representation before adding more heuristics produced the biggest quality gain.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Retrieval history](retrieval-version-history.md)
