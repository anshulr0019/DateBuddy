import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { leaveQueue } from '@/lib/random-chat-matchmaking';
import { rateLimitHit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    rateLimitHit(session.userId, 'leave');
    await leaveQueue(session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving random chat queue:', error);
    return NextResponse.json({ success: false, message: 'Could not leave the queue.' }, { status: 500 });
  }
}
