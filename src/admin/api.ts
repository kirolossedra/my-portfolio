import type { AdminOpinion } from '../../shared/opinion.ts';
import type {
  AdminMilestoneSummary,
  AdminSession,
  ApiItemResponse,
  ApiListResponse,
  AuthExchangeResponse,
  MilestoneDetail,
  MilestoneImageWriteInput,
  MilestoneSectionWriteInput,
  MilestoneWriteInput,
} from '../../shared/milestone.ts';
import { API_BASE_URL, responseError } from '../lib/api.ts';

const SESSION_STORAGE_KEY = 'kirolos-portfolio-admin-session';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function beginGitHubLogin(): void {
  window.location.assign(`${API_BASE_URL}/api/auth/github`);
}

async function request<T>(path: string, init: RequestInit = {}, requireAuth = true): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');

  if (requireAuth) {
    const token = getAdminToken();
    if (!token) throw new Error('Admin session is not available.');
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) throw await responseError(response);
  return response.json() as Promise<T>;
}

export async function exchangeOAuthCode(code: string): Promise<AuthExchangeResponse> {
  const response = await request<ApiItemResponse<AuthExchangeResponse>>(
    '/api/auth/exchange',
    { method: 'POST', body: JSON.stringify({ code }) },
    false,
  );
  return response.data;
}

export async function verifyAdminSession(): Promise<AdminSession> {
  const response = await request<ApiItemResponse<AdminSession>>('/api/auth/session');
  return response.data;
}

export async function listAdminMilestones(): Promise<AdminMilestoneSummary[]> {
  const response = await request<ApiListResponse<AdminMilestoneSummary>>('/api/admin/milestones');
  return response.data;
}

export async function loadAdminMilestone(id: number): Promise<MilestoneDetail> {
  const response = await request<ApiItemResponse<MilestoneDetail>>(`/api/admin/milestones/${id}`);
  return response.data;
}

export async function createAdminMilestone(input: MilestoneWriteInput): Promise<number> {
  const response = await request<ApiItemResponse<{ id: number }>>('/api/admin/milestones', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data.id;
}

export async function updateAdminMilestone(id: number, input: MilestoneWriteInput): Promise<void> {
  await request(`/api/admin/milestones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteAdminMilestone(id: number): Promise<void> {
  await request(`/api/admin/milestones/${id}`, { method: 'DELETE' });
}

export async function replaceAdminSections(id: number, sections: MilestoneSectionWriteInput[]): Promise<void> {
  await request(`/api/admin/milestones/${id}/sections`, {
    method: 'PUT',
    body: JSON.stringify(sections),
  });
}

export async function addAdminImage(id: number, image: MilestoneImageWriteInput): Promise<number> {
  const response = await request<ApiItemResponse<{ id: number }>>(`/api/admin/milestones/${id}/images`, {
    method: 'POST',
    body: JSON.stringify(image),
  });
  return response.data.id;
}

export async function deleteAdminImage(milestoneId: number, imageId: number): Promise<void> {
  await request(`/api/admin/milestones/${milestoneId}/images/${imageId}`, { method: 'DELETE' });
}


export async function listAdminOpinions(): Promise<AdminOpinion[]> {
  const response = await request<ApiListResponse<AdminOpinion>>('/api/admin/opinions');
  return response.data;
}

export async function moderateAdminOpinion(id: number, status: 'approved' | 'rejected'): Promise<void> {
  await request(`/api/admin/opinions/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function deleteAdminOpinion(id: number): Promise<void> {
  await request(`/api/admin/opinions/${id}`, { method: 'DELETE' });
}
