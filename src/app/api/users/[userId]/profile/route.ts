import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, photos, interests, userInterests, matches, blocks } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { userId: rawUserId } = await params;
  const targetId = Number(rawUserId);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
  }

  // Don't return self via this endpoint
  if (targetId === session.userId) {
    return NextResponse.json({ success: false, message: 'Use /api/users/me for your own profile' }, { status: 400 });
  }

  try {
    // Verify a match exists between the two users (so random users can't stalk)
    const [match] = await db
      .select({ id: matches.id })
      .from(matches)
      .where(
        and(
          eq(matches.isActive, true),
          or(
            and(eq(matches.user1Id, session.userId), eq(matches.user2Id, targetId)),
            and(eq(matches.user1Id, targetId), eq(matches.user2Id, session.userId))
          )
        )
      );

    if (!match) {
      return NextResponse.json({ success: false, message: 'Profile not accessible' }, { status: 403 });
    }

    // Check if blocked
    const [blocked] = await db
      .select({ id: blocks.id })
      .from(blocks)
      .where(
        or(
          and(eq(blocks.blockerId, session.userId), eq(blocks.blockedId, targetId)),
          and(eq(blocks.blockerId, targetId), eq(blocks.blockedId, session.userId))
        )
      );
    if (blocked) {
      return NextResponse.json({ success: false, message: 'Profile not accessible' }, { status: 403 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, targetId));
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const [userPhotos, tags] = await Promise.all([
      db.select({ url: photos.url }).from(photos).where(eq(photos.userId, targetId)).orderBy(photos.orderIndex),
      db
        .select({ name: interests.name })
        .from(userInterests)
        .innerJoin(interests, eq(userInterests.interestId, interests.id))
        .where(eq(userInterests.userId, targetId)),
    ]);

    // Calculate age
    const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : null;
    const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        age,
        city: user.city,
        bio: user.bio,
        isVerified: user.isVerified,
        instagramHandle: user.instagramHandle,
        snapchatHandle: user.snapchatHandle,
        lastActiveAt: user.lastActiveAt,
        photos: userPhotos.map((p) => p.url),
        interests: tags.map((t) => t.name),
      },
    });
  } catch (error) {
    console.error('Error fetching partner profile:', error);
    return NextResponse.json({ success: false, message: 'Could not load profile' }, { status: 500 });
  }
}
