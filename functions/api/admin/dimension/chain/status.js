// functions/api/admin/dimension/chain/status.js
// POST /api/admin/dimension/chain/status — toggle active/inactive status for a retail chain (ห้าง)

export async function onRequestPost({ request, env }) {
  try {
    const { hang, status } = await request.json()
    if (!hang || !status) {
      return Response.json({ error: 'hang and status required' }, { status: 400 })
    }

    const newStatus = status === 'inactive' ? 'inactive' : 'active'
    await env.DB.prepare(
      'INSERT INTO chain_statuses (hang, status) VALUES (?, ?) ON CONFLICT(hang) DO UPDATE SET status=excluded.status'
    ).bind(hang, newStatus).run()

    return Response.json({ success: true, hang, status: newStatus })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
