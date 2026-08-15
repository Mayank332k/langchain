const { search } = require("duck-duck-scrape");

// Diverse Real-World User-Agents Pool (macOS, Windows, Linux, iOS, Android)
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/AP1A.240505.005) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.122 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; Samsung Galaxy S23) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getNeedleOptions() {
  const ua = getRandomUserAgent();
  const isMobile = ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android');

  return {
    headers: {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://duckduckgo.com/',
      'sec-ch-ua-mobile': isMobile ? '?1' : '?0',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1'
    },
    follow_max: 5,
    open_timeout: 10000,
    read_timeout: 10000
  };
}

function stripTags(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
}

function cleanText(str) {
  if (!str) return '';
  return str.replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
}

/**
 * Deep Web Scraping: Fetch target webpage and extract main article text
 */
async function extractDeepPageContent(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return '';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    clearTimeout(timer);

    if (!response.ok) return '';

    const html = await response.text();

    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<form[\s\S]*?<\/form>/gi, '')
      .replace(/<!--[\s\S]*?-->/gi, '');

    // Extract <p>, <li>, <h2>, <h3> tags for richer content
    const paragraphs = [];
    const contentRegex = /<(?:p|li|h[2-3])[^>]*>([\s\S]*?)<\/(?:p|li|h[2-3])>/gi;
    let match;

    while ((match = contentRegex.exec(cleanHtml)) !== null && paragraphs.length < 12) {
      const text = cleanText(stripTags(match[1]));
      if (text.length > 40) {
        paragraphs.push(text);
      }
    }

    const fullText = paragraphs.join('\n');
    return fullText;
  } catch (err) {
    return '';
  }
}

/**
 * Secondary strategy: Library Scraper (duck-duck-scrape).
 * This depends on DuckDuckGo's internal VQD token flow and is less stable.
 */
async function scrapeDuckDuckGoAPI(query) {
  const needleOpts = getNeedleOptions();
  const searchOptions = {
    time: 'w', // 'w' for week
    region: 'in-en' // India (English)
  };
  const searchResults = await search(query, searchOptions, needleOpts);

  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return [];
  }

  return searchResults.results.map((item, index) => ({
    id: index + 1,
    title: cleanText(item.title || 'No Title'),
    url: item.url || item.rawUrl || '#',
    snippet: cleanText(item.snippet || item.description || '')
  }));
}

/**
 * Primary strategy: Direct HTML Scraper.
 * This endpoint does not require the library's internal VQD token flow.
 */
async function scrapeDuckDuckGoHTML(query) {
  const ua = getRandomUserAgent();
  const response = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'User-Agent': ua,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://html.duckduckgo.com',
      'Referer': 'https://html.duckduckgo.com/'
    },
    body: `q=${encodeURIComponent(query)}&kl=in-en&df=w`
  });

  if (!response.ok) {
    throw new Error(`HTML Scraper HTTP ${response.status}`);
  }

  const html = await response.text();
  const results = [];

  const titleRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex = /<(?:a|td)[^>]+class="(?:result__snippet|result-snippet)"[^>]*>([\s\S]*?)<\/(?:a|td)>/gi;

  const titles = [];
  let m;
  while ((m = titleRegex.exec(html)) !== null) {
    let rawUrl = m[1];
    if (rawUrl.includes('uddg=')) {
      try {
        const u = new URL('https://html.duckduckgo.com' + rawUrl);
        rawUrl = decodeURIComponent(u.searchParams.get('uddg') || rawUrl);
      } catch (e) {
        // ignore
      }
    }
    const title = cleanText(stripTags(m[2]));
    if (title && rawUrl && !rawUrl.includes('duckduckgo.com')) {
      titles.push({ url: rawUrl, title });
    }
  }

  const snippets = [];
  while ((m = snippetRegex.exec(html)) !== null) {
    snippets.push(cleanText(stripTags(m[1])));
  }

  for (let i = 0; i < titles.length && i < 10; i++) {
    results.push({
      id: i + 1,
      title: titles[i].title,
      url: titles[i].url,
      snippet: snippets[i] || ''
    });
  }

  return results;
}

/**
 * Perform Web Text Search with optional Deep Article Content Extraction
 */
async function performWebSearch(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Search query must be a non-empty string');
  }

  const cleanQuery = query.trim();
  const { deepScrape = true, onProgress } = options;
  let baseResults = [];
  let secondaryAttempted = false;

  onProgress?.({
    phase: 'searching',
    message: `Searching web for "${cleanQuery}"...`
  });

  // Prefer the direct HTML endpoint because the library scraper relies on
  // DuckDuckGo's private VQD token format, which changes more often.
  try {
    baseResults = await scrapeDuckDuckGoHTML(cleanQuery);
  } catch (primaryErr) {
    onProgress?.({
      phase: 'fallback',
      message: 'Primary HTML search unavailable, trying secondary search...'
    });

    secondaryAttempted = true;
    try {
      baseResults = await scrapeDuckDuckGoAPI(cleanQuery);
    } catch (secondaryErr) {
      // Both search strategies failed; the empty-result state below handles it.
    }
  }

  // An empty HTML response is also treated as a primary failure so the
  // secondary strategy still gets a chance to return results.
  if ((!baseResults || baseResults.length === 0) && !secondaryAttempted) {
    secondaryAttempted = true;
    try {
      baseResults = await scrapeDuckDuckGoAPI(cleanQuery);
    } catch (secondaryErr) {
      // Both search strategies failed; the empty-result state below handles it.
    }
  }

  if (!baseResults || baseResults.length === 0) {
    onProgress?.({
      phase: 'empty',
      message: 'No web results found.'
    });
    return [];
  }

  onProgress?.({
    phase: 'results',
    message: `Search results found: ${baseResults.length}`
  });

  // Deep Content Extraction for top 3 search results
  if (deepScrape) {
    const topResults = baseResults.slice(0, 3);
    let completedSources = 0;

    onProgress?.({
      phase: 'reading',
      message: `Reading ${topResults.length} relevant source${topResults.length === 1 ? '' : 's'}...`
    });

    const deepContents = await Promise.all(topResults.map(async (result) => {
      const content = await extractDeepPageContent(result.url);
      completedSources += 1;

      onProgress?.({
        phase: 'source_complete',
        message: `Sources read: ${completedSources}/${topResults.length}`
      });

      return content;
    }));

    deepContents.forEach((text, i) => {
      if (text) {
        topResults[i].deepContent = text;
      }
    });
  }

  onProgress?.({
    phase: 'complete',
    message: 'Web research complete'
  });

  return baseResults;
}

module.exports = {
  performWebSearch,
  extractDeepPageContent
};
