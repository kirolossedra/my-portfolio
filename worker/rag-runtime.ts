import type { RagCitation, RagHealthResponse, RagQueryResponse } from '../shared/rag.ts';
import type { Env } from './env.ts';
import { HttpError, jsonResponse, parseJsonBody } from './http.ts';
import {
  countRagDocuments,
  getActiveRagRelease,
  getRagCorpusMeta,
  getRagDocumentsByIds,
  type RagDocument,
} from './rag-repository.ts';
import { DEPLOYED_RAG_RELEASE_ID } from './rag-release-build.ts';

export const RAG_EMBEDDING_MODEL = '@cf/qwen/qwen3-embedding-0.6b';
export const RAG_RERANKER_MODEL = 'deterministic-evidence-reranker-v1';
export const RAG_GENERATION_MODEL = '@cf/zai-org/glm-4.7-flash';
export const RAG_QUERY_INSTRUCTION = 'Given a web search query, retrieve relevant passages that answer the query';
export const RAG_VECTOR_INDEX_NAME = 'portfolio-career-rag-cloudflare-v1';

const EXPECTED_REPOSITORIES = 134;
const VECTOR_CANDIDATES = 64;
const DEFAULT_EVIDENCE_TOKEN_BUDGET = 2_600;
const MIN_EVIDENCE_TOKEN_BUDGET = 800;
const MAX_EVIDENCE_TOKEN_BUDGET = 6_000;
const DUPLICATE_TOKEN_SIMILARITY = 0.82;
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
  estimatedTokens: number;
  signals: RerankSignals;
  overlapTokens: Set<string>;
  sourceHashSet: Set<string>;
}

interface RerankSignals {
  denseSimilarity: number;
  exactTermMatch: number;
  repositoryTitleRelevance: number;
  tagRelevance: number;
  sectionContextRelevance: number;
  evidenceQuality: number;
}

interface EvidenceSelectionResult {
  selected: RankedEvidence[];
  duplicateDocumentIds: string[];
  budgetRejectedDocumentIds: string[];
  tokenBudget: number;
  estimatedTokens: number;
}

const RERANK_WEIGHTS = {
  denseSimilarity: 0.55,
  exactTermMatch: 0.16,
  repositoryTitleRelevance: 0.08,
  tagRelevance: 0.10,
  sectionContextRelevance: 0.07,
  evidenceQuality: 0.04,
} as const;

const QUERY_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'did', 'do', 'does', 'for', 'from', 'he', 'his',
  'how', 'i', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'were', 'what',
  'when', 'where', 'which', 'who', 'why', 'with', 'work', 'show', 'evidence',
]);

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
  return /\b(limit|limitations?|weakness(?:es)?|gaps?|missing|risks?|failures?|debt|not\s+(?:prove|demonstrate|show)|what\s+did(?:n't| not))\b/i.test(question);
}

function terms(value: string): string[] {
  return (value.toLowerCase().match(/[a-z0-9][a-z0-9+#.-]{1,}/g) ?? [])
    .map((term) => term.replace(/^[.-]+|[.-]+$/g, ''))
    .map((term) => term.length > 4 && term.endsWith('s') && !term.endsWith('ss') ? term.slice(0, -1) : term)
    .filter((term) => term.length > 1 && !QUERY_STOP_WORDS.has(term));
}

function uniqueTerms(value: string): Set<string> {
  return new Set(terms(value));
}

function termCoverage(queryTerms: Set<string>, value: string): number {
  return termSetCoverage(queryTerms, uniqueTerms(value));
}

function termSetCoverage(queryTerms: Set<string>, target: Set<string>): number {
  if (queryTerms.size === 0) return 0;
  let matches = 0;
  for (const term of queryTerms) if (target.has(term)) matches += 1;
  return matches / queryTerms.size;
}

function sectionText(document: RagDocument): string {
  return document.sourceFragments.flatMap((fragment) => [
    typeof fragment.section_title === 'string' ? fragment.section_title : '',
    Array.isArray(fragment.section_path) ? fragment.section_path.filter((part): part is string => typeof part === 'string').join(' ') : '',
  ]).join(' ');
}

function evidenceQuality(document: RagDocument, limitationIntent: boolean): number {
  let score = 0.45;
  if (document.evidenceLevel === 'implemented_or_concrete') score += 0.30;
  else if (document.evidenceLevel === 'repository_specific') score += 0.20;
  else if (document.evidenceLevel === 'conceptual_exposure') score -= 0.20;
  if (document.retrievalClass === 'direct_evidence') score += 0.15;
  if (document.retrievalClass === 'limitation') score += limitationIntent ? 0.30 : -0.10;
  if (document.evidencePolarity === 'negative') score += limitationIntent ? 0.15 : -0.05;
  score += Math.max(0, Math.min(1, document.specificityScore)) * 0.10;
  return Math.max(0, Math.min(1, score));
}

function estimateEvidenceTokens(document: RagDocument): number {
  const metadataWords = 28 + document.topics.length + document.evidenceAreas.length + document.sourceFragments.length * 4;
  return Math.ceil(document.wordCount * 1.34 + metadataWords);
}

function scoreCandidate(candidate: DenseCandidate, question: string): RankedEvidence {
  const queryTerms = uniqueTerms(question);
  const document = candidate.document;
  const overlapTokens = uniqueTerms(document.text);
  const sourceHashSet = sourceHashes(document);
  const signals: RerankSignals = {
    denseSimilarity: Math.max(0, Math.min(1, candidate.denseScore)),
    exactTermMatch: termSetCoverage(queryTerms, overlapTokens),
    repositoryTitleRelevance: termCoverage(queryTerms, `${document.repositoryName} ${document.repositorySlug ?? ''}`),
    tagRelevance: termCoverage(queryTerms, [document.semanticArea, document.retrievalClass, ...document.topics, ...document.evidenceAreas].join(' ')),
    sectionContextRelevance: termCoverage(queryTerms, sectionText(document)),
    evidenceQuality: evidenceQuality(document, isLimitationIntent(question)),
  };
  const rerankScore = Object.entries(RERANK_WEIGHTS).reduce(
    (total, [name, weight]) => total + signals[name as keyof RerankSignals] * weight,
    0,
  );
  return {
    ...candidate,
    rerankScore,
    rerankRank: 0,
    selectionScore: rerankScore,
    estimatedTokens: estimateEvidenceTokens(document),
    signals,
    overlapTokens,
    sourceHashSet,
  };
}

export function rerankEvidence(candidates: DenseCandidate[], question: string): RankedEvidence[] {
  return candidates
    .map((candidate) => scoreCandidate(candidate, question))
    .sort((a, b) => b.rerankScore - a.rerankScore || b.denseScore - a.denseScore || a.denseRank - b.denseRank)
    .map((candidate, rerankRank) => ({ ...candidate, rerankRank }));
}

function sourceHashes(document: RagDocument): Set<string> {
  return new Set(document.sourceFragments
    .map((fragment) => typeof fragment.text_sha256 === 'string' ? fragment.text_sha256 : '')
    .filter(Boolean));
}

function tokenSimilarity(left: RankedEvidence, right: RankedEvidence): number {
  if ([...left.sourceHashSet].some((hash) => right.sourceHashSet.has(hash))) return 1;
  const a = left.overlapTokens;
  const b = right.overlapTokens;
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

export function selectEvidence(
  reranked: RankedEvidence[],
  _question: string,
  tokenBudget = DEFAULT_EVIDENCE_TOKEN_BUDGET,
): EvidenceSelectionResult {
  const budget = Math.max(MIN_EVIDENCE_TOKEN_BUDGET, Math.min(MAX_EVIDENCE_TOKEN_BUDGET, Math.floor(tokenBudget)));
  const remaining = [...reranked];
  const selected: RankedEvidence[] = [];
  const duplicateDocumentIds: string[] = [];
  const budgetRejectedDocumentIds: string[] = [];
  const perRepository = new Map<number, number>();
  let estimatedTokens = 0;

  while (remaining.length) {
    const viable = remaining.filter((candidate) => {
      const duplicate = selected.some((chosen) => tokenSimilarity(candidate, chosen) >= DUPLICATE_TOKEN_SIMILARITY);
      if (duplicate) duplicateDocumentIds.push(candidate.document.documentId);
      return !duplicate;
    });
    remaining.length = 0;
    remaining.push(...viable);
    if (!remaining.length) break;

    let bestIndex = 0;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;
    for (const [index, candidate] of remaining.entries()) {
      const repositoryCount = perRepository.get(candidate.document.repositoryIndex) ?? 0;
      const diversityPenalty = Math.min(0.07, repositoryCount * 0.035);
      const adjustedScore = candidate.rerankScore - diversityPenalty;
      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = index;
      }
    }

    const [candidate] = remaining.splice(bestIndex, 1);
    if (!candidate) break;
    if (estimatedTokens + candidate.estimatedTokens > budget) {
      budgetRejectedDocumentIds.push(candidate.document.documentId);
      continue;
    }
    const repositoryCount = perRepository.get(candidate.document.repositoryIndex) ?? 0;
    const diversityPenalty = Math.min(0.07, repositoryCount * 0.035);
    selected.push({ ...candidate, selectionScore: candidate.rerankScore - diversityPenalty });
    perRepository.set(candidate.document.repositoryIndex, repositoryCount + 1);
    estimatedTokens += candidate.estimatedTokens;
  }

  return { selected, duplicateDocumentIds, budgetRejectedDocumentIds, tokenBudget: budget, estimatedTokens };
}

function buildEvidencePrompt(question: string, evidence: RankedEvidence[], releaseId: string, conversationContext = ''): string {
  const blocks = evidence.map((item, index) => {
    const d = item.document;
    const label = `E${index + 1}`;
    return [
      `[${label}]`,
      `Release: ${releaseId}`,
      `Document: ${d.documentId}`,
      `Repository: ${d.repositoryName} (repo ${String(d.repositoryIndex).padStart(3, '0')})`,
      `Tags: ${[d.semanticArea, ...d.topics, ...d.evidenceAreas].filter(Boolean).join(', ') || 'none'}`,
      `Section context: ${sectionText(d) || 'not recorded'}`,
      `Evidence class: ${d.retrievalClass}`,
      `Evidence level: ${d.evidenceLevel}`,
      `Evidence polarity: ${d.evidencePolarity}`,
      `Retrieval scores: dense=${item.denseScore.toFixed(6)}, rerank=${item.rerankScore.toFixed(6)}, selected=${item.selectionScore.toFixed(6)}`,
      `Evidence:`,
      d.text,
    ].join('\n');
  }).join('\n\n---\n\n');

  return [
    ...(conversationContext ? ['Conversation context:', conversationContext, ''] : []),
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
- For cross-repository comparisons or technology summaries, verify each named repository independently. Never attach one repository's technology or property to every repository in a list.
- When the requested fact is absent, say so directly and briefly. Do not pad the answer with tangentially related projects, tooling, corpus statistics, or infrastructure.
- Default to a short direct answer and no more than five compact bullets unless the question explicitly asks for detail.
- Prefer concise, evidence-dense answers. Explain uncertainty where it materially changes the claim.
- Never claim that a repository proves something that its evidence explicitly bounds or denies.`;

export const RAG_GENERATION_OPTIONS = {
  temperature: 0.2,
  top_p: 0.9,
  max_completion_tokens: 480,
  chat_template_kwargs: {
    enable_thinking: false,
  },
} as const;

function valueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function extractVisibleContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content.map((entry) => {
    const block = asObject(entry);
    if (!block || (block.type !== 'text' && block.type !== 'output_text')) return '';
    return typeof block.text === 'string' ? block.text : '';
  }).join('');
}

export function describeGenerationResponse(raw: unknown): Record<string, unknown> {
  const object = asObject(raw);
  const choices = Array.isArray(object?.choices) ? object.choices : [];
  const first = asObject(choices[0]);
  const message = asObject(first?.message);
  const content = message?.content;
  const usage = asObject(object?.usage);

  return {
    responseType: valueType(raw),
    topLevelKeys: object ? Object.keys(object).sort() : [],
    choicesLength: choices.length,
    firstChoiceKeys: first ? Object.keys(first).sort() : [],
    messageKeys: message ? Object.keys(message).sort() : [],
    contentType: valueType(content),
    contentBlockTypes: Array.isArray(content)
      ? content.map((entry) => {
        const block = asObject(entry);
        return typeof block?.type === 'string' ? block.type : valueType(entry);
      })
      : [],
    hasReasoningContent: Boolean(message && 'reasoning_content' in message),
    reasoningContentType: message && 'reasoning_content' in message
      ? valueType(message.reasoning_content)
      : 'absent',
    finishReason: typeof first?.finish_reason === 'string' ? first.finish_reason : null,
    usage: usage
      ? Object.fromEntries(
        Object.entries(usage).filter(([key, value]) => key.includes('token') && typeof value === 'number'),
      )
      : null,
  };
}

export function extractGenerationText(raw: unknown): string {
  const object = asObject(raw);
  const response = extractVisibleContent(object?.response);
  if (response.trim()) return response.trim();

  const choices = Array.isArray(object?.choices) ? object.choices : [];
  const first = asObject(choices[0]);
  const message = asObject(first?.message);
  const content = extractVisibleContent(message?.content);
  if (content.trim()) return content.trim();
  const text = extractVisibleContent(first?.text);
  if (text.trim()) return text.trim();

  throw new HttpError(502, 'generation_invalid', 'Workers AI returned an unrecognized generation response.');
}

export function extractGenerationDelta(raw: unknown): string {
  const object = asObject(raw);
  const response = extractVisibleContent(object?.response);
  if (response) return response;
  const choices = Array.isArray(object?.choices) ? object.choices : [];
  const first = asObject(choices[0]);
  const delta = asObject(first?.delta);
  const deltaContent = extractVisibleContent(delta?.content);
  if (deltaContent) return deltaContent;
  const message = asObject(first?.message);
  const messageContent = extractVisibleContent(message?.content);
  if (messageContent) return messageContent;
  const text = extractVisibleContent(first?.text);
  if (text) return text;
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

function citationFromEvidence(item: RankedEvidence, index: number, releaseId: string): RagCitation {
  const d = item.document;
  return {
    label: `E${index + 1}`,
    releaseId,
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
    selectionScore: item.selectionScore,
    retrievalTags: [...new Set([d.semanticArea, ...d.topics, ...d.evidenceAreas])],
    evidenceExcerpt: d.text.length > 420 ? `${d.text.slice(0, 417).trimEnd()}…` : d.text,
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
  const releaseId = await getActiveRagRelease(env.DB);
  const meta = releaseId ? await getRagCorpusMeta(env.DB, releaseId) : null;
  if (!releaseId || !meta || meta.document_count < 1 || meta.repository_count !== EXPECTED_REPOSITORIES || await countRagDocuments(env.DB, releaseId) !== meta.document_count) {
    throw new HttpError(
      503,
      'rag_corpus_not_ready',
      `RAG D1 corpus is not ready across ${EXPECTED_REPOSITORIES} repositories.`,
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

function evidenceTokenBudget(env: Env): number {
  const configured = Number(env.RAG_EVIDENCE_TOKEN_BUDGET);
  return Number.isFinite(configured) ? configured : DEFAULT_EVIDENCE_TOKEN_BUDGET;
}

function conversationContext(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 1_200);
}

async function retrieveEvidence(question: string, env: Env): Promise<{
  selected: RankedEvidence[];
  releaseId: string;
  vectorCandidateCount: number;
  d1DocumentCount: number;
  rerankedCount: number;
  estimatedEvidenceTokens: number;
  evidenceTokenBudget: number;
}> {
  const ai = env.AI as unknown as AiRunner;
  const embeddingRaw = await ai.run(RAG_EMBEDDING_MODEL, {
    queries: [question],
    instruction: RAG_QUERY_INSTRUCTION,
  });
  const queryVector = extractEmbeddingVector(embeddingRaw);
  const releaseId = await getActiveRagRelease(env.DB);
  if (!releaseId) throw new HttpError(503, 'rag_corpus_not_ready', 'No active RAG release is configured.');

  if (queryVector.length !== 1024) {
    throw new HttpError(502, 'embedding_dimension_mismatch', `Expected 1024 query dimensions, received ${queryVector.length}.`);
  }

  const vectorResult = await env.RAG_INDEX.query(queryVector, {
    topK: VECTOR_CANDIDATES,
    returnValues: false,
    returnMetadata: 'none',
    ...(releaseId === 'legacy-v1' ? {} : { filter: { release_id: { $eq: releaseId } } }),
  });

  const vectorMatches = vectorResult.matches ?? [];
  if (vectorMatches.length === 0) {
    throw new HttpError(503, 'rag_no_candidates', 'Vectorize returned no portfolio evidence candidates.');
  }

  const ids = vectorMatches.map((match) => releaseId === 'legacy-v1' ? match.id : match.id.slice(releaseId.length + 1));
  const documentMap = await getRagDocumentsByIds(env.DB, releaseId, ids);
  const candidates: DenseCandidate[] = vectorMatches.flatMap((match, denseRank) => {
    const document = documentMap.get(match.id);
    if (!document) return [];
    return [{ document, denseScore: match.score, denseRank }];
  });

  if (candidates.length < Math.min(10, vectorMatches.length)) {
    throw new HttpError(503, 'rag_d1_vector_mismatch', 'D1 evidence rows do not match the Vectorize candidate IDs.');
  }

  const reranked = rerankEvidence(candidates, question);
  const selection = selectEvidence(reranked, question, evidenceTokenBudget(env));
  const selected = selection.selected;

  if (selected.length === 0) {
    throw new HttpError(503, 'rag_no_evidence', 'No grounded evidence fit the configured evidence budget after reranking.');
  }

  if (env.RAG_RETRIEVAL_DEBUG === 'true') {
    console.info('rag_retrieval_trace', {
      query: question,
      releaseId,
      flow: ['Query', 'Vector candidates', 'Reranked candidates', 'Duplicate/diversity filtering', 'Final evidence supplied to the model'],
      vectorCandidates: candidates.map((candidate) => ({
        documentId: candidate.document.documentId,
        repository: candidate.document.repositoryName,
        denseRank: candidate.denseRank,
        denseScore: candidate.denseScore,
      })),
      rerankedCandidates: reranked.map((candidate) => ({
        documentId: candidate.document.documentId,
        repository: candidate.document.repositoryName,
        rerankRank: candidate.rerankRank,
        rerankScore: candidate.rerankScore,
        signals: candidate.signals,
      })),
      filtering: {
        duplicateDocumentIds: selection.duplicateDocumentIds,
        budgetRejectedDocumentIds: selection.budgetRejectedDocumentIds,
        tokenBudget: selection.tokenBudget,
        estimatedTokens: selection.estimatedTokens,
      },
      finalEvidence: selected.map((candidate) => ({
        documentId: candidate.document.documentId,
        repository: candidate.document.repositoryName,
        selectionScore: candidate.selectionScore,
        estimatedTokens: candidate.estimatedTokens,
      })),
    });
  }

  return {
    selected,
    releaseId,
    vectorCandidateCount: vectorMatches.length,
    d1DocumentCount: candidates.length,
    rerankedCount: reranked.length,
    estimatedEvidenceTokens: selection.estimatedTokens,
    evidenceTokenBudget: selection.tokenBudget,
  };
}

async function handleHealth(env: Env): Promise<Response> {
  const releaseId = await getActiveRagRelease(env.DB);
  if (!releaseId) throw new HttpError(503, 'rag_corpus_not_ready', 'No active RAG release is configured.');
  const [meta, count] = await Promise.all([getRagCorpusMeta(env.DB, releaseId), countRagDocuments(env.DB, releaseId)]);
  if (!meta || count < 1 || count !== meta.document_count || meta.repository_count !== EXPECTED_REPOSITORIES) {
    throw new HttpError(503, 'rag_corpus_not_ready', 'RAG D1 corpus is not fully published.');
  }

  const payload: RagHealthResponse = {
    data: {
      status: 'ok',
      corpusDocuments: count,
      corpusRepositories: meta.repository_count,
      expectedDocuments: meta.document_count,
      vectorIndex: RAG_VECTOR_INDEX_NAME,
      activeRelease: releaseId,
      deployedRelease: DEPLOYED_RAG_RELEASE_ID,
    },
  };
  return jsonResponse(env, payload, 200, true);
}

async function handleStreamQuery(request: Request, env: Env): Promise<Response> {
  await enforceRateLimit(request, env);
  await assertCorpusReady(env);
  const body = await parseJsonBody(request);
  const question = validateRagQueryInput(body);
  const context = conversationContext(asObject(body)?.conversationContext);
  const retrievalQuestion = context ? `${context}\nFollow-up question: ${question}` : question;
  const retrieval = await retrieveEvidence(retrievalQuestion, env);
  const citations = retrieval.selected.map((item, index) => citationFromEvidence(item, index, retrieval.releaseId));

  const ai = env.AI as unknown as AiRunner;
  const generationRaw = await ai.run(RAG_GENERATION_MODEL, {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildEvidencePrompt(question, retrieval.selected, retrieval.releaseId, context) },
    ],
    ...RAG_GENERATION_OPTIONS,
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
          evidenceTokenBudget: retrieval.evidenceTokenBudget,
          estimatedEvidenceTokens: retrieval.estimatedEvidenceTokens,
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
  const body = await parseJsonBody(request);
  const question = validateRagQueryInput(body);
  const context = conversationContext(asObject(body)?.conversationContext);
  const retrievalQuestion = context ? `${context}\nFollow-up question: ${question}` : question;
  const retrieval = await retrieveEvidence(retrievalQuestion, env);

  const ai = env.AI as unknown as AiRunner;
  const generationRaw = await ai.run(RAG_GENERATION_MODEL, {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildEvidencePrompt(question, retrieval.selected, retrieval.releaseId, context) },
    ],
    ...RAG_GENERATION_OPTIONS,
  });
  console.info('rag_generation_response_shape', describeGenerationResponse(generationRaw));
  const answer = extractGenerationText(generationRaw);
  const citations = retrieval.selected.map((item, index) => citationFromEvidence(item, index, retrieval.releaseId));
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
        evidenceTokenBudget: retrieval.evidenceTokenBudget,
        estimatedEvidenceTokens: retrieval.estimatedEvidenceTokens,
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
