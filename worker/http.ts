import type { ApiErrorResponse } from '../shared/milestone.ts';
import type { Env } from './env.ts';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new HttpError(415, 'unsupported_media_type', 'Content-Type must be application/json.');
  }

  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must contain valid JSON.');
  }
}

function configuredAdminOrigin(env: Env): string {
  return env.FRONTEND_ORIGIN ?? 'https://kirolos.dev';
}

export function assertAllowedAdminOrigin(request: Request, env: Env): void {
  const requestOrigin = request.headers.get('Origin');
  if (requestOrigin && requestOrigin !== configuredAdminOrigin(env)) {
    throw new HttpError(403, 'origin_not_allowed', 'This origin is not allowed for authenticated requests.');
  }
}

function corsOrigin(env: Env, restricted: boolean): string {
  return restricted ? configuredAdminOrigin(env) : '*';
}

export function jsonResponse(
  env: Env,
  data: unknown,
  status = 200,
  restricted = false,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': restricted ? 'no-store' : 'public, max-age=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': corsOrigin(env, restricted),
      Vary: 'Origin',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function errorResponse(env: Env, error: unknown, restricted = false): Response {
  const known = error instanceof HttpError;
  const payload: ApiErrorResponse = {
    error: {
      code: known ? error.code : 'internal_error',
      message: known ? error.message : 'An unexpected server error occurred.',
    },
  };

  return jsonResponse(env, payload, known ? error.status : 500, restricted);
}

export function optionsResponse(env: Env, restricted: boolean): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin(env, restricted),
      'Access-Control-Allow-Methods': restricted ? 'GET, POST, PUT, DELETE, OPTIONS' : 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}
