import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { swipes, matches, notifications, users, photos } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SWIPE_ACTIONS = ['like', 'pass', 'super_like'] as const;
type SwipeAction = (typeof SWIPE_ACTIONS)[number];

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.userId;

    const { swipedUserId, action = 'like' } = await request.json();
    const targetId = Number(swipedUserId);

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json(
        { success: false, message: 'A valid swipedUserId is required' },
        { status: 400 }
      );
    }
    if (targetId === currentUserId) {
      return NextResponse.json({ success: false, message: 'You cannot swipe yourself' }, { status: 400 });
    }
    if (!SWIPE_ACTIONS.includes(action as SwipeAction)) {
      return NextResponse.json({ success: false, message: 'Invalid swipe action' }, { status: 400 });
    }

    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetId));
    if (!target) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    await db
      .insert(swipes)
      .values({ swiperId: currentUserId, swipedId: targetId, action: action as SwipeAction })
      .onConflictDoNothing();

    let isMatch = false;
    let matchedUser = null;

    if (action === 'like' || action === 'super_like') {
      const [reciprocal] = await db
        .select()
        .from(swipes)
        .where(and(eq(swipes.swiperId, targetId), eq(swipes.swipedId, currentUserId)));

      if (reciprocal && (reciprocal.action === 'like' || reciprocal.action === 'super_like')) {
        isMatch = true;

        const [newMatch] = await db
          .insert(matches)
          .values({
            user1Id: Math.min(currentUserId, targetId),
            user2Id: Math.max(currentUserId, targetId),
          })
          .onConflictDoNothing()
          .returning();

        if (newMatch) {
          await db.insert(notifications).values({
            userId: targetId,
            type: 'match',
            title: "It's a Match! 🎉",
            body: 'Someone liked you back!',
            metadata: { matchId: newMatch.id },
          });
        }

        const [targetUser] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, targetId));
        const targetPhotos = await db.select().from(photos).where(eq(photos.userId, targetId));
        if (targetUser) {
          // Only the fields the match celebration needs — never spread the raw
          // user row, which carries phone number, email and googleId.
          matchedUser = { id: targetUser.id, name: targetUser.name, photo: targetPhotos[0]?.url ?? null };
        }
      }
    }

    return NextResponse.json({ success: true, action, isMatch, matchedUser });
  } catch (error) {
    console.error('Error processing swipe:', error);
    return NextResponse.json(
      { success: false, message: 'Could not record swipe' },
      { status: 500 }
    );
  }
}
