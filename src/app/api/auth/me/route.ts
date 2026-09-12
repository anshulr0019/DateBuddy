import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, photos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const [[user], userPhotos] = await Promise.all([
      db.select().from(users).where(eq(users.id, session.userId)),
      db.select().from(photos).where(eq(photos.userId, session.userId)),
    ]);

    if (!user) {
      // Session points at a deleted account — force a re-login.
      return NextResponse.json(
        { success: false, message: 'Account no longer exists' },
        { status: 401 }
      );
    }

    // Sort by order field and return URL strings
    const photoUrls = userPhotos
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map(p => p.url)
      .filter((url): url is string => typeof url === 'string' && url.length > 0);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        city: user.city,
        bio: user.bio,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        lookingFor: user.lookingFor,
        isVerified: user.isVerified,
        onboardingCompletedAt: user.onboardingCompletedAt,
        createdAt: user.createdAt,
        photos: photoUrls,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load profile' },
      { status: 500 }
    );
  }
}
