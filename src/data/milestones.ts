import type {
  ApiItemResponse,
  ApiListResponse,
  MilestoneDetail,
  TimelineMilestone,
} from '../../shared/milestone.ts';
import { API_BASE_URL, responseError } from '../lib/api.ts';

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw await responseError(response);
  return response.json() as Promise<T>;
}

export async function loadMilestones(): Promise<TimelineMilestone[]> {
  const response = await apiRequest<ApiListResponse<TimelineMilestone>>('/api/milestones');
  return response.data;
}

export async function loadMilestone(slug: string): Promise<MilestoneDetail> {
  const response = await apiRequest<ApiItemResponse<MilestoneDetail>>(
    `/api/milestones/${encodeURIComponent(slug)}`,
  );
  return response.data;
}
