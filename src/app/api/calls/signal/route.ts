import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { redis, fallbackRedis } from '@/lib/redis';
import { triggerCallSignal, triggerGlobalCallSignal } from '@/lib/pusher-server';
import { db } from '@/db';
import { users, photos } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const SIGNAL_TTL = 90; // seconds — signals expire if not consumed

function signalKey(matchId: number, receiverId: number) {
  return `call:signals:${matchId}:${receiverId}`;
}

function userInboxKey(userId: number) {
  return `call:inbox:${userId}`;
}

async function getAndClear(key: string): Promise<any> {
  if (redis) {
    try {
      const raw = await redis.get<any>(key);
      if (raw !== null) await redis.del(key);
      return raw;
    } catch { /* fall through */ }
  }
  const raw = await fallbackRedis.get<any>(key);
  if (raw !== null) await fallbackRedis.del(key);
  return raw;
}

async function appendSignal(key: string, signal: object): Promise<void> {
  if (redis) {
    try {
      const existing = await redis.get<any>(key);
      const list = Array.isArray(existing)
        ? existing
        : typeof existing === 'string'
        ? JSON.parse(existing)
        : existing
        ? [existing]
        : [];
      list.push(signal);
      await redis.set(key, JSON.stringify(list), { ex: SIGNAL_TTL });
      return;
    } catch { /* fall through */ }
  }
  const existing = await fallbackRedis.get<any>(key);
  const list = Array.isArray(existing)
    ? existing
    : typeof existing === 'string'
    ? JSON.parse(existing)
    : existing
    ? [existing]
    : [];
  list.push(signal);
  await fallbackRedis.set(key, JSON.stringify(list), { ex: SIGNAL_TTL });
}

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const matchId = Number(searchParams.get('matchId'));
  if (!matchId) {
    return NextResponse.json({ success: false, message: 'Missing matchId' }, { status: 400 });
  }

  const key = signalKey(matchId, session.userId);
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

  return NextResponse.json({ success: true, signals });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { matchId, receiverId, type, callType = 'video', data } = body;

    if (!matchId || !receiverId || !type) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    // For 'offer' signals, attach the caller's name + photo so the receiver
    // can show a proper "X is calling" banner from any page.
    let callerName: string | null = null;
    let callerPhoto: string | null = null;
    if (type === 'offer') {
      try {
        const [callerUser] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, session.userId))
          .limit(1);

        const [callerPhotoRow] = await db
          .select({ url: photos.url })
          .from(photos)
          .where(eq(photos.userId, session.userId))
          .orderBy(photos.orderIndex)
          .limit(1);

        callerName = callerUser?.name ?? null;
        callerPhoto = callerPhotoRow?.url ?? null;
      } catch {
        /* non-critical; banner will show generic name */
      }
    }

    const signal: Record<string, any> = {
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: session.userId,
      receiverId: Number(receiverId),
      matchId: Number(matchId),
      type,
      callType,
      data,
      ...(type === 'offer' && {
        callerName,
        callerPhoto,
      }),
    };

    // 1. Store signal in match-specific key (consumed by chat page polling)
    const key = signalKey(Number(matchId), Number(receiverId));
    await appendSignal(key, signal);

    // 2. If this is an offer, also write to the global user inbox
    //    (consumed by GlobalCallListener polling from any page)
    if (type === 'offer') {
      await appendSignal(userInboxKey(Number(receiverId)), signal);
    }

    // 3. Realtime instant delivery via Pusher — both channels
    try {
      await triggerCallSignal(Number(matchId), Number(receiverId), signal);
    } catch {
      /* Fallback to polling */
    }

    if (type === 'offer') {
      try {
        await triggerGlobalCallSignal(Number(receiverId), signal);
      } catch {
        /* Fallback to polling */
      }
    }

    return NextResponse.json({ success: true, signalId: signal.id });
  } catch (error) {
    console.error('Error sending call signal:', error);
    return NextResponse.json({ success: false, message: 'Failed to send signal' }, { status: 500 });
  }
}
