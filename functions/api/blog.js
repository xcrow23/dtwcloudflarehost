// functions/api/blog.js
// Cloudflare Pages Function that SERVES blog posts from KV.
//
// This function never calls Substack itself. Substack was returning 429
// Too Many Requests specifically to Cloudflare-originated fetches (works
// fine from other networks), which points at IP/ASN-level rate limiting
// on Cloudflare's shared Workers egress pool rather than anything DTW's
// own traffic was doing. The fix moved the actual fetch to a separate
// cron-triggered Worker (see ../../blog-updater/) that writes the parsed
// feed into this same KV namespace on a schedule. This function just
// reads whatever is there - which also means a failed refresh never
// takes the blog section down, it just serves the last-known-good data.

export async function onRequestGet(context) {
  const { env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    if (!env.BLOG_CACHE) {
      throw new Error('BLOG_CACHE KV binding is not configured');
    }

    const cachedData = await env.BLOG_CACHE.get('blog_feed_cache', 'json');

    if (!cachedData || !cachedData.items) {
      return jsonResponse({
        status: 'error',
        message: 'Blog cache is empty - the updater Worker may not have run yet'
      }, 503, corsHeaders);
    }

    return jsonResponse({
      status: 'ok',
      items: cachedData.items,
      count: cachedData.items.length,
      updatedAt: cachedData.updatedAt,
      cached: true
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Blog API error:', error);
    return jsonResponse({
      status: 'error',
      message: 'Unable to fetch blog posts',
      error: error.message
    }, 500, corsHeaders);
  }
}

// Handle CORS preflight
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders
    }
  });
}
