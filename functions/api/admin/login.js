// functions/api/admin/login.js
// POST /api/admin/login — validate admin/viewer password

export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json()
    const adminPwd = env.ADMIN_PASSWORD || 'admin1234'
    const viewerPwd = env.VIEWER_PASSWORD || 'viewer1234'

    if (password === adminPwd) {
      return Response.json({ ok: true, role: 'admin' })
    }
    if (password === viewerPwd) {
      return Response.json({ ok: true, role: 'viewer' })
    }
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
