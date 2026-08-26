CREATE TABLE IF NOT EXISTS opinions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
    relationship TEXT CHECK (relationship IS NULL OR length(relationship) <= 120),
    opinion_text TEXT NOT NULL CHECK (length(opinion_text) BETWEEN 12 AND 600),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    consent_to_publish INTEGER NOT NULL CHECK (consent_to_publish = 1),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_opinions_public
ON opinions(status, reviewed_at, created_at);

CREATE INDEX IF NOT EXISTS idx_opinions_admin
ON opinions(status, created_at DESC);
