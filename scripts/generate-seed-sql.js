#!/usr/bin/env node
// Generates migrations/003_stores_models_seed.sql from pre-parsed JSON data
// Run: node scripts/generate-seed-sql.js
// Then: npx wrangler d1 execute haier_survey_db --file=./migrations/003_stores_models_seed.sql --remote

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../src/data')
const outFile = path.join(__dirname, '../migrations/003_stores_models_seed.sql')

const stores = JSON.parse(fs.readFileSync(path.join(dataDir, 'stores.json'), 'utf-8'))
const models = JSON.parse(fs.readFileSync(path.join(dataDir, 'models.json'), 'utf-8'))

const esc = (v) => String(v ?? '').replace(/'/g, "''")

let sql = `-- Auto-generated seed: ${new Date().toISOString()}\n-- ${stores.length} stores, ${models.length} models\n\n`

// Models (small — all in one)
sql += '-- Models\n'
for (const m of models) {
  sql += `INSERT OR IGNORE INTO models (model_code,category,sub_category,size) VALUES ('${esc(m.model_code)}','${esc(m.category)}','${esc(m.sub_category)}','${esc(m.size)}');\n`
}

// Stores (chunked for D1 limits)
sql += '\n-- Stores\n'
for (const s of stores) {
  sql += `INSERT OR IGNORE INTO stores (store_id,hang,phumipak,changwat,sakha,store_name) VALUES ('${esc(s.store_id)}','${esc(s.hang)}','${esc(s.phumipak)}','${esc(s.changwat)}','${esc(s.sakha)}','${esc(s.store_name)}');\n`
}

fs.writeFileSync(outFile, sql)
console.log(`✓ Generated ${outFile}`)
console.log(`  ${models.length} models + ${stores.length} stores`)
console.log(`\nNext: npx wrangler d1 execute haier_survey_db --file=./migrations/003_stores_models_seed.sql --remote`)
