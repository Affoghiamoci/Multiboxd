/**
 * app/[config]/manifest.json/route.ts
 * Manifest Stremio dinamico basato sulla configurazione dell'utente.
 */

import { NextResponse } from 'next/server';
import { decodeConfig, isConfigValid } from '@/lib/config';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ config: string }> }
) {
  const { config: configStr } = await params;
  const config = decodeConfig(configStr);

  const host = req.headers.get('host') || 'multiboxd.fly.dev';
  const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const origin = `${protocol}://${host}`;

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

  if (config.catalogs?.watched && config.lbUsername) {
    catalogs.push({ 
      type: 'movie', 
      id: 'lb-watched', 
      name: formatName(config.watchedName || 'Watched'), 
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
    version: '0.3.1',
    name: 'Multiboxd',
    description: 'Sync your Letterboxd Watchlist, Diary, Friends Activity and custom lists directly into Stremio — no metadata provided, works alongside your existing addons.',
    logo: `${origin}/icon.png`,
    resources: ['catalog'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs,
    behaviorHints: {
      configurable: true,
      configurationRequired: false,
    },
    stremioAddonsConfig: {
      issuer: 'https://stremio-addons.net',
      signature: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..rI3nYCw_vgQJgPFC1qWYsQ.E1jpHmWIMH9X7kaChnEAiz8UgvZ7c1bg87Hl16jc8TaJ-TyEukdSVS-HYpqDgWVDDrRmJP5UTMGXvyrmHEF1FWLs-cKmGt6O614xc69XV6M0RbO8kt-M3Fk33p4Uaxvy.NZgirOzGtbfIfzAm7QcOOg',
    },
  };

  if (!isConfigValid(config)) {
    manifest.behaviorHints.configurationRequired = true;
  }

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'max-age=86400',
    },
  });
}
