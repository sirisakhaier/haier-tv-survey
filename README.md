# Haier TV Display Survey App

> Mobile-first web app for Haier field merchandisers to survey TV display placements across Thai retail stores.

## Features

- **Public Survey** (4 steps): Store selection → Respondent info → Model+location entries → Photo upload
- **Admin Module**: Dashboard with charts, dimension management (CSV import/export), survey data export/reset
- **Thai + English** bilingual UI, **mobile-first** design with large tap targets

---

## Quick Start (Local Development)

### Prerequisites
- Node.js v18+

### 1. Install dependencies
```bash
npm install
```

### 2. Parse CSV data (already done — run if CSVs change)
```bash
npm run parse-csv
```

### 3. Run (frontend + backend together)
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Admin**: http://localhost:5173/admin (password: `admin1234`)

---

## Admin Module

- **URL**: `/admin`
- **Password**: `admin1234` (set `ADMIN_PASSWORD` env var for production)
- Dashboard with KPI cards and charts
- Dimension management: Store / Model / Location (CSV import/export/edit)
- Survey data export (CSV with BOM for Thai) and reset

---

## Cloudflare Deployment

| Component | Local | Cloudflare |
|---|---|---|
| Frontend | Vite dev server | Cloudflare Pages |
| Backend API | Express (port 3001) | Cloudflare Pages Functions |
| Database | SQLite (better-sqlite3) | Cloudflare D1 |
| Photo storage | Local `uploads/` | Cloudflare R2 |
| Admin password | env var | Cloudflare Secret |

```bash
npx wrangler login
npx wrangler d1 create haier_survey_db
npx wrangler r2 bucket create haier-survey-photos
npx wrangler secret put ADMIN_PASSWORD
git remote add origin https://github.com/sirisakhaier/haier-tv-survey.git
git push -u origin main
npx wrangler pages deploy dist --project-name haier-tv-survey
```

| Variable | Default | Description |
|---|---|---|
| `ADMIN_PASSWORD` | `admin1234` | Admin panel password |
