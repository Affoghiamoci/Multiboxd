/**
 * app/api/auth/stremio/route.ts
 * Proxy di login verso api.strem.io: scambia email+password con un authKey.
 * La password non viene mai salvata né loggata; l'authKey ritornato non è
 * persistito server-side, viene codificato solo nell'URL lato client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginStremio } from '@/lib/stremio';

const rateLimit = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const e = rateLimit.get(ip);
  if (!e || now > e.resetAt) { rateLimit.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 }); return true; }
  if (e.count >= 10) return false;
  e.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 });
  }

  let email: string;
  let password: string;
  try {
    const body = await req.json();
    email = (body.email ?? '').trim();
    password = (body.password ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const result = await loginStremio(email, password);

  if (!result) {
    return NextResponse.json({ error: 'Invalid Stremio credentials.' }, { status: 401 });
  }

  return NextResponse.json({ authKey: result.authKey, email: result.email });
}
