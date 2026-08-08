import { NextRequest, NextResponse } from 'next/server';
import { sql, eq, and, lt, gte } from 'drizzle-orm';
import { db } from '@/db';
import { swipes, matches, notifications, users, photos, subscriptions, dailyLimits } from '@/db/schema';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SWIPE_ACTIONS = ['like', 'pass', 'super_like'] as const;
type SwipeAction = (typeof SWIPE_ACTIONS)[number];

// Must match the recycle window in /api/feed/route.ts
const PASS_RECYCLE_MS = 24 * 60 * 60 * 1000;

// Free-tier daily caps
const FREE_LIKES_PER_DAY       = 20;
const FREE_SUPER_LIKES_PER_DAY = 1;

// Gold-tier daily cap (only super likes are capped; regular likes are unlimited)
const GOLD_SUPER_LIKES_PER_DAY = 5;

/* ── helpers ─────────────────────────────────── */

/** Midnight UTC — used to scope daily-limit rows to today. */
function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** True when the user has an active paid subscription (any non-free tier). */
async function isGoldSubscriber(userId: number): Promise<boolean> {
  const [sub] = await db
    .select({ tier: subscriptions.tier, endDate: subscriptions.endDate })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  if (!sub || sub.tier === 'free' || !sub.endDate) return false;
  return new Date(sub.endDate) > new Date();
}

/**
 * Fetch today's daily-limit row for the user, creating it if absent.
 * The schema has no unique index on (userId, date), so we query with
 * gte(date, todayUTC()) and insert only when nothing is found.
 */
async function getOrCreateDailyLimit(userId: number) {
  const today = todayUTC();
  const [existing] = await db
    .select()
    .from(dailyLimits)
    .where(and(eq(dailyLimits.userId, userId), gte(dailyLimits.date, today)));
  if (existing) return existing;

  const [created] = await db
    .insert(dailyLimits)
    .values({
      userId,
      date: today,
      likesUsed:      0,
      superLikesUsed: 0,
      rewindsUsed:    0,
      revealsUsed:    0,
    })
    .returning();
  return created;
}

/** Atomically increment the counter for a like or super_like. */
async function incrementLimit(limitId: number, action: 'like' | 'super_like') {
  if (action === 'like') {
    await db
      .update(dailyLimits)
      .set({ likesUsed: sql`${dailyLimits.likesUsed} + 1` })
      .where(eq(dailyLimits.id, limitId));
  } else {
    await db
      .update(dailyLimits)
      .set({ superLikesUsed: sql`${dailyLimits.superLikesUsed} + 1` })
      .where(eq(dailyLimits.id, limitId));
  }
}

/* ── POST /api/swipes ────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.userId;

    const { swipedUserId, action = 'like' } = await request.json();
    const targetId = Number(swipedUserId);

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json(
        { success: false, message: 'A valid swipedUserId is required' },
        { status: 400 }
      );
    }
    if (targetId === currentUserId) {
      return NextResponse.json({ success: false, message: 'You cannot swipe yourself' }, { status: 400 });
    }
    if (!SWIPE_ACTIONS.includes(action as SwipeAction)) {
      return NextResponse.json({ success: false, message: 'Invalid swipe action' }, { status: 400 });
    }

    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetId));
    if (!target) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // ── Daily limit enforcement (likes and super_likes only) ──────────────
    // Passes are never rate-limited — the user should always be able to skip.
    let limitRow: Awaited<ReturnType<typeof getOrCreateDailyLimit>> | null = null;

    if (action === 'like' || action === 'super_like') {
      const gold = await isGoldSubscriber(currentUserId);
      limitRow = await getOrCreateDailyLimit(currentUserId);

      if (!gold) {
        // Free tier: hard caps on likes and super_likes
        if (action === 'like' && (limitRow.likesUsed ?? 0) >= FREE_LIKES_PER_DAY) {
          return NextResponse.json(
            {
              success:      false,
              limitReached: true,
              message:      `You've used all ${FREE_LIKES_PER_DAY} free likes for today. Upgrade to Gold for unlimited likes.`,
            },
            { status: 429 }
          );
        }
        if (action === 'super_like' && (limitRow.superLikesUsed ?? 0) >= FREE_SUPER_LIKES_PER_DAY) {
          return NextResponse.json(
            {
              success:      false,
              limitReached: true,
              message:      `You've used your free Super Like for today. Upgrade to Gold for ${GOLD_SUPER_LIKES_PER_DAY}/day.`,
            },
            { status: 429 }
          );
        }
      } else {
        // Gold tier: only super_likes are capped (at 5/day)
        if (action === 'super_like' && (limitRow.superLikesUsed ?? 0) >= GOLD_SUPER_LIKES_PER_DAY) {
          return NextResponse.json(
            {
              success:      false,
              limitReached: true,
              message:      `You've used all ${GOLD_SUPER_LIKES_PER_DAY} Super Likes for today. They refresh at midnight.`,
            },
            { status: 429 }
          );
        }
      }
    }

    // ── Clear expired pass so the recycle path works (see feed/route.ts) ──
    await db
      .delete(swipes)
      .where(
        and(
          eq(swipes.swiperId, currentUserId),
          eq(swipes.swipedId, targetId),
          eq(swipes.action, 'pass'),
          lt(swipes.createdAt, new Date(Date.now() - PASS_RECYCLE_MS))
        )
      );

    // ── Record the swipe ──────────────────────────────────────────────────
    await db
      .insert(swipes)
      .values({ swiperId: currentUserId, swipedId: targetId, action: action as SwipeAction })
      .onConflictDoNothing();

    // ── Increment daily counter after a successful swipe ──────────────────
    if ((action === 'like' || action === 'super_like') && limitRow) {
      await incrementLimit(limitRow.id, action);
    }

    // ── Match detection ───────────────────────────────────────────────────
    let isMatch    = false;
    let matchedUser = null;

    if (action === 'like' || action === 'super_like') {
      const [reciprocal] = await db
        .select()
        .from(swipes)
        .where(and(eq(swipes.swiperId, targetId), eq(swipes.swipedId, currentUserId)));

      if (reciprocal && (reciprocal.action === 'like' || reciprocal.action === 'super_like')) {
        isMatch = true;

        const [newMatch] = await db
          .insert(matches)
          .values({
            user1Id: Math.min(currentUserId, targetId),
            user2Id: Math.max(currentUserId, targetId),
          })
          .onConflictDoNothing()
          .returning();

        if (newMatch) {
          await db.insert(notifications).values({
            userId:   targetId,
            type:     'match',
            title:    "It's a Match! 🎉",
            body:     'Someone liked you back!',
            metadata: { matchId: newMatch.id },
          });
        }

        const [targetUser] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, targetId));
        const targetPhotos = await db.select().from(photos).where(eq(photos.userId, targetId));

        if (targetUser) {
          // Only the fields the match celebration needs — never spread the raw
          // user row, which carries phone number, email, and googleId.
          matchedUser = {
            id:    targetUser.id,
            name:  targetUser.name,
            photo: targetPhotos[0]?.url ?? null,
          };
        }
      }
    }

    return NextResponse.json({ success: true, action, isMatch, matchedUser });
  } catch (error) {
    console.error('Error processing swipe:', error);
    return NextResponse.json(
      { success: false, message: 'Could not record swipe' },
      { status: 500 }
    );
  }
}

/* ── DELETE /api/swipes — undo last swipe ────── */

/* Undo the caller's most recent swipe on a user. Swipes that already
   became a match cannot be undone — the other person has seen it. */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.userId;

    const { swipedUserId } = await request.json();
    const targetId = Number(swipedUserId);

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json(
        { success: false, message: 'A valid swipedUserId is required' },
        { status: 400 }
      );
    }

    const [existingMatch] = await db
      .select({ id: matches.id })
      .from(matches)
      .where(
        and(
          eq(matches.user1Id, Math.min(currentUserId, targetId)),
          eq(matches.user2Id, Math.max(currentUserId, targetId))
        )
      );
    if (existingMatch) {
      return NextResponse.json(
        { success: false, message: "You already matched — this swipe can't be undone." },
        { status: 409 }
      );
    }

    await db
      .delete(swipes)
      .where(and(eq(swipes.swiperId, currentUserId), eq(swipes.swipedId, targetId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error undoing swipe:', error);
    return NextResponse.json(
      { success: false, message: 'Could not undo swipe' },
      { status: 500 }
    );
  }
}
