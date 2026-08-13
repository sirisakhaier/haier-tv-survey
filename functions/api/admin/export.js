// functions/api/admin/export.js
// GET /api/admin/export — all survey data as flat JSON for CSV export

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT ss.id, ss.store_id, s.hang, s.phumipak, s.changwat, s.sakha,
        ss.respondent_name, ss.phone, ss.submitted_at,
        si.model_code, si.sub_category, si.size, si.location_label_th, si.location_label_en
      FROM survey_submissions ss
      LEFT JOIN stores s ON s.store_id=ss.store_id
      LEFT JOIN submission_items si ON si.submission_id=ss.id
      ORDER BY ss.id, si.id
    `).all()
    return Response.json(results)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
