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

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function requireAdmin(request: Request, env: Env): void {
  if (!env.ADMIN_API_TOKEN) {
    throw new HttpError(503, 'admin_not_configured', 'Admin API authentication is not configured.');
  }

  const authorization = request.headers.get('Authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token || !safeEqual(token, env.ADMIN_API_TOKEN)) {
    throw new HttpError(401, 'unauthorized', 'A valid admin bearer token is required.');
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
    throw new HttpError(403, 'origin_not_allowed', 'This origin is not allowed for admin requests.');
  }
}

function corsOrigin(env: Env, admin: boolean): string {
  return admin ? configuredAdminOrigin(env) : '*';
}

export function jsonResponse(
  env: Env,
  data: unknown,
  status = 200,
  admin = false,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': admin ? 'no-store' : 'public, max-age=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': corsOrigin(env, admin),
      Vary: 'Origin',
    },
  });
}

export function errorResponse(env: Env, error: unknown, admin = false): Response {
  const known = error instanceof HttpError;
  const payload: ApiErrorResponse = {
    error: {
      code: known ? error.code : 'internal_error',
      message: known ? error.message : 'An unexpected server error occurred.',
    },
  };

  return jsonResponse(env, payload, known ? error.status : 500, admin);
}

export function optionsResponse(env: Env, admin: boolean): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin(env, admin),
      'Access-Control-Allow-Methods': admin ? 'GET, POST, PUT, DELETE, OPTIONS' : 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}
