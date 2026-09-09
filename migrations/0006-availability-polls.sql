PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS availability_polls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_token TEXT NOT NULL UNIQUE CHECK (length(public_token) = 32 AND public_token NOT GLOB '*[^0-9a-f]*'),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 4000),
  timezone TEXT NOT NULL DEFAULT 'America/Toronto' CHECK (timezone = 'America/Toronto'),
  slot_width_minutes INTEGER NOT NULL CHECK (slot_width_minutes BETWEEN 15 AND 480 AND slot_width_minutes % 5 = 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'finalized')),
  finalized_date TEXT,
  finalized_start_time TEXT,
  finalized_end_time TEXT,
  finalized_location TEXT,
  finalized_meeting_link TEXT,
  finalized_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS availability_poll_dates (
  poll_id INTEGER NOT NULL REFERENCES availability_polls(id) ON DELETE CASCADE,
  poll_date TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (poll_id, poll_date)
);

CREATE TABLE IF NOT EXISTS availability_poll_time_ranges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL REFERENCES availability_polls(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  UNIQUE (poll_id, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS availability_poll_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL REFERENCES availability_polls(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  UNIQUE (poll_id, normalized_name)
);

CREATE TABLE IF NOT EXISTS availability_poll_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  poll_id INTEGER NOT NULL REFERENCES availability_polls(id) ON DELETE CASCADE,
  expected_participant_id INTEGER NOT NULL REFERENCES availability_poll_participants(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (poll_id, expected_participant_id)
);

CREATE TABLE IF NOT EXISTS availability_poll_selections (
  response_id INTEGER NOT NULL REFERENCES availability_poll_responses(id) ON DELETE CASCADE,
  poll_date TEXT NOT NULL,
  slot_start TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('online', 'in_person', 'either')),
  PRIMARY KEY (response_id, poll_date, slot_start)
);

CREATE INDEX IF NOT EXISTS idx_availability_polls_status ON availability_polls(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_availability_poll_participants_poll ON availability_poll_participants(poll_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_availability_poll_responses_poll ON availability_poll_responses(poll_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_availability_poll_selections_response ON availability_poll_selections(response_id);
