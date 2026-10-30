import type { AddonConfig } from './config';

type PosterOptions = Pick<AddonConfig, 'rpdbKey' | 'rpdbStyle' | 'rpdbProvider' | 'language'>;

export function ratedPosterUrl(id: string, options: PosterOptions): string | undefined {
  if (!options.rpdbKey) return undefined;
  const domain = options.rpdbProvider === 'opdb'
    ? 'https://openposterdb.com' : 'https://api.ratingposterdb.com';
  return `${domain}/${encodeURIComponent(options.rpdbKey)}/imdb/${encodeURIComponent(options.rpdbStyle || 'poster-default')}/${id}.jpg?fallback=true`;
}

export function tmdbPosterUrl(path: string | null | undefined): string | undefined {
  return path && /^\/[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(path)
    ? `https://image.tmdb.org/t/p/w500${path}` : undefined;
}

export function catalogPosterUrl(id: string, path: string | undefined, options: PosterOptions, origin: string): string {
  const fallback = tmdbPosterUrl(path) || `https://images.metahub.space/poster/medium/${id}/img`;
  if (!options.rpdbKey) return fallback;
  // Non includere i token Letterboxd/Stremio nell’URL della locandina.
  const config = Buffer.from(JSON.stringify({
    rpdbKey: options.rpdbKey,
    rpdbStyle: options.rpdbStyle,
    rpdbProvider: options.rpdbProvider,
    language: options.language,
  })).toString('base64url');
  const query = tmdbPosterUrl(path) ? `?tmdb=${encodeURIComponent(path!)}` : '';
  return `${origin}/poster/${config}/${id}.jpg${query}`;
}

export function posterOrigin(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
  const protocol = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  return `${protocol}://${host}`;
}
