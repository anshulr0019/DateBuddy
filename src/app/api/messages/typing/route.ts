import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, matches } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import { triggerTypingIndicator } from '@/lib/pusher-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const matchId = Number(body?.matchId);
    const isTyping = Boolean(body?.isTyping);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid matchId' }, { status: 400 });
    }

    // Verify participation
    const [match] = await db
      .select({ id: matches.id })
      .from(matches)
      .where(
        and(
          eq(matches.id, matchId),
          eq(matches.isActive, true),
          or(eq(matches.user1Id, session.userId), eq(matches.user2Id, session.userId))
        )
      );

    if (!match) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    // Broadcast typing event via Pusher
    void triggerTypingIndicator(matchId, session.userId, isTyping);

    // If typing, touch lastActiveAt
    if (isTyping) {
      void db
        .update(users)
        .set({ lastActiveAt: new Date() })
        .where(eq(users.id, session.userId))
        .catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
