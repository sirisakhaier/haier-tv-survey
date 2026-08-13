// functions/api/admin/submissions.js
// GET /api/admin/submissions — all submissions list

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT ss.id, ss.store_id, ss.respondent_name, ss.phone, ss.submitted_at,
        s.hang, s.phumipak, s.changwat, s.sakha,
        (SELECT COUNT(*) FROM submission_items si WHERE si.submission_id=ss.id) as items_count,
        (SELECT COUNT(*) FROM submission_photos sp WHERE sp.submission_id=ss.id) as photos_count
      FROM survey_submissions ss LEFT JOIN stores s ON s.store_id=ss.store_id
      ORDER BY ss.submitted_at DESC
    `).all()
    return Response.json(results)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
