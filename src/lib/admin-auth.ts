import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

/*
  Admin API access. There is deliberately no fallback secret: without
  ADMIN_SECRET (16+ characters) every admin request is refused. The key is
  read from the x-admin-key header only — query strings end up in logs.
*/
export function isAdminRequest(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 16) return false;
  const provided = request.headers.get('x-admin-key');
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
