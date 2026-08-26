import type {
  ApiItemResponse,
  ApiListResponse,
  MilestoneDetail,
  TimelineMilestone,
} from '../../shared/milestone.ts';

const DEFAULT_API_BASE_URL = 'https://kirolos-portfolio-api.linc-ministry.workers.dev';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const message = response.status === 404
      ? 'The requested portfolio content was not found.'
      : `Portfolio API request failed (${response.status}).`;
    throw new Error(message);
  }

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
