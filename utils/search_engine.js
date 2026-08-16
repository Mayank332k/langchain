const { Readability } = require("@mozilla/readability");
const { JSDOM, VirtualConsole } = require("jsdom");

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
    body: `q=${encodeURIComponent(query)}&kl=in-en`
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
    const virtualConsole = new VirtualConsole();
    const dom = new JSDOM(html, { url, virtualConsole });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.textContent) {
      return article.textContent.replace(/\s+/g, ' ').trim();
    }
    
    return '';
  } catch (err) {
    return '';
  }
}

async function performWebSearch(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Search query must be a non-empty string');
  }

  const cleanQuery = query.trim();
  const { deepScrape = true, onProgress } = options;
  let baseResults = [];

  onProgress?.({
    phase: 'searching',
    message: `Searching web for "${cleanQuery}"...`
  });

  try {
    baseResults = await scrapeDuckDuckGoHTML(cleanQuery);
  } catch (err) {
    // HTML search failed
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

  if (deepScrape) {
    const topResults = baseResults.slice(0, 5);
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
