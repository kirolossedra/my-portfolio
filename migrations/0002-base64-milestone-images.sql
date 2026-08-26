PRAGMA foreign_keys = ON;

DROP INDEX IF EXISTS idx_milestone_images_single_cover;
DROP INDEX IF EXISTS idx_milestone_images_milestone;

ALTER TABLE milestone_images RENAME TO milestone_images_r2_legacy;

CREATE TABLE milestone_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milestone_id INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    base64_data TEXT NOT NULL,
    byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 1310720),
    alt_text TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_cover INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
    CHECK (mime_type IN ('image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'))
);

DROP TABLE milestone_images_r2_legacy;

CREATE INDEX idx_milestone_images_milestone
ON milestone_images(milestone_id, display_order);

CREATE UNIQUE INDEX idx_milestone_images_single_cover
ON milestone_images(milestone_id)
WHERE is_cover = 1;
