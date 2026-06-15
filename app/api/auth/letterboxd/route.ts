/**
 * app/api/auth/letterboxd/route.ts
 * Secure Letterboxd cookie verification endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/letterboxd';

const rateLimit = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const e = rateLimit.get(ip);
  if (!e || now > e.resetAt) { rateLimit.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 }); return true; }
  if (e.count >= 20) return false;
  e.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 });
  }

  let sessionCookie: string;
  try {
    const body = await req.json();
    sessionCookie = (body.sessionCookie ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Session cookie is required.' }, { status: 400 });
  }

  const result = await verifySessionCookie(sessionCookie);

  if (!result) {
    return NextResponse.json(
      { error: 'Invalid or expired session cookie. Please try getting a new one.' },
      { status: 401 }
    );
  }

  return NextResponse.json({ sessionToken: result.sessionToken, username: result.username });
}
