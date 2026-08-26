import type {
  AdminSession,
  AuthExchangeInput,
  AuthExchangeResponse,
} from '../shared/milestone.ts';
import type { Env } from './env.ts';
import { HttpError } from './http.ts';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const STATE_MAX_AGE_SECONDS = 10 * 60;
const EXCHANGE_CODE_TTL_SECONDS = 2 * 60;
const SESSION_TTL_SECONDS = 60 * 60;
const SESSION_AUDIENCE = 'kirolos-portfolio-admin';

interface SignedStatePayload {
  nonce: string;
  iat: number;
}

interface SessionPayload {
  sub: string;
  login: string;
  iat: number;
  exp: number;
  aud: typeof SESSION_AUDIENCE;
}

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id?: number;
  login?: string;
}

interface ExchangeCodeRow {
  github_user_id: string;
  github_login: string;
}

function requiredSecret(value: string | undefined, name: string): string {
  if (!value) {
    throw new HttpError(503, 'auth_not_configured', `${name} is not configured.`);
  }
  return value;
}

function sessionSecret(env: Env): string {
  const secret = requiredSecret(env.SESSION_SECRET, 'SESSION_SECRET');
  if (secret.length < 32) {
    throw new HttpError(503, 'auth_not_configured', 'SESSION_SECRET must be at least 32 characters.');
  }
  return secret;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    throw new HttpError(401, 'invalid_session', 'Authentication token is malformed.');
  }
}

function encodeJson(value: unknown): string {
  return bytesToBase64Url(textEncoder.encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string): T {
  try {
    return JSON.parse(textDecoder.decode(base64UrlToBytes(value))) as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'invalid_session', 'Authentication token payload is malformed.');
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(textEncoder.encode(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signValue(value: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), toArrayBuffer(textEncoder.encode(value)));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySignedValue(value: string, signature: string, secret: string): Promise<boolean> {
  return crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    toArrayBuffer(base64UrlToBytes(signature)),
    toArrayBuffer(textEncoder.encode(value)),
  );
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(textEncoder.encode(value)));
  return bytesToBase64Url(new Uint8Array(digest));
}

function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function frontendOrigin(env: Env): string {
  return (env.FRONTEND_ORIGIN ?? 'https://kirolos.dev').replace(/\/$/, '');
}

function callbackUrl(env: Env): string {
  return env.GITHUB_CALLBACK_URL
    ?? 'https://kirolos-portfolio-api.linc-ministry.workers.dev/api/auth/github/callback';
}

function authCallbackRedirect(env: Env, params: Record<string, string>): Response {
  const url = new URL('/admin/auth/callback', frontendOrigin(env));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return Response.redirect(url.toString(), 302);
}

async function createState(env: Env): Promise<string> {
  const secret = sessionSecret(env);
  const encoded = encodeJson({ nonce: randomToken(18), iat: nowSeconds() } satisfies SignedStatePayload);
  return `${encoded}.${await signValue(encoded, secret)}`;
}

async function verifyState(env: Env, state: string): Promise<void> {
  const secret = sessionSecret(env);
  const [payloadPart, signaturePart, ...rest] = state.split('.');
  if (!payloadPart || !signaturePart || rest.length) {
    throw new HttpError(400, 'invalid_oauth_state', 'OAuth state is malformed.');
  }
  if (!(await verifySignedValue(payloadPart, signaturePart, secret))) {
    throw new HttpError(400, 'invalid_oauth_state', 'OAuth state signature is invalid.');
  }

  const payload = decodeJson<SignedStatePayload>(payloadPart);
  if (!payload.nonce || !Number.isInteger(payload.iat)) {
    throw new HttpError(400, 'invalid_oauth_state', 'OAuth state payload is invalid.');
  }
  const age = nowSeconds() - payload.iat;
  if (age < 0 || age > STATE_MAX_AGE_SECONDS) {
    throw new HttpError(400, 'expired_oauth_state', 'OAuth state has expired.');
  }
}

export async function beginGitHubOAuth(env: Env): Promise<Response> {
  const clientId = requiredSecret(env.GITHUB_CLIENT_ID, 'GITHUB_CLIENT_ID');
  sessionSecret(env);

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', callbackUrl(env));
  authorize.searchParams.set('scope', 'read:user');
  authorize.searchParams.set('state', await createState(env));
  return Response.redirect(authorize.toString(), 302);
}

async function exchangeGitHubCode(env: Env, code: string): Promise<string> {
  const clientId = requiredSecret(env.GITHUB_CLIENT_ID, 'GITHUB_CLIENT_ID');
  const clientSecret = requiredSecret(env.GITHUB_CLIENT_SECRET, 'GITHUB_CLIENT_SECRET');

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'kirolos-portfolio-api',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl(env),
    }),
  });

  const payload = await response.json() as GitHubTokenResponse;
  if (!response.ok || !payload.access_token || payload.error) {
    throw new HttpError(502, 'github_token_exchange_failed', 'GitHub authentication could not be completed.');
  }
  return payload.access_token;
}

async function fetchGitHubUser(accessToken: string): Promise<{ id: string; login: string }> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'kirolos-portfolio-api',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  const payload = await response.json() as GitHubUserResponse;
  if (!response.ok || typeof payload.id !== 'number' || !payload.login) {
    throw new HttpError(502, 'github_identity_failed', 'GitHub identity could not be verified.');
  }
  return { id: String(payload.id), login: payload.login };
}

async function createOneTimeExchangeCode(
  db: D1Database,
  githubUserId: string,
  githubLogin: string,
): Promise<string> {
  const code = randomToken(32);
  const codeHash = await sha256(code);
  const expiresAt = nowSeconds() + EXCHANGE_CODE_TTL_SECONDS;

  await db.batch([
    db.prepare('DELETE FROM auth_exchange_codes WHERE expires_at <= ?1').bind(nowSeconds()),
    db.prepare(`
      INSERT INTO auth_exchange_codes (
        code_hash, github_user_id, github_login, expires_at
      ) VALUES (?1, ?2, ?3, ?4)`)
      .bind(codeHash, githubUserId, githubLogin, expiresAt),
  ]);

  return code;
}

export async function completeGitHubOAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  if (error) {
    return authCallbackRedirect(env, { error: 'github_denied' });
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    throw new HttpError(400, 'invalid_oauth_callback', 'GitHub callback is missing required parameters.');
  }

  await verifyState(env, state);
  const accessToken = await exchangeGitHubCode(env, code);
  const githubUser = await fetchGitHubUser(accessToken);
  const allowedId = requiredSecret(env.ADMIN_GITHUB_USER_ID, 'ADMIN_GITHUB_USER_ID');

  if (githubUser.id !== allowedId) {
    return authCallbackRedirect(env, { error: 'not_authorized' });
  }

  const exchangeCode = await createOneTimeExchangeCode(env.DB, githubUser.id, githubUser.login);
  return authCallbackRedirect(env, { code: exchangeCode });
}

export async function issueAdminSession(env: Env, userId: string, login: string): Promise<AuthExchangeResponse> {
  const secret = sessionSecret(env);
  const iat = nowSeconds();
  const exp = iat + SESSION_TTL_SECONDS;
  const payload: SessionPayload = {
    sub: userId,
    login,
    iat,
    exp,
    aud: SESSION_AUDIENCE,
  };
  const encoded = encodeJson(payload);
  const token = `${encoded}.${await signValue(encoded, secret)}`;
  return {
    token,
    session: {
      githubUserId: userId,
      githubLogin: login,
      expiresAt: new Date(exp * 1000).toISOString(),
    },
  };
}

export function validateAuthExchangeInput(value: unknown): AuthExchangeInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'invalid_auth_exchange', 'Authentication exchange payload is invalid.');
  }
  const code = (value as { code?: unknown }).code;
  if (typeof code !== 'string' || code.length < 20 || code.length > 256) {
    throw new HttpError(400, 'invalid_auth_exchange', 'Authentication exchange code is invalid.');
  }
  return { code };
}

export async function exchangeOneTimeCode(
  env: Env,
  input: AuthExchangeInput,
): Promise<AuthExchangeResponse> {
  const codeHash = await sha256(input.code);
  const now = nowSeconds();
  const [lookupResult] = await env.DB.batch([
    env.DB.prepare(`
      SELECT github_user_id, github_login
      FROM auth_exchange_codes
      WHERE code_hash = ?1 AND expires_at > ?2
      LIMIT 1`)
      .bind(codeHash, now),
    env.DB.prepare(`
      DELETE FROM auth_exchange_codes
      WHERE code_hash = ?1 AND expires_at > ?2`)
      .bind(codeHash, now),
  ]);

  const row = lookupResult?.results?.[0] as ExchangeCodeRow | undefined;
  if (!row) {
    throw new HttpError(401, 'invalid_exchange_code', 'Authentication exchange code is invalid or expired.');
  }

  return issueAdminSession(env, row.github_user_id, row.github_login);
}

export async function verifyAdminSession(token: string, env: Env): Promise<AdminSession> {
  const secret = sessionSecret(env);
  const [payloadPart, signaturePart, ...rest] = token.split('.');
  if (!payloadPart || !signaturePart || rest.length) {
    throw new HttpError(401, 'invalid_session', 'Admin session is malformed.');
  }
  if (!(await verifySignedValue(payloadPart, signaturePart, secret))) {
    throw new HttpError(401, 'invalid_session', 'Admin session signature is invalid.');
  }

  const payload = decodeJson<SessionPayload>(payloadPart);
  const allowedId = requiredSecret(env.ADMIN_GITHUB_USER_ID, 'ADMIN_GITHUB_USER_ID');
  if (
    payload.aud !== SESSION_AUDIENCE
    || payload.sub !== allowedId
    || !payload.login
    || !Number.isInteger(payload.iat)
    || !Number.isInteger(payload.exp)
    || payload.exp <= nowSeconds()
  ) {
    throw new HttpError(401, 'invalid_session', 'Admin session is invalid or expired.');
  }

  return {
    githubUserId: payload.sub,
    githubLogin: payload.login,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

export async function requireAdminSession(request: Request, env: Env): Promise<AdminSession> {
  const authorization = request.headers.get('Authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    throw new HttpError(401, 'unauthorized', 'A valid GitHub-authenticated admin session is required.');
  }
  return verifyAdminSession(token, env);
}
