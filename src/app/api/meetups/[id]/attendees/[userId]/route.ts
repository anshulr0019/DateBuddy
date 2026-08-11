import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups, meetupAttendees, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Host-only: kick a participant. Frees their slot; they lose their spot.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId: userIdParam } = await params;
    const meetupId = Number(id);
    const targetId = Number(userIdParam);
    if (!Number.isInteger(meetupId) || meetupId <= 0 || !Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid meetup or user id' }, { status: 400 });
    }

    const [meetup] = await db.select().from(meetups).where(eq(meetups.id, meetupId));
    if (!meetup) {
      return NextResponse.json({ success: false, message: 'Meetup not found' }, { status: 404 });
    }
    if (meetup.hostId !== session.userId) {
      return NextResponse.json({ success: false, message: 'Only the host can manage this meetup' }, { status: 403 });
    }
    if (targetId === session.userId) {
      return NextResponse.json({ success: false, message: 'Host cannot be removed' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(meetupAttendees)
      .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, targetId)));

    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: 'User is not an attendee' }, { status: 404 });
    }

    await db
      .delete(meetupAttendees)
      .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, targetId)));

    await db.insert(notifications).values({
      userId: targetId,
      type: 'event',
      title: 'Removed from Squad',
      body: `You were removed from "${meetup.title || 'a squad'}" by the host.`,
      metadata: { meetupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing attendee:', error);
    return NextResponse.json({ success: false, message: 'Failed to remove attendee' }, { status: 500 });
  }
}