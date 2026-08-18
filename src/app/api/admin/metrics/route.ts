import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, matches, messages, photos, subscriptions, swipes } from '@/db/schema';
import { desc, count, sql, gte, inArray } from 'drizzle-orm';

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

    const now = new Date();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Parallel KPI Counts
    const [
      [{ totalUsers }],
      [{ activeToday }],
      [{ totalMatches }],
      [{ totalMessages }],
      [{ totalSwipes }],
    ] = await Promise.all([
      db.select({ totalUsers: count() }).from(users),
      db.select({ activeToday: count() }).from(users).where(gte(users.lastActiveAt, twentyFourHoursAgo)),
      db.select({ totalMatches: count() }).from(matches),
      db.select({ totalMessages: count() }).from(messages),
      db.select({ totalSwipes: count() }).from(swipes),
    ]);

    // 2. Gender distribution
    const genderStats = await db
      .select({ gender: users.gender, count: count() })
      .from(users)
      .groupBy(users.gender);

    // 3. Top Cities
    const cityStats = await db
      .select({ city: users.city, count: count() })
      .from(users)
      .where(sql`${users.city} IS NOT NULL AND ${users.city} != ''`)
      .groupBy(users.city)
      .orderBy(desc(count()))
      .limit(8);

    // 4. Recent 100 Signups
    const recentUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(100);

    const userIds = recentUsers.map((u) => u.id);

    // Fetch primary photos & subscriptions for these users
    const [userPhotos, userSubs] = await Promise.all([
      userIds.length > 0
        ? db
            .select()
            .from(photos)
            .where(inArray(photos.userId, userIds))
        : [],
      userIds.length > 0
        ? db
            .select()
            .from(subscriptions)
            .where(inArray(subscriptions.userId, userIds))
        : [],
    ]);

    const photoByUserId = new Map<number, string>();
    for (const p of userPhotos) {
      if (!photoByUserId.has(p.userId) || p.orderIndex === 0) {
        photoByUserId.set(p.userId, p.url);
      }
    }

    const subByUserId = new Map<number, string>();
    for (const s of userSubs) {
      subByUserId.set(s.userId, s.tier);
    }

    const userList = recentUsers.map((u) => {
      let age: number | null = null;
      if (u.dateOfBirth) {
        const birthYear = new Date(u.dateOfBirth).getFullYear();
        age = new Date().getFullYear() - birthYear;
      }

      return {
        id: u.id,
        name: u.name,
        phone: u.phoneNumber ?? '—',
        email: u.email ?? '—',
        age: age ?? 20,
        gender: u.gender,
        city: u.city || '—',
        isVerified: u.isVerified ?? false,
        onboardingComplete: Boolean(u.onboardingCompletedAt),
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
        photo: photoByUserId.get(u.id) || null,
        tier: subByUserId.get(u.id) || 'free',
      };
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers: Number(totalUsers),
        activeToday: Number(activeToday),
        totalMatches: Number(totalMatches),
        totalMessages: Number(totalMessages),
        totalSwipes: Number(totalSwipes),
        earlyVipRemaining: Math.max(0, 500 - Number(totalUsers)),
        genderStats,
        cityStats,
      },
      users: userList,
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return NextResponse.json(
      { success: false, message: 'Could not fetch admin metrics' },
      { status: 500 }
    );
  }
}
