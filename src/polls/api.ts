import type {
  AdminPollDetail,
  AdminPollSummary,
  FinalizePollInput,
  ParticipantResponse,
  ParticipantResponseWriteInput,
  PollDefinition,
  PollStatus,
  PublicPoll,
} from '../../shared/poll.ts';
import { API_BASE_URL, responseError } from '../lib/api.ts';
import { getAdminToken } from '../admin/api.ts';

type ItemResponse<T> = { data: T };
type ListResponse<T> = { data: T[] };

async function request<T>(path: string, init: RequestInit = {}, admin = false): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (admin) {
    const token = getAdminToken();
    if (!token) throw new Error('Admin session is not available.');
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) throw await responseError(response);
  return response.json() as Promise<T>;
}

export async function listPolls(): Promise<AdminPollSummary[]> {
  return (await request<ListResponse<AdminPollSummary>>('/api/admin/polls', {}, true)).data;
}

export async function createPoll(definition: PollDefinition): Promise<AdminPollDetail> {
  return (await request<ItemResponse<AdminPollDetail>>('/api/admin/polls', {
    method: 'POST', body: JSON.stringify(definition),
  }, true)).data;
}

export async function loadAdminPoll(id: number): Promise<AdminPollDetail> {
  return (await request<ItemResponse<AdminPollDetail>>(`/api/admin/polls/${id}`, {}, true)).data;
}

export async function updatePoll(id: number, definition: PollDefinition): Promise<AdminPollDetail> {
  return (await request<ItemResponse<AdminPollDetail>>(`/api/admin/polls/${id}`, {
    method: 'PUT', body: JSON.stringify(definition),
  }, true)).data;
}

export async function rotateAdminPollLink(id: number): Promise<AdminPollDetail> {
  return (await request<ItemResponse<AdminPollDetail>>(`/api/admin/polls/${id}/rotate-link`, {
    method: 'POST',
  }, true)).data;
}

export async function updatePollStatus(id: number, status: PollStatus): Promise<AdminPollDetail> {
  return (await request<ItemResponse<AdminPollDetail>>(`/api/admin/polls/${id}/status`, {
    method: 'PUT', body: JSON.stringify({ status }),
  }, true)).data;
}

export async function removeParticipantResponse(pollId: number, participantId: number): Promise<void> {
  await request(`/api/admin/polls/${pollId}/responses/${participantId}`, { method: 'DELETE' }, true);
}

export async function finalizeAdminPoll(id: number, input: FinalizePollInput): Promise<AdminPollDetail> {
  return (await request<ItemResponse<AdminPollDetail>>(`/api/admin/polls/${id}/finalize`, {
    method: 'PUT', body: JSON.stringify(input),
  }, true)).data;
}

export async function deleteAdminPoll(id: number): Promise<void> {
  await request(`/api/admin/polls/${id}`, { method: 'DELETE' }, true);
}

export async function downloadAdminPollFile(id: number, kind: 'json' | 'xml' | 'pdf', title: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error('Admin session is not available.');
  const path = kind === 'pdf' ? `/api/admin/polls/${id}/pdf` : `/api/admin/polls/${id}/export.${kind}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw await responseError(response);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'availability-poll'}.${kind}`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function loadPublicPoll(token: string): Promise<PublicPoll> {
  return (await request<ItemResponse<PublicPoll>>(`/api/polls/${encodeURIComponent(token)}`)).data;
}

export async function loadParticipantResponse(token: string, participantId: number): Promise<ParticipantResponse | null> {
  return (await request<ItemResponse<ParticipantResponse | null>>(`/api/polls/${encodeURIComponent(token)}/responses/${participantId}`)).data;
}

export async function saveParticipantResponse(token: string, input: ParticipantResponseWriteInput): Promise<ParticipantResponse> {
  return (await request<ItemResponse<ParticipantResponse>>(
    `/api/polls/${encodeURIComponent(token)}/responses/${input.participantId}`,
    { method: 'PUT', body: JSON.stringify(input) },
  )).data;
}
