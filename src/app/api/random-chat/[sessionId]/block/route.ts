import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { blockInSession } from '@/lib/random-chat-matchmaking';
import { rateLimitHit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
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
    if (!rateLimitHit(session.userId, 'block')) {
      return NextResponse.json(
        { success: false, message: 'You are blocking too many people right now.' },
        { status: 429 }
      );
    }
    await blockInSession(id, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error blocking random chat partner:', error);
    return NextResponse.json({ success: false, message: 'Could not block this person.' }, { status: 500 });
  }
}
