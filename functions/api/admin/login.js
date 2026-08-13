// functions/api/admin/login.js
// POST /api/admin/login — validate admin password (stored as CF secret ADMIN_PASSWORD)

export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json()
    const adminPwd = env.ADMIN_PASSWORD || 'admin1234'
    if (password === adminPwd) {
      return Response.json({ ok: true })
    }
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
