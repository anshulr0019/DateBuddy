import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, photos, swipes } from '@/db/schema';
import { eq, notInArray } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    const currentUserId = session?.userId || 1;

    // Get profiles user has already swiped on
    const userSwipes = await db.select({ swipedId: swipes.swipedId })
      .from(swipes)
      .where(eq(swipes.swiperId, currentUserId));

    const swipedIds = userSwipes.map((s) => s.swipedId).concat(currentUserId);

    // Query unswiped candidates from users table
    let candidateUsers = await db.select()
      .from(users)
      .where(notInArray(users.id, swipedIds))
      .limit(10);

    // If database candidates are few or empty during initial demo, provide structured candidates
    if (candidateUsers.length === 0) {
      candidateUsers = await db.select().from(users).limit(10);
    }

    // Attach photos for each candidate
    const candidateProfiles = await Promise.all(
      candidateUsers.map(async (u) => {
        const userPhotos = await db.select().from(photos).where(eq(photos.userId, u.id));
        return {
          ...u,
          age: u.dateOfBirth ? new Date().getFullYear() - new Date(u.dateOfBirth).getFullYear() : 23,
          photos: userPhotos.length > 0 ? userPhotos.map(p => p.url) : [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80'
          ],
        };
      })
    );

    return NextResponse.json({
      success: true,
      profiles: candidateProfiles,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}
