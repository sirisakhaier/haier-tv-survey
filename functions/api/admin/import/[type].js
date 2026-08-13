// functions/api/admin/import/[type].js
// POST /api/admin/import/:type — import dimension CSV rows into D1
// Replaces entire store or model catalog (DELETE ALL then INSERT) with PRAGMA foreign_keys = OFF

export async function onRequestPost({ params, request, env }) {
  try {
    const { rows } = await request.json()
    if (!rows || !Array.isArray(rows)) return Response.json({ error: 'No rows provided' }, { status: 400 })

    const type = params.type
    let stmts = []
    let imported = 0

    // Disable foreign key checks during replace-all import
    await env.DB.prepare('PRAGMA foreign_keys = OFF;').run()

    if (type === 'store') {
      await env.DB.prepare('DELETE FROM stores').run()
      const stmt = env.DB.prepare('INSERT OR REPLACE INTO stores (store_id,hang,phumipak,changwat,sakha,store_name,status) VALUES (?,?,?,?,?,?,?)')
      for (const r of rows) {
        const id = r['Store ID(Primary key)'] || r['Store ID (Primary key)'] || r.store_id
        if (!id) continue
        const status = r.status || r['สถานะ'] || 'active'
        stmts.push(stmt.bind(id, r['ห้าง']||r.hang, r['ภูมิภาค']||r.phumipak, r['จังหวัด']||r.changwat, r['สาขา']||r.sakha, r['Store Name']||r.store_name, status))
        imported++
      }
    } else if (type === 'model') {
      await env.DB.prepare('DELETE FROM models').run()
      const stmt = env.DB.prepare('INSERT OR REPLACE INTO models (model_code,category,sub_category,size) VALUES (?,?,?,?)')
      for (const r of rows) {
        const code = r['Model (Primary key)'] || r.model_code
        if (!code) continue
        stmts.push(stmt.bind(code, r['Model Category']||r.category, r['Model Sub Category']||r.sub_category, r['Model Size']||r.size))
        imported++
      }
    } else if (type === 'location') {
      await env.DB.prepare('DELETE FROM location_types').run()
      const stmt = env.DB.prepare('INSERT OR REPLACE INTO location_types (code,label_th,label_en) VALUES (?,?,?)')
      for (const r of rows) {
        stmts.push(stmt.bind(r.code||r.Code, r.label_th||r.LabelTH, r.label_en||r.LabelEN))
        imported++
      }
    } else {
      return Response.json({ error: 'Unknown type' }, { status: 400 })
    }

    // D1 batch has limit of 100 statements; chunk if needed
    for (let i = 0; i < stmts.length; i += 100) {
      await env.DB.batch(stmts.slice(i, i + 100))
    }

    await env.DB.prepare('PRAGMA foreign_keys = ON;').run()

    return Response.json({ imported })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
