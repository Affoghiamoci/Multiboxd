/**
 * app/[config]/meta/[type]/[id]/route.ts
 * Handler metadata: recupera da TMDB nella lingua configurata dall'utente.
 */

import { NextResponse } from 'next/server';
import { decodeConfig, isConfigValid } from '@/lib/config';
import { getMeta } from '@/lib/tmdb';

// La TMDB API key è caricata dalle variabili d'ambiente — mai hardcoded nel codice sorgente.
const TMDB_API_KEY = process.env.TMDB_API_KEY!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ config: string; type: string; id: string }> }
) {
  const { config: configStr, type, id: rawId } = await params;
  const id = rawId.replace(/\.json$/, '');
  const config = decodeConfig(configStr);

  if (!isConfigValid(config)) {
    return NextResponse.json(
      { err: 'Invalid configuration. Please reconfigure the addon.' },
      { status: 400, headers: CORS }
    );
  }

  if (!id.startsWith('tt')) {
    return NextResponse.json({ meta: null }, { headers: CORS });
  }

  const meta = await getMeta(id, type, TMDB_API_KEY, config.language ?? 'it-IT', config.rpdbKey, config.rpdbStyle, config.rpdbProvider);

  if (!meta) {
    return NextResponse.json({ meta: null }, { headers: CORS });
  }

  return NextResponse.json(
    { meta },
    {
      headers: {
        ...CORS,
        'Cache-Control': 'max-age=3600, stale-while-revalidate=86400',
      },
    }
  );
}
