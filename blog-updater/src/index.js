// dtw-blog-cache-updater
// Cron-triggered Worker: fetches the Substack RSS feed and writes the
// parsed result into the shared BLOG_CACHE KV namespace. The Pages
// Function at functions/api/blog.js only ever reads from KV - it no
// longer calls Substack itself. See DEV_JOURNEY.md for why (Substack
// was returning 429 Too Many Requests to Cloudflare-originated fetches).
//
// The cache key is written WITHOUT a TTL, so the last successful fetch
// stays live indefinitely if a later cron run fails - visitors always
// see the most recent good data instead of an error state.
//
// Note: fetching Substack from this Worker's public workers.dev route
// gets blocked by Cloudflare itself (error 1042 - workers.dev can't
// freely reach other Cloudflare-proxied origins). The scheduled() cron
// path doesn't go through that route and isn't subject to it, which is
// why this only exports a scheduled() handler, not fetch().

const SUBSTACK_FEED_URL = 'https://dreamthewilderness.substack.com/feed';
const CACHE_KEY = 'blog_feed_cache';

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(updateBlogCache(env));
  }
};

async function updateBlogCache(env) {
  try {
    const feedResponse = await fetch(SUBSTACK_FEED_URL, {
      headers: {
        'User-Agent': 'DreamTheWildernessBot/1.0 (+https://dreamthewilderness.com)'
      }
    });

    if (!feedResponse.ok) {
      throw new Error(`Substack feed returned ${feedResponse.status} ${feedResponse.statusText}`);
    }

    const feedText = await feedResponse.text();
    const items = parseRssFeed(feedText);

    if (items.length === 0) {
      throw new Error('Parsed feed but found 0 items - leaving existing cache untouched');
    }

    const updatedAt = new Date().toISOString();
    await env.BLOG_CACHE.put(CACHE_KEY, JSON.stringify({ items, updatedAt }));

    console.log(`Blog cache updater: wrote ${items.length} items at ${updatedAt}`);
    return { status: 'ok', count: items.length, updatedAt };
  } catch (error) {
    console.error('Blog cache updater failed:', error.message);
    return { status: 'error', message: error.message };
  }
}

function parseRssFeed(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
    const itemContent = itemMatch[1];

    let title = 'Untitled';
    const titleCdataMatch = itemContent.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/);
    const titlePlainMatch = itemContent.match(/<title[^>]*>([^<]+)<\/title>/);
    if (titleCdataMatch) {
      title = decodeHtml(titleCdataMatch[1].trim());
    } else if (titlePlainMatch) {
      title = decodeHtml(titlePlainMatch[1].trim());
    }

    const descriptionMatch = itemContent.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
    let description = '';
    let imageUrl = null;

    if (descriptionMatch) {
      const descriptionHtml = descriptionMatch[1];
      const imgMatch = descriptionHtml.match(/<img[^>]+src=["']([^"']+)["']/);
      imageUrl = imgMatch ? imgMatch[1] : null;

      description = descriptionHtml
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    }

    const linkMatch = itemContent.match(/<link[^>]*>([^<]*)<\/link>/);
    const link = linkMatch ? linkMatch[1] : '#';

    const pubDateMatch = itemContent.match(/<pubDate[^>]*>([^<]*)<\/pubDate>/);
    const pubDateStr = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();

    const creatorMatch = itemContent.match(/<creator[^>]*>([^<]*)<\/creator>/);
    const author = creatorMatch ? decodeHtml(creatorMatch[1]) : 'Dream the Wilderness';

    const pubDate = new Date(pubDateStr);

    items.push({
      title,
      description: description.substring(0, 200),
      link,
      pubDate: pubDateStr,
      author,
      image: imageUrl,
      timestamp: pubDate.getTime()
    });
  }

  items.sort((a, b) => b.timestamp - a.timestamp);
  return items;
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
