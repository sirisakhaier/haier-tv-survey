// functions/api/stores.js
// GET /api/stores  — list all stores from D1

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM stores ORDER BY hang, phumipak, sakha').all()
    return Response.json(results)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
