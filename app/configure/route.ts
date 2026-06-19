import { NextResponse } from 'next/server';

export function GET(req: Request) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const origin = `${protocol}://${host}`;
  return NextResponse.redirect(`${origin}/`);
}
