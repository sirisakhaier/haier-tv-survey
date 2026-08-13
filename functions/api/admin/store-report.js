// functions/api/admin/store-report.js
// GET /api/admin/store-report — returns aggregated store summary report

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        s.store_id,
        s.hang,
        s.phumipak,
        s.changwat,
        s.sakha,
        s.store_name,
        s.status as store_status,
        COUNT(DISTINCT ss.id) as submission_count,
        COUNT(si.id) as total_tvs_displayed,
        (
          SELECT ss_sub.respondent_name 
          FROM survey_submissions ss_sub 
          WHERE ss_sub.store_id = s.store_id 
          ORDER BY ss_sub.submitted_at DESC 
          LIMIT 1
        ) as latest_respondent,
        MAX(ss.submitted_at) as latest_submitted_at
      FROM stores s
      LEFT JOIN survey_submissions ss ON s.store_id = ss.store_id
      LEFT JOIN submission_items si ON ss.id = si.submission_id
      GROUP BY s.store_id
      ORDER BY submission_count DESC, s.hang ASC, s.sakha ASC
    `).all()

    return Response.json(results || [])
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
