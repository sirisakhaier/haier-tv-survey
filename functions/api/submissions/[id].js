// functions/api/submissions/[id].js
// GET /api/submissions/:id  — single submission detail (items + photos)

export async function onRequestGet({ params, env }) {
  try {
    const { results: [submission] } = await env.DB.prepare(`
      SELECT ss.*, s.hang, s.phumipak, s.changwat, s.sakha
      FROM survey_submissions ss LEFT JOIN stores s ON s.store_id=ss.store_id
      WHERE ss.id=?
    `).bind(params.id).all()
    if (!submission) return Response.json({ error: 'Not found' }, { status: 404 })

    const { results: items }  = await env.DB.prepare('SELECT * FROM submission_items WHERE submission_id=?').bind(params.id).all()
    const { results: photos } = await env.DB.prepare('SELECT * FROM submission_photos WHERE submission_id=?').bind(params.id).all()
    return Response.json({ ...submission, items, photos })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
