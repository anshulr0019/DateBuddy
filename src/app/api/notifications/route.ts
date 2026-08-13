import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — fetch notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, Number(sp.get('limit') ?? '30')));

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    const unreadCount = rows.filter((n) => !n.isRead).length;

    return NextResponse.json({ success: true, notifications: rows, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Could not load notifications' }, { status: 500 });
  }
}

// PATCH — mark notifications as read (all or specific IDs)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids: number[] | undefined = Array.isArray(body?.ids) ? body.ids.map(Number) : undefined;

    if (ids && ids.length > 0) {
      // Mark specific notifications read
      for (const id of ids) {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(and(eq(notifications.id, id), eq(notifications.userId, session.userId)));
      }
    } else {
      // Mark all as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, session.userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    return NextResponse.json({ success: false, message: 'Could not update notifications' }, { status: 500 });
  }
}

// DELETE — clear all notifications for the current user
export async function DELETE() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await db.delete(notifications).where(eq(notifications.userId, session.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json({ success: false, message: 'Could not clear notifications' }, { status: 500 });
  }
}
