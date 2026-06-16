/**
 * app/[config]/catalog/[type]/[id]/route.ts
 * Handler cataloghi Letterboxd.
 * Stremio chiama: /catalog/{type}/{id}.json?skip=N
 */

import { NextResponse } from 'next/server';
import { decodeConfig, isConfigValid } from '@/lib/config';
import {
  getFriendsActivity,
  getWatchlist,
  getDiary,
  getWatched,
  getPublicList,
  getAllWatchedFilms,
  getAllPublicListFilms,
  resolveImdbIds,
  LbFilm,
} from '@/lib/letterboxd';
import { findByImdb, posterUrl, getRecommendations } from '@/lib/tmdb';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

const PAGE_SIZE = 20;

function skipToPage(skip: number): number {
  return Math.floor(skip / PAGE_SIZE) + 1;
}



export async function GET(
  req: Request,
  { params }: { params: Promise<{ config: string; type: string; id: string }> }
) {
  const { config: configStr, id: rawId } = await params;
  const id = rawId.replace(/\.json$/, '');
  const url = new URL(req.url);
  const skip = parseInt(url.searchParams.get('skip') ?? '0', 10);
  const page = skipToPage(skip);

  const config = decodeConfig(configStr);

  if (!isConfigValid(config)) {
    return NextResponse.json({ metas: [] }, { headers: CORS });
  }

  let films: LbFilm[] = [];

  try {
    if (id === 'lb-friends' && config.lbUsername) {
      films = await getFriendsActivity(config.lbSessionToken, page, config.lbUsername);
    } else if (id === 'lb-watchlist' && config.lbUsername) {
      films = await getWatchlist(config.lbUsername, config.lbSessionToken, page);
    } else if (id === 'lb-diary' && config.lbUsername) {
      films = await getDiary(config.lbUsername, config.lbSessionToken, page);
    } else if (id === 'lb-watched' && config.lbUsername) {
      films = await getWatched(config.lbUsername, config.lbSessionToken, page);
    } else if (id === 'lb-recommendations' && config.lbUsername && config.tmdbKey) {
      // 1. Fetch Diary (page 1)
      const diary = await getDiary(config.lbUsername, undefined, 1);
      
      // 2. Resolve IMDB IDs for all diary movies on page 1
      const resolvedDiary = await resolveImdbIds(diary, undefined);
      
      // 3. Find TMDB IDs for all diary movies on page 1 to filter them out of recommendations
      const diaryTmdbIds = new Set<number>();
      await Promise.all(resolvedDiary.map(async (f) => {
        if (!f.imdbId) return;
        try {
          const tmdbData = await findByImdb(f.imdbId, config.tmdbKey!, config.language || 'it-IT');
          if (tmdbData?.tmdbId) {
            diaryTmdbIds.add(tmdbData.tmdbId);
          }
        } catch {}
      }));

      // 4. Sort by rating (highest first) and take the top 10 rated movies.
      // If a movie has no rating, assume a default weight (e.g. 5/10).
      const topRated = resolvedDiary
        .map(f => ({ ...f, weight: f.rating ? f.rating / 10 : 0.5 }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 10);

      // 5. Convert IMDB IDs to TMDB IDs and keep their weights
      const tmdbSources: { id: number; weight: number }[] = [];
      await Promise.all(topRated.map(async (f) => {
        if (!f.imdbId) return;
        try {
          const tmdbData = await findByImdb(f.imdbId, config.tmdbKey!, config.language || 'it-IT');
          if (tmdbData?.tmdbId) {
            tmdbSources.push({ id: tmdbData.tmdbId, weight: (f as any).weight ?? 0.5 });
          }
        } catch {}
      }));

      // 6. Fetch weighted recommendations
      const recs = await getRecommendations(tmdbSources, config.tmdbKey, config.language || 'it-IT');
      
      const allWatchedFilms = await getAllWatchedFilms(config.lbUsername);
      const normalizeTitle = (t: string) => t.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();

      // 7. Filter out recommendations that are already in the diary or watched list
      const filteredRecs = recs.filter(r => {
        const tmdbIdStr = r.imdbId.startsWith('tmdb:') ? r.imdbId.split(':')[1] : null;
        if (tmdbIdStr) {
          const tmdbId = parseInt(tmdbIdStr, 10);
          if (diaryTmdbIds.has(tmdbId)) return false;
        }
        
        const rTitleNorm = normalizeTitle(r.title);
        const isWatched = allWatchedFilms.some(w => 
          normalizeTitle(w.title) === rTitleNorm && 
          w.year === r.year
        );
        
        return !isWatched;
      });

      return NextResponse.json(
        { metas: filteredRecs.map(r => ({ id: r.imdbId, type: 'movie' as const, name: r.title, poster: r.poster, releaseInfo: r.year })) },
        { headers: { ...CORS, 'Cache-Control': 'max-age=900, stale-while-revalidate=3600' } }
      );
    } else if (id.startsWith('lb-list-')) {
      const slug = id.replace('lb-list-', '').replace(/__/g, '/');

      // Check if shuffle is enabled for this custom list
      const listEntry = config.catalogs.customLists.find(l => {
        const s = typeof l === 'string' ? l : l.slug;
        return s === slug;
      });
      const shouldShuffle = listEntry && typeof listEntry === 'object' && listEntry.shuffle;

      // Fetch ALL films from all pages to shuffle the entire list, or to guarantee perfect pagination
      const allFilms = await getAllPublicListFilms(slug);
        
      if (shouldShuffle && allFilms.length > 1) {
        // Seeded shuffle (consistent per day) using a simple hash
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        let seed = 0;
        const seedStr = slug + today;
        for (let i = 0; i < seedStr.length; i++) {
          seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;
        }
        // Simple seeded PRNG (mulberry32)
        const mulberry32 = (s: number) => {
          return () => {
            s |= 0; s = s + 0x6D2B79F5 | 0;
            let t = Math.imul(s ^ s >>> 15, 1 | s);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
          };
        };
        const rng = mulberry32(seed);
        // Fisher-Yates shuffle
        for (let i = allFilms.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [allFilms[i], allFilms[j]] = [allFilms[j], allFilms[i]];
        }
      }
        
      // Paginate the list (whether shuffled or not)
      films = allFilms.slice(skip, skip + 100);
    }

    const resolved = await resolveImdbIds(films, config.lbSessionToken);

    // Se abbiamo la chiave TMDB, proviamo a scaricare i poster localizzati
    const metas = resolved.filter((f) => f.imdbId).map((f) => ({
      id: f.imdbId!,
      type: 'movie' as const,
      name: f.title,
      poster: `https://images.metahub.space/poster/medium/${f.imdbId}/img`,
      releaseInfo: f.year,
    }));

    if (config.tmdbKey || config.rpdbKey) {
      await Promise.all(metas.map(async (m) => {
        try {
          if (config.rpdbKey) {
            const style = config.rpdbStyle || 'poster-default';
            const domain = config.rpdbProvider === 'opdb' ? 'https://openposterdb.com/api' : 'https://api.ratingposterdb.com';
            m.poster = `${domain}/${config.rpdbKey}/imdb/${style}/${m.id}.jpg`;
          }

          if (config.tmdbKey) {
            const tmdbData = await findByImdb(m.id, config.tmdbKey, config.language || 'it-IT');
            if (!config.rpdbKey && tmdbData?.posterPath) {
              const url = posterUrl(tmdbData.posterPath, 'w500');
              if (url) m.poster = url;
            }
            if (tmdbData?.title) {
              m.name = tmdbData.title;
            }
          }
        } catch {
          // Ignora errori e usa Metahub fallback
        }
      }));
    }

    return NextResponse.json(
      { metas },
      {
        headers: {
          ...CORS,
          'Cache-Control': 'max-age=900, stale-while-revalidate=3600',
        },
      }
    );
  } catch (err) {
    console.error('[catalog] error:', err);
    return NextResponse.json({ metas: [] }, { headers: CORS });
  }
}
