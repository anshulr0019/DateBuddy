import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, matches, users } from '@/db/schema';
import { eq, desc, and, or, lt } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import { triggerChatMessage, triggerReadReceipt, triggerMessageReaction } from '@/lib/pusher-server';
import { pushNotifyUser } from '@/lib/push-notify';

export const dynamic = 'force-dynamic';

const MESSAGE_TYPES = ['text', 'photo', 'voice', 'gif', 'location'] as const;
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

    const { matchId, content, type = 'text', metadata } = await request.json();
    const id = Number(matchId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'A valid matchId is required' }, { status: 400 });
    }

    // Text messages capped at 4,000 characters; Photos/media dataUrls allowed up to 10MB
    const maxLen = type === 'text' ? 4000 : 10 * 1024 * 1024;
    if (typeof content !== 'string' || !content.trim() || content.length > maxLen) {
      return NextResponse.json(
        { success: false, message: `Message content exceeds limit (max ${maxLen} chars)` },
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
        metadata: metadata || null,
      })
      .returning();

    // Broadcast instant sub-50ms message to the match channel
    void triggerChatMessage(id, newMessage);

    // Web Push
    void (async () => {
      try {
        const [sender] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, session.userId))
          .limit(1);

        const senderName = sender?.name ?? 'Someone';
        const preview =
          type === 'text'
            ? content.trim().slice(0, 100)
            : type === 'photo'
            ? '📷 Sent a photo'
            : type === 'voice'
            ? '🎤 Sent a voice message'
            : type === 'gif'
            ? '🎞️ Sent a GIF'
            : 'Sent you a message';

        await pushNotifyUser(receiverId, {
          title: senderName,
          body: preview,
          url: `/chat/${id}`,
          tag: `chat-${id}`,
          matchId: id,
        });
      } catch { /* non-critical */ }
    })();

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 });
  }
}

/* Marks messages read OR toggles emoji reactions */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, messageId, reaction } = body;
    const id = Number(matchId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'A valid matchId is required' }, { status: 400 });
    }

    const match = await requireParticipation(id, session.userId);
    if (!match) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    // Reaction handling
    if (messageId && typeof reaction === 'string') {
      const numMsgId = Number(messageId);
      const [targetMsg] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, numMsgId), eq(messages.matchId, id)))
        .limit(1);

      if (targetMsg) {
        const currentMeta = (targetMsg.metadata as any) || {};
        const currentReactions: Record<string, string> = { ...(currentMeta.reactions || {}) };

        // Toggle: if same reaction tapped again, remove it
        if (currentReactions[String(session.userId)] === reaction) {
          delete currentReactions[String(session.userId)];
        } else {
          currentReactions[String(session.userId)] = reaction;
        }

        const newMeta = { ...currentMeta, reactions: currentReactions };

        const [updatedMsg] = await db
          .update(messages)
          .set({ metadata: newMeta })
          .where(eq(messages.id, numMsgId))
          .returning();

        // Broadcast real-time reaction via Pusher
        void triggerMessageReaction(id, numMsgId, currentReactions);

        return NextResponse.json({ success: true, message: updatedMsg, reactions: currentReactions });
      }
    }

    // Mark as read handling
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

    // Broadcast read receipt event in real-time
    void triggerReadReceipt(id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/messages:', error);
    return NextResponse.json({ success: false, message: 'Could not update messages' }, { status: 500 });
  }
}
