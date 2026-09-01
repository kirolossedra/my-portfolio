export interface Env {
  DB: D1Database;
  AI: Ai;
  RAG_INDEX: VectorizeIndex;
  RAG_RATE_LIMITER: RateLimit;
  FRONTEND_ORIGIN?: string;
  GITHUB_CALLBACK_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  ADMIN_GITHUB_USER_ID?: string;
  SESSION_SECRET?: string;
}
