import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = 3001
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234'
const DB_PATH = path.join(__dirname, 'survey.db')
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

// Ensure uploads dir exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

// ─── DB Setup ────────────────────────────────────────────
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    store_id TEXT PRIMARY KEY,
    hang TEXT,
    phumipak TEXT,
    changwat TEXT,
    sakha TEXT,
    store_name TEXT
  );
  CREATE TABLE IF NOT EXISTS models (
    model_code TEXT PRIMARY KEY,
    category TEXT,
    sub_category TEXT,
    size TEXT
  );
  CREATE TABLE IF NOT EXISTS location_types (
    code TEXT PRIMARY KEY,
    label_th TEXT,
    label_en TEXT
  );
  CREATE TABLE IF NOT EXISTS survey_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT REFERENCES stores(store_id),
    respondent_name TEXT,
    phone TEXT,
    submitted_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS submission_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER REFERENCES survey_submissions(id) ON DELETE CASCADE,
    model_code TEXT,
    location_code TEXT,
    sub_category TEXT,
    size TEXT,
    location_label_th TEXT,
    location_label_en TEXT
  );
  CREATE TABLE IF NOT EXISTS submission_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER REFERENCES survey_submissions(id) ON DELETE CASCADE,
    file_path TEXT,
    uploaded_at TEXT DEFAULT (datetime('now'))
  );
`)

// ─── Seed if empty ────────────────────────────────────────
function seedFromJson() {
  const storeCount = db.prepare('SELECT COUNT(*) as c FROM stores').get().c
  if (storeCount === 0) {
    try {
      const storesJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/stores.json'), 'utf-8'))
      const insertStore = db.prepare('INSERT OR IGNORE INTO stores VALUES (@store_id,@hang,@phumipak,@changwat,@sakha,@store_name)')
      const insertMany = db.transaction(rows => { for (const r of rows) insertStore.run(r) })
      insertMany(storesJson)
      console.log(`✓ Seeded ${storesJson.length} stores`)
    } catch (e) { console.error('Store seed error:', e.message) }
  }

  const modelCount = db.prepare('SELECT COUNT(*) as c FROM models').get().c
  if (modelCount === 0) {
    try {
      const modelsJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/models.json'), 'utf-8'))
      const insertModel = db.prepare('INSERT OR IGNORE INTO models VALUES (@model_code,@category,@sub_category,@size)')
      const insertMany = db.transaction(rows => { for (const r of rows) insertModel.run(r) })
      insertMany(modelsJson)
      console.log(`✓ Seeded ${modelsJson.length} models`)
    } catch (e) { console.error('Model seed error:', e.message) }
  }

  const locCount = db.prepare('SELECT COUNT(*) as c FROM location_types').get().c
  if (locCount === 0) {
    db.prepare('INSERT OR IGNORE INTO location_types VALUES (?,?,?)').run('wall','ผนัง','Wall')
    db.prepare('INSERT OR IGNORE INTO location_types VALUES (?,?,?)').run('table','โต๊ะ','Table')
    db.prepare('INSERT OR IGNORE INTO location_types VALUES (?,?,?)').run('pillar','เสา','Pillar')
    console.log('✓ Seeded location types')
  }
}
seedFromJson()

// ─── Express App ─────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))

// Multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } })

// ─── Public API ───────────────────────────────────────────
app.get('/api/stores', (req, res) => {
  res.json(db.prepare('SELECT * FROM stores').all())
})
app.get('/api/models', (req, res) => {
  res.json(db.prepare('SELECT * FROM models').all())
})
app.get('/api/locations', (req, res) => {
  res.json(db.prepare('SELECT * FROM location_types').all())
})

// Submit survey
app.post('/api/submissions', upload.array('photos', 10), (req, res) => {
  const { store_id, respondent_name, phone, entries } = req.body
  if (!store_id || !respondent_name || !phone) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  let parsedEntries = []
  try { parsedEntries = JSON.parse(entries) } catch { return res.status(400).json({ error: 'Invalid entries JSON' }) }
  if (!parsedEntries.length) return res.status(400).json({ error: 'At least one model entry required' })
  if (!req.files?.length || req.files.length < 3) return res.status(400).json({ error: 'At least 3 photos required' })

  const tx = db.transaction(() => {
    const { lastInsertRowid: submissionId } = db.prepare(
      'INSERT INTO survey_submissions (store_id, respondent_name, phone) VALUES (?,?,?)'
    ).run(store_id, respondent_name, phone)

    const insertItem = db.prepare('INSERT INTO submission_items (submission_id,model_code,location_code,sub_category,size,location_label_th,location_label_en) VALUES (?,?,?,?,?,?,?)')
    for (const e of parsedEntries) {
      insertItem.run(submissionId, e.model_code, e.location_code, e.sub_category, e.size, e.location_label_th, e.location_label_en)
    }

    const insertPhoto = db.prepare('INSERT INTO submission_photos (submission_id,file_path) VALUES (?,?)')
    for (const f of req.files) {
      insertPhoto.run(submissionId, `/uploads/${f.filename}`)
    }
    return submissionId
  })

  try {
    const id = tx()
    res.json({ success: true, id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Admin auth middleware ────────────────────────────────
function adminAuth(req, res, next) {
  const auth = req.headers['x-admin-auth'] || req.query.auth
  if (auth === ADMIN_PASSWORD || req.session?.admin) return next()
  // For simplicity, check sessionStorage via header sent by frontend
  return res.status(401).json({ error: 'Unauthorized' })
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  if (password === ADMIN_PASSWORD) {
    res.json({ ok: true })
  } else {
    res.status(401).json({ error: 'Invalid password' })
  }
})

// Admin stats — no auth header required in dev (frontend handles it via sessionStorage)
app.get('/api/admin/stats', (req, res) => {
  try {
    const totalSubmissions = db.prepare('SELECT COUNT(*) as c FROM survey_submissions').get().c
    const uniqueStores = db.prepare('SELECT COUNT(DISTINCT store_id) as c FROM survey_submissions').get().c
    const totalPhotos = db.prepare('SELECT COUNT(*) as c FROM submission_photos').get().c
    const totalItems = db.prepare('SELECT COUNT(*) as c FROM submission_items').get().c
    const today = db.prepare("SELECT COUNT(*) as c FROM survey_submissions WHERE date(submitted_at)=date('now')").get().c
    const thisWeek = db.prepare("SELECT COUNT(*) as c FROM survey_submissions WHERE submitted_at >= date('now','-7 days')").get().c

    const byHang = db.prepare(`
      SELECT s.hang as name, COUNT(*) as count FROM survey_submissions ss
      JOIN stores s ON s.store_id=ss.store_id GROUP BY s.hang ORDER BY count DESC
    `).all()
    const byRegion = db.prepare(`
      SELECT s.phumipak as name, COUNT(*) as count FROM survey_submissions ss
      JOIN stores s ON s.store_id=ss.store_id GROUP BY s.phumipak ORDER BY count DESC
    `).all()
    const byModel = db.prepare(`
      SELECT model_code as name, COUNT(*) as count FROM submission_items GROUP BY model_code ORDER BY count DESC LIMIT 15
    `).all()
    const bySubCat = db.prepare(`
      SELECT sub_category as name, COUNT(*) as count FROM submission_items GROUP BY sub_category ORDER BY count DESC
    `).all()
    const byLocation = db.prepare(`
      SELECT location_label_th as name, COUNT(*) as count FROM submission_items GROUP BY location_code ORDER BY count DESC
    `).all()
    const trend = db.prepare(`
      SELECT date(submitted_at) as date, COUNT(*) as count FROM survey_submissions
      GROUP BY date(submitted_at) ORDER BY date LIMIT 30
    `).all()

    res.json({ totalSubmissions, uniqueStores, totalPhotos, totalItems, today, thisWeek, byHang, byRegion, byModel, bySubCat, byLocation, trend })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/recent', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT ss.id, ss.store_id, ss.respondent_name, ss.phone, ss.submitted_at,
        s.hang, s.phumipak, s.sakha,
        (SELECT COUNT(*) FROM submission_items si WHERE si.submission_id=ss.id) as items_count,
        (SELECT COUNT(*) FROM submission_photos sp WHERE sp.submission_id=ss.id) as photos_count
      FROM survey_submissions ss LEFT JOIN stores s ON s.store_id=ss.store_id
      ORDER BY ss.submitted_at DESC LIMIT 50
    `).all()
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/admin/submissions', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT ss.id, ss.store_id, ss.respondent_name, ss.phone, ss.submitted_at,
        s.hang, s.phumipak, s.changwat, s.sakha,
        (SELECT COUNT(*) FROM submission_items si WHERE si.submission_id=ss.id) as items_count,
        (SELECT COUNT(*) FROM submission_photos sp WHERE sp.submission_id=ss.id) as photos_count
      FROM survey_submissions ss LEFT JOIN stores s ON s.store_id=ss.store_id
      ORDER BY ss.submitted_at DESC
    `).all()
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Single submission detail (items + photos)
app.get('/api/admin/submissions/:id', (req, res) => {
  try {
    const submission = db.prepare(`
      SELECT ss.*, s.hang, s.phumipak, s.changwat, s.sakha
      FROM survey_submissions ss LEFT JOIN stores s ON s.store_id=ss.store_id
      WHERE ss.id=?
    `).get(req.params.id)
    if (!submission) return res.status(404).json({ error: 'Not found' })
    const items = db.prepare('SELECT * FROM submission_items WHERE submission_id=?').all(req.params.id)
    const photos = db.prepare('SELECT * FROM submission_photos WHERE submission_id=?').all(req.params.id)
    res.json({ ...submission, items, photos })
  } catch (err) { res.status(500).json({ error: err.message }) }
})



// Export all — flattened rows
app.get('/api/admin/export', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT ss.id, ss.store_id, s.hang, s.phumipak, s.changwat, s.sakha,
        ss.respondent_name, ss.phone, ss.submitted_at,
        si.model_code, si.sub_category, si.size, si.location_label_th, si.location_label_en
      FROM survey_submissions ss
      LEFT JOIN stores s ON s.store_id=ss.store_id
      LEFT JOIN submission_items si ON si.submission_id=ss.id
      ORDER BY ss.id, si.id
    `).all()
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Dimension import
app.post('/api/admin/import/:type', (req, res) => {
  const { type } = req.params
  const { rows } = req.body
  if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'No rows' })

  try {
    let imported = 0
    const tx = db.transaction(() => {
      if (type === 'store') {
        const stmt = db.prepare('INSERT OR REPLACE INTO stores (store_id,hang,phumipak,changwat,sakha,store_name) VALUES (?,?,?,?,?,?)')
        for (const r of rows) {
          const id = r['Store ID(Primary key)'] || r['Store ID (Primary key)'] || r['store_id']
          if (!id) continue
          stmt.run(id, r['ห้าง']||r.hang, r['ภูมิภาค']||r.phumipak, r['จังหวัด']||r.changwat, r['สาขา']||r.sakha, r['Store Name']||r.store_name)
          imported++
        }
      } else if (type === 'model') {
        const stmt = db.prepare('INSERT OR REPLACE INTO models (model_code,category,sub_category,size) VALUES (?,?,?,?)')
        for (const r of rows) {
          const code = r['Model (Primary key)'] || r['model_code']
          if (!code) continue
          stmt.run(code, r['Model Category']||r.category, r['Model Sub Category']||r.sub_category, r['Model Size']||r.size)
          imported++
        }
      } else if (type === 'location') {
        const stmt = db.prepare('INSERT OR REPLACE INTO location_types (code,label_th,label_en) VALUES (?,?,?)')
        for (const r of rows) {
          stmt.run(r.code||r.Code, r.label_th||r.LabelTH, r.label_en||r.LabelEN)
          imported++
        }
      }
    })
    tx()
    res.json({ imported })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Dimension delete
app.delete('/api/admin/dimension/:type/:pk', (req, res) => {
  const { type, pk } = req.params
  const table = type === 'store' ? 'stores' : type === 'model' ? 'models' : 'location_types'
  const col = type === 'store' ? 'store_id' : type === 'model' ? 'model_code' : 'code'
  try {
    db.prepare(`DELETE FROM ${table} WHERE ${col}=?`).run(pk)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Reset survey data
app.delete('/api/admin/reset-data', (req, res) => {
  try {
    db.exec('DELETE FROM submission_photos; DELETE FROM submission_items; DELETE FROM survey_submissions;')
    // Also clean up upload files
    try {
      const files = fs.readdirSync(UPLOADS_DIR)
      for (const f of files) fs.unlinkSync(path.join(UPLOADS_DIR, f))
    } catch {}
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.listen(PORT, () => {
  console.log(`\n🚀 Haier TV Survey API running on http://localhost:${PORT}`)
  console.log(`   Admin password: ${ADMIN_PASSWORD}`)
  console.log(`   DB: ${DB_PATH}\n`)
})
