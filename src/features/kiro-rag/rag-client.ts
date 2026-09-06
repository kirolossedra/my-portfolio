import type { RagCitation } from '../../../shared/rag.ts';
import { API_BASE_URL, responseError } from '../../lib/api.ts';

export interface RagStreamRetrieval {
  vectorCandidates: number;
  d1Documents: number;
  rerankedDocuments: number;
  selectedEvidence: number;
}

export interface RagStreamModels {
  embedding: string;
  reranker: string;
  generation: string;
}

export interface RagStreamContextPayload {
  citations: RagCitation[];
  retrieval: RagStreamRetrieval;
  models: RagStreamModels;
}

export interface RagStreamDonePayload {
  citedEvidenceLabels: string[];
  groundingWarning: string | null;
}

export interface RagStreamHandlers {
  onContext?: (payload: RagStreamContextPayload) => void;
  onToken?: (text: string) => void;
  onDone?: (payload: RagStreamDonePayload) => void;
}

export interface ParsedSseFrame {
  event: string;
  data: string;
}

export function parseSseFrame(frame: string): ParsedSseFrame | null {
  const lines = frame.split(/\r?\n/);
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event = line.slice(6).trim() || 'message';
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}

export function takeSseFrames(buffer: string): { frames: string[]; rest: string } {
  const frames: string[] = [];
  let rest = buffer;

  for (;;) {
    const match = /\r?\n\r?\n/.exec(rest);
    if (!match) break;
    const separator = match[0] ?? '';
    frames.push(rest.slice(0, match.index));
    rest = rest.slice(match.index + separator.length);
  }

  return { frames, rest };
}

function parsePayload<T>(data: string, event: string): T {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Malformed RAG ${event} event: ${message}`);
  }
}

export async function streamRagQuery(
  question: string,
  handlers: RagStreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/rag/query/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ question }),
    signal,
  });

  if (!response.ok) throw await responseError(response);
  if (!response.body) throw new Error('The portfolio agent returned an empty response stream.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let sawDone = false;

  const dispatch = (rawFrame: string) => {
    const frame = parseSseFrame(rawFrame);
    if (!frame) return;

    if (frame.event === 'context') {
      handlers.onContext?.(parsePayload<RagStreamContextPayload>(frame.data, frame.event));
      return;
    }

    if (frame.event === 'token') {
      const payload = parsePayload<{ text?: unknown }>(frame.data, frame.event);
      if (typeof payload.text !== 'string') throw new Error('RAG token event did not contain text.');
      handlers.onToken?.(payload.text);
      return;
    }

    if (frame.event === 'done') {
      sawDone = true;
      handlers.onDone?.(parsePayload<RagStreamDonePayload>(frame.data, frame.event));
      return;
    }

    if (frame.event === 'error') {
      const payload = parsePayload<{ message?: unknown }>(frame.data, frame.event);
      throw new Error(typeof payload.message === 'string' ? payload.message : 'Portfolio agent generation failed.');
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const split = takeSseFrames(buffer);
      buffer = split.rest;
      split.frames.forEach(dispatch);
    }

    buffer += decoder.decode();
    if (buffer.trim()) dispatch(buffer);
  } finally {
    reader.releaseLock();
  }

  if (!sawDone && !signal.aborted) {
    throw new Error('The portfolio agent stream ended before completion.');
  }
}
