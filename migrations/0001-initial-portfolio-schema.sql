PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    expanded_description TEXT,
    detail_markdown TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS milestone_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milestone_id INTEGER NOT NULL,
    r2_key TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_cover INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS milestone_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milestone_id INTEGER NOT NULL,
    heading TEXT,
    body_markdown TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_milestones_date
ON milestones(year, month, display_order);

CREATE INDEX IF NOT EXISTS idx_milestones_published
ON milestones(is_published, year, month, display_order);

CREATE INDEX IF NOT EXISTS idx_milestone_images_milestone
ON milestone_images(milestone_id, display_order);

CREATE INDEX IF NOT EXISTS idx_milestone_sections_milestone
ON milestone_sections(milestone_id, display_order);

INSERT OR IGNORE INTO milestones (
    slug,
    year,
    month,
    title,
    short_description,
    expanded_description,
    detail_markdown,
    display_order,
    is_published,
    published_at
) VALUES (
    'kirolos-dev-foundation',
    2026,
    8,
    'kirolos.dev begins',
    'A personal portfolio begins taking shape as a long-form record rather than a conventional résumé page.',
    'The portfolio starts with a time-proportional personal history: milestones appear according to their actual month and year, reveal themselves as the visitor scrolls, and expand into deeper context instead of reducing a life to a flat list of achievements.',
    'The first portfolio system is intentionally data-driven. Timeline entries are stored in Cloudflare D1 and served through a typed Worker API, so the chronology can grow without changing the timeline implementation.\n\nOn desktop, deeper milestone context appears through hover and keyboard focus. On touch devices, the same information opens through an explicit tap so the interaction remains natural on each device class.',
    0,
    1,
    CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_milestone_images_single_cover
ON milestone_images(milestone_id)
WHERE is_cover = 1;
