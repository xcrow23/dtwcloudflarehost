// functions/blog.js
// Cloudflare Pages Function for fetching and serving Substack blog posts

const SUBSTACK_FEED_URL = 'https://dreamthewilderness.substack.com/feed';

export async function onRequestGet(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Try to get cached feed from KV (10-minute TTL)
    const cacheKey = 'blog_feed_cache';
    let items;
    let cached = false;

    if (env.BLOG_CACHE) {
      try {
        const cachedData = await env.BLOG_CACHE.get(cacheKey, 'json');
        if (cachedData && cachedData.items) {
          console.log('Blog API: Using cached feed');
          items = cachedData.items;
          cached = true;

          return jsonResponse({
            status: 'ok',
            items: items,
            count: items.length,
            updatedAt: cachedData.updatedAt,
            cached: true
          }, 200, corsHeaders);
        }
      } catch (cacheError) {
        console.warn('Blog API: Cache read failed, fetching fresh feed:', cacheError.message);
      }
    }

    // Fetch the Substack RSS feed
    const feedResponse = await fetch(SUBSTACK_FEED_URL);

    if (!feedResponse.ok) {
      throw new Error(`Failed to fetch Substack feed: ${feedResponse.statusText}`);
    }

    const feedText = await feedResponse.text();

    // Parse RSS XML
    items = parseRssFeed(feedText);

    // Cache the result for 10 minutes (600 seconds)
    if (env.BLOG_CACHE && items.length > 0) {
      try {
        const updatedAt = new Date().toISOString();
        await env.BLOG_CACHE.put(cacheKey, JSON.stringify({
          items: items,
          updatedAt: updatedAt
        }), { expirationTtl: 600 });
        console.log('Blog API: Feed cached for 10 minutes');
      } catch (cacheError) {
        console.warn('Blog API: Failed to cache feed:', cacheError.message);
      }
    }

    // Return as JSON
    return jsonResponse({
      status: 'ok',
      items: items,
      count: items.length,
      updatedAt: new Date().toISOString(),
      cached: false
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

function parseRssFeed(xmlText) {
  try {
    const items = [];

    // Extract all <item> elements using regex
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
      const itemContent = itemMatch[1];

      // Extract title (handle both plain text and CDATA)
      let title = 'Untitled';
      const titleCdataMatch = itemContent.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/);
      const titlePlainMatch = itemContent.match(/<title[^>]*>([^<]+)<\/title>/);

      if (titleCdataMatch) {
        title = decodeHtml(titleCdataMatch[1].trim());
      } else if (titlePlainMatch) {
        title = decodeHtml(titlePlainMatch[1].trim());
      }

      // Extract description
      const descriptionMatch = itemContent.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
      let description = '';
      let imageUrl = null;

      if (descriptionMatch) {
        const descriptionHtml = descriptionMatch[1];

        // Extract featured image URL
        const imgMatch = descriptionHtml.match(/<img[^>]+src=["']([^"']+)["']/);
        imageUrl = imgMatch ? imgMatch[1] : null;

        // Clean description text
        description = descriptionHtml
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
      }

      // Extract link
      const linkMatch = itemContent.match(/<link[^>]*>([^<]*)<\/link>/);
      const link = linkMatch ? linkMatch[1] : '#';

      // Extract publish date
      const pubDateMatch = itemContent.match(/<pubDate[^>]*>([^<]*)<\/pubDate>/);
      const pubDateStr = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();

      // Extract author/creator
      const creatorMatch = itemContent.match(/<creator[^>]*>([^<]*)<\/creator>/);
      const author = creatorMatch ? decodeHtml(creatorMatch[1]) : 'Dream the Wilderness';

      const pubDate = new Date(pubDateStr);

      items.push({
        title,
        description: description.substring(0, 200), // Limit length
        link,
        pubDate: pubDateStr,
        author,
        image: imageUrl,
        timestamp: pubDate.getTime()
      });
    }

    // Sort by date descending (newest first)
    items.sort((a, b) => b.timestamp - a.timestamp);

    return items;

  } catch (error) {
    console.error('RSS parsing error:', error);
    throw new Error(`Failed to parse RSS: ${error.message}`);
  }
}

function decodeHtml(html) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&nbsp;': ' '
  };

  return html.replace(/&[^;]+;/g, (match) => entities[match] || match);
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
