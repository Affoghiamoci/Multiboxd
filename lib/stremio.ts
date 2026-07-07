/**
 * lib/stremio.ts
 * Client per le API ufficiali di Stremio (api.strem.io).
 * La password dell'utente viene usata SOLO per ottenere un authKey via /api/login:
 * non viene mai salvata né loggata. L'authKey stesso non è persistito server-side,
 * viaggia solo dentro l'URL di installazione codificato dal client (vedi lib/config.ts).
 */

import NodeCache from 'node-cache';

export interface SyncableMeta {
  id: string; // imdb id, es. tt1234567
  name: string;
  poster?: string;
}

const STREMIO_API = 'https://api.strem.io/api';
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 min TTL libreria
const syncCache = new NodeCache({ stdTTL: 900, checkperiod: 120 }); // 15 min TTL dedup sync

export interface StremioLibraryItem {
  id: string;
  type: 'movie' | 'series';
  name: string;
  poster?: string;
  year?: string;
  addedAt: number; // epoch ms, da _ctime
}

export interface StremioAuthResult {
  authKey: string;
  email: string;
}

/** Effettua il login su Stremio e restituisce solo l'authKey (mai la password). */
export async function loginStremio(email: string, password: string): Promise<StremioAuthResult | null> {
  try {
    const res = await fetch(`${STREMIO_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'Login', email, password, facebook: false }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    if (!res.ok || data?.error || !data?.result?.authKey) {
      return null;
    }

    return {
      authKey: data.result.authKey as string,
      email: data.result.user?.email ?? email,
    };
  } catch (err) {
    console.error('[stremio] login error:', err);
    return null;
  }
}

/** Recupera l'intera libreria dell'utente (film + serie, esclusi i rimossi). */
export async function getLibrary(authKey: string): Promise<StremioLibraryItem[]> {
  const cacheKey = `lib:${authKey.slice(0, 12)}`;
  const cached = cache.get<StremioLibraryItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${STREMIO_API}/datastoreGet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DatastoreGet',
        authKey,
        collection: 'libraryItem',
        ids: [],
        all: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error('[stremio] getLibrary datastoreGet failed with status:', res.status);
      return [];
    }
    const data = await res.json();
    const items: any[] = Array.isArray(data?.result) ? data.result : [];

    const mapped: StremioLibraryItem[] = items
      .filter((it) => !it.removed && !it.temp && (it.type === 'movie' || it.type === 'series') && it._id?.startsWith('tt'))
      .map((it) => ({
        id: it._id as string,
        type: it.type as 'movie' | 'series',
        name: it.name as string,
        poster: it.poster ?? undefined,
        year: it.year ? String(it.year) : undefined,
        addedAt: it._ctime ? new Date(it._ctime).getTime() : 0,
      }));

    console.log(`[stremio] getLibrary: ${items.length} raw item(s) from API, ${mapped.length} after filter. Raw ids:`, items.map((it) => `${it._id}(type=${it.type},removed=${it.removed},temp=${it.temp})`).join(', '));

    cache.set(cacheKey, mapped);
    return mapped;
  } catch (err) {
    console.error('[stremio] getLibrary error:', err);
    return [];
  }
}

/**
 * Aggiunge alla Libreria Stremio i film della Watchlist Letterboxd non ancora presenti.
 * Solo aggiunta, mai rimozione. Silenzioso in caso di errore: non deve mai
 * impattare la risposta del catalogo che lo invoca (fire-and-forget).
 * Una cache di dedup evita di ripetere il check ad ogni singola richiesta
 * entro la stessa finestra di 15 minuti.
 */
export async function addMissingToLibrary(authKey: string, metas: SyncableMeta[]): Promise<void> {
  const dedupKey = `sync:${authKey.slice(0, 12)}`;
  if (syncCache.get(dedupKey)) return;
  syncCache.set(dedupKey, true);

  try {
    if (metas.length === 0) return;

    const library = await getLibrary(authKey);
    const existingIds = new Set(library.map((it) => it.id));
    console.log(`[stremio-sync] Watchlist page has ${metas.length} title(s): ${metas.map((m) => m.id).join(', ')}`);
    console.log(`[stremio-sync] Library currently has ${existingIds.size} title(s): ${[...existingIds].join(', ')}`);

    const missing = metas.filter((m) => !existingIds.has(m.id));
    console.log(`[stremio-sync] Diff result: ${missing.length} missing title(s): ${missing.map((m) => m.id).join(', ')}`);
    if (missing.length === 0) return;

    const now = new Date().toISOString();
    const changes = missing.map((m) => ({
      _id: m.id,
      name: m.name,
      type: 'movie',
      poster: m.poster,
      posterShape: 'poster',
      removed: false,
      temp: false,
      _ctime: now,
      _mtime: now,
      state: {
        lastWatched: null,
        timeWatched: 0,
        timeOffset: 0,
        overallTimeWatched: 0,
        timesWatched: 0,
        flaggedWatched: 0,
        duration: 0,
        video_id: null,
        watched: null,
        noNotif: false,
      },
    }));

    const res = await fetch(`${STREMIO_API}/datastorePut`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'DatastorePut', authKey, collection: 'libraryItem', changes }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error('[stremio-sync] datastorePut failed with status:', res.status);
      return;
    }

    const data = await res.json();
    console.log('[stremio-sync] datastorePut raw response:', JSON.stringify(data));
    if (data?.error) {
      console.error('[stremio-sync] datastorePut error:', data.error);
      return;
    }

    cache.del(`lib:${authKey.slice(0, 12)}`); // forza il refresh della libreria al prossimo getLibrary

    // Round-trip di verifica: rileggiamo subito la libreria per confermare che la scrittura sia persistita.
    const refreshed = await getLibrary(authKey);
    const refreshedIds = new Set(refreshed.map((it) => it.id));
    const confirmed = missing.filter((m) => refreshedIds.has(m.id));
    console.log(`[stremio-sync] Added ${missing.length} title(s) to library, ${confirmed.length} confirmed present on re-read.`);
  } catch (err) {
    console.error('[stremio-sync] addMissingToLibrary error:', err);
  }
}
