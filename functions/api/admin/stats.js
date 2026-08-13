// functions/api/admin/stats.js
// GET /api/admin/stats — dashboard KPIs and chart data from D1

export async function onRequestGet({ env }) {
  try {
    const db = env.DB

    const [[totalRow], [storeRow], [photoRow], [itemRow], [todayRow], [weekRow]] = await Promise.all([
      db.prepare('SELECT COUNT(*) as c FROM survey_submissions').all().then(r => r.results),
      db.prepare('SELECT COUNT(DISTINCT store_id) as c FROM survey_submissions').all().then(r => r.results),
      db.prepare('SELECT COUNT(*) as c FROM submission_photos').all().then(r => r.results),
      db.prepare('SELECT COUNT(*) as c FROM submission_items').all().then(r => r.results),
      db.prepare("SELECT COUNT(*) as c FROM survey_submissions WHERE date(submitted_at)=date('now')").all().then(r => r.results),
      db.prepare("SELECT COUNT(*) as c FROM survey_submissions WHERE submitted_at>=date('now','-7 days')").all().then(r => r.results),
    ])

    const [byHang, byRegion, byModel, bySubCat, byLocation, trend] = await Promise.all([
      db.prepare(`SELECT s.hang as name, COUNT(*) as count FROM survey_submissions ss JOIN stores s ON s.store_id=ss.store_id GROUP BY s.hang ORDER BY count DESC`).all().then(r => r.results),
      db.prepare(`SELECT s.phumipak as name, COUNT(*) as count FROM survey_submissions ss JOIN stores s ON s.store_id=ss.store_id GROUP BY s.phumipak ORDER BY count DESC`).all().then(r => r.results),
      db.prepare(`SELECT model_code as name, COUNT(*) as count FROM submission_items GROUP BY model_code ORDER BY count DESC LIMIT 15`).all().then(r => r.results),
      db.prepare(`SELECT sub_category as name, COUNT(*) as count FROM submission_items GROUP BY sub_category ORDER BY count DESC`).all().then(r => r.results),
      db.prepare(`SELECT location_label_th as name, COUNT(*) as count FROM submission_items GROUP BY location_code ORDER BY count DESC`).all().then(r => r.results),
      db.prepare(`SELECT date(submitted_at) as date, COUNT(*) as count FROM survey_submissions GROUP BY date(submitted_at) ORDER BY date LIMIT 30`).all().then(r => r.results),
    ])

    return Response.json({
      totalSubmissions: totalRow.c,
      uniqueStores:     storeRow.c,
      totalPhotos:      photoRow.c,
      totalItems:       itemRow.c,
      today:            todayRow.c,
      thisWeek:         weekRow.c,
      byHang, byRegion, byModel, bySubCat, byLocation, trend,
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
