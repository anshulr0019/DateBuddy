import { NextResponse } from 'next/server';
import { db } from '@/db';
import { swipes, users, photos, subscriptions } from '@/db/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function isGoldSubscriber(userId: number): Promise<boolean> {
  const [sub] = await db
    .select({ tier: subscriptions.tier, endDate: subscriptions.endDate })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  if (!sub || sub.tier === 'free' || !sub.endDate) return false;
  return new Date(sub.endDate) > new Date();
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.userId;

    const gold = await isGoldSubscriber(currentUserId);

    // Find everyone who swiped like/super_like on the current user
    // but the current user has NOT yet swiped on them.
    const alreadySwiped = db
      .select({ id: swipes.swipedId })
      .from(swipes)
      .where(eq(swipes.swiperId, currentUserId));

    const likers = await db
      .select({
        swiperId: swipes.swiperId,
        action: swipes.action,
        createdAt: swipes.createdAt,
      })
      .from(swipes)
      .where(
        and(
          eq(swipes.swipedId, currentUserId),
          ne(swipes.action, 'pass'),
        )
      );

    const alreadySwipedIds = await alreadySwiped;
    const alreadySwipedSet = new Set(alreadySwipedIds.map((r) => r.id));

    // Filter out people already responded to and the user themselves
    const pendingLikers = likers.filter(
      (l) => !alreadySwipedSet.has(l.swiperId) && l.swiperId !== currentUserId
    );

    if (pendingLikers.length === 0) {
      return NextResponse.json({ success: true, isGold: gold, count: 0, likers: [] });
    }

    const likerIds = pendingLikers.map((l) => l.swiperId);

    const [likerUsers, likerPhotos] = await Promise.all([
      db
        .select({ id: users.id, name: users.name, city: users.city, isVerified: users.isVerified, dateOfBirth: users.dateOfBirth })
        .from(users)
        .where(inArray(users.id, likerIds)),
      db
        .select({ userId: photos.userId, url: photos.url, orderIndex: photos.orderIndex })
        .from(photos)
        .where(inArray(photos.userId, likerIds))
        .orderBy(photos.orderIndex),
    ]);

    const photosByUser = new Map<number, string[]>();
    for (const p of likerPhotos) {
      const list = photosByUser.get(p.userId) ?? [];
      list.push(p.url);
      photosByUser.set(p.userId, list);
    }

    const now = Date.now();

    const result = likerUsers.map((u) => {
      const photos = photosByUser.get(u.id) ?? [];
      const age = u.dateOfBirth
        ? Math.floor((now - new Date(u.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      if (gold) {
        // Gold: return full profile
        return {
          id: u.id,
          name: u.name,
          age,
          city: u.city,
          verified: u.isVerified,
          photo: photos[0] ?? null,
          blurred: false,
        };
      } else {
        // Free: return blurred preview (no name, no photo URL)
        return {
          id: u.id,
          name: null,
          age: null,
          city: null,
          verified: false,
          photo: null,
          blurred: true,
        };
      }
    });

    return NextResponse.json({
      success: true,
      isGold: gold,
      count: result.length,
      likers: result,
    });
  } catch (error) {
    console.error('Error fetching likers:', error);
    return NextResponse.json({ success: false, message: 'Could not load likes' }, { status: 500 });
  }
}
