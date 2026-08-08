import { NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.userId));

    const now = new Date();
    const isActive =
      sub !== undefined &&
      sub.tier !== 'free' &&
      sub.endDate !== null &&
      new Date(sub.endDate) > now;

    const daysLeft = isActive && sub.endDate
      ? Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return NextResponse.json({
      success: true,
      subscription: {
        tier: isActive ? sub.tier : 'free',
        isActive,
        expiresAt: isActive ? sub.endDate : null,
        daysLeft,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { success: false, message: 'Could not fetch subscription status' },
      { status: 500 }
    );
  }
}
