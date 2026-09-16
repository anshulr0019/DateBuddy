import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { swipes, matches, users, photos, notifications } from '@/db/schema';
import { getAuthSession } from '@/lib/auth';
import { and, eq, or, sql } from 'drizzle-orm';
import { triggerPusherEvent, triggerUserNotification } from '@/lib/pusher-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawId = body.swipedUserId ?? body.targetUserId ?? body.targetId;
    const swipedId = Number(rawId);
    const action = body.action;

    if (!swipedId || isNaN(swipedId) || !['like', 'pass', 'super_like'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    if (swipedId === session.userId) {
      return NextResponse.json({ success: false, message: 'Cannot swipe on yourself' }, { status: 400 });
    }

    // 1. Record or update the swipe
    let swipeId: number;
    try {
      const [recorded] = await db
        .insert(swipes)
        .values({
          swiperId: session.userId,
          swipedId,
          action,
        })
        .onConflictDoUpdate({
          target: [swipes.swiperId, swipes.swipedId],
          set: { action, createdAt: new Date() },
        })
        .returning({ id: swipes.id });
      swipeId = recorded.id;
    } catch {
      // Robust fallback if unique constraint is ever bypassed or transitioning
      const existing = await db
        .select({ id: swipes.id })
        .from(swipes)
        .where(and(eq(swipes.swiperId, session.userId), eq(swipes.swipedId, swipedId)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(swipes)
          .set({ action, createdAt: new Date() })
          .where(eq(swipes.id, existing[0].id));
        swipeId = existing[0].id;
      } else {
        const [recorded] = await db.insert(swipes).values({
          swiperId: session.userId,
          swipedId,
          action,
        }).returning({ id: swipes.id });
        swipeId = recorded.id;
      }
    }

    // If passed, return immediately with success
    if (action === 'pass') {
      return NextResponse.json({ success: true, isMatch: false, swipeId });
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
    const currentUserRows = await db
      .select({ id: users.id, name: users.name, isVerified: users.isVerified })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const senderName = currentUserRows[0]?.name || 'Someone';

    // Fetch target user photo and name for the return payload
    const targetUserRows = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, swipedId))
      .limit(1);

    const targetPhotos = await db
      .select({ url: photos.url })
      .from(photos)
      .where(eq(photos.userId, swipedId))
      .orderBy(photos.orderIndex)
      .limit(1);

    const matchedUserPayload = {
      id: swipedId,
      name: targetUserRows[0]?.name || 'Your Match',
      photo: targetPhotos[0]?.url || null,
    };

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
        try {
          const [newMatch] = await db
            .insert(matches)
            .values({
              user1Id: session.userId,
              user2Id: swipedId,
              isActive: true,
            })
            .returning({ id: matches.id });
          matchId = newMatch?.id;
        } catch {
          // In case of race condition creating duplicate match
          const [fallbackMatch] = await db
            .select()
            .from(matches)
            .where(
              or(
                and(eq(matches.user1Id, session.userId), eq(matches.user2Id, swipedId)),
                and(eq(matches.user1Id, swipedId), eq(matches.user2Id, session.userId))
              )
            )
            .limit(1);
          matchId = fallbackMatch?.id;
        }
      }

      // Send MATCH notification to the other user -> routes to /chat
      try {
        await db.insert(notifications).values({
          userId: swipedId,
          type: 'match',
          title: "It's a Match! 💕",
          body: `You and ${senderName} matched! Start the conversation now.`,
          metadata: { actionUrl: `/chat/${matchId}` },
        });
      } catch (err) {
        console.warn('Failed to insert match notification:', err);
      }

      // Realtime notification ping
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
        swipeId,
        matchId,
        matchedUser: matchedUserPayload,
      });
    } else {
      // ── ONE-WAY LIKE (NOT A MATCH YET) ──
      // Send LIKE notification -> routes to /likes (Who Liked You)
      try {
        await db.insert(notifications).values({
          userId: swipedId,
          type: 'like',
          title: action === 'super_like' ? 'New Super Like! ⭐' : 'Someone liked your profile! ✨',
          body: action === 'super_like'
            ? `${senderName} super liked you! See who liked you and connect.`
            : 'Someone liked you! See who liked you and vibe check back.',
          metadata: { actionUrl: '/likes', swipeId, swiperId: session.userId },
        });
      } catch (err) {
        console.warn('Failed to insert like notification:', err);
      }

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

      return NextResponse.json({
        success: true,
        isMatch: false,
        swipeId,
      });
    }
  } catch (error) {
    console.error('Error handling swipe:', error);
    return NextResponse.json({ success: false, message: 'Failed to process swipe' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const swipedId = Number(body.swipedUserId);
    const expectedSwipeId = body.swipeId == null ? null : Number(body.swipeId);
    const expectedAction = body.action;
    if (!Number.isSafeInteger(swipedId) || swipedId <= 0 || swipedId === session.userId ||
        (expectedSwipeId !== null && (!Number.isSafeInteger(expectedSwipeId) || expectedSwipeId <= 0)) ||
        (expectedAction != null && !['like', 'pass', 'super_like'].includes(expectedAction))) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    let removedLike = false;
    const result = await db.transaction(async (tx) => {
      const [recordedSwipe] = await tx
        .select({ id: swipes.id, swipedId: swipes.swipedId, action: swipes.action })
        .from(swipes)
        .where(and(eq(swipes.swiperId, session.userId), eq(swipes.swipedId, swipedId)))
        .limit(1)
        .for('update');

      if (!recordedSwipe || recordedSwipe.swipedId !== swipedId ||
          (expectedSwipeId !== null && recordedSwipe.id !== expectedSwipeId) ||
          (expectedAction != null && recordedSwipe.action !== expectedAction)) {
        return NextResponse.json({ success: false, message: 'This decision has changed or was already undone.' }, { status: 409 });
      }

      const [existingMatch] = await tx
        .select({ id: matches.id })
        .from(matches)
        .where(or(
          and(eq(matches.user1Id, session.userId), eq(matches.user2Id, swipedId)),
          and(eq(matches.user1Id, swipedId), eq(matches.user2Id, session.userId))
        ))
        .limit(1);
      if (existingMatch) {
        return NextResponse.json({ success: false, message: 'A match can’t be undone here.' }, { status: 409 });
      }

      await tx.delete(swipes).where(and(eq(swipes.id, recordedSwipe.id), eq(swipes.swiperId, session.userId)));
      if (recordedSwipe.action !== 'pass') {
        // Older notifications lack a swipe ID, so leave those untouched rather
        // than risk removing a different person's like notification.
        await tx.delete(notifications).where(and(
          eq(notifications.userId, swipedId),
          eq(notifications.type, 'like'),
          sql`${notifications.metadata}->>'swipeId' = ${String(recordedSwipe.id)}`,
          sql`${notifications.metadata}->>'swiperId' = ${String(session.userId)}`
        ));
        removedLike = true;
      }
      return NextResponse.json({ success: true });
    });
    if (removedLike) {
      try {
        await triggerUserNotification(swipedId, { type: 'like-removed' });
      } catch {
        /* The swipe is undone even if the other device is offline. */
      }
    }
    return result;
  } catch (error) {
    console.error('Error undoing swipe:', error);
    return NextResponse.json({ success: false, message: 'Could not undo that swipe.' }, { status: 500 });
  }
}
