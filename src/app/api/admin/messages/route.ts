import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, matches, users, photos } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'infyn2026';

function isAuthorized(request: NextRequest): boolean {
  const headerKey = request.headers.get('x-admin-key');
  const queryKey = request.nextUrl.searchParams.get('key');
  return headerKey === ADMIN_SECRET || queryKey === ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const matchIdParam = request.nextUrl.searchParams.get('matchId');

    // If specific matchId requested, return all messages for that match
    if (matchIdParam) {
      const matchId = Number(matchIdParam);
      const matchMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.matchId, matchId))
        .orderBy(messages.createdAt);

      const senderIds = Array.from(new Set(matchMessages.map((m) => m.senderId)));
      const senderUsers = senderIds.length > 0
        ? await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phoneNumber }).from(users).where(inArray(users.id, senderIds))
        : [];
      const userMap = new Map(senderUsers.map((u) => [u.id, u]));

      const formatted = matchMessages.map((m) => {
        const sender = userMap.get(m.senderId);
        return {
          id: m.id,
          matchId: m.matchId,
          senderId: m.senderId,
          senderName: sender?.name ?? `User #${m.senderId}`,
          senderEmail: sender?.email ?? '—',
          senderPhone: sender?.phone ?? '—',
          receiverId: m.receiverId,
          type: m.type,
          content: m.content,
          isRead: m.isRead,
          createdAt: m.createdAt,
        };
      });

      return NextResponse.json({ success: true, messages: formatted });
    }

    // Otherwise, return all active conversations with their participants and latest messages
    const recentMatches = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.matchedAt))
      .limit(100);

    if (recentMatches.length === 0) {
      return NextResponse.json({ success: true, conversations: [] });
    }

    const allUserIds = Array.from(
      new Set(recentMatches.flatMap((m) => [m.user1Id, m.user2Id]))
    );
    const matchIds = recentMatches.map((m) => m.id);

    const [allUsers, allPhotos, allLastMessages] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phoneNumber,
          city: users.city,
          gender: users.gender,
        })
        .from(users)
        .where(inArray(users.id, allUserIds)),
      db
        .select()
        .from(photos)
        .where(inArray(photos.userId, allUserIds)),
      db
        .selectDistinctOn([messages.matchId])
        .from(messages)
        .where(inArray(messages.matchId, matchIds))
        .orderBy(messages.matchId, desc(messages.createdAt)),
    ]);

    const userById = new Map(allUsers.map((u) => [u.id, u]));
    const photoByUserId = new Map<number, string>();
    for (const p of allPhotos) {
      if (!photoByUserId.has(p.userId) || p.orderIndex === 0) {
        photoByUserId.set(p.userId, p.url);
      }
    }

    const lastMsgByMatch = new Map(allLastMessages.map((m) => [m.matchId, m]));

    const conversations = recentMatches.map((m) => {
      const u1 = userById.get(m.user1Id);
      const u2 = userById.get(m.user2Id);
      const lastMsg = lastMsgByMatch.get(m.id);

      return {
        matchId: m.id,
        matchedAt: m.matchedAt,
        user1: {
          id: m.user1Id,
          name: u1?.name ?? 'User 1',
          email: u1?.email ?? '—',
          phone: u1?.phone ?? '—',
          city: u1?.city ?? '—',
          gender: u1?.gender ?? '—',
          photo: photoByUserId.get(m.user1Id) ?? null,
        },
        user2: {
          id: m.user2Id,
          name: u2?.name ?? 'User 2',
          email: u2?.email ?? '—',
          phone: u2?.phone ?? '—',
          city: u2?.city ?? '—',
          gender: u2?.gender ?? '—',
          photo: photoByUserId.get(m.user2Id) ?? null,
        },
        lastMessage: lastMsg
          ? {
              senderId: lastMsg.senderId,
              senderName: userById.get(lastMsg.senderId)?.name ?? `User #${lastMsg.senderId}`,
              content: lastMsg.content,
              type: lastMsg.type,
              createdAt: lastMsg.createdAt,
            }
          : null,
      };
    });

    // Sort by latest message or match date
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.matchedAt || 0).getTime();
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.matchedAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Admin messages error:', error);
    return NextResponse.json(
      { success: false, message: 'Could not fetch conversations' },
      { status: 500 }
    );
  }
}
