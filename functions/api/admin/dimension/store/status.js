// functions/api/admin/dimension/store/status.js
// POST /api/admin/dimension/store/status — toggle active/inactive status for a store

export async function onRequestPost({ request, env }) {
  try {
    const { store_id, status } = await request.json()
    if (!store_id || !status) {
      return Response.json({ error: 'store_id and status required' }, { status: 400 })
    }

    const newStatus = status === 'inactive' ? 'inactive' : 'active'
    await env.DB.prepare('UPDATE stores SET status=? WHERE store_id=?').bind(newStatus, store_id).run()

    return Response.json({ success: true, store_id, status: newStatus })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
