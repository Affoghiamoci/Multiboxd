/**
 * app/[config]/configure/route.ts
 * Quando Stremio apre il pannello "Configure", rimanda alla home
 * con la configurazione attuale già pre-caricata nell'URL (?restore=).
 */

import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ config: string }> }
) {
  const { config } = await params;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const origin = `${protocol}://${host}`;
  return NextResponse.redirect(`${origin}/?restore=${config}`);
}
