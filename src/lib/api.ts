import type { ApiErrorResponse } from '../../shared/milestone.ts';

const DEFAULT_API_BASE_URL = 'https://kirolos-portfolio-api.linc-ministry.workers.dev';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');

export async function responseError(response: Response): Promise<Error> {
  try {
    const payload = await response.json() as ApiErrorResponse;
    if (payload.error?.message) return new Error(payload.error.message);
  } catch {
    // Fall through to a status-based error.
  }
  return new Error(`Portfolio API request failed (${response.status}).`);
}
