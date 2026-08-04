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

    const [user] = await db.select().from(users).where(eq(users.id, session.userId));

    if (!user) {
      // Session points at a deleted account — force a re-login.
      return NextResponse.json(
        { success: false, message: 'Account no longer exists' },
        { status: 401 }
      );
    }

    const userPhotos = await db.select().from(photos).where(eq(photos.userId, user.id));

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        photos: userPhotos,
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
