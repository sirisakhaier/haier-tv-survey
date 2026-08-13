// functions/api/chains.js
// GET /api/chains — returns active/inactive status for each retail chain (ห้าง)

export async function onRequestGet({ env }) {
  try {
    // Get unique hangs from stores table
    const { results: hangs } = await env.DB.prepare('SELECT DISTINCT hang FROM stores ORDER BY hang').all()
    const { results: statuses } = await env.DB.prepare('SELECT hang, status FROM chain_statuses').all()

    const statusMap = new Map()
    for (const s of statuses) statusMap.set(s.hang, s.status)

    const list = hangs.map(h => ({
      hang: h.hang,
      status: statusMap.get(h.hang) || 'active',
    }))

    return Response.json(list)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
