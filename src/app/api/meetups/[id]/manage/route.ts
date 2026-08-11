import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups, meetupAttendees, users, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const hostUserId = session.userId;

    const { id } = await params;
    const meetupId = Number(id);
    if (!Number.isInteger(meetupId) || meetupId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid meetup id' }, { status: 400 });
    }

    const [meetup] = await db.select().from(meetups).where(eq(meetups.id, meetupId));
    if (!meetup) {
      return NextResponse.json({ success: false, message: 'Meetup not found' }, { status: 404 });
    }

    // Host check
    if (meetup.hostId !== hostUserId) {
      return NextResponse.json({ success: false, message: 'Only the host can manage attendees' }, { status: 403 });
    }

    const { action, targetUserId } = await request.json();
    const targetId = Number(targetUserId);

    if (!action || !['kick', 'approve', 'decline'].includes(action) || !Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid action or target user' }, { status: 400 });
    }

    if (targetId === hostUserId) {
      return NextResponse.json({ success: false, message: 'Host cannot kick themselves' }, { status: 400 });
    }

    const [targetAttendee] = await db
      .select()
      .from(meetupAttendees)
      .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, targetId)));

    if (!targetAttendee) {
      return NextResponse.json({ success: false, message: 'User is not in this squad' }, { status: 404 });
    }

    if (action === 'kick') {
      // Update status to 'kicked' so they cannot re-join instantly
      await db
        .update(meetupAttendees)
        .set({ status: 'kicked' })
        .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, targetId)));

      await db.insert(notifications).values({
        userId: targetId,
        type: 'event_kick',
        title: 'Removed from Squad ⚠️',
        body: `You were removed from "${meetup.title}" by the host.`,
        metadata: { meetupId },
      });

      return NextResponse.json({ success: true, action: 'kicked', targetId });
    }

    if (action === 'approve') {
      await db
        .update(meetupAttendees)
        .set({ status: 'going' })
        .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, targetId)));

      await db.insert(notifications).values({
        userId: targetId,
        type: 'event_approved',
        title: 'Request Approved! 🎉',
        body: `The host accepted your request to join "${meetup.title}".`,
        metadata: { meetupId },
      });

      return NextResponse.json({ success: true, action: 'approved', targetId });
    }

    if (action === 'decline') {
      await db
        .delete(meetupAttendees)
        .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, targetId)));

      return NextResponse.json({ success: true, action: 'declined', targetId });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error in meetup manage route:', error);
    return NextResponse.json({ success: false, message: 'Management action failed' }, { status: 500 });
  }
}
