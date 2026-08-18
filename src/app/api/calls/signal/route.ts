import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { redis, fallbackRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const SIGNAL_TTL = 90; // seconds — signals expire if not consumed

function signalKey(matchId: number, receiverId: number) {
  return `call:signals:${matchId}:${receiverId}`;
}

async function getAndClear(key: string): Promise<string | null> {
  if (redis) {
    try {
      const raw = await redis.get<string>(key);
      if (raw !== null) await redis.del(key);
      return raw;
    } catch { /* fall through */ }
  }
  const raw = await fallbackRedis.get<string>(key);
  if (raw !== null) await fallbackRedis.del(key);
  return raw;
}

async function appendSignal(key: string, signal: object): Promise<void> {
  if (redis) {
    try {
      const existing = await redis.get<string>(key);
      const list = existing ? JSON.parse(existing) : [];
      list.push(signal);
      await redis.set(key, JSON.stringify(list), { ex: SIGNAL_TTL });
      return;
    } catch { /* fall through */ }
  }
  const existing = await fallbackRedis.get<string>(key);
  const list = existing ? JSON.parse(existing) : [];
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
  const signals = raw ? JSON.parse(raw) : [];

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

    const signal = {
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: session.userId,
      type,
      callType,
      data,
    };

    const key = signalKey(Number(matchId), Number(receiverId));
    await appendSignal(key, signal);

    return NextResponse.json({ success: true, signalId: signal.id });
  } catch (error) {
    console.error('Error sending call signal:', error);
    return NextResponse.json({ success: false, message: 'Failed to send signal' }, { status: 500 });
  }
}
