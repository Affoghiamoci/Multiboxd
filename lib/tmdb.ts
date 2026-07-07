/**
 * lib/tmdb.ts
 * Client TMDB con cache in-memory.
 * Tutte le chiamate passano language=it-IT (o la lingua configurata).
 */

import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1h TTL

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface StremioMeta {
  id: string;
  type: 'movie' | 'series';
  name: string;
  description?: string;
  releaseInfo?: string;
  imdbRating?: string;
  runtime?: string;
  genres?: string[];
  cast?: string[];
  director?: string[];
  writer?: string[];
  poster?: string;
  background?: string;
  logo?: string;
  trailers?: { source: string; type: string }[];
  links?: { name: string; category: string; url: string }[];
  country?: string;
  language?: string;
}

interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  runtime: number;
  genres: { id: number; name: string }[];
  poster_path: string | null;
  backdrop_path: string | null;
  original_language: string;
  production_countries: { iso_3166_1: string; name: string }[];
  credits?: {
    cast: { name: string; order: number }[];
    crew: { name: string; job: string; department: string }[];
  };
  videos?: {
    results: { key: string; type: string; site: string; official: boolean }[];
  };
  images?: {
    logos: { file_path: string; iso_639_1: string | null; vote_average: number }[];
  };
  external_ids?: { imdb_id: string };
}

interface TmdbTv {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  last_air_date: string;
  vote_average: number;
  episode_run_time: number[];
  genres: { id: number; name: string }[];
  poster_path: string | null;
  backdrop_path: string | null;
  original_language: string;
  origin_country: string[];
  number_of_seasons: number;
  credits?: {
    cast: { name: string; order: number }[];
    crew: { name: string; job: string; department: string }[];
  };
  videos?: {
    results: { key: string; type: string; site: string; official: boolean }[];
  };
  images?: {
    logos: { file_path: string; iso_639_1: string | null; vote_average: number }[];
  };
  created_by?: { name: string }[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function tmdbFetch<T>(path: string, apiKey: string, language: string, extra = ''): Promise<T | null> {
  const cacheKey = `tmdb:${path}:${language}`;
  const cached = cache.get<T>(cacheKey);
  if (cached) return cached;

  const url = `${TMDB_BASE}${path}?api_key=${apiKey}&language=${language}${extra}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data: T = await res.json();
    cache.set(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

export function posterUrl(path: string | null | undefined, size = 'w500'): string | undefined {
  return path ? `${IMG_BASE}/${size}${path}` : undefined;
}

function pickLogo(
  logos: { file_path: string; iso_639_1: string | null; vote_average: number }[] | undefined,
  language: string
): string | undefined {
  if (!logos || logos.length === 0) return undefined;
  const langCode = language.split('-')[0];
  // Preferisci logo nella lingua richiesta, poi inglese, poi qualsiasi
  const sorted = [...logos].sort((a, b) => b.vote_average - a.vote_average);
  const match = sorted.find((l) => l.iso_639_1 === langCode)
    ?? sorted.find((l) => l.iso_639_1 === 'en')
    ?? sorted[0];
  return match ? `${IMG_BASE}/w300${match.file_path}` : undefined;
}

// ─── API pubbliche ────────────────────────────────────────────────────────────

export async function findByImdb(
  imdbId: string,
  apiKey: string,
  language: string
): Promise<{ tmdbId: number; type: 'movie' | 'series'; posterPath?: string; title?: string; description?: string; backgroundPath?: string } | null> {
  const cacheKey = `find:${imdbId}:${language}`;
  const cached = cache.get<{ tmdbId: number; type: 'movie' | 'series'; posterPath?: string; title?: string; description?: string; backgroundPath?: string }>(cacheKey);
  if (cached) return cached;

  const url = `${TMDB_BASE}/find/${imdbId}?api_key=${apiKey}&language=${language}&external_source=imdb_id`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();

    let result: { tmdbId: number; type: 'movie' | 'series'; posterPath?: string; title?: string; description?: string; backgroundPath?: string } | null = null;
    if (data.movie_results?.length > 0) {
      result = { 
        tmdbId: data.movie_results[0].id, 
        type: 'movie', 
        posterPath: data.movie_results[0].poster_path,
        title: data.movie_results[0].title,
        description: data.movie_results[0].overview,
        backgroundPath: data.movie_results[0].backdrop_path
      };
    } else if (data.tv_results?.length > 0) {
      result = { 
        tmdbId: data.tv_results[0].id, 
        type: 'series', 
        posterPath: data.tv_results[0].poster_path,
        title: data.tv_results[0].name,
        description: data.tv_results[0].overview,
        backgroundPath: data.tv_results[0].backdrop_path
      };
    }
    if (result) cache.set(cacheKey, result, 86400);
    return result;
  } catch {
    return null;
  }
}

/** Metadata completi di un film (da IMDb ID) */
export async function getMovieMeta(
  imdbId: string,
  apiKey: string,
  language: string
): Promise<StremioMeta | null> {
  const found = await findByImdb(imdbId, apiKey, language);
  if (!found || found.type !== 'movie') return null;

  const data = await tmdbFetch<TmdbMovie>(
    `/movie/${found.tmdbId}`,
    apiKey,
    language,
    '&append_to_response=credits,videos,images,external_ids'
  );
  if (!data) return null;

  const cast = data.credits?.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 10)
    .map((c) => c.name) ?? [];

  const crew = data.credits?.crew ?? [];
  const directors = crew.filter((c) => c.job === 'Director').map((c) => c.name);
  const writers = crew
    .filter((c) => c.department === 'Writing' || c.job === 'Screenplay')
    .slice(0, 3)
    .map((c) => c.name);

  const trailer = data.videos?.results.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official
  ) ?? data.videos?.results.find((v) => v.site === 'YouTube');

  const year = data.release_date?.split('-')[0] ?? '';
  const country = data.production_countries?.[0]?.iso_3166_1 ?? '';

  return {
    id: imdbId,
    type: 'movie',
    name: data.title,
    description: data.overview,
    releaseInfo: year,
    imdbRating: data.vote_average > 0 ? data.vote_average.toFixed(1) : undefined,
    runtime: data.runtime ? `${data.runtime} min` : undefined,
    genres: data.genres.map((g) => g.name),
    cast,
    director: directors,
    writer: writers,
    poster: posterUrl(data.poster_path, 'w500'),
    background: posterUrl(data.backdrop_path, 'original'),
    logo: pickLogo(data.images?.logos, language),
    trailers: trailer ? [{ source: trailer.key, type: 'Trailer' }] : [],
    country,
    language: data.original_language,
  };
}

/** Metadata completi di una serie TV (da IMDb ID) */
export async function getTvMeta(
  imdbId: string,
  apiKey: string,
  language: string
): Promise<StremioMeta | null> {
  const found = await findByImdb(imdbId, apiKey, language);
  if (!found || found.type !== 'series') return null;

  const data = await tmdbFetch<TmdbTv>(
    `/tv/${found.tmdbId}`,
    apiKey,
    language,
    '&append_to_response=credits,videos,images,external_ids'
  );
  if (!data) return null;

  const cast = data.credits?.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 10)
    .map((c) => c.name) ?? [];

  const directors = data.created_by?.map((c) => c.name) ?? [];

  const trailer = data.videos?.results.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official
  ) ?? data.videos?.results.find((v) => v.site === 'YouTube');

  const startYear = data.first_air_date?.split('-')[0] ?? '';
  const endYear = data.last_air_date?.split('-')[0] ?? '';
  const releaseInfo = endYear && endYear !== startYear ? `${startYear}–${endYear}` : startYear;

  return {
    id: imdbId,
    type: 'series',
    name: data.name,
    description: data.overview,
    releaseInfo,
    imdbRating: data.vote_average > 0 ? data.vote_average.toFixed(1) : undefined,
    runtime: data.episode_run_time?.[0] ? `${data.episode_run_time[0]} min` : undefined,
    genres: data.genres.map((g) => g.name),
    cast,
    director: directors,
    poster: posterUrl(data.poster_path, 'w500'),
    background: posterUrl(data.backdrop_path, 'original'),
    logo: pickLogo(data.images?.logos, language),
    trailers: trailer ? [{ source: trailer.key, type: 'Trailer' }] : [],
    country: data.origin_country?.[0],
    language: data.original_language,
  };
}

/** Dispatch intelligente: prova movie, poi series */
export async function getMeta(
  imdbId: string,
  type: string,
  apiKey: string,
  language: string,
  rpdbKey?: string,
  rpdbStyle?: string,
  rpdbProvider?: string
): Promise<StremioMeta | null> {
  let meta: StremioMeta | null = null;
  if (type === 'movie') {
    meta = await getMovieMeta(imdbId, apiKey, language);
  } else if (type === 'series') {
    meta = await getTvMeta(imdbId, apiKey, language);
  } else {
    // Fallback: prova entrambi
    meta = await getMovieMeta(imdbId, apiKey, language);
    if (!meta) meta = await getTvMeta(imdbId, apiKey, language);
  }

  if (meta && rpdbKey) {
    const style = rpdbStyle || 'poster-default';
    const domain = rpdbProvider === 'opdb' ? 'https://openposterdb.com/api' : 'https://api.ratingposterdb.com';
    meta.poster = `${domain}/${rpdbKey}/imdb/${style}/${imdbId}.jpg`;
  }
  return meta;
}

/** Recupera le raccomandazioni in base a una lista di TMDB IDs e dei loro pesi (voti) */
export async function getRecommendations(
  tmdbSources: { id: number; weight: number }[],
  apiKey: string,
  language: string
): Promise<{ imdbId: string; title: string; year: string; poster: string }[]> {
  const allRecs: { imdbId: string; title: string; year: string; poster: string; score: number }[] = [];
  
  await Promise.all(tmdbSources.map(async ({ id: tmdbId, weight }) => {
    try {
      const data = await tmdbFetch<{ results: any[] }>(`/movie/${tmdbId}/recommendations`, apiKey, language);
      if (data && data.results) {
        for (const item of data.results) {
          if (!item.poster_path || !item.release_date) continue;
          
          const rawScore = item.popularity || 0;
          const weightedScore = rawScore * weight;

          allRecs.push({
            imdbId: `tmdb:${item.id}`,
            title: item.title,
            year: item.release_date.split('-')[0],
            poster: posterUrl(item.poster_path, 'w500') || '',
            score: weightedScore
          });
        }
      }
    } catch { }
  }));

  // Sort by popularity, remove duplicates and sum scores for duplicates (weighted average effect)
  const unique = new Map<string, any>();
  for (const rec of allRecs) {
    const current = unique.get(rec.imdbId);
    if (current) {
      current.score += rec.score;
    } else {
      unique.set(rec.imdbId, { ...rec });
    }
  }

  const sorted = Array.from(unique.values()).sort((a, b) => b.score - a.score);
  return sorted.slice(0, 50);
}
