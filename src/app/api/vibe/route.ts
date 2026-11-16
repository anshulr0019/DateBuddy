import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { swipes, messages, matches } from '@/db/schema';
import { and, desc, eq, gte, inArray, lt, or } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import { computeVibe, isValidTimeZone, WINDOW_DAYS, type ActivityEvent } from '@/lib/vibe';

export const dynamic = 'force-dynamic';

const DEFAULT_TZ = 'Asia/Kolkata';

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ success: false }, { status: 401 });

  const tzParam = request.nextUrl.searchParams.get('tz') ?? '';
  const timeZone = tzParam && isValidTimeZone(tzParam) ? tzParam : DEFAULT_TZ;
  const userId = session.userId;
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  try {
    const matchRows = await db
      .select({ id: matches.id })
      .from(matches)
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));
    const matchIds = matchRows.map((m) => m.id);

    const [swipeRows, messageRows, earlierSwipe, earlierMessage] = await Promise.all([
      db.select({ at: swipes.createdAt, action: swipes.action })
        .from(swipes)
        .where(and(eq(swipes.swiperId, userId), gte(swipes.createdAt, since))),
      matchIds.length
        ? db.select({ at: messages.createdAt, type: messages.type, content: messages.content })
            .from(messages)
            .where(and(inArray(messages.matchId, matchIds), eq(messages.senderId, userId), gte(messages.createdAt, since)))
        : Promise.resolve([]),
      // Most recent activity before the window, for the comeback rule.
      db.select({ at: swipes.createdAt }).from(swipes)
        .where(and(eq(swipes.swiperId, userId), lt(swipes.createdAt, since)))
        .orderBy(desc(swipes.createdAt)).limit(1),
      matchIds.length
        ? db.select({ at: messages.createdAt }).from(messages)
            .where(and(inArray(messages.matchId, matchIds), eq(messages.senderId, userId), lt(messages.createdAt, since)))
            .orderBy(desc(messages.createdAt)).limit(1)
        : Promise.resolve([]),
    ]);

    const events: ActivityEvent[] = [
      ...swipeRows.filter((r) => r.at).map((r) => ({ at: r.at as Date, kind: 'swipe' as const, liked: r.action !== 'pass' })),
      ...messageRows.filter((r) => r.at).map((r) => ({
        at: r.at as Date,
        kind: 'message' as const,
        length: r.type === 'text' ? r.content.length : undefined,
      })),
      ...[...earlierSwipe, ...earlierMessage].filter((r) => r.at).map((r) => ({ at: r.at as Date, kind: 'swipe' as const })),
    ];

    return NextResponse.json({ success: true, vibe: computeVibe(events, timeZone) });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
