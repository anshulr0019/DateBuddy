import { NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, users, photos, messages } from '@/db/schema';
import { eq, or, desc, inArray, and, sql } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.userId;

    const userMatches = await db
      .select()
      .from(matches)
      .where(or(eq(matches.user1Id, currentUserId), eq(matches.user2Id, currentUserId)))
      .orderBy(desc(matches.matchedAt))
      .limit(200);

    if (userMatches.length === 0) {
      return NextResponse.json({ success: true, matches: [] });
    }

    const partnerIds = userMatches.map((m) =>
      m.user1Id === currentUserId ? m.user2Id : m.user1Id
    );
    const matchIds = userMatches.map((m) => m.id);

    const [partners, partnerPhotos, lastMessages] = await Promise.all([
      db.select().from(users).where(inArray(users.id, partnerIds)),
      db.select().from(photos).where(inArray(photos.userId, partnerIds)),
      db
        .selectDistinctOn([messages.matchId])
        .from(messages)
        .where(inArray(messages.matchId, matchIds))
        .orderBy(messages.matchId, desc(messages.createdAt)),
    ]);

    const partnerById = new Map(partners.map((p) => [p.id, p]));
    const photoByUser = new Map<number, string>();
    for (const p of partnerPhotos) {
      if (!photoByUser.has(p.userId)) photoByUser.set(p.userId, p.url);
    }
    const lastMsgByMatch = new Map(lastMessages.map((m) => [m.matchId, m]));

    const matchDetails = userMatches.map((m) => {
      const partnerId = m.user1Id === currentUserId ? m.user2Id : m.user1Id;
      const partner = partnerById.get(partnerId);
      const lastMsg = lastMsgByMatch.get(m.id);

      return {
        id: m.id,
        partnerId,
        name: partner?.name ?? 'Match',
        age: partner?.dateOfBirth
          ? new Date().getFullYear() - new Date(partner.dateOfBirth).getFullYear()
          : null,
        city: partner?.city ?? null,
        photo: photoByUser.get(partnerId) ?? null,
        online: partner?.isActive ?? false,
        verified: partner?.isVerified ?? false,
        lastMessage: lastMsg?.content ?? null,
        lastMessageTime: lastMsg?.createdAt ?? m.matchedAt,
        isRead: lastMsg?.isRead ?? true,
      };
    });

    return NextResponse.json({ success: true, matches: matchDetails });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { success: false, message: 'Could not load matches' },
      { status: 503 }
    );
  }
}
