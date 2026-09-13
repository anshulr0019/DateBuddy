import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { redis, fallbackRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const SIGNAL_TTL = 90;

function userInboxKey(userId: number) {
  return `call:inbox:v2:${userId}`;
}

async function getAndClear(key: string): Promise<any> {
  if (redis) {
    try {
      return await redis.lpop<any>(key, 100);
    } catch { /* fall through */ }
  }
  const raw = await fallbackRedis.get<any>(key);
  if (raw !== null) await fallbackRedis.del(key);
  return raw;
}

/**
 * GET /api/calls/incoming
 * Returns pending global call signals for the authenticated user regardless of matchId.
 * Offers display incoming calls; end/decline signals dismiss stale ringing UI.
 */
export async function GET(_request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const key = userInboxKey(session.userId);
  const raw = await getAndClear(key);

  let signals: any[] = [];
  if (raw) {
    if (Array.isArray(raw)) {
      signals = raw;
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        signals = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        signals = [];
      }
    } else {
      signals = [raw];
    }
  }

  const globalSignals = signals.filter((s) => ['offer', 'end', 'decline'].includes(s.type));
  return NextResponse.json({ success: true, signals: globalSignals });
}
