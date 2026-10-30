import { NextResponse } from 'next/server';
import { decodeConfig } from '@/lib/config';
import { findByImdb } from '@/lib/tmdb';
import { ratedPosterUrl, tmdbPosterUrl } from '@/lib/posters';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ config: string; id: string }> }
) {
  const { config: encoded, id: rawId } = await params;
  const id = rawId.replace(/\.jpg$/, '');
  if (!/^tt\d{7,}$/.test(id)) return new NextResponse(null, { status: 400 });
  const config = decodeConfig(encoded);
  const rated = ratedPosterUrl(id, config);
  if (rated) {
    try {
      const response = await fetch(rated, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && /^image\/(jpeg|png|webp)(?:;|$)/i.test(contentType)) {
        const image = await response.arrayBuffer();
        if (image.byteLength) {
          return new NextResponse(image, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } else {
        await response.body?.cancel();
      }
    } catch { /* Provider non disponibile: usa TMDB. */ }
  }
  let fallback = tmdbPosterUrl(new URL(req.url).searchParams.get('tmdb'));
  if (!fallback && process.env.TMDB_API_KEY) {
    const data = await findByImdb(id, process.env.TMDB_API_KEY, config.language || 'it-IT');
    fallback = tmdbPosterUrl(data?.posterPath);
  }
  return NextResponse.redirect(fallback || `https://images.metahub.space/poster/medium/${id}/img`, {
    status: 302,
    headers: { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' },
  });
}
