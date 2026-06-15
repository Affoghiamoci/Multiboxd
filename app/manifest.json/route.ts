import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const host = req.headers.get('host') || 'multiboxd.fly.dev';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const manifest = {
    id: 'com.multiboxd',
    version: '0.2.2',
    name: 'Multiboxd',
    description: 'Sync your Letterboxd Watchlist, Diary, Friends Activity and custom lists directly into Stremio — no metadata provided, works alongside your existing addons.',
    logo: `${origin}/icon.png`,
    resources: ['catalog'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs: [],
    behaviorHints: {
      configurable: true,
      configurationRequired: true,
    },
    stremioAddonsConfig: {
      issuer: 'https://stremio-addons.net',
      signature: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..rI3nYCw_vgQJgPFC1qWYsQ.E1jpHmWIMH9X7kaChnEAiz8UgvZ7c1bg87Hl16jc8TaJ-TyEukdSVS-HYpqDgWVDDrRmJP5UTMGXvyrmHEF1FWLs-cKmGt6O614xc69XV6M0RbO8kt-M3Fk33p4Uaxvy.NZgirOzGtbfIfzAm7QcOOg',
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'max-age=86400',
    },
  });
}
