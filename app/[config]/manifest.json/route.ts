/**
 * app/[config]/manifest.json/route.ts
 * Manifest Stremio dinamico basato sulla configurazione dell'utente.
 */

import { NextResponse } from 'next/server';
import { decodeConfig, isConfigValid } from '@/lib/config';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ config: string }> }
) {
  const { config: configStr } = await params;
  const config = decodeConfig(configStr);

  const catalogs = [];

  // Letterboxd
  const prefix = config.catalogPrefix || 'Multiboxd';
  
  const formatName = (catalogName: string) => {
    if (config.hideAddonName) return catalogName;
    if (config.hideHyphen) return `${prefix} ${catalogName}`;
    return `${prefix} - ${catalogName}`;
  };

  if (config.catalogs?.watchlist && config.lbUsername) {
    catalogs.push({ 
      type: 'movie', 
      id: 'lb-watchlist', 
      name: formatName(config.watchlistName || 'Watchlist'), 
      extra: [{ name: 'skip', isRequired: false }] 
    });
  }

  if (config.catalogs?.diary && config.lbUsername) {
    catalogs.push({ 
      type: 'movie', 
      id: 'lb-diary', 
      name: formatName(config.diaryName || 'Diary'), 
      extra: [{ name: 'skip', isRequired: false }] 
    });
  }

  if (config.catalogs?.friendsActivity && config.lbUsername) {
    catalogs.push({ 
      type: 'movie', 
      id: 'lb-friends', 
      name: formatName(config.friendsName || 'Friends'), 
      extra: [{ name: 'skip', isRequired: false }] 
    });
  }

  if (config.catalogs?.recommendations && config.tmdbKey && config.lbUsername) {
    catalogs.push({ 
      type: 'movie', 
      id: 'lb-recommendations', 
      name: formatName(config.recommendationsName || 'Recommended for You'), 
      extra: [{ name: 'skip', isRequired: false }] 
    });
  }

  // Custom lists
  if (config.catalogs?.customLists) {
    config.catalogs.customLists.forEach(list => {
      // Compatibilità con stringhe legacy
      const slug = typeof list === 'string' ? list : list.slug;
      const customName = typeof list === 'object' && list.name ? list.name : null;
      
      const fallbackName = slug
        .split('/')
        .filter(Boolean)
        .pop()
        ?.split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || 'List';
        
      const safeSlug = slug.replace(/\//g, '__');
      catalogs.push({
        type: 'movie',
        id: `lb-list-${safeSlug}`,
        name: formatName(customName || fallbackName),
        extra: [{ name: 'skip', isRequired: false }]
      });
    });
  }

  if (config.catalogOrder && Array.isArray(config.catalogOrder)) {
    catalogs.sort((a, b) => {
      const idxA = config.catalogOrder!.indexOf(a.id);
      const idxB = config.catalogOrder!.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  const manifest = {
    id: 'com.multiboxd',
    version: '0.2.0',
    name: 'Multiboxd',
    description: 'Sync your Letterboxd Watchlist, Diary, Friends Activity and custom lists directly into Stremio — no metadata provided, works alongside your existing addons.',
    logo: 'https://multiboxd.fly.dev/icon.png',
    resources: ['catalog'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs,
    behaviorHints: {
      configurable: true,
      configurationRequired: false,
    },
  };

  if (!isConfigValid(config)) {
    return NextResponse.json(
      { error: 'Chiave TMDB mancante o non valida. Riconfigura l\'addon.' },
      { status: 400 }
    );
  }

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'max-age=86400',
    },
  });
}
