import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { swipes, matches, users, notifications } from '@/db/schema';
import { getAuthSession } from '@/lib/auth';
import { and, eq, or } from 'drizzle-orm';
import { triggerPusherEvent, triggerUserNotification } from '@/lib/pusher-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, action } = await request.json();
    const swipedId = Number(targetUserId);

    if (!swipedId || !['like', 'pass', 'super_like'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    if (swipedId === session.userId) {
      return NextResponse.json({ success: false, message: 'Cannot swipe on yourself' }, { status: 400 });
    }

    // 1. Record the swipe
    await db
      .insert(swipes)
      .values({
        swiperId: session.userId,
        swipedId,
        action,
      })
      .onConflictDoUpdate({
        target: [swipes.swiperId, swipes.swipedId],
        set: { action, createdAt: new Date() },
      });

    // If passed, return immediately
    if (action === 'pass') {
      return NextResponse.json({ success: true, isMatch: false });
    }

    // 2. Check if the target user has already liked the current user (MUTUAL MATCH)
    const existingReciprocalLike = await db
      .select()
      .from(swipes)
      .where(
        and(
          eq(swipes.swiperId, swipedId),
          eq(swipes.swipedId, session.userId),
          or(eq(swipes.action, 'like'), eq(swipes.action, 'super_like'))
        )
      )
      .limit(1);

    const isMatch = existingReciprocalLike.length > 0;

    // Fetch current user details for the notification
    const currentUser = await db
      .select({ id: users.id, name: users.name, isVerified: users.isVerified })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const senderName = currentUser[0]?.name || 'Someone';

    if (isMatch) {
      // ── MUTUAL MATCH ──
      // Create or activate match record
      const [existingMatch] = await db
        .select()
        .from(matches)
        .where(
          or(
            and(eq(matches.user1Id, session.userId), eq(matches.user2Id, swipedId)),
            and(eq(matches.user1Id, swipedId), eq(matches.user2Id, session.userId))
          )
        )
        .limit(1);

      let matchId = existingMatch?.id;

      if (!matchId) {
        const [newMatch] = await db
          .insert(matches)
          .values({
            user1Id: session.userId,
            user2Id: swipedId,
            isActive: true,
          })
          .returning({ id: matches.id });
        matchId = newMatch.id;
      }

      // Send MATCH notification to the other user -> routes to /chat so they can chat!
      await db.insert(notifications).values({
        userId: swipedId,
        type: 'match',
        title: "It's a Match! 💕",
        body: `You and ${senderName} matched! Start the conversation now.`,
        metadata: { actionUrl: `/chat/${matchId}` },
      });

      // Also notify via Pusher if available
      try {
        await triggerPusherEvent(`user-${swipedId}`, 'new-match', {
          matchId,
          partnerId: session.userId,
          partnerName: senderName,
        });
      } catch {
        /* Non-critical */
      }

      return NextResponse.json({
        success: true,
        isMatch: true,
        matchId,
        matchedUser: {
          id: swipedId,
          name: senderName,
        },
      });
    } else {
      // ── ONE-WAY LIKE (NOT A MATCH YET) ──
      // Send LIKE notification -> routes to /likes (Who Liked You) so user can view & like back!
      await db.insert(notifications).values({
        userId: swipedId,
        type: 'like',
        title: action === 'super_like' ? 'New Super Like! ⭐' : 'Someone liked your profile! ✨',
        body: action === 'super_like'
          ? `${senderName} super liked you! See who liked you and connect.`
          : 'Someone liked you! See who liked you and vibe check back.',
        metadata: { actionUrl: '/likes' },
      });

      // Realtime notification ping
      try {
        await triggerUserNotification(swipedId, {
          type: 'like',
          title: 'Someone liked your profile! ✨',
          actionUrl: '/likes',
        });
      } catch {
        /* Non-critical */
      }

      return NextResponse.json({ success: true, isMatch: false });
    }
  } catch (error) {
    console.error('Error handling swipe:', error);
    return NextResponse.json({ success: false, message: 'Failed to process swipe' }, { status: 500 });
  }
}
