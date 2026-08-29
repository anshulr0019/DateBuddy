import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetupAttendees, meetups, users, notifications } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
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
    const userId = session.userId;

    const { id } = await params;
    const meetupId = Number(id);
    if (!Number.isInteger(meetupId) || meetupId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid meetup id' }, { status: 400 });
    }

    const [meetup] = await db.select().from(meetups).where(eq(meetups.id, meetupId));
    if (!meetup) {
      return NextResponse.json({ success: false, message: 'Meetup not found' }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(meetupAttendees)
      .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, userId)));

    if (existing) {
      if (existing.status === 'kicked') {
        return NextResponse.json({ success: false, message: 'You were removed from this session by the host.' }, { status: 403 });
      }
      // Leave / cancel request
      await db
        .delete(meetupAttendees)
        .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, userId)));
      return NextResponse.json({ success: true, action: 'left', status: null });
    }

    const [{ attendees }] = await db
      .select({ attendees: count() })
      .from(meetupAttendees)
      .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.status, 'going')));

    if (Number(attendees) >= (meetup.maxAttendees ?? 10)) {
      return NextResponse.json({ success: false, message: 'Event is full' }, { status: 409 });
    }

    const targetStatus = meetup.requireApproval ? 'pending' : 'going';

    await db
      .insert(meetupAttendees)
      .values({ meetupId, userId, status: targetStatus })
      .onConflictDoNothing();

    // If require approval, notify host
    if (targetStatus === 'pending' && meetup.hostId !== userId) {
      const [currentUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
      await db.insert(notifications).values({
        userId: meetup.hostId,
        type: 'event_request',
        title: 'Join Request ✋',
        body: `${currentUser?.name ?? 'Someone'} requested to join your squad "${meetup.title}".`,
        metadata: { meetupId, applicantUserId: userId, actionUrl: `/meetups/${meetupId}` },
      });
    }

    return NextResponse.json({
      success: true,
      action: targetStatus === 'pending' ? 'requested' : 'joined',
      status: targetStatus,
    });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json({ success: false, message: 'Failed to update RSVP' }, { status: 500 });
  }
}
