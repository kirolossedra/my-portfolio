import type {
  ApiItemResponse,
  ApiListResponse,
  AuthExchangeResponse,
  TimelineMilestone,
} from '../shared/milestone.ts';
import type { OpinionSubmissionResponse, PublicOpinion } from '../shared/opinion.ts';
import {
  beginGitHubOAuth,
  completeGitHubOAuth,
  exchangeOneTimeCode,
  requireAdminSession,
  validateAuthExchangeInput,
} from './auth.ts';
import type { Env } from './env.ts';
import {
  assertAllowedAdminOrigin,
  errorResponse,
  HttpError,
  jsonResponse,
  optionsResponse,
  parseJsonBody,
} from './http.ts';
import {
  addMilestoneImage,
  createMilestone,
  deleteMilestone,
  deleteMilestoneImage,
  getMilestoneById,
  getPublishedImageById,
  getPublishedMilestoneBySlug,
  listAllMilestones,
  listPublishedMilestones,
  replaceMilestoneImages,
  replaceMilestoneSections,
  updateMilestone,
} from './milestones-repository.ts';
import {
  deleteOpinion,
  listAdminOpinions,
  listApprovedOpinions,
  moderateOpinion,
  submitOpinion,
} from './opinions-repository.ts';
import {
  validateImagesWriteInput,
  validateImageWriteInput,
  validateMilestoneWriteInput,
  validateOpinionModerationInput,
  validateOpinionSubmissionInput,
  validateSectionsWriteInput,
} from './validation.ts';

function parsePositiveId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'invalid_id', 'Identifier must be a positive integer.');
  }
  return id;
}

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function decodeBase64ToArrayBuffer(base64Data: string): ArrayBuffer {
  const binary = atob(base64Data);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return buffer;
}

async function handleAuth(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method === 'GET' && url.pathname === '/api/auth/github') {
    return beginGitHubOAuth(env);
  }

  if (request.method === 'GET' && url.pathname === '/api/auth/github/callback') {
    return completeGitHubOAuth(request, env);
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/exchange') {
    const input = validateAuthExchangeInput(await parseJsonBody(request));
    const data: AuthExchangeResponse = await exchangeOneTimeCode(env, input);
    return jsonResponse(env, { data }, 200, true);
  }

  if (request.method === 'GET' && url.pathname === '/api/auth/session') {
    const data = await requireAdminSession(request, env);
    return jsonResponse(env, { data }, 200, true);
  }

  throw new HttpError(404, 'not_found', 'Authentication route was not found.');
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

  if (request.method === 'GET' && url.pathname === '/api/opinions') {
    const data = await listApprovedOpinions(env.DB);
    const payload: ApiListResponse<PublicOpinion> = { data };
    return jsonResponse(env, payload);
  }

  if (request.method === 'POST' && url.pathname === '/api/opinions') {
    const input = validateOpinionSubmissionInput(await parseJsonBody(request));
    const id = await submitOpinion(env.DB, input);
    const data: OpinionSubmissionResponse = { id, status: 'pending' };
    return jsonResponse(env, { data }, 202, true);
  }

  const milestoneMatch = url.pathname.match(/^\/api\/milestones\/([^/]+)$/);
  if (request.method === 'GET' && milestoneMatch?.[1]) {
    const slug = decodeURIComponent(milestoneMatch[1]);
    const data = await getPublishedMilestoneBySlug(env.DB, slug, requestOrigin(request));
    const payload: ApiItemResponse<typeof data> = { data };
    return jsonResponse(env, payload);
  }

  const imageMatch = url.pathname.match(/^\/api\/images\/(\d+)$/);
  if (request.method === 'GET' && imageMatch?.[1]) {
    const imageId = parsePositiveId(imageMatch[1]);
    const image = await getPublishedImageById(env.DB, imageId);
    const body = decodeBase64ToArrayBuffer(image.base64_data);

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': image.mime_type,
        'Content-Length': String(image.byte_size),
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  throw new HttpError(404, 'not_found', 'API route was not found.');
}

async function handleAdmin(request: Request, env: Env, url: URL): Promise<Response> {
  await requireAdminSession(request, env);

  if (request.method === 'GET' && url.pathname === '/api/admin/opinions') {
    const data = await listAdminOpinions(env.DB);
    return jsonResponse(env, { data }, 200, true);
  }

  const opinionMatch = url.pathname.match(/^\/api\/admin\/opinions\/(\d+)$/);
  if (opinionMatch?.[1]) {
    const opinionId = parsePositiveId(opinionMatch[1]);

    if (request.method === 'PUT') {
      const input = validateOpinionModerationInput(await parseJsonBody(request));
      await moderateOpinion(env.DB, opinionId, input);
      return jsonResponse(env, { data: { id: opinionId, status: input.status } }, 200, true);
    }

    if (request.method === 'DELETE') {
      await deleteOpinion(env.DB, opinionId);
      return jsonResponse(env, { data: { id: opinionId } }, 200, true);
    }
  }

  if (request.method === 'GET' && url.pathname === '/api/admin/milestones') {
    const data = await listAllMilestones(env.DB, requestOrigin(request));
    return jsonResponse(env, { data }, 200, true);
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/milestones') {
    const input = validateMilestoneWriteInput(await parseJsonBody(request));
    const id = await createMilestone(env.DB, input);
    return jsonResponse(env, { data: { id } }, 201, true);
  }

  const imageItemMatch = url.pathname.match(/^\/api\/admin\/milestones\/(\d+)\/images\/(\d+)$/);
  if (request.method === 'DELETE' && imageItemMatch?.[1] && imageItemMatch[2]) {
    const milestoneId = parsePositiveId(imageItemMatch[1]);
    const imageId = parsePositiveId(imageItemMatch[2]);
    await deleteMilestoneImage(env.DB, milestoneId, imageId);
    return jsonResponse(env, { data: { id: imageId } }, 200, true);
  }

  const sectionsMatch = url.pathname.match(/^\/api\/admin\/milestones\/(\d+)\/sections$/);
  if (request.method === 'PUT' && sectionsMatch?.[1]) {
    const milestoneId = parsePositiveId(sectionsMatch[1]);
    const sections = validateSectionsWriteInput(await parseJsonBody(request));
    await replaceMilestoneSections(env.DB, milestoneId, sections);
    return jsonResponse(env, { data: { id: milestoneId } }, 200, true);
  }

  const imagesMatch = url.pathname.match(/^\/api\/admin\/milestones\/(\d+)\/images$/);
  if (imagesMatch?.[1]) {
    const milestoneId = parsePositiveId(imagesMatch[1]);

    if (request.method === 'PUT') {
      const images = validateImagesWriteInput(await parseJsonBody(request));
      await replaceMilestoneImages(env.DB, milestoneId, images);
      return jsonResponse(env, { data: { id: milestoneId } }, 200, true);
    }

    if (request.method === 'POST') {
      const image = validateImageWriteInput(await parseJsonBody(request));
      const imageId = await addMilestoneImage(env.DB, milestoneId, image);
      return jsonResponse(env, { data: { id: imageId } }, 201, true);
    }
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

  throw new HttpError(404, 'not_found', 'Admin API route was not found.');
}

function isRestrictedBrowserRoute(pathname: string): boolean {
  return pathname.startsWith('/api/admin/')
    || pathname === '/api/auth/exchange'
    || pathname === '/api/auth/session';
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const admin = url.pathname.startsWith('/api/admin/');
  const auth = url.pathname.startsWith('/api/auth/');
  const opinionSubmission = url.pathname === '/api/opinions' && (request.method === 'POST' || request.method === 'OPTIONS');
  const restricted = isRestrictedBrowserRoute(url.pathname) || opinionSubmission;

  try {
    if (restricted) {
      assertAllowedAdminOrigin(request, env);
    }

    if (request.method === 'OPTIONS') {
      return optionsResponse(env, restricted);
    }

    if (auth) return await handleAuth(request, env, url);
    if (admin) return await handleAdmin(request, env, url);
    return await handlePublic(request, env, url);
  } catch (error) {
    if (!(error instanceof HttpError) || error.status >= 500) {
      console.error('Portfolio API request failed', {
        method: request.method,
        path: url.pathname,
        error,
      });
    }
    return errorResponse(env, error, restricted);
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
