import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, matches } from '@/db/schema';
import { eq, asc, and, or } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MESSAGE_TYPES = ['text', 'photo', 'voice', 'gif', 'location'] as const;
const MAX_CONTENT_LENGTH = 4000;

async function requireParticipation(matchId: number, userId: number) {
  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.id, matchId),
        or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))
      )
    );
  return match ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const matchId = Number(new URL(request.url).searchParams.get('matchId'));
    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json(
        { success: false, message: 'A valid matchId is required' },
        { status: 400 }
      );
    }

    const match = await requireParticipation(matchId, session.userId);
    if (!match) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    const conversation = await db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(asc(messages.createdAt))
      .limit(200);

    return NextResponse.json({ success: true, messages: conversation });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, message: 'Could not load messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { matchId, content, type = 'text' } = await request.json();
    const id = Number(matchId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'A valid matchId is required' }, { status: 400 });
    }
    if (typeof content !== 'string' || !content.trim() || content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Message must be between 1 and ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }
    if (!MESSAGE_TYPES.includes(type)) {
      return NextResponse.json({ success: false, message: 'Invalid message type' }, { status: 400 });
    }

    const match = await requireParticipation(id, session.userId);
    if (!match) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    const receiverId = match.user1Id === session.userId ? match.user2Id : match.user1Id;

    const [newMessage] = await db
      .insert(messages)
      .values({
        matchId: id,
        senderId: session.userId,
        receiverId,
        content: content.trim(),
        type,
      })
      .returning();

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 });
  }
}
