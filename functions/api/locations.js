// functions/api/locations.js
// GET /api/locations  — list location types from D1

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM location_types').all()
    return Response.json(results)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
