import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { sendSessionMessage } from '@/lib/random-chat-matchmaking';
import { rateLimitHit } from '@/lib/rate-limit';
import { MAX_MESSAGE_LENGTH } from '@/lib/random-chat-config';

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
    if (!rateLimitHit(session.userId, 'messages')) {
      return NextResponse.json(
        { success: false, message: 'Slow down — you are sending messages very quickly.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ success: false, message: 'Message cannot be empty.' }, { status: 400 });
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const message = await sendSessionMessage(id, session.userId, content);
    if (!message) {
      return NextResponse.json(
        { success: false, message: 'This conversation is no longer active.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error sending random chat message:', error);
    return NextResponse.json({ success: false, message: 'Could not send your message.' }, { status: 500 });
  }
}
