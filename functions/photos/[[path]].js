// functions/photos/[[path]].js
// Serves photos stored in Cloudflare R2 bucket (env.PHOTOS) under /photos/*
// Automatically handles extension fallbacks (.jpg, .webp, .png, .jpeg)

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
    const rawKey = Array.isArray(params.path) ? params.path.join('/') : (params.path || '')
    
    if (!rawKey) {
      return new Response('Key required', { status: 400 })
    }

    // 1. Try exact key match first
    let object = await env.PHOTOS.get(rawKey)

    // 2. If not found, try fallback extensions (.webp, .png, .jpg, .jpeg)
    if (!object) {
      const baseKey = rawKey.replace(/\.(jpg|jpeg|png|webp)$/i, '')
      const candidateExts = ['.jpg', '.webp', '.png', '.jpeg']
      for (const ext of candidateExts) {
        const altKey = baseKey + ext
        if (altKey !== rawKey) {
          object = await env.PHOTOS.get(altKey)
          if (object) break
        }
      }
    }

    if (!object) {
      return new Response('Photo not found: ' + rawKey, { status: 404 })
    }

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    headers.set('Access-Control-Allow-Origin', '*')

    // Ensure content type header is set
    if (!headers.get('content-type')) {
      const ext = rawKey.split('.').pop().toLowerCase()
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
