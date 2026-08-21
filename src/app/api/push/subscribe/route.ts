import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/* POST — save a new push subscription (or update if endpoint already exists) */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;
    const { p256dh, auth } = keys ?? {};

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ success: false, message: 'Missing subscription fields' }, { status: 400 });
    }

    // Upsert: delete old row for this endpoint, then insert fresh
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    await db.insert(pushSubscriptions).values({
      userId: session.userId,
      endpoint,
      p256dh,
      auth,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save subscription' }, { status: 500 });
  }
}

/* DELETE — unsubscribe a specific endpoint */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { endpoint } = body;

    if (!endpoint) {
      // Delete all subscriptions for this user
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, session.userId));
    } else {
      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, session.userId),
            eq(pushSubscriptions.endpoint, endpoint)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push Unsubscribe] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to remove subscription' }, { status: 500 });
  }
}
