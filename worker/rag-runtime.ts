import type { RagCitation, RagHealthResponse, RagQueryResponse } from '../shared/rag.ts';
import type { Env } from './env.ts';
import { HttpError, jsonResponse, parseJsonBody } from './http.ts';
import {
  countRagDocuments,
  getRagCorpusMeta,
  getRagDocumentsByIds,
  type RagDocument,
} from './rag-repository.ts';

export const RAG_EMBEDDING_MODEL = '@cf/qwen/qwen3-embedding-0.6b';
export const RAG_RERANKER_MODEL = '@cf/baai/bge-reranker-base';
export const RAG_GENERATION_MODEL = '@cf/zai-org/glm-4.7-flash';
export const RAG_QUERY_INSTRUCTION = 'Given a web search query, retrieve relevant passages that answer the query';
export const RAG_VECTOR_INDEX_NAME = 'portfolio-career-rag-cloudflare-v1';

const EXPECTED_DOCUMENTS = 2808;
const EXPECTED_REPOSITORIES = 134;
const VECTOR_CANDIDATES = 40;
const RERANK_TOP_K = 20;
const FINAL_EVIDENCE = 8;
const MAX_QUESTION_CHARS = 1600;

interface AiRunner {
  run(model: string, input: unknown): Promise<unknown>;
}

interface DenseCandidate {
  document: RagDocument;
  denseScore: number;
  denseRank: number;
}

export interface RankedEvidence extends DenseCandidate {
  rerankScore: number;
  rerankRank: number;
  selectionScore: number;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function normalizeVector(vector: number[]): number[] {
  let squared = 0;
  for (const value of vector) {
    if (!Number.isFinite(value)) throw new HttpError(502, 'embedding_invalid', 'Embedding model returned a non-finite value.');
    squared += value * value;
  }
  const norm = Math.sqrt(squared);
  if (!(norm > 0)) throw new HttpError(502, 'embedding_invalid', 'Embedding model returned a zero vector.');
  return vector.map((value) => value / norm);
}

function extractEmbeddingVector(raw: unknown): number[] {
  const object = asObject(raw);
  const result = asObject(object?.result);
  const candidate = object?.data ?? result?.data;

  if (Array.isArray(candidate) && candidate.length > 0) {
    if (Array.isArray(candidate[0])) {
      const row = candidate[0];
      if (row.every((value) => typeof value === 'number')) return normalizeVector(row as number[]);
    }
    if (candidate.every((value) => typeof value === 'number')) {
      return normalizeVector(candidate as number[]);
    }
  }

  throw new HttpError(502, 'embedding_invalid', 'Workers AI returned an unrecognized embedding response.');
}

export function validateRagQueryInput(value: unknown): string {
  const object = asObject(value);
  const question = typeof object?.question === 'string' ? object.question.trim() : '';
  if (question.length < 3) {
    throw new HttpError(400, 'invalid_question', 'Question must contain at least 3 characters.');
  }
  if (question.length > MAX_QUESTION_CHARS) {
    throw new HttpError(400, 'invalid_question', `Question must be at most ${MAX_QUESTION_CHARS} characters.`);
  }
  return question;
}

function isLimitationIntent(question: string): boolean {
  return /\b(limit|limitation|weakness|gap|missing|risk|failure|debt|not\s+(?:prove|demonstrate|show)|what\s+did(?:n't| not))\b/i.test(question);
}

function evidenceBonus(document: RagDocument, limitationIntent: boolean): number {
  let bonus = 0;

  if (document.evidenceLevel === 'implemented_or_concrete') bonus += 0.030;
  else if (document.evidenceLevel === 'repository_specific') bonus += 0.020;
  else if (document.evidenceLevel === 'conceptual_exposure') bonus -= 0.025;

  if (document.retrievalClass === 'direct_evidence') bonus += 0.020;
  if (document.retrievalClass === 'limitation') bonus += limitationIntent ? 0.045 : -0.005;
  if (document.evidencePolarity === 'negative') bonus += limitationIntent ? 0.025 : -0.005;

  bonus += Math.max(0, Math.min(1, document.specificityScore)) * 0.010;
  return bonus;
}

export function selectEvidence(
  reranked: Array<Omit<RankedEvidence, 'selectionScore'>>,
  question: string,
  limit = FINAL_EVIDENCE,
): RankedEvidence[] {
  const limitationIntent = isLimitationIntent(question);
  const rescored = reranked
    .map((item) => ({
      ...item,
      selectionScore: item.rerankScore + evidenceBonus(item.document, limitationIntent),
    }))
    .sort((a, b) => b.selectionScore - a.selectionScore || a.rerankRank - b.rerankRank);

  const selected: RankedEvidence[] = [];
  const selectedIds = new Set<string>();
  const perRepository = new Map<number, number>();

  const takePass = (repositoryCap: number) => {
    for (const item of rescored) {
      if (selected.length >= limit) break;
      if (selectedIds.has(item.document.documentId)) continue;
      const count = perRepository.get(item.document.repositoryIndex) ?? 0;
      if (count >= repositoryCap) continue;
      selected.push(item);
      selectedIds.add(item.document.documentId);
      perRepository.set(item.document.repositoryIndex, count + 1);
    }
  };

  // First maximize cross-repository coverage, then fill any remaining evidence slots.
  takePass(2);
  takePass(3);
  if (selected.length < limit) takePass(Number.POSITIVE_INFINITY);

  return selected.slice(0, limit);
}

function parseRerankerResponse(raw: unknown, candidates: DenseCandidate[]): Array<Omit<RankedEvidence, 'selectionScore'>> {
  const object = asObject(raw);
  const response = Array.isArray(object?.response) ? object.response : null;
  if (!response) {
    throw new HttpError(502, 'reranker_invalid', 'Workers AI returned an unrecognized reranker response.');
  }

  const ranked: Array<Omit<RankedEvidence, 'selectionScore'>> = [];
  response.forEach((entry, rerankRank) => {
    const item = asObject(entry);
    if (!item) return;
    const rawIndex = item.index ?? item.id;
    const index = typeof rawIndex === 'number' ? rawIndex : Number(rawIndex);
    const score = typeof item.score === 'number' ? item.score : Number(item.score);
    if (!Number.isInteger(index) || index < 0 || index >= candidates.length || !Number.isFinite(score)) return;
    const candidate = candidates[index];
    if (!candidate) return;
    ranked.push({ ...candidate, rerankScore: score, rerankRank });
  });

  if (ranked.length === 0) {
    throw new HttpError(502, 'reranker_invalid', 'Reranker response contained no usable ranked contexts.');
  }
  return ranked;
}

function buildEvidencePrompt(question: string, evidence: RankedEvidence[]): string {
  const blocks = evidence.map((item, index) => {
    const d = item.document;
    const label = `E${index + 1}`;
    return [
      `[${label}]`,
      `Repository: ${d.repositoryName} (repo ${String(d.repositoryIndex).padStart(3, '0')})`,
      `Evidence class: ${d.retrievalClass}`,
      `Evidence level: ${d.evidenceLevel}`,
      `Evidence polarity: ${d.evidencePolarity}`,
      `Semantic area: ${d.semanticArea}`,
      `Evidence:`,
      d.text,
    ].join('\n');
  }).join('\n\n---\n\n');

  return [
    `Employer question: ${question}`,
    '',
    'Retrieved portfolio evidence:',
    blocks,
  ].join('\n');
}

const SYSTEM_PROMPT = `You answer questions about Kirolos Sedra's engineering portfolio for employers and technical reviewers.

Grounding rules:
- Use ONLY the supplied retrieved portfolio evidence.
- Do not invent technologies, ownership, scale, dates, production status, responsibilities, outcomes, or seniority claims.
- Preserve the evidence distinction between implemented/concrete work, repository-specific evidence, interpretation, conceptual exposure, and limitations.
- If the evidence is insufficient, say exactly what is not established.
- Cite factual claims inline with the supplied labels, for example [E1] or [E2][E5].
- Prefer concise, evidence-dense answers. Explain uncertainty where it materially changes the claim.
- Never claim that a repository proves something that its evidence explicitly bounds or denies.`;

function extractGenerationText(raw: unknown): string {
  const object = asObject(raw);
  if (typeof object?.response === 'string' && object.response.trim()) return object.response.trim();

  const choices = Array.isArray(object?.choices) ? object.choices : [];
  const first = asObject(choices[0]);
  const message = asObject(first?.message);
  if (typeof message?.content === 'string' && message.content.trim()) return message.content.trim();
  if (typeof first?.text === 'string' && first.text.trim()) return first.text.trim();

  throw new HttpError(502, 'generation_invalid', 'Workers AI returned an unrecognized generation response.');
}

function extractGenerationDelta(raw: unknown): string {
  const object = asObject(raw);
  if (typeof object?.response === 'string') return object.response;
  const choices = Array.isArray(object?.choices) ? object.choices : [];
  const first = asObject(choices[0]);
  const delta = asObject(first?.delta);
  if (typeof delta?.content === 'string') return delta.content;
  const message = asObject(first?.message);
  if (typeof message?.content === 'string') return message.content;
  if (typeof first?.text === 'string') return first.text;
  return '';
}

function ragStreamResponse(env: Env, body: ReadableStream<Uint8Array>): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': env.FRONTEND_ORIGIN ?? 'https://kirolos.dev',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
    },
  });
}

export function extractCitedEvidenceLabels(answer: string, evidenceCount: number): string[] {
  const found = new Set<string>();
  for (const match of answer.matchAll(/\[E(\d+)\]/g)) {
    const index = Number(match[1]);
    if (Number.isInteger(index) && index >= 1 && index <= evidenceCount) found.add(`E${index}`);
  }
  return [...found];
}

function citationFromEvidence(item: RankedEvidence, index: number): RagCitation {
  const d = item.document;
  return {
    label: `E${index + 1}`,
    documentId: d.documentId,
    repositoryIndex: d.repositoryIndex,
    repositoryName: d.repositoryName,
    repositoryUrl: d.repositoryUrl,
    retrievalClass: d.retrievalClass,
    semanticArea: d.semanticArea,
    evidencePolarity: d.evidencePolarity,
    evidenceLevel: d.evidenceLevel,
    specificityScore: d.specificityScore,
    denseScore: item.denseScore,
    rerankScore: item.rerankScore,
    sourceFragments: d.sourceFragments.map((fragment) => ({
      section_title: typeof fragment.section_title === 'string' ? fragment.section_title : null,
      section_path: Array.isArray(fragment.section_path) ? fragment.section_path.filter((v): v is string => typeof v === 'string') : [],
      source_line_start: typeof fragment.source_line_start === 'number' ? fragment.source_line_start : null,
      source_line_end: typeof fragment.source_line_end === 'number' ? fragment.source_line_end : null,
      text_sha256: typeof fragment.text_sha256 === 'string' ? fragment.text_sha256 : null,
    })),
  };
}

async function assertCorpusReady(env: Env): Promise<void> {
  const meta = await getRagCorpusMeta(env.DB);
  if (!meta || meta.document_count !== EXPECTED_DOCUMENTS || meta.repository_count !== EXPECTED_REPOSITORIES) {
    throw new HttpError(
      503,
      'rag_corpus_not_ready',
      `RAG D1 corpus is not ready. Expected ${EXPECTED_DOCUMENTS} documents across ${EXPECTED_REPOSITORIES} repositories.`,
    );
  }
}

async function enforceRateLimit(request: Request, env: Env): Promise<void> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown-client';
  const { success } = await env.RAG_RATE_LIMITER.limit({ key: `rag:${ip}` });
  if (!success) {
    throw new HttpError(429, 'rag_rate_limited', 'Too many portfolio RAG requests. Please try again shortly.');
  }
}

async function retrieveEvidence(question: string, env: Env): Promise<{
  selected: RankedEvidence[];
  vectorCandidateCount: number;
  d1DocumentCount: number;
  rerankedCount: number;
}> {
  const ai = env.AI as unknown as AiRunner;
  const embeddingRaw = await ai.run(RAG_EMBEDDING_MODEL, {
    queries: [question],
    instruction: RAG_QUERY_INSTRUCTION,
  });
  const queryVector = extractEmbeddingVector(embeddingRaw);

  if (queryVector.length !== 1024) {
    throw new HttpError(502, 'embedding_dimension_mismatch', `Expected 1024 query dimensions, received ${queryVector.length}.`);
  }

  const vectorResult = await env.RAG_INDEX.query(queryVector, {
    topK: VECTOR_CANDIDATES,
    returnValues: false,
    returnMetadata: 'none',
  });

  const vectorMatches = vectorResult.matches ?? [];
  if (vectorMatches.length === 0) {
    throw new HttpError(503, 'rag_no_candidates', 'Vectorize returned no portfolio evidence candidates.');
  }

  const ids = vectorMatches.map((match) => match.id);
  const documentMap = await getRagDocumentsByIds(env.DB, ids);
  const candidates: DenseCandidate[] = vectorMatches.flatMap((match, denseRank) => {
    const document = documentMap.get(match.id);
    if (!document) return [];
    return [{ document, denseScore: match.score, denseRank }];
  });

  if (candidates.length < Math.min(10, vectorMatches.length)) {
    throw new HttpError(503, 'rag_d1_vector_mismatch', 'D1 evidence rows do not match the Vectorize candidate IDs.');
  }

  const rerankerRaw = await ai.run(RAG_RERANKER_MODEL, {
    query: question,
    contexts: candidates.map((candidate) => ({ text: candidate.document.text })),
    top_k: Math.min(RERANK_TOP_K, candidates.length),
  });
  const reranked = parseRerankerResponse(rerankerRaw, candidates);
  const selected = selectEvidence(reranked, question, FINAL_EVIDENCE);

  if (selected.length === 0) {
    throw new HttpError(503, 'rag_no_evidence', 'No grounded evidence remained after reranking.');
  }

  return {
    selected,
    vectorCandidateCount: vectorMatches.length,
    d1DocumentCount: candidates.length,
    rerankedCount: reranked.length,
  };
}

async function handleHealth(env: Env): Promise<Response> {
  const [meta, count] = await Promise.all([getRagCorpusMeta(env.DB), countRagDocuments(env.DB)]);
  if (!meta || count !== EXPECTED_DOCUMENTS || meta.repository_count !== EXPECTED_REPOSITORIES) {
    throw new HttpError(503, 'rag_corpus_not_ready', 'RAG D1 corpus is not fully published.');
  }

  const payload: RagHealthResponse = {
    data: {
      status: 'ok',
      corpusDocuments: count,
      corpusRepositories: meta.repository_count,
      expectedDocuments: EXPECTED_DOCUMENTS,
      vectorIndex: RAG_VECTOR_INDEX_NAME,
    },
  };
  return jsonResponse(env, payload, 200, true);
}

async function handleStreamQuery(request: Request, env: Env): Promise<Response> {
  await enforceRateLimit(request, env);
  await assertCorpusReady(env);
  const question = validateRagQueryInput(await parseJsonBody(request));
  const retrieval = await retrieveEvidence(question, env);
  const citations = retrieval.selected.map(citationFromEvidence);

  const ai = env.AI as unknown as AiRunner;
  const generationRaw = await ai.run(RAG_GENERATION_MODEL, {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildEvidencePrompt(question, retrieval.selected) },
    ],
    temperature: 0.2,
    top_p: 0.9,
    max_completion_tokens: 700,
    stream: true,
  });

  if (!(generationRaw instanceof ReadableStream)) {
    throw new HttpError(502, 'generation_stream_invalid', 'Workers AI did not return a readable generation stream.');
  }

  const upstream = generationRaw as ReadableStream<Uint8Array>;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullAnswer = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const contextEvent = {
        citations,
        retrieval: {
          vectorCandidates: retrieval.vectorCandidateCount,
          d1Documents: retrieval.d1DocumentCount,
          rerankedDocuments: retrieval.rerankedCount,
          selectedEvidence: retrieval.selected.length,
        },
        models: {
          embedding: RAG_EMBEDDING_MODEL,
          reranker: RAG_RERANKER_MODEL,
          generation: RAG_GENERATION_MODEL,
        },
      };
      controller.enqueue(encoder.encode(`event: context\ndata: ${JSON.stringify(contextEvent)}\n\n`));

      const reader = upstream.getReader();
      let buffer = '';
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const delta = extractGenerationDelta(JSON.parse(data));
              if (!delta) continue;
              fullAnswer += delta;
              controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ text: delta })}\n\n`));
            } catch {
              // Ignore non-JSON provider bookkeeping frames.
            }
          }
        }

        const citedEvidenceLabels = extractCitedEvidenceLabels(fullAnswer, citations.length);
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
          citedEvidenceLabels,
          groundingWarning: citedEvidenceLabels.length === 0
            ? 'The generated answer did not emit an inline [E#] citation even though grounded evidence was supplied.'
            : null,
        })}\n\n`));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({
          message: error instanceof Error ? error.message : 'Generation stream failed.',
        })}\n\n`));
        controller.close();
      } finally {
        reader.releaseLock();
      }
    },
  });

  return ragStreamResponse(env, stream);
}

async function handleQuery(request: Request, env: Env): Promise<Response> {
  await enforceRateLimit(request, env);
  await assertCorpusReady(env);
  const question = validateRagQueryInput(await parseJsonBody(request));
  const retrieval = await retrieveEvidence(question, env);

  const ai = env.AI as unknown as AiRunner;
  const generationRaw = await ai.run(RAG_GENERATION_MODEL, {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildEvidencePrompt(question, retrieval.selected) },
    ],
    temperature: 0.2,
    top_p: 0.9,
    max_completion_tokens: 700,
  });
  const answer = extractGenerationText(generationRaw);
  const citations = retrieval.selected.map(citationFromEvidence);
  const citedEvidenceLabels = extractCitedEvidenceLabels(answer, citations.length);

  const payload: RagQueryResponse = {
    data: {
      answer,
      citations,
      retrieval: {
        vectorCandidates: retrieval.vectorCandidateCount,
        d1Documents: retrieval.d1DocumentCount,
        rerankedDocuments: retrieval.rerankedCount,
        selectedEvidence: retrieval.selected.length,
        citedEvidenceLabels,
        groundingWarning: citedEvidenceLabels.length === 0
          ? 'The generated answer did not emit an inline [E#] citation even though grounded evidence was supplied.'
          : null,
      },
      models: {
        embedding: RAG_EMBEDDING_MODEL,
        reranker: RAG_RERANKER_MODEL,
        generation: RAG_GENERATION_MODEL,
      },
    },
  };

  return jsonResponse(env, payload, 200, true);
}

export async function handleRagRequest(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === 'GET' && url.pathname === '/api/rag/health') {
    return handleHealth(env);
  }
  if (request.method === 'POST' && url.pathname === '/api/rag/query') {
    return handleQuery(request, env);
  }
  if (request.method === 'POST' && url.pathname === '/api/rag/query/stream') {
    return handleStreamQuery(request, env);
  }
  throw new HttpError(404, 'not_found', 'RAG API route was not found.');
}
