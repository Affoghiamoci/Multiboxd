/**
 * lib/letterboxd.ts — Letterboxd scraping + auth
 */

import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';
import https from 'https';

const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

const LB_BASE = 'https://letterboxd.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export interface LbFilm {
  letterboxdSlug: string;
  title: string;
  year?: string;
  poster?: string;
  imdbId?: string;
  rating?: number;
}

// ─── Low-level HTTP ───────────────────────────────────────────────────────────

interface HttpResponse {
  status: number;
  headers: Record<string, string | string[]>;
  body: string;
}

function httpRequest(
  url: string,
  opts: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: opts.method ?? 'GET',
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...opts.headers,
      },
    };

    if (opts.body) {
      (options.headers as Record<string, string>)['Content-Length'] = String(Buffer.byteLength(opts.body));
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers as Record<string, string | string[]>,
          body: data,
        })
      );
    });

    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// ─── Auth (Session Cookie Verification) ───────────────────────────────────────

export interface LbAuthResult {
  sessionToken: string;
  username: string;
}

export async function verifySessionCookie(cookieValue: string): Promise<LbAuthResult | null> {
  try {
    // Se l'utente incolla l'intera stringa "Cookie: ...", usiamola così com'è.
    // Altrimenti se è un singolo valore senza '=', supponiamo fosse il vecchio session token.
    let sessionToken = cookieValue.trim();
    if (sessionToken.toLowerCase().startsWith('cookie: ')) {
      sessionToken = sessionToken.substring(8).trim();
    } else if (!sessionToken.includes('=')) {
      sessionToken = `letterboxd.session=${sessionToken}`;
    }

    // Prova a estrarre lo username direttamente dal cookie per saltare la fetch della homepage
    // (la homepage è spesso bloccata più duramente da Cloudflare)
    const match = sessionToken.match(/letterboxd\.signed\.in\.as=([^;]+)/i);
    if (match && match[1]) {
      const username = match[1].trim();
      console.log('[lb-auth] Verified session via regex for user:', username);
      return { sessionToken, username };
    }

    // Fallback: Request the homepage with the cookie
    const res = await httpRequest(`${LB_BASE}/`, {
      headers: { Cookie: sessionToken },
    });

    if (res.status !== 200) {
      console.error('[lb-auth] verify failed with status:', res.status);
      return null;
    }

    const $ = cheerio.load(res.body);
    
    // If not signed in, the nav-signed-in class won't exist
    if ($('.nav-signed-in').length === 0) {
      console.error('[lb-auth] Invalid cookie: not signed in');
      return null;
    }

    // Extract username from the account navigation link (e.g. /username/)
    const accountLink = $('.nav-account a[href^="/"]').attr('href');
    if (!accountLink) {
      console.error('[lb-auth] Signed in but could not extract username');
      return null;
    }

    const username = accountLink.replace(/\//g, '');
    
    console.log('[lb-auth] Verified session for user:', username);
    return { sessionToken, username };
  } catch (err) {
    console.error('[lb-auth] Verify error:', err);
    return null;
  }
}

// ─── Film grid extraction ─────────────────────────────────────────────────────

function extractFilmsFromGrid($: cheerio.CheerioAPI): LbFilm[] {
  const films: LbFilm[] = [];
  $('li.poster-container, div.film-poster, ul.poster-list li, .react-component[data-component-class="LazyPoster"]').each((_, el) => {
    const item = $(el);
    const slug =
      item.find('[data-film-slug]').attr('data-film-slug') ??
      item.attr('data-film-slug') ??
      item.attr('data-item-slug');
    const title =
      item.find('img').attr('alt') ??
      item.find('[data-film-name]').attr('data-film-name') ??
      item.attr('data-item-name') ??
      '';
    const poster = 
      item.find('img[src]').attr('src') ??
      item.attr('data-empty-poster-src');
    const year = item.find('.year').text().trim() || undefined;

    let rating: number | undefined;
    const ratingEl = item.closest('li, tr').find('.rating[class*="rated-"]');
    if (ratingEl.length) {
      const match = ratingEl.attr('class')?.match(/rated-(\d+)/);
      if (match) rating = parseInt(match[1], 10);
    }

    if (slug) films.push({ letterboxdSlug: slug, title, year, poster, rating });
  });
  return films;
}

// ─── Resolve IMDb ID ──────────────────────────────────────────────────────────

async function resolveImdb(slug: string, sessionToken?: string): Promise<string | undefined> {
  const cacheKey = `lb:imdb:${slug}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  try {
    const res = await httpRequest(`${LB_BASE}/film/${slug}/`, {
      headers: sessionToken ? { Cookie: sessionToken } : {},
    });
    if (res.status !== 200) return undefined;

    const $ = cheerio.load(res.body);
    let imdbId: string | undefined;

    $('a[href*="imdb.com/title/tt"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const m = href.match(/tt\d{7,}/);
      if (m) { imdbId = m[0]; return false; }
    });

    if (!imdbId) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() ?? '{}');
          const sameAs: string[] = Array.isArray(data.sameAs) ? data.sameAs : [];
          const match = sameAs.find((u: string) => u.includes('imdb.com/title/tt'));
          if (match) imdbId = match.match(/tt\d{7,}/)?.[0];
        } catch { /* skip */ }
      });
    }

    if (imdbId) cache.set(cacheKey, imdbId, 86400);
    return imdbId;
  } catch {
    return undefined;
  }
}

// ─── Catalog fetchers ─────────────────────────────────────────────────────────

async function lbGet(path: string, sessionToken?: string): Promise<string | null> {
  const url = `${LB_BASE}${path}`;
  console.log(`[lbGet] Requesting ${url}`);
  try {
    const res = await httpRequest(url, {
      headers: sessionToken ? { Cookie: sessionToken } : {},
    });
    console.log(`[lbGet] Response for ${url}: status ${res.status}`);
    if (res.status === 404 || res.status === 403) return null;
    return res.body;
  } catch (err) {
    console.log(`[lbGet] Error for ${url}:`, err);
    return null;
  }
}

export async function getWatchlist(username: string, _sessionToken?: string, page = 1): Promise<LbFilm[]> {
  const cacheKey = `lb:watchlist:${username}:${page}`;
  const cached = cache.get<LbFilm[]>(cacheKey);
  if (cached) return cached;
  const urlPath = page === 1 ? `/${username}/watchlist/` : `/${username}/watchlist/page/${page}/`;
  const html = await lbGet(urlPath);
  if (!html) return [];
  const films = extractFilmsFromGrid(cheerio.load(html));
  cache.set(cacheKey, films);
  return films;
}

export async function getDiary(username: string, _sessionToken?: string, page = 1): Promise<LbFilm[]> {
  const cacheKey = `lb:diary:${username}:${page}`;
  const cached = cache.get<LbFilm[]>(cacheKey);
  if (cached) return cached;
  // Use /diary/ for page 1 to bypass Cloudflare 403 blocks on /diary/page/1/
  const urlPath = page === 1 ? `/${username}/diary/` : `/${username}/diary/page/${page}/`;
  const html = await lbGet(urlPath);
  if (!html) return [];
  const $ = cheerio.load(html);
  const films = extractFilmsFromGrid($);
  cache.set(cacheKey, films);
  return films;
}

export async function getFriendsActivity(_sessionToken?: string, page = 1, username?: string): Promise<LbFilm[]> {
  if (!username || page > 1) return [];
  const cacheKey = `lb:friends:${username}`;
  const cached = cache.get<LbFilm[]>(cacheKey);
  if (cached) return cached;

  const followingHtml = await lbGet(`/${username}/following/`);
  if (!followingHtml) return [];

  const $ = cheerio.load(followingHtml);
  const friends: string[] = [];
  $('a.avatar').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const match = href.match(/^\/([^\/]+)\/$/);
      // Exclude the user's own profile (appears in nav) and duplicates
      if (match && match[1].toLowerCase() !== username.toLowerCase()) {
        if (!friends.includes(match[1])) friends.push(match[1]);
      }
    }
  });

  const allFilms: LbFilm[] = [];
  const topFriends = friends.slice(0, 10);
  
  await Promise.all(topFriends.map(async (friend) => {
    try {
      const diary = await getDiary(friend, undefined, 1);
      allFilms.push(...diary.slice(0, 5));
    } catch {}
  }));

  for (let i = allFilms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allFilms[i], allFilms[j]] = [allFilms[j], allFilms[i]];
  }

  cache.set(cacheKey, allFilms, 600);
  return allFilms;
}

export async function getPublicList(listUrl: string, page = 1): Promise<LbFilm[]> {
  const base = listUrl.replace(/\/?$/, '');
  const path = base.startsWith('http')
    ? new URL(base).pathname.replace(/\/?$/, '')
    : `/${base.replace(/^\//, '')}`;
  const cacheKey = `lb:list:${path}:${page}`;
  const cached = cache.get<LbFilm[]>(cacheKey);
  if (cached) return cached;
  const urlPath = page === 1 ? `${path}/` : `${path}/page/${page}/`;
  const html = await lbGet(urlPath);
  if (!html) return [];
  const films = extractFilmsFromGrid(cheerio.load(html));
  cache.set(cacheKey, films);
  return films;
}

export async function resolveImdbIds(films: LbFilm[], sessionToken?: string, concurrency = 5): Promise<LbFilm[]> {
  const results: LbFilm[] = [];
  console.log(`[resolveImdbIds] Resolving ${films.length} films...`);
  for (let i = 0; i < films.length; i += concurrency) {
    const batch = films.slice(i, i + concurrency);
    const resolved = await Promise.all(
      batch.map(async (f) => {
        const imdbId = await resolveImdb(f.letterboxdSlug, sessionToken);
        console.log(`[resolveImdbIds] Film ${f.letterboxdSlug} -> ${imdbId}`);
        return { ...f, imdbId };
      })
    );
    results.push(...resolved);
  }
  return results.filter((f) => !!f.imdbId);
}
