import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { swipes, matches, notifications, users, photos } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const currentUserId = session?.userId || 1;

    const { swipedUserId, action } = await request.json(); // action: 'like' | 'pass' | 'super_like'

    if (!swipedUserId || !action) {
      return NextResponse.json(
        { success: false, message: 'swipedUserId and action are required' },
        { status: 400 }
      );
    }

    // Record swipe
    await db.insert(swipes).values({
      swiperId: currentUserId,
      swipedId: Number(swipedUserId),
      action,
    });

    let isMatch = false;
    let matchedUser = null;

    if (action === 'like' || action === 'super_like') {
      // Check if target user liked current user back
      const reciprocalSwipe = await db.select()
        .from(swipes)
        .where(and(
          eq(swipes.swiperId, Number(swipedUserId)),
          eq(swipes.swipedId, currentUserId)
        ));

      if (reciprocalSwipe.length > 0 && (reciprocalSwipe[0].action === 'like' || reciprocalSwipe[0].action === 'super_like')) {
        isMatch = true;

        // Insert match record
        const [newMatch] = await db.insert(matches).values({
          user1Id: Math.min(currentUserId, Number(swipedUserId)),
          user2Id: Math.max(currentUserId, Number(swipedUserId)),
        }).returning();

        // Create notification
        await db.insert(notifications).values({
          userId: Number(swipedUserId),
          type: 'match',
          title: "It's a Match! 🎉",
          body: 'Someone liked you back!',
          metadata: { matchId: newMatch.id },
        });

        // Get matched user info
        const [targetUser] = await db.select().from(users).where(eq(users.id, Number(swipedUserId)));
        const targetPhotos = await db.select().from(photos).where(eq(photos.userId, Number(swipedUserId)));
        matchedUser = {
          ...targetUser,
          photo: targetPhotos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        };
      }
    }

    return NextResponse.json({
      success: true,
      action,
      isMatch,
      matchedUser,
    });
  } catch (error) {
    console.error('Error processing swipe:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to record swipe' },
      { status: 500 }
    );
  }
}
