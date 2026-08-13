import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { reportInSession } from '@/lib/random-chat-matchmaking';
import { rateLimitHit } from '@/lib/rate-limit';
import { REPORT_REASONS } from '@/lib/random-chat-config';

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
    if (!rateLimitHit(session.userId, 'report')) {
      return NextResponse.json(
        { success: false, message: 'You can only submit a few reports per minute.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const reason = typeof body?.reason === 'string' ? body.reason : '';
    if (!REPORT_REASONS.includes(reason as never)) {
      return NextResponse.json({ success: false, message: 'Invalid report reason.' }, { status: 400 });
    }
    const details = typeof body?.details === 'string' ? body.details.slice(0, 1000) : null;

    await reportInSession(id, session.userId, reason as never, details);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reporting random chat session:', error);
    return NextResponse.json({ success: false, message: 'Could not submit your report.' }, { status: 500 });
  }
}
