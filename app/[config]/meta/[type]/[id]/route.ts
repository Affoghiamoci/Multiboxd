/**
 * app/[config]/meta/[type]/[id]/route.ts
 * Handler metadata: recupera da TMDB nella lingua configurata dall'utente.
 */

import { NextResponse } from 'next/server';
import { decodeConfig, isConfigValid } from '@/lib/config';
import { getMeta } from '@/lib/tmdb';

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
      { err: 'TMDB key missing. Please reconfigure the addon.' },
      { status: 400, headers: CORS }
    );
  }

  if (!id.startsWith('tt')) {
    return NextResponse.json({ meta: null }, { headers: CORS });
  }

  const meta = await getMeta(id, type, config.tmdbKey ?? '', config.language ?? 'it-IT');

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
