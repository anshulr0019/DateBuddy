import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, matches, users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import { triggerChatMessage } from '@/lib/pusher-server';
import { pushNotifyUser } from '@/lib/push-notify';
import { redis, fallbackRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export interface CallLogPayload {
  matchId: number;
  partnerId: number;
  callType: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined' | 'cancelled';
  duration?: number;
  callSessionId?: string;
}

/**
 * POST /api/calls/log
 * Records an ended/missed/declined call in the chat message history.
 * Automatically deduplicates using callSessionId so only one call log is inserted per call.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CallLogPayload;
    const { matchId, partnerId, callType = 'video', status = 'completed', duration = 0, callSessionId } = body;

    const id = Number(matchId);
    const targetUserId = Number(partnerId);

    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(targetUserId) || targetUserId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid matchId or partnerId' }, { status: 400 });
    }

    // Verify participation in the match
    const [match] = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.id, id),
          eq(matches.isActive, true),
          or(eq(matches.user1Id, session.userId), eq(matches.user2Id, session.userId))
        )
      );

    if (!match) {
      return NextResponse.json({ success: false, message: 'Match not found' }, { status: 404 });
    }

    // Deduplication check: only one log per callSessionId
    if (callSessionId) {
      const dedupKey = `call:logged:${id}:${callSessionId}`;
      let alreadyLogged = false;

      if (redis) {
        try {
          const exists = await redis.get(dedupKey);
          if (exists) alreadyLogged = true;
          else await redis.set(dedupKey, '1', { ex: 300 });
        } catch { /* fall back */ }
      }

      if (!alreadyLogged) {
        const fallbackExists = await fallbackRedis.get(dedupKey);
        if (fallbackExists) alreadyLogged = true;
        else await fallbackRedis.set(dedupKey, '1', { ex: 300 });
      }

      if (alreadyLogged) {
        return NextResponse.json({ success: true, message: 'Already logged' });
      }
    }

    const safeDuration = Math.max(0, Math.floor(Number(duration) || 0));
    const structuredContent = `CALL_EVENT:${JSON.stringify({
      callType,
      status,
      duration: safeDuration,
    })}`;

    const [newMessage] = await db
      .insert(messages)
      .values({
        matchId: id,
        senderId: session.userId,
        receiverId: targetUserId,
        content: structuredContent,
        type: 'text',
      })
      .returning();

    // Broadcast in real-time to the match chat channel
    void triggerChatMessage(id, newMessage);

    // If call was missed, send Web Push notification to the recipient
    if (status === 'missed') {
      void (async () => {
        try {
          const [caller] = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);

          const callerName = caller?.name || 'Someone';
          const callTitle = callType === 'video' ? 'Missed Video Call' : 'Missed Audio Call';

          await pushNotifyUser(targetUserId, {
            title: callTitle,
            body: `${callerName} called you`,
            url: `/chat/${id}`,
            tag: `call-${id}`,
            matchId: id,
          });
        } catch {
          /* non-critical */
        }
      })();
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error logging call:', error);
    return NextResponse.json({ success: false, message: 'Failed to log call' }, { status: 500 });
  }
}
