// functions/photos/[...path].js
// Serves photos stored in Cloudflare R2 bucket (env.PHOTOS) under /photos/*

export async function onRequest({ request, params, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    })
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    // params.path is an array of path segments after /photos/
    const key = Array.isArray(params.path) ? params.path.join('/') : (params.path || '')
    
    if (!key) {
      return new Response('Key required', { status: 400 })
    }

    const object = await env.PHOTOS.get(key)

    if (!object) {
      return new Response('Photo not found: ' + key, { status: 404 })
    }

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    headers.set('Access-Control-Allow-Origin', '*')

    // Determine content type if not set
    if (!headers.get('content-type')) {
      const ext = key.split('.').pop().toLowerCase()
      if (ext === 'png') headers.set('content-type', 'image/png')
      else if (ext === 'webp') headers.set('content-type', 'image/webp')
      else headers.set('content-type', 'image/jpeg')
    }

    if (request.method === 'HEAD') {
      return new Response(null, { headers })
    }

    return new Response(object.body, { headers })
  } catch (e) {
    return new Response('Error retrieving photo: ' + e.message, { status: 500 })
  }
}
