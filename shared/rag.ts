export interface RagQueryRequest {
  question: string;
}

export interface RagCitationSourceFragment {
  section_title?: string | null;
  section_path?: string[];
  source_line_start?: number | null;
  source_line_end?: number | null;
  text_sha256?: string | null;
}

export interface RagCitation {
  label: string;
  documentId: string;
  repositoryIndex: number;
  repositoryName: string;
  repositoryUrl: string | null;
  retrievalClass: string;
  semanticArea: string;
  evidencePolarity: string;
  evidenceLevel: string;
  specificityScore: number;
  denseScore: number;
  rerankScore: number;
  sourceFragments: RagCitationSourceFragment[];
}

export interface RagRetrievalDiagnostics {
  vectorCandidates: number;
  d1Documents: number;
  rerankedDocuments: number;
  selectedEvidence: number;
  citedEvidenceLabels: string[];
  groundingWarning: string | null;
}

export interface RagQueryResponse {
  data: {
    answer: string;
    citations: RagCitation[];
    retrieval: RagRetrievalDiagnostics;
    models: {
      embedding: string;
      reranker: string;
      generation: string;
    };
  };
}

export interface RagHealthResponse {
  data: {
    status: 'ok';
    corpusDocuments: number;
    corpusRepositories: number;
    expectedDocuments: number;
    vectorIndex: string;
  };
}
