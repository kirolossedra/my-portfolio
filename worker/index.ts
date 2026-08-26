import type { ApiItemResponse, ApiListResponse, TimelineMilestone } from '../shared/milestone.ts';
import type { Env } from './env.ts';
import {
  assertAllowedAdminOrigin,
  errorResponse,
  HttpError,
  jsonResponse,
  optionsResponse,
  parseJsonBody,
  requireAdmin,
} from './http.ts';
import {
  createMilestone,
  deleteMilestone,
  getMilestoneById,
  getPublishedMilestoneBySlug,
  listAllMilestones,
  listPublishedMilestones,
  replaceMilestoneImages,
  replaceMilestoneSections,
  updateMilestone,
} from './milestones-repository.ts';
import {
  validateImagesWriteInput,
  validateMilestoneWriteInput,
  validateSectionsWriteInput,
} from './validation.ts';

function parsePositiveId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'invalid_id', 'Milestone id must be a positive integer.');
  }
  return id;
}

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

const ALLOWED_IMAGE_CONTENT_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function validateMediaUpload(request: Request): string {
  const contentType = (request.headers.get('Content-Type') ?? '').split(';', 1)[0]?.trim().toLowerCase() ?? '';
  if (!ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new HttpError(415, 'unsupported_media_type', 'Milestone media must be an AVIF, GIF, JPEG, PNG, or WebP image.');
  }

  const contentLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw new HttpError(413, 'media_too_large', 'Milestone images must be 10 MB or smaller.');
  }

  return contentType;
}

async function handlePublic(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    await env.DB.prepare('SELECT 1').first();
    return jsonResponse(env, {
      status: 'ok',
      service: 'kirolos-portfolio-api',
    });
  }

  if (request.method === 'GET' && url.pathname === '/api/milestones') {
    const data = await listPublishedMilestones(env.DB, requestOrigin(request));
    const payload: ApiListResponse<TimelineMilestone> = { data };
    return jsonResponse(env, payload);
  }

  const milestoneMatch = url.pathname.match(/^\/api\/milestones\/([^/]+)$/);
  if (request.method === 'GET' && milestoneMatch?.[1]) {
    const slug = decodeURIComponent(milestoneMatch[1]);
    const data = await getPublishedMilestoneBySlug(env.DB, slug, requestOrigin(request));
    const payload: ApiItemResponse<typeof data> = { data };
    return jsonResponse(env, payload);
  }

  const mediaMatch = url.pathname.match(/^\/api\/media\/(.+)$/);
  if (request.method === 'GET' && mediaMatch?.[1]) {
    if (!env.ASSETS) {
      throw new HttpError(503, 'media_not_configured', 'Portfolio media storage is not configured yet.');
    }

    const key = mediaMatch[1]
      .split('/')
      .map((part) => decodeURIComponent(part))
      .join('/');
    const object = await env.ASSETS.get(key);
    if (!object) {
      throw new HttpError(404, 'media_not_found', 'Media object was not found.');
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(object.body, { headers });
  }

  throw new HttpError(404, 'not_found', 'API route was not found.');
}

async function handleAdmin(request: Request, env: Env, url: URL): Promise<Response> {
  requireAdmin(request, env);

  if (request.method === 'GET' && url.pathname === '/api/admin/milestones') {
    const data = await listAllMilestones(env.DB, requestOrigin(request));
    return jsonResponse(env, { data }, 200, true);
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/milestones') {
    const input = validateMilestoneWriteInput(await parseJsonBody(request));
    const id = await createMilestone(env.DB, input);
    return jsonResponse(env, { data: { id } }, 201, true);
  }

  const sectionsMatch = url.pathname.match(/^\/api\/admin\/milestones\/(\d+)\/sections$/);
  if (request.method === 'PUT' && sectionsMatch?.[1]) {
    const milestoneId = parsePositiveId(sectionsMatch[1]);
    const sections = validateSectionsWriteInput(await parseJsonBody(request));
    await replaceMilestoneSections(env.DB, milestoneId, sections);
    return jsonResponse(env, { data: { id: milestoneId } }, 200, true);
  }

  const imagesMatch = url.pathname.match(/^\/api\/admin\/milestones\/(\d+)\/images$/);
  if (request.method === 'PUT' && imagesMatch?.[1]) {
    const milestoneId = parsePositiveId(imagesMatch[1]);
    const images = validateImagesWriteInput(await parseJsonBody(request));
    await replaceMilestoneImages(env.DB, milestoneId, images);
    return jsonResponse(env, { data: { id: milestoneId } }, 200, true);
  }

  const milestoneMatch = url.pathname.match(/^\/api\/admin\/milestones\/(\d+)$/);
  if (milestoneMatch?.[1]) {
    const milestoneId = parsePositiveId(milestoneMatch[1]);

    if (request.method === 'GET') {
      const data = await getMilestoneById(env.DB, milestoneId, requestOrigin(request));
      return jsonResponse(env, { data }, 200, true);
    }

    if (request.method === 'PUT') {
      const input = validateMilestoneWriteInput(await parseJsonBody(request));
      await updateMilestone(env.DB, milestoneId, input);
      return jsonResponse(env, { data: { id: milestoneId } }, 200, true);
    }

    if (request.method === 'DELETE') {
      await deleteMilestone(env.DB, milestoneId);
      return jsonResponse(env, { data: { id: milestoneId } }, 200, true);
    }
  }

  const mediaMatch = url.pathname.match(/^\/api\/admin\/media\/(.+)$/);
  if (mediaMatch?.[1]) {
    if (!env.ASSETS) {
      throw new HttpError(503, 'media_not_configured', 'Portfolio media storage is not configured yet.');
    }

    const key = mediaMatch[1]
      .split('/')
      .map((part) => decodeURIComponent(part))
      .join('/');

    if (request.method === 'PUT') {
      if (!request.body) {
        throw new HttpError(400, 'empty_media_body', 'Media upload requires a request body.');
      }
      const contentType = validateMediaUpload(request);
      await env.ASSETS.put(key, request.body, {
        httpMetadata: { contentType },
      });
      return jsonResponse(env, { data: { key } }, 201, true);
    }

    if (request.method === 'DELETE') {
      await env.ASSETS.delete(key);
      return jsonResponse(env, { data: { key } }, 200, true);
    }
  }

  throw new HttpError(404, 'not_found', 'Admin API route was not found.');
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const admin = url.pathname.startsWith('/api/admin/');

  try {
    if (admin) {
      assertAllowedAdminOrigin(request, env);
    }

    if (request.method === 'OPTIONS') {
      return optionsResponse(env, admin);
    }

    return admin
      ? await handleAdmin(request, env, url)
      : await handlePublic(request, env, url);
  } catch (error) {
    if (!(error instanceof HttpError) || error.status >= 500) {
      console.error('Portfolio API request failed', {
        method: request.method,
        path: url.pathname,
        error,
      });
    }
    return errorResponse(env, error, admin);
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
