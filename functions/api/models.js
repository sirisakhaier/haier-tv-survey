// functions/api/models.js
// GET /api/models  — list all TV models from D1

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM models ORDER BY sub_category, size').all()
    return Response.json(results)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
