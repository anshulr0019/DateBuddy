import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { requestConnection } from '@/lib/random-chat-matchmaking';
import { rateLimitHit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { sessionId } = await params;
    const id = Number(sessionId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 400 });
    }
    if (!rateLimitHit(session.userId, 'connection')) {
      return NextResponse.json(
        { success: false, message: 'You are making too many connection requests.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const want = body?.connected === true;

    const result = await requestConnection(id, session.userId, want);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error handling connection request:', error);
    return NextResponse.json(
      { success: false, message: 'Could not update your connection request.' },
      { status: 500 }
    );
  }
}
