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
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/?restore=${config}`);
}
