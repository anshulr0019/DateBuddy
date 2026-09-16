import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  swipes, users, photos,
  randomChatSessions, randomChatMessages, randomChatReports,
  reports, blocks,
  meetups, meetupAttendees,
  notifications,
  profileViews,
} from '@/db/schema';
import { desc, eq, count, inArray, sql } from 'drizzle-orm';

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

    const section = request.nextUrl.searchParams.get('section');

    // ── Random chat messages for a specific session ──
    if (section === 'random-chat-messages') {
      const sessionId = Number(request.nextUrl.searchParams.get('sessionId'));
      if (!sessionId) {
        return NextResponse.json({ success: false, message: 'sessionId required' }, { status: 400 });
      }

      const msgs = await db
        .select()
        .from(randomChatMessages)
        .where(eq(randomChatMessages.sessionId, sessionId))
        .orderBy(randomChatMessages.createdAt);

      const senderIds = Array.from(new Set(msgs.map((m) => m.senderId)));
      const senderUsers = senderIds.length > 0
        ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, senderIds))
        : [];
      const userMap = new Map(senderUsers.map((u) => [u.id, u.name]));

      const formatted = msgs.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        senderId: m.senderId,
        senderName: userMap.get(m.senderId) ?? `User #${m.senderId}`,
        content: m.content,
        createdAt: m.createdAt,
      }));

      return NextResponse.json({ success: true, messages: formatted });
    }

    // ── Fetch all extra data in parallel ──
    const [
      recentSwipes,
      rcSessions,
      regularReports,
      rcReports,
      allBlocks,
      allMeetups,
      recentNotifications,
      [{ totalRandomSessions }],
      [{ totalReports }],
      [{ totalBlocks: totalBlocksCount }],
      [{ totalProfileViews }],
    ] = await Promise.all([
      db.select().from(swipes).orderBy(desc(swipes.createdAt)).limit(200),
      db.select().from(randomChatSessions).orderBy(desc(randomChatSessions.createdAt)).limit(100),
      db.select().from(reports).orderBy(desc(reports.createdAt)).limit(100),
      db.select().from(randomChatReports).orderBy(desc(randomChatReports.createdAt)).limit(100),
      db.select().from(blocks).orderBy(desc(blocks.createdAt)).limit(100),
      db.select().from(meetups).orderBy(desc(meetups.createdAt)).limit(50),
      db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100),
      db.select({ totalRandomSessions: count() }).from(randomChatSessions),
      db.select({ totalReports: count() }).from(reports),
      db.select({ totalBlocks: count() }).from(blocks),
      db.select({ totalProfileViews: count() }).from(profileViews),
    ]);

    // ── Gather all unique user IDs to batch-lookup names/photos ──
    const userIdSet = new Set<number>();
    for (const s of recentSwipes) { userIdSet.add(s.swiperId); userIdSet.add(s.swipedId); }
    for (const s of rcSessions) { userIdSet.add(s.userAId); userIdSet.add(s.userBId); }
    for (const r of regularReports) { userIdSet.add(r.reporterId); userIdSet.add(r.reportedId); }
    for (const r of rcReports) { userIdSet.add(r.reporterId); userIdSet.add(r.reportedUserId); }
    for (const b of allBlocks) { userIdSet.add(b.blockerId); userIdSet.add(b.blockedId); }
    for (const m of allMeetups) { userIdSet.add(m.hostId); }
    for (const n of recentNotifications) { userIdSet.add(n.userId); }

    const allUserIds = Array.from(userIdSet);

    const [userLookup, photoLookup] = await Promise.all([
      allUserIds.length > 0
        ? db.select({ id: users.id, name: users.name, email: users.email, phone: users.phoneNumber, city: users.city, gender: users.gender })
            .from(users).where(inArray(users.id, allUserIds))
        : [],
      allUserIds.length > 0
        ? db.select().from(photos).where(inArray(photos.userId, allUserIds))
        : [],
    ]);

    const userMap = new Map(userLookup.map((u) => [u.id, u]));
    const photoMap = new Map<number, string>();
    for (const p of photoLookup) {
      if (!photoMap.has(p.userId) || p.orderIndex === 0) {
        photoMap.set(p.userId, p.url);
      }
    }

    const getUser = (id: number) => {
      const u = userMap.get(id);
      return {
        id,
        name: u?.name ?? `User #${id}`,
        email: u?.email ?? '—',
        phone: u?.phone ?? '—',
        city: u?.city ?? '—',
        gender: u?.gender ?? '—',
        photo: photoMap.get(id) ?? null,
      };
    };

    // ── Format swipes ──
    const formattedSwipes = recentSwipes.map((s) => ({
      id: s.id,
      swiper: getUser(s.swiperId),
      swiped: getUser(s.swipedId),
      action: s.action,
      createdAt: s.createdAt,
    }));

    // ── Format random chat sessions ──
    const formattedSessions = rcSessions.map((s) => ({
      id: s.id,
      userA: { ...getUser(s.userAId), alias: s.aliasA },
      userB: { ...getUser(s.userBId), alias: s.aliasB },
      vibe: s.vibe,
      status: s.status,
      connectionRequestedByA: s.connectionRequestedByA,
      connectionRequestedByB: s.connectionRequestedByB,
      matchId: s.matchId,
      endedAt: s.endedAt,
      createdAt: s.createdAt,
    }));

    // ── Format regular reports ──
    const formattedReports = regularReports.map((r) => ({
      id: r.id,
      type: 'profile' as const,
      reporter: getUser(r.reporterId),
      reported: getUser(r.reportedId),
      reason: r.reason,
      details: r.details,
      createdAt: r.createdAt,
    }));

    // ── Format random chat reports ──
    const formattedRcReports = rcReports.map((r) => ({
      id: r.id,
      type: 'random_chat' as const,
      reporter: getUser(r.reporterId),
      reported: getUser(r.reportedUserId),
      reason: r.reason,
      details: r.details,
      sessionId: r.sessionId,
      createdAt: r.createdAt,
    }));

    const allReports = [...formattedReports, ...formattedRcReports]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // ── Format blocks ──
    const formattedBlocks = allBlocks.map((b) => ({
      id: b.id,
      blocker: getUser(b.blockerId),
      blocked: getUser(b.blockedId),
      createdAt: b.createdAt,
    }));

    // ── Format meetups + attendee counts ──
    const meetupIds = allMeetups.map((m) => m.id);
    const attendeeCounts = meetupIds.length > 0
      ? await db
          .select({ meetupId: meetupAttendees.meetupId, count: count() })
          .from(meetupAttendees)
          .where(inArray(meetupAttendees.meetupId, meetupIds))
          .groupBy(meetupAttendees.meetupId)
      : [];
    const attendeeCountMap = new Map(attendeeCounts.map((a) => [a.meetupId, Number(a.count)]));

    const formattedMeetups = allMeetups.map((m) => ({
      id: m.id,
      host: getUser(m.hostId),
      title: m.title,
      description: m.description,
      category: m.category,
      activityType: m.activityType,
      venueName: m.venueName,
      city: m.city,
      date: m.date,
      duration: m.duration,
      maxAttendees: m.maxAttendees,
      attendeeCount: attendeeCountMap.get(m.id) ?? 0,
      status: m.status,
      imageUrl: m.imageUrl,
      createdAt: m.createdAt,
    }));

    // ── Format notifications ──
    const formattedNotifications = recentNotifications.map((n) => ({
      id: n.id,
      user: getUser(n.userId),
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({
      success: true,
      counts: {
        totalRandomSessions: Number(totalRandomSessions),
        totalReports: Number(totalReports),
        totalBlocks: Number(totalBlocksCount),
        totalProfileViews: Number(totalProfileViews),
      },
      swipes: formattedSwipes,
      randomChatSessions: formattedSessions,
      reports: allReports,
      blocks: formattedBlocks,
      meetups: formattedMeetups,
      notifications: formattedNotifications,
    });
  } catch (error) {
    console.error('Admin all-data error:', error);
    return NextResponse.json(
      { success: false, message: 'Could not fetch all data' },
      { status: 500 }
    );
  }
}
