import { NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, users, photos, messages } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    const currentUserId = session?.userId || 1;

    // Get matches where currentUserId is user1Id or user2Id
    const userMatches = await db.select()
      .from(matches)
      .where(or(
        eq(matches.user1Id, currentUserId),
        eq(matches.user2Id, currentUserId)
      ));

    const matchDetails = await Promise.all(
      userMatches.map(async (m) => {
        const partnerId = m.user1Id === currentUserId ? m.user2Id : m.user1Id;
        const [partnerUser] = await db.select().from(users).where(eq(users.id, partnerId));
        const partnerPhotos = await db.select().from(photos).where(eq(photos.userId, partnerId));

        // Get last message in conversation
        const lastMsg = await db.select()
          .from(messages)
          .where(eq(messages.matchId, m.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        return {
          id: m.id,
          partnerId,
          name: partnerUser?.name || 'Match',
          photo: partnerPhotos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          lastMessage: lastMsg[0]?.content || 'Matched! Say hello 👋',
          lastMessageTime: lastMsg[0]?.createdAt || m.matchedAt,
          isRead: lastMsg[0]?.isRead ?? true,
        };
      })
    );

    return NextResponse.json({
      success: true,
      matches: matchDetails,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
