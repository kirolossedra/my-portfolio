import { describe, expect, it } from 'vitest';
import { handleRequest } from '../index.ts';
import type { Env } from '../env.ts';

function mockDatabase(): D1Database {
  return {
    prepare(query: string) {
      return {
        bind() {
          return this;
        },
        async first() {
          return query.includes('SELECT 1') ? { ok: 1 } : null;
        },
        async all() {
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
                  cover_r2_key: null,
                  cover_alt_text: null,
                }]
              : [],
            meta: {},
          };
        },
      };
    },
  } as unknown as D1Database;
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    DB: mockDatabase(),
    FRONTEND_ORIGIN: 'https://kirolos.dev',
    ...overrides,
  };
}

describe('portfolio worker router', () => {
  it('reports database-backed health', async () => {
    const response = await handleRequest(
      new Request('https://api.example.test/api/health'),
      env(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      service: 'kirolos-portfolio-api',
    });
  });

  it('serves published milestones in the frontend contract', async () => {
    const response = await handleRequest(
      new Request('https://api.example.test/api/milestones'),
      env(),
    );
    const body = await response.json() as { data: Array<{ slug: string; date: { year: number; month: number } }> };

    expect(response.status).toBe(200);
    expect(body.data[0]?.slug).toBe('foundation');
    expect(body.data[0]?.date).toEqual({ year: 2026, month: 8 });
  });

  it('blocks admin writes without the configured bearer token', async () => {
    const response = await handleRequest(
      new Request('https://api.example.test/api/admin/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
      env({ ADMIN_API_TOKEN: 'secret' }),
    );

    expect(response.status).toBe(401);
  });

  it('rejects browser admin requests from untrusted origins without crashing error handling', async () => {
    const response = await handleRequest(
      new Request('https://api.example.test/api/admin/milestones', {
        headers: {
          Authorization: 'Bearer secret',
          Origin: 'https://attacker.example',
        },
      }),
      env({ ADMIN_API_TOKEN: 'secret' }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: 'origin_not_allowed',
        message: 'This origin is not allowed for admin requests.',
      },
    });
  });


  it('rejects non-image uploads before writing to R2', async () => {
    const response = await handleRequest(
      new Request('https://api.example.test/api/admin/media/milestones/test.txt', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer secret',
          'Content-Type': 'text/plain',
        },
        body: 'not an image',
      }),
      env({
        ADMIN_API_TOKEN: 'secret',
        ASSETS: {} as R2Bucket,
      }),
    );

    expect(response.status).toBe(415);
  });

});
