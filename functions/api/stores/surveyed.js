// functions/api/stores/surveyed.js
// GET /api/stores/surveyed — returns array of store_ids that already have survey submissions

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT DISTINCT store_id FROM survey_submissions WHERE store_id IS NOT NULL'
    ).all()
    const storeIds = (results || []).map(r => r.store_id)
    return Response.json(storeIds)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
