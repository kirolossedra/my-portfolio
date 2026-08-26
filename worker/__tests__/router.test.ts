import { describe, expect, it } from 'vitest';
import { issueAdminSession } from '../auth.ts';
import type { Env } from '../env.ts';
import { handleRequest } from '../index.ts';

function mockDatabase(): D1Database {
  return {
    prepare(query: string) {
      return {
        bind() { return this; },
        async first() {
          if (query.includes('SELECT 1')) return { ok: 1 };
          if (query.includes('SELECT id FROM opinions')) return { id: 11 };
          if (query.includes('FROM milestone_images i')) {
            return { id: 7, mime_type: 'image/png', base64_data: 'AQID', byte_size: 3 };
          }
          return null;
        },
        async all() {
          if (query.includes('FROM opinions')) {
            return {
              success: true,
              results: [{
                id: 11,
                display_name: 'Ada',
                relationship: 'Collaborator',
                opinion_text: 'Thoughtful engineering partner.',
                status: 'approved',
                created_at: '2026-08-26T00:00:00.000Z',
                reviewed_at: '2026-08-26T01:00:00.000Z',
              }],
              meta: {},
            };
          }
          return {
            success: true,
            results: query.includes('FROM milestones')
              ? [{
                  id: 1,
                  slug: 'foundation',
                  year: 2026,
                  month: 8,
                  title: 'Foundation',
                  short_description: 'Started the portfolio.',
                  expanded_description: 'Started the portfolio properly.',
                  detail_markdown: null,
                  display_order: 0,
                  is_published: 1,
                  published_at: '2026-08-25T00:00:00.000Z',
                  cover_image_id: null,
                  cover_alt_text: null,
                }]
              : [],
            meta: {},
          };
        },
        async run() {
          return { success: true, meta: { last_row_id: 11 } };
        },
      };
    },
  } as unknown as D1Database;
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    DB: mockDatabase(),
    FRONTEND_ORIGIN: 'https://kirolos.dev',
    GITHUB_CALLBACK_URL: 'https://api.example.test/api/auth/github/callback',
    GITHUB_CLIENT_ID: 'client-id',
    GITHUB_CLIENT_SECRET: 'client-secret',
    ADMIN_GITHUB_USER_ID: '59807200',
    SESSION_SECRET: 'test-session-secret-with-at-least-thirty-two-characters',
    ...overrides,
  };
}

async function adminAuthorization(environment: Env): Promise<string> {
  const session = await issueAdminSession(environment, environment.ADMIN_GITHUB_USER_ID!, 'kirolossedra');
  return `Bearer ${session.token}`;
}

describe('portfolio worker router', () => {
  it('reports database-backed health', async () => {
    const response = await handleRequest(new Request('https://api.example.test/api/health'), env());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'kirolos-portfolio-api' });
  });

  it('serves published milestones in the frontend contract', async () => {
    const response = await handleRequest(new Request('https://api.example.test/api/milestones'), env());
    const body = await response.json() as { data: Array<{ slug: string; date: { year: number; month: number } }> };
    expect(response.status).toBe(200);
    expect(body.data[0]?.slug).toBe('foundation');
    expect(body.data[0]?.date).toEqual({ year: 2026, month: 8 });
  });



  it('serves only approved public opinions', async () => {
    const response = await handleRequest(new Request('https://api.example.test/api/opinions'), env());
    const body = await response.json() as { data: Array<{ id: number; displayName: string; opinion: string }> };
    expect(response.status).toBe(200);
    expect(body.data[0]).toMatchObject({ id: 11, displayName: 'Ada', opinion: 'Thoughtful engineering partner.' });
  });

  it('accepts public opinions as pending submissions from the portfolio origin', async () => {
    const response = await handleRequest(
      new Request('https://api.example.test/api/opinions', {
        method: 'POST',
        headers: {
          Origin: 'https://kirolos.dev',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: 'Ada',
          relationship: 'Collaborator',
          opinion: 'Thoughtful engineering partner.',
          consentToPublish: true,
          website: '',
        }),
      }),
      env(),
    );
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: { id: 11, status: 'pending' } });
  });

  it('rejects public opinion submissions from an untrusted browser origin', async () => {
    const response = await handleRequest(
      new Request('https://api.example.test/api/opinions', {
        method: 'POST',
        headers: {
          Origin: 'https://attacker.example',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: 'Ada',
          opinion: 'Thoughtful engineering partner.',
          consentToPublish: true,
        }),
      }),
      env(),
    );
    expect(response.status).toBe(403);
  });

  it('serves Base64-backed D1 images as binary image responses', async () => {
    const response = await handleRequest(new Request('https://api.example.test/api/images/7'), env());
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2, 3]);
  });

  it('starts GitHub OAuth with a signed state and exact callback', async () => {
    const response = await handleRequest(new Request('https://api.example.test/api/auth/github'), env());
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('Location')!);
    expect(location.origin).toBe('https://github.com');
    expect(location.pathname).toBe('/login/oauth/authorize');
    expect(location.searchParams.get('client_id')).toBe('client-id');
    expect(location.searchParams.get('redirect_uri')).toBe('https://api.example.test/api/auth/github/callback');
    expect(location.searchParams.get('state')?.split('.')).toHaveLength(2);
  });

  it('blocks admin requests without a GitHub-authenticated session', async () => {
    const response = await handleRequest(
      new Request('https://api.example.test/api/admin/milestones', {
        headers: { Origin: 'https://kirolos.dev' },
      }),
      env(),
    );
    expect(response.status).toBe(401);
  });

  it('accepts an admin session issued for the configured GitHub user', async () => {
    const environment = env();
    const response = await handleRequest(
      new Request('https://api.example.test/api/admin/milestones', {
        headers: {
          Authorization: await adminAuthorization(environment),
          Origin: 'https://kirolos.dev',
        },
      }),
      environment,
    );
    expect(response.status).toBe(200);
  });


  it('allows the authenticated administrator to approve an opinion', async () => {
    const environment = env();
    const response = await handleRequest(
      new Request('https://api.example.test/api/admin/opinions/11', {
        method: 'PUT',
        headers: {
          Authorization: await adminAuthorization(environment),
          Origin: 'https://kirolos.dev',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      }),
      environment,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: 11, status: 'approved' } });
  });

  it('rejects browser admin requests from untrusted origins before authentication', async () => {
    const environment = env();
    const response = await handleRequest(
      new Request('https://api.example.test/api/admin/milestones', {
        headers: {
          Authorization: await adminAuthorization(environment),
          Origin: 'https://attacker.example',
        },
      }),
      environment,
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'origin_not_allowed',
        message: 'This origin is not allowed for authenticated requests.',
      },
    });
  });

  it('rejects non-image Base64 payloads before writing to D1', async () => {
    const environment = env();
    const response = await handleRequest(
      new Request('https://api.example.test/api/admin/milestones/1/images', {
        method: 'POST',
        headers: {
          Authorization: await adminAuthorization(environment),
          Origin: 'https://kirolos.dev',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mimeType: 'text/plain', base64Data: 'AQID', altText: 'Not an image' }),
      }),
      environment,
    );
    expect(response.status).toBe(415);
  });
});
