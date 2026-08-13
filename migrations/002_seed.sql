-- Haier TV Survey — D1 Seed Data
-- Run AFTER 001_schema.sql
-- Generate the SQL from JSON: node scripts/generate-seed-sql.js
-- Then: npx wrangler d1 execute haier_survey_db --file=./migrations/002_seed.sql --remote

-- Location types (static seed)
INSERT OR IGNORE INTO location_types (code, label_th, label_en) VALUES
  ('wall',   'ผนัง', 'Wall'),
  ('table',  'โต๊ะ', 'Table'),
  ('pillar', 'เสา',  'Pillar');

-- NOTE: Store and Model data is seeded via the generate-seed-sql script
-- which reads src/data/stores.json and src/data/models.json and
-- produces INSERT statements. Run: node scripts/generate-seed-sql.js
