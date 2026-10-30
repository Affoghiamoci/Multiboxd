import { GET as catalogGET } from '../route';

// Stremio passa gli extra nel percorso: /catalog/movie/id/skip=100.json.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ config: string; type: string; id: string; extra: string }> }
) {
  const { extra, ...catalogParams } = await params;
  const url = new URL(req.url);
  const extras = new URLSearchParams(extra.replace(/\.json$/, ''));
  for (const [key, value] of extras) url.searchParams.set(key, value);
  return catalogGET(new Request(url, { headers: req.headers }), { params: Promise.resolve(catalogParams) });
}
