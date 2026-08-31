# Active RAG Pipeline - End to End

## Table of Contents

- [Pipeline Contract](#pipeline-contract)
- [Stage 0 - Source Analysis](#stage-0-source-analysis)
- [Stage 1 - Normalize](#stage-1-normalize)
- [Stage 2 - Compile Evidence Documents](#stage-2-compile-evidence-documents)
- [Stage 3 - Embed](#stage-3-embed)
- [Stage 4 - Offline Evidence-Aware Retrieval](#stage-4-offline-evidence-aware-retrieval)
- [Stage 5 - Pinecone Serving Copy](#stage-5-pinecone-serving-copy)
- [Stage 6 - Python HTTP Runtime](#stage-6-python-http-runtime)
- [Stage 7 - Grounded Generation (Selected / Not Integrated)](#stage-7-grounded-generation-selected-not-integrated)
- [Stage 8 - Kiro Browser Integration (Not Integrated)](#stage-8-kiro-browser-integration-not-integrated)
- [Candidate Stage 9 - Cloudflare-Native Runtime Migration](#candidate-stage-9-cloudflare-native-runtime-migration)
- [Migration Validation Order](#migration-validation-order)

<a id="pipeline-contract"></a>
## Pipeline Contract

```mermaid
flowchart TD
    A[134-repository analysis corpus] --> B[Step 1 canonical normalization]
    B --> C[2,808 evidence-aware retrieval documents]
    C --> D[Nomic v1.5 768-D native embeddings]
    D --> E[Layer norm + first 512 dims + L2 normalization]
    E --> F[Pinecone namespace corpus-v1]
    Q[Question] --> Q1[search_query: Nomic 512-D embedding]
    Q1 --> F
    Q --> BM[BM25]
    Q --> MD[metadata / topic / skill recall]
    F --> RRF[RRF + normalized channel scores]
    BM --> RRF
    MD --> RRF
    RRF --> Gate[primary-concept gate]
    Gate --> EQ[evidence class / polarity / specificity]
    EQ --> CE[CrossEncoder rerank: top 120]
    CE --> Neg[intent-aware positive/negative gate]
    Neg --> DD[semantic dedupe + max 2/repository]
    DD --> Top[Top evidence + full provenance]
    Top -. planned .-> Gen[Gemini 2.5 Flash-Lite]
    Gen -. planned .-> UI[Kiro RAG portfolio UI]
```

<a id="stage-0-source-analysis"></a>
## Stage 0 - Source Analysis

The eleven `other/repositories-*.md` files are not ad-hoc scraped README text. They are longitudinal evidence reports with explicit provenance, limitations, chronology and skill evidence. Source completeness is 134/134.

<a id="stage-1-normalize"></a>
## Stage 1 - Normalize

`prepare-rag-corpus.py` parses source reports into per-repository JSON and combined JSONL. Historical output is valid. Because the script moved away from its input files, do not rerun until its path discovery is repaired.

<a id="stage-2-compile-evidence-documents"></a>
## Stage 2 - Compile Evidence Documents

The compiler examines 77,612 blocks, fingerprints repeated structure, suppresses 39,342 template blocks and 7,340 tiny generic blocks in the derived layer, retains 30,930 useful blocks and compiles 2,808 retrieval documents across five evidence classes and eight semantic areas.

<a id="stage-3-embed"></a>
## Stage 3 - Embed

Pinned Nomic v1.5 produces 768 native dimensions, then `layer_norm -> first 512 -> L2`. All 2,808 vectors are finite/nonzero/normalized. Document and query prefixes must remain asymmetric (`search_document:` / `search_query:`).

<a id="stage-4-offline-evidence-aware-retrieval"></a>
## Stage 4 - Offline Evidence-Aware Retrieval

Exact dense scores + BM25 + metadata -> RRF -> concept gate -> evidence score -> CrossEncoder -> intent-aware polarity -> dedupe/diversity. This exact-matrix implementation is the reference logic.

<a id="stage-5-pinecone-serving-copy"></a>
## Stage 5 - Pinecone Serving Copy

All vectors are copied into a 512-D cosine serverless index. Dense parity v2 proves candidate overlap and exact fetched-vector fidelity. Pinecone is serving infrastructure, not canonical source.

<a id="stage-6-python-http-runtime"></a>
## Stage 6 - Python HTTP Runtime

The runtime keeps text/provenance/BM25/metadata/gates/CrossEncoder local and replaces exact dense candidate selection with Pinecone ANN. It fetches candidate vectors for dedupe. Current endpoints provide evidence retrieval only.

<a id="stage-7-grounded-generation-selected-not-integrated"></a>
## Stage 7 - Grounded Generation (Selected / Not Integrated)

Gemini 2.5 Flash-Lite will synthesize a controlled evidence packet. This stage must preserve uncertainty/limitations and cannot invent repository evidence.

<a id="stage-8-kiro-browser-integration-not-integrated"></a>
## Stage 8 - Kiro Browser Integration (Not Integrated)

The existing Kiro GLB UI already has semantic RAG states. Network events should replace the demo timers while preserving the model contract.

<a id="candidate-stage-9-cloudflare-native-runtime-migration"></a>
## Candidate Stage 9 - Cloudflare-Native Runtime Migration

**Status: candidate only; the active pipeline above remains authoritative until regression gates pass.**

The target is to remove the public Python/Docker service, not to delete Python from offline tooling.

```mermaid
flowchart TD
    C[Same 2,808 evidence-aware documents] --> QE[Workers AI Qwen3 document embeddings]
    QE --> QP[New Pinecone 1024-D candidate index]

    U[User question] --> W[Cloudflare Worker]
    W --> QQ[Workers AI Qwen3 query embedding]
    QQ --> QP
    W --> FTS[D1 FTS5 lexical recall]
    W --> META[D1 metadata/topic/skill recall]

    QP --> F[TypeScript fusion + gates]
    FTS --> F
    META --> F
    F --> RR[Workers AI BGE reranker]
    RR --> DD[TypeScript polarity + semantic dedupe + repo diversity]
    DD --> T[Top 10 evidence + provenance]
    T -. separate quota .-> G[Gemini 2.5 Flash-Lite]
    G --> UI[Kiro RAG UI]
```

### Why Pinecone is retained in the first candidate

The current dense stage needs `top 500`. Cloudflare Vectorize currently returns at most `100` results without values/metadata and `50` with values/full metadata. A simultaneous model + vector-DB migration would therefore change both the embedding space and recall breadth.

The first candidate should instead isolate the embedding-model change:

```text
Nomic 512 + current Pinecone       = baseline
Qwen 1024 + new Pinecone index     = candidate
```

### Full Python responsibility decomposition

Replacing Nomic alone is insufficient. Current Python also owns:

- BM25;
- metadata/topic/skill recall;
- fusion and normalized channel scoring;
- primary-concept/evidence/polarity gates;
- CrossEncoder reranking;
- semantic dedupe;
- max-per-repository diversity;
- response/provenance shaping.

Each must be ported or replaced and then regression-tested before Stage 6 can be retired.

<a id="migration-validation-order"></a>
## Migration Validation Order

1. [ ] Generate Qwen document embeddings into a **new** artifact directory.
2. [ ] Create a **new** 1,024-D Pinecone candidate index; never overwrite the Nomic index.
3. [ ] Compare dense and end-task retrieval against the existing validation queries.
4. [ ] Capture Pinecone `usage.read_units` for top-500 query + dedupe fetch behavior.
5. [ ] If Qwen passes, port lexical/metadata recall to D1 and deterministic scoring/gates to TypeScript.
6. [ ] Compare D1 FTS5 behavior against current Python BM25; do not assume equivalence.
7. [ ] Evaluate Workers AI `@cf/baai/bge-reranker-base` against the current CrossEncoder.
8. [ ] Measure actual Workers AI neurons per complete query; reranking is expected to dominate query embedding.
9. [ ] Only after full backend parity, wire `src/kiro-rag-page.tsx` to the live Worker endpoint.
10. [ ] Only after production telemetry is satisfactory, retire the production Python/Docker path.
11. [ ] Evaluate Pinecone vs Vectorize later as an independent database decision.

Full caps, calculations, rejected deployment paths and future file map:

- [cloudflare-native-zero-cost-migration.md](cloudflare-native-zero-cost-migration.md)

## Related Documentation

- Parent: [../README.md](../README.md)
- [Scripts](../scripts/README.md)
- [Runtime](../runtime/README.md)
- [Zero-cost Cloudflare migration](cloudflare-native-zero-cost-migration.md)
