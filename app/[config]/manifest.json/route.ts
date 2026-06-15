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
  const prefix = config.catalogPrefix || 'Letterboxd';
  
  if (config.catalogs?.watchlist && config.lbUsername) {
    catalogs.push({ 
      type: 'movie', 
      id: 'lb-watchlist', 
      name: `${prefix} - ${config.watchlistName || 'Watchlist'}`, 
      extra: [{ name: 'skip', isRequired: false }] 
    });
  }

  if (config.catalogs?.diary && config.lbUsername) {
    catalogs.push({ 
      type: 'movie', 
      id: 'lb-diary', 
      name: `${prefix} - ${config.diaryName || 'Diary'}`, 
      extra: [{ name: 'skip', isRequired: false }] 
    });
  }

  if (config.catalogs?.friendsActivity && config.lbUsername) {
    catalogs.push({ 
      type: 'movie', 
      id: 'lb-friends', 
      name: `${prefix} - ${config.friendsName || 'Friends'}`, 
      extra: [{ name: 'skip', isRequired: false }] 
    });
  }

  if (config.catalogs?.recommendations && config.tmdbKey && config.lbUsername) {
    catalogs.push({ 
      type: 'movie', 
      id: 'lb-recommendations', 
      name: `${prefix} - ${config.recommendationsName || 'Recommended for You'}`, 
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
        name: `${prefix} - ${customName || fallbackName}`,
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
    version: '0.1.0',
    name: 'Multiboxd',
    description: `Multilingual metadata from TMDB${catalogs.length > 0 ? ' + Letterboxd catalogs' : ''}`,
    logo: 'https://i.imgur.com/ztMoMtI.png',
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
