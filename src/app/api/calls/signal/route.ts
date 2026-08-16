import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// In-memory signaling store for 0ms ultra-fast WebRTC handshake (cleared after delivery)
interface SignalPayload {
  id: string;
  matchId: number;
  senderId: number;
  receiverId: number;
  type: 'offer' | 'answer' | 'candidate' | 'end' | 'decline' | 'calling';
  callType: 'audio' | 'video';
  data: any;
  timestamp: number;
}

const activeSignals: SignalPayload[] = [];

// Cleanup expired signals after 60 seconds
setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (let i = activeSignals.length - 1; i >= 0; i--) {
    if (activeSignals[i].timestamp < cutoff) {
      activeSignals.splice(i, 1);
    }
  }
}, 30000);

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const matchId = Number(searchParams.get('matchId'));
  const myId = session.userId;

  if (!matchId) {
    return NextResponse.json({ success: false, message: 'Missing matchId' }, { status: 400 });
  }

  // Retrieve all pending signals intended for me in this match
  const pending = activeSignals.filter(
    (s) => s.matchId === matchId && s.receiverId === myId
  );

  // Remove retrieved signals
  for (const p of pending) {
    const idx = activeSignals.findIndex((s) => s.id === p.id);
    if (idx !== -1) activeSignals.splice(idx, 1);
  }

  return NextResponse.json({
    success: true,
    signals: pending.map((p) => ({
      id: p.id,
      senderId: p.senderId,
      type: p.type,
      callType: p.callType,
      data: p.data,
    })),
  });
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

    const signal: SignalPayload = {
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      matchId: Number(matchId),
      senderId: session.userId,
      receiverId: Number(receiverId),
      type,
      callType,
      data,
      timestamp: Date.now(),
    };

    activeSignals.push(signal);

    return NextResponse.json({ success: true, signalId: signal.id });
  } catch (error) {
    console.error('Error sending call signal:', error);
    return NextResponse.json({ success: false, message: 'Failed to send signal' }, { status: 500 });
  }
}
