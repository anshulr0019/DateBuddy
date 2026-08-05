import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, matches } from '@/db/schema';
import { eq, desc, and, or, lt } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MESSAGE_TYPES = ['text', 'photo', 'voice', 'gif', 'location'] as const;
const MAX_CONTENT_LENGTH = 4000;
const PAGE_SIZE = 50;

async function requireParticipation(matchId: number, userId: number) {
  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.id, matchId),
        eq(matches.isActive, true),
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

    /* Cursor pagination walks backwards from the newest message. Serial ids are
       monotonic, so `id < before` is a stable cursor even for same-timestamp rows. */
    const rawBefore = new URL(request.url).searchParams.get('before');
    const before = rawBefore === null ? null : Number(rawBefore);
    if (before !== null && (!Number.isInteger(before) || before <= 0)) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination cursor' },
        { status: 400 }
      );
    }

    const page = await db
      .select()
      .from(messages)
      .where(
        before === null
          ? eq(messages.matchId, matchId)
          : and(eq(messages.matchId, matchId), lt(messages.id, before))
      )
      .orderBy(desc(messages.id))
      .limit(PAGE_SIZE + 1);

    const hasMore = page.length > PAGE_SIZE;
    const conversation = (hasMore ? page.slice(0, PAGE_SIZE) : page).reverse();

    return NextResponse.json({ success: true, messages: conversation, hasMore });
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

/* Marks every message addressed to the current user in a match as read.
   Powers real read receipts (sender polls and sees isRead flip) and clears
   the unread counts served by /api/conversations. */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await request.json();
    const id = Number(matchId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'A valid matchId is required' }, { status: 400 });
    }

    const match = await requireParticipation(id, session.userId);
    if (!match) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.matchId, id),
          eq(messages.receiverId, session.userId),
          eq(messages.isRead, false)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages read:', error);
    return NextResponse.json({ success: false, message: 'Could not update messages' }, { status: 500 });
  }
}
