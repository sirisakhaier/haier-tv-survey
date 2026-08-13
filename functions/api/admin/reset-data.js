// functions/api/admin/reset-data.js
// DELETE /api/admin/reset-data — wipe all survey data (submissions, items, photos from R2)

export async function onRequestDelete({ env }) {
  try {
    // Delete all R2 objects under submissions/
    const listed = await env.PHOTOS.list({ prefix: 'submissions/' })
    if (listed.objects?.length) {
      await Promise.all(listed.objects.map(obj => env.PHOTOS.delete(obj.key)))
    }

    // Wipe DB tables
    await env.DB.batch([
      env.DB.prepare('DELETE FROM submission_photos'),
      env.DB.prepare('DELETE FROM submission_items'),
      env.DB.prepare('DELETE FROM survey_submissions'),
    ])

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
