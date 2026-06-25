import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { ok: true, addon: 'multiboxd', ts: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
