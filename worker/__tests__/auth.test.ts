import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  beginGitHubOAuth,
  completeGitHubOAuth,
  issueAdminSession,
  validateAuthExchangeInput,
  verifyAdminSession,
} from '../auth.ts';
import type { Env } from '../env.ts';

function inertDatabase(): D1Database {
  return {
    prepare() {
      return {
        bind() { return this; },
      };
    },
    async batch() {
      return [];
    },
  } as unknown as D1Database;
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    DB: inertDatabase(),
    FRONTEND_ORIGIN: 'https://kirolos.dev',
    GITHUB_CALLBACK_URL: 'https://api.example.test/api/auth/github/callback',
    GITHUB_CLIENT_ID: 'client-id',
    GITHUB_CLIENT_SECRET: 'client-secret',
    ADMIN_GITHUB_USER_ID: '59807200',
    SESSION_SECRET: 'test-session-secret-with-at-least-thirty-two-characters',
    ...overrides,
  };
}

async function oauthState(environment: Env): Promise<string> {
  const response = await beginGitHubOAuth(environment);
  return new URL(response.headers.get('Location')!).searchParams.get('state')!;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('GitHub-backed admin authentication', () => {
  it('issues and verifies a session only for the configured immutable GitHub user ID', async () => {
    const environment = env();
    const issued = await issueAdminSession(environment, '59807200', 'kirolossedra');
    const verified = await verifyAdminSession(issued.token, environment);
    expect(verified.githubUserId).toBe('59807200');
    expect(verified.githubLogin).toBe('kirolossedra');
  });

  it('rejects a validly signed token when the configured admin GitHub ID differs', async () => {
    const issued = await issueAdminSession(env(), '59807200', 'kirolossedra');
    await expect(verifyAdminSession(issued.token, env({ ADMIN_GITHUB_USER_ID: '999' })))
      .rejects.toMatchObject({ status: 401, code: 'invalid_session' });
  });

  it('rejects tampered session tokens', async () => {
    const environment = env();
    const issued = await issueAdminSession(environment, '59807200', 'kirolossedra');
    await expect(verifyAdminSession(`${issued.token}x`, environment))
      .rejects.toMatchObject({ status: 401, code: 'invalid_session' });
  });

  it('rejects expired sessions', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T00:00:00Z'));
    const environment = env();
    const issued = await issueAdminSession(environment, '59807200', 'kirolossedra');
    vi.setSystemTime(new Date('2026-08-26T02:00:00Z'));
    await expect(verifyAdminSession(issued.token, environment))
      .rejects.toMatchObject({ status: 401, code: 'invalid_session' });
  });

  it('accepts the configured GitHub identity and returns a one-time frontend handoff', async () => {
    const environment = env();
    const state = await oauthState(environment);
    const githubFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'github-token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 59807200, login: 'kirolossedra' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    vi.stubGlobal('fetch', githubFetch);

    const response = await completeGitHubOAuth(
      new Request(`https://api.example.test/api/auth/github/callback?code=github-code&state=${encodeURIComponent(state)}`),
      environment,
    );

    expect(response.status).toBe(302);
    const redirect = new URL(response.headers.get('Location')!);
    expect(redirect.origin).toBe('https://kirolos.dev');
    expect(redirect.pathname).toBe('/admin/auth/callback');
    expect(redirect.searchParams.get('code')?.length).toBeGreaterThan(20);
    expect(githubFetch).toHaveBeenCalledTimes(2);
  });

  it('rejects every GitHub account except the configured numeric user ID', async () => {
    const environment = env();
    const state = await oauthState(environment);
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'github-token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 999, login: 'someone-else' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })));

    const response = await completeGitHubOAuth(
      new Request(`https://api.example.test/api/auth/github/callback?code=github-code&state=${encodeURIComponent(state)}`),
      environment,
    );
    const redirect = new URL(response.headers.get('Location')!);
    expect(redirect.searchParams.get('error')).toBe('not_authorized');
  });

  it('validates one-time OAuth exchange payloads', () => {
    expect(validateAuthExchangeInput({ code: 'a'.repeat(32) })).toEqual({ code: 'a'.repeat(32) });
    expect(() => validateAuthExchangeInput({ code: 'short' })).toThrow();
  });
});
