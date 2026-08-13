// functions/api/submissions.js
// POST /api/submissions — create a new survey submission (multipart form: fields + photos)
// GET  /api/submissions — list all submissions (admin)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

  if (request.method === 'POST') return handlePost({ request, env })
  if (request.method === 'GET')  return handleGet({ env })
  return new Response('Method not allowed', { status: 405 })
}

async function handlePost({ request, env }) {
  try {
    const formData = await request.formData()
    const store_id       = formData.get('store_id')
    const respondent_name = formData.get('respondent_name')
    const phone          = formData.get('phone')
    const entriesRaw     = formData.get('entries')
    const photoFiles     = formData.getAll('photos')

    if (!store_id || !respondent_name || !phone) {
      return Response.json({ error: 'Missing required fields' }, { status: 400, headers: CORS })
    }

    let entries = []
    try { entries = JSON.parse(entriesRaw) } catch {
      return Response.json({ error: 'Invalid entries JSON' }, { status: 400, headers: CORS })
    }
    if (!entries.length) return Response.json({ error: 'At least one model entry required' }, { status: 400, headers: CORS })
    if (photoFiles.length < 3) return Response.json({ error: 'At least 3 photos required' }, { status: 400, headers: CORS })

    // 1. Insert submission
    const { meta } = await env.DB.prepare(
      'INSERT INTO survey_submissions (store_id, respondent_name, phone) VALUES (?, ?, ?)'
    ).bind(store_id, respondent_name, phone).run()
    const submissionId = meta.last_row_id

    // 2. Insert items
    const itemStmt = env.DB.prepare(
      'INSERT INTO submission_items (submission_id, model_code, location_code, sub_category, size, location_label_th, location_label_en) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    const itemBatch = entries.map(e =>
      itemStmt.bind(submissionId, e.model_code, e.location_code, e.sub_category, e.size, e.location_label_th, e.location_label_en)
    )

    // 3. Upload photos to R2, insert photo records
    const photoStmt = env.DB.prepare('INSERT INTO submission_photos (submission_id, file_path) VALUES (?, ?)')
    const photoBatch = []
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i]
      const key  = `submissions/${submissionId}/${Date.now()}_${i}.jpg`
      await env.PHOTOS.put(key, file.stream(), { httpMetadata: { contentType: file.type || 'image/jpeg' } })
      const url = `/photos/${key}`
      photoBatch.push(photoStmt.bind(submissionId, url))
    }

    // 4. Batch write all DB records
    await env.DB.batch([...itemBatch, ...photoBatch])

    return Response.json({ success: true, id: submissionId }, { headers: CORS })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: CORS })
  }
}

async function handleGet({ env }) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT ss.id, ss.store_id, ss.respondent_name, ss.phone, ss.submitted_at,
        s.hang, s.phumipak, s.changwat, s.sakha,
        (SELECT COUNT(*) FROM submission_items si WHERE si.submission_id=ss.id) as items_count,
        (SELECT COUNT(*) FROM submission_photos sp WHERE sp.submission_id=ss.id) as photos_count
      FROM survey_submissions ss LEFT JOIN stores s ON s.store_id=ss.store_id
      ORDER BY ss.submitted_at DESC
    `).all()
    return Response.json(results, { headers: CORS })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: CORS })
  }
}
