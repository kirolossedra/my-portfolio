import type {
  FinalizePollInput,
  ParticipantResponseWriteInput,
  PollStatus,
} from '../shared/poll.ts';
import {
  POLL_STATUSES,
  PollDefinitionError,
  pollDefinitionToJson,
  pollDefinitionToXml,
} from '../shared/poll.ts';
import type { Env } from './env.ts';
import { HttpError, jsonResponse, parseJsonBody } from './http.ts';
import { renderPollPdf } from './poll-pdf.ts';
import {
  createPoll,
  deleteParticipantResponse,
  deletePoll,
  finalizePoll,
  getAdminPoll,
  getPublicParticipantResponse,
  getPublicPoll,
  listAdminPolls,
  savePublicParticipantResponse,
  rotatePollPublicToken,
  setPollStatus,
  updatePollDefinition,
} from './polls-repository.ts';

function positiveId(value: string | undefined, name = 'identifier'): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'invalid_id', `${name} must be a positive integer.`);
  return id;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'invalid_payload', 'Request body must be an object.');
  }
  return value as Record<string, unknown>;
}

function textOrNull(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') throw new HttpError(400, 'invalid_payload', `${field} must be a string or null.`);
  return value;
}

function parseResponseWrite(value: unknown): ParticipantResponseWriteInput {
  const input = record(value);
  const participantId = Number(input.participantId);
  if (!Number.isInteger(participantId) || participantId <= 0) throw new HttpError(400, 'invalid_participant', 'participantId is invalid.');
  const revision = input.revision === null ? null : Number(input.revision);
  if (revision !== null && (!Number.isInteger(revision) || revision < 1)) throw new HttpError(400, 'invalid_revision', 'revision must be null or a positive integer.');
  if (!Array.isArray(input.selections)) throw new HttpError(400, 'invalid_selections', 'selections must be an array.');
  return { participantId, revision, selections: input.selections as ParticipantResponseWriteInput['selections'] };
}

function parseFinalize(value: unknown): FinalizePollInput {
  const input = record(value);
  if (typeof input.date !== 'string' || typeof input.startTime !== 'string') {
    throw new HttpError(400, 'invalid_finalization', 'date and startTime are required.');
  }
  return {
    date: input.date,
    startTime: input.startTime,
    location: textOrNull(input.location, 'location'),
    meetingLink: textOrNull(input.meetingLink, 'meetingLink'),
    note: textOrNull(input.note, 'note'),
  };
}

async function enforceParticipantWriteRateLimit(request: Request, env: Env): Promise<void> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown-client';
  const { success } = await env.RAG_RATE_LIMITER.limit({ key: `poll:${ip}` });
  if (!success) throw new HttpError(429, 'poll_rate_limited', 'Too many availability updates. Please try again shortly.');
}

function safeFileStem(title: string): string {
  const stem = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return stem || 'availability-poll';
}

function privateHeaders(env: Env, contentType: string, fileName?: string): Headers {
  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': env.FRONTEND_ORIGIN ?? 'https://kirolos.dev',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff',
  });
  if (fileName) headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
  return headers;
}

export async function handlePublicPollRequest(request: Request, env: Env, url: URL): Promise<Response> {
  try {
  const responseMatch = url.pathname.match(/^\/api\/polls\/([a-f0-9]{32})\/responses\/(\d+)$/);
  if (responseMatch?.[1] && responseMatch[2]) {
    const token = responseMatch[1];
    const participantId = positiveId(responseMatch[2], 'Participant identifier');
    if (request.method === 'GET') {
      const data = await getPublicParticipantResponse(env.DB, token, participantId);
      return jsonResponse(env, { data }, 200, true);
    }
    if (request.method === 'PUT') {
      await enforceParticipantWriteRateLimit(request, env);
      const input = parseResponseWrite(await parseJsonBody(request));
      if (input.participantId !== participantId) throw new HttpError(400, 'participant_mismatch', 'Participant identifier does not match the route.');
      const data = await savePublicParticipantResponse(env.DB, token, input);
      return jsonResponse(env, { data }, 200, true);
    }
  }

  const pollMatch = url.pathname.match(/^\/api\/polls\/([a-f0-9]{32})$/);
  if (request.method === 'GET' && pollMatch?.[1]) {
    const data = await getPublicPoll(env.DB, pollMatch[1]);
    return jsonResponse(env, { data }, 200, true);
  }

  throw new HttpError(404, 'not_found', 'Poll route was not found.');
  } catch (error) {
    if (error instanceof PollDefinitionError) throw new HttpError(400, 'invalid_poll_definition', error.message);
    throw error;
  }
}

export async function handleAdminPollRequest(request: Request, env: Env, url: URL): Promise<Response> {
  try {
  if (url.pathname === '/api/admin/polls') {
    if (request.method === 'GET') {
      const data = await listAdminPolls(env.DB);
      return jsonResponse(env, { data }, 200, true);
    }
    if (request.method === 'POST') {
      const data = await createPoll(env.DB, await parseJsonBody(request));
      return jsonResponse(env, { data }, 201, true);
    }
  }

  const exportMatch = url.pathname.match(/^\/api\/admin\/polls\/(\d+)\/export\.(json|xml)$/);
  if (request.method === 'GET' && exportMatch?.[1] && exportMatch[2]) {
    const poll = await getAdminPoll(env.DB, positiveId(exportMatch[1], 'Poll identifier'));
    const stem = safeFileStem(poll.title);
    if (exportMatch[2] === 'xml') {
      return new Response(pollDefinitionToXml(poll.definition), {
        headers: privateHeaders(env, 'application/xml; charset=utf-8', `${stem}.xml`),
      });
    }
    return new Response(pollDefinitionToJson(poll.definition), {
      headers: privateHeaders(env, 'application/json; charset=utf-8', `${stem}.json`),
    });
  }

  const pdfMatch = url.pathname.match(/^\/api\/admin\/polls\/(\d+)\/pdf$/);
  if (request.method === 'GET' && pdfMatch?.[1]) {
    const poll = await getAdminPoll(env.DB, positiveId(pdfMatch[1], 'Poll identifier'));
    return new Response(renderPollPdf(poll), {
      headers: privateHeaders(env, 'application/pdf', `${safeFileStem(poll.title)}.pdf`),
    });
  }

  const responseMatch = url.pathname.match(/^\/api\/admin\/polls\/(\d+)\/responses\/(\d+)$/);
  if (request.method === 'DELETE' && responseMatch?.[1] && responseMatch[2]) {
    const pollId = positiveId(responseMatch[1], 'Poll identifier');
    const participantId = positiveId(responseMatch[2], 'Participant identifier');
    await deleteParticipantResponse(env.DB, pollId, participantId);
    return jsonResponse(env, { data: { pollId, participantId } }, 200, true);
  }

  const rotateLinkMatch = url.pathname.match(/^\/api\/admin\/polls\/(\d+)\/rotate-link$/);
  if (request.method === 'POST' && rotateLinkMatch?.[1]) {
    const data = await rotatePollPublicToken(env.DB, positiveId(rotateLinkMatch[1], 'Poll identifier'));
    return jsonResponse(env, { data }, 200, true);
  }

  const statusMatch = url.pathname.match(/^\/api\/admin\/polls\/(\d+)\/status$/);
  if (request.method === 'PUT' && statusMatch?.[1]) {
    const input = record(await parseJsonBody(request));
    if (typeof input.status !== 'string' || !POLL_STATUSES.includes(input.status as PollStatus)) {
      throw new HttpError(400, 'invalid_status', 'Poll status is invalid.');
    }
    const data = await setPollStatus(env.DB, positiveId(statusMatch[1], 'Poll identifier'), input.status as PollStatus);
    return jsonResponse(env, { data }, 200, true);
  }

  const finalizeMatch = url.pathname.match(/^\/api\/admin\/polls\/(\d+)\/finalize$/);
  if (request.method === 'PUT' && finalizeMatch?.[1]) {
    const data = await finalizePoll(
      env.DB,
      positiveId(finalizeMatch[1], 'Poll identifier'),
      parseFinalize(await parseJsonBody(request)),
    );
    return jsonResponse(env, { data }, 200, true);
  }

  const pollMatch = url.pathname.match(/^\/api\/admin\/polls\/(\d+)$/);
  if (pollMatch?.[1]) {
    const pollId = positiveId(pollMatch[1], 'Poll identifier');
    if (request.method === 'GET') {
      const data = await getAdminPoll(env.DB, pollId);
      return jsonResponse(env, { data }, 200, true);
    }
    if (request.method === 'PUT') {
      const data = await updatePollDefinition(env.DB, pollId, await parseJsonBody(request));
      return jsonResponse(env, { data }, 200, true);
    }
    if (request.method === 'DELETE') {
      await deletePoll(env.DB, pollId);
      return jsonResponse(env, { data: { id: pollId } }, 200, true);
    }
  }

  throw new HttpError(404, 'not_found', 'Admin poll route was not found.');
  } catch (error) {
    if (error instanceof PollDefinitionError) throw new HttpError(400, 'invalid_poll_definition', error.message);
    if (error instanceof SyntaxError) throw new HttpError(400, 'invalid_poll_definition', 'Structured poll definition is malformed.');
    throw error;
  }
}
