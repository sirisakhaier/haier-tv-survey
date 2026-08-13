// functions/api/admin/dimension/[type]/[pk].js
// DELETE /api/admin/dimension/:type/:pk — delete one dimension row

export async function onRequestDelete({ params, env }) {
  try {
    const { type, pk } = params
    const table = type === 'store' ? 'stores' : type === 'model' ? 'models' : 'location_types'
    const col   = type === 'store' ? 'store_id' : type === 'model' ? 'model_code' : 'code'
    await env.DB.prepare(`DELETE FROM ${table} WHERE ${col}=?`).bind(pk).run()
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
