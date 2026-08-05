import { NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, users, photos, messages } from '@/db/schema';
import { eq, or, desc, inArray, and, sql, count } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

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
      .where(
        and(
          eq(matches.isActive, true),
          or(eq(matches.user1Id, currentUserId), eq(matches.user2Id, currentUserId))
        )
      )
      .orderBy(desc(matches.matchedAt))
      .limit(200);

    if (userMatches.length === 0) {
      return NextResponse.json({ success: true, conversations: [] });
    }

    const partnerIds = userMatches.map((m) =>
      m.user1Id === currentUserId ? m.user2Id : m.user1Id
    );
    const matchIds = userMatches.map((m) => m.id);

    const [partners, partnerPhotos, lastMessages, unreadCounts] = await Promise.all([
      db.select().from(users).where(inArray(users.id, partnerIds)),
      db.select().from(photos).where(inArray(photos.userId, partnerIds)),
      db
        .selectDistinctOn([messages.matchId])
        .from(messages)
        .where(inArray(messages.matchId, matchIds))
        .orderBy(messages.matchId, desc(messages.createdAt)),
      db
        .select({ matchId: messages.matchId, unread: count() })
        .from(messages)
        .where(
          and(
            inArray(messages.matchId, matchIds),
            eq(messages.receiverId, currentUserId),
            eq(messages.isRead, false)
          )
        )
        .groupBy(messages.matchId),
    ]);

    const partnerById = new Map(partners.map((p) => [p.id, p]));
    const photoByUser = new Map<number, string>();
    for (const p of partnerPhotos) {
      if (!photoByUser.has(p.userId)) photoByUser.set(p.userId, p.url);
    }
    const lastMsgByMatch = new Map(lastMessages.map((m) => [m.matchId, m]));
    const unreadByMatch = new Map(unreadCounts.map((u) => [u.matchId, Number(u.unread)]));

    const now = Date.now();
    const conversations = userMatches.map((m) => {
      const partnerId = m.user1Id === currentUserId ? m.user2Id : m.user1Id;
      const partner = partnerById.get(partnerId);
      const lastMsg = lastMsgByMatch.get(m.id);

      let displayMsg = 'Matched! Say hello 👋';
      if (lastMsg) {
        const byType: Record<string, string> = {
          photo: '📷 Photo',
          voice: '🎙️ Voice Note',
          location: '📍 Location',
          gif: '🎬 GIF',
        };
        displayMsg = byType[lastMsg.type as string] ?? lastMsg.content;
      }

      return {
        id: m.id,
        partnerId,
        name: partner?.name ?? 'Match',
        photo: photoByUser.get(partnerId) ?? null,
        lastMsg: displayMsg,
        time: lastMsg?.createdAt ?? m.matchedAt,
        unread: unreadByMatch.get(m.id) ?? 0,
        online: partner?.lastActiveAt
          ? now - new Date(partner.lastActiveAt).getTime() < ONLINE_WINDOW_MS
          : false,
      };
    });

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, message: 'Could not load conversations' },
      { status: 503 }
    );
  }
}
