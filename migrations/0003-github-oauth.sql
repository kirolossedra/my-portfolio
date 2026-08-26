CREATE TABLE IF NOT EXISTS auth_exchange_codes (
    code_hash TEXT PRIMARY KEY,
    github_user_id TEXT NOT NULL,
    github_login TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_exchange_codes_expires_at
ON auth_exchange_codes(expires_at);
