import { describe, expect, it } from 'vitest';
import { HttpError } from '../http.ts';
import {
  extractCitedEvidenceLabels,
  selectEvidence,
  validateRagQueryInput,
  type RankedEvidence,
} from '../rag-runtime.ts';
import type { RagDocument } from '../rag-repository.ts';

function document(
  id: string,
  repositoryIndex: number,
  overrides: Partial<RagDocument> = {},
): RagDocument {
  return {
    documentId: id,
    repositoryIndex,
    repositoryName: `Repo ${repositoryIndex}`,
    repositorySlug: null,
    repositoryUrl: null,
    retrievalClass: 'direct_evidence',
    semanticArea: 'software_engineering',
    evidencePolarity: 'positive',
    evidenceLevel: 'implemented_or_concrete',
    specificityScore: 0.9,
    concreteSignalCount: 2,
    wordCount: 100,
    text: `Evidence for ${id}`,
    topics: [],
    evidenceAreas: [],
    relatedSkillRatings: [],
    sourceFragments: [],
    provenance: {},
    ...overrides,
  };
}

function ranked(id: string, repositoryIndex: number, score: number, rank: number): Omit<RankedEvidence, 'selectionScore'> {
  return {
    document: document(id, repositoryIndex),
    denseScore: 1 - rank * 0.01,
    denseRank: rank,
    rerankScore: score,
    rerankRank: rank,
  };
}

describe('RAG query validation', () => {
  it('trims and accepts a normal employer question', () => {
    expect(validateRagQueryInput({ question: '  What backend systems did he build?  ' }))
      .toBe('What backend systems did he build?');
  });

  it('rejects missing and oversized questions', () => {
    expect(() => validateRagQueryInput({ question: ' ' })).toThrow(HttpError);
    expect(() => validateRagQueryInput({ question: 'x'.repeat(1601) })).toThrow(HttpError);
  });
});

describe('evidence selection', () => {
  it('diversifies repositories before filling additional slots', () => {
    const input = [
      ranked('a1', 1, 0.99, 0),
      ranked('a2', 1, 0.98, 1),
      ranked('a3', 1, 0.97, 2),
      ranked('b1', 2, 0.96, 3),
      ranked('c1', 3, 0.95, 4),
      ranked('d1', 4, 0.94, 5),
    ];

    const selected = selectEvidence(input, 'What systems were implemented?', 5);
    expect(selected).toHaveLength(5);
    expect(new Set(selected.map((item) => item.document.repositoryIndex)).size).toBeGreaterThanOrEqual(3);
  });

  it('boosts limitation evidence for explicit limitation questions', () => {
    const positive = ranked('positive', 1, 0.80, 0);
    const limitation = {
      ...ranked('limitation', 2, 0.79, 1),
      document: document('limitation', 2, {
        retrievalClass: 'limitation',
        evidencePolarity: 'negative',
        evidenceLevel: 'repository_limitation',
      }),
    };

    const selected = selectEvidence([positive, limitation], 'What limitations or missing production evidence exist?', 1);
    expect(selected[0]?.document.documentId).toBe('limitation');
  });
});

describe('citation extraction', () => {
  it('returns unique valid evidence labels and ignores out-of-range labels', () => {
    expect(extractCitedEvidenceLabels('Built X [E1], tested Y [E2], again [E1], bogus [E9].', 3))
      .toEqual(['E1', 'E2']);
  });
});
