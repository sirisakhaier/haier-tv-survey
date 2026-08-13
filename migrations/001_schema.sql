-- Haier TV Survey — D1 Database Schema
-- Run with: npx wrangler d1 execute haier_survey_db --file=./migrations/001_schema.sql

CREATE TABLE IF NOT EXISTS stores (
  store_id   TEXT PRIMARY KEY,
  hang       TEXT NOT NULL,
  phumipak   TEXT NOT NULL,
  changwat   TEXT,
  sakha      TEXT,
  store_name TEXT,
  status     TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS chain_statuses (
  hang   TEXT PRIMARY KEY,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS models (
  model_code   TEXT PRIMARY KEY,
  category     TEXT,
  sub_category TEXT,
  size         TEXT
);

CREATE TABLE IF NOT EXISTS location_types (
  code     TEXT PRIMARY KEY,
  label_th TEXT NOT NULL,
  label_en TEXT NOT NULL
);

-- Seed location types
INSERT OR IGNORE INTO location_types (code, label_th, label_en) VALUES
  ('wall',   'ผนัง', 'Wall'),
  ('table',  'โต๊ะ', 'Table'),
  ('pillar', 'เสา',  'Pillar');

CREATE TABLE IF NOT EXISTS survey_submissions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id        TEXT REFERENCES stores(store_id),
  respondent_name TEXT NOT NULL,
  phone           TEXT NOT NULL,
  submitted_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submission_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id    INTEGER REFERENCES survey_submissions(id) ON DELETE CASCADE,
  model_code       TEXT,
  location_code    TEXT,
  sub_category     TEXT,
  size             TEXT,
  location_label_th TEXT,
  location_label_en TEXT
);

CREATE TABLE IF NOT EXISTS submission_photos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER REFERENCES survey_submissions(id) ON DELETE CASCADE,
  file_path     TEXT,
  uploaded_at   TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_store ON survey_submissions(store_id);
CREATE INDEX IF NOT EXISTS idx_submissions_date  ON survey_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_items_submission  ON submission_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_photos_submission ON submission_photos(submission_id);
CREATE INDEX IF NOT EXISTS idx_stores_hang       ON stores(hang);
CREATE INDEX IF NOT EXISTS idx_stores_region     ON stores(phumipak);
