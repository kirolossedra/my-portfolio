import type {
  OpinionSubmissionInput,
  OpinionSubmissionResponse,
  PublicOpinion,
} from '../../shared/opinion.ts';
import type { ApiItemResponse, ApiListResponse } from '../../shared/milestone.ts';
import { API_BASE_URL, responseError } from '../lib/api.ts';

export async function loadOpinions(): Promise<PublicOpinion[]> {
  const response = await fetch(`${API_BASE_URL}/api/opinions`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw await responseError(response);
  const payload = await response.json() as ApiListResponse<PublicOpinion>;
  return payload.data;
}

export async function submitOpinion(input: OpinionSubmissionInput): Promise<OpinionSubmissionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/opinions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await responseError(response);
  const payload = await response.json() as ApiItemResponse<OpinionSubmissionResponse>;
  return payload.data;
}
