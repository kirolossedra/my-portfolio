export interface Env {
  DB: D1Database;
  AI: Ai;
  RAG_INDEX: VectorizeIndex;
  RAG_RATE_LIMITER: RateLimit;
  FRONTEND_ORIGIN?: string;
  RAG_EVIDENCE_TOKEN_BUDGET?: string;
  RAG_RETRIEVAL_DEBUG?: string;
  GITHUB_CALLBACK_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  ADMIN_GITHUB_USER_ID?: string;
  SESSION_SECRET?: string;
}
