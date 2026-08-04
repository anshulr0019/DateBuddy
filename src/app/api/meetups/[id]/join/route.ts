import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetupAttendees, meetups } from '@/db/schema';
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

    const existing = await db
      .select()
      .from(meetupAttendees)
      .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, userId)));

    if (existing.length > 0) {
      await db
        .delete(meetupAttendees)
        .where(and(eq(meetupAttendees.meetupId, meetupId), eq(meetupAttendees.userId, userId)));
      return NextResponse.json({ success: true, action: 'left' });
    }

    const [{ attendees }] = await db
      .select({ attendees: count() })
      .from(meetupAttendees)
      .where(eq(meetupAttendees.meetupId, meetupId));

    if (Number(attendees) >= (meetup.maxAttendees ?? 10)) {
      return NextResponse.json({ success: false, message: 'Event is full' }, { status: 409 });
    }

    // Unique index on (meetupId, userId) makes the concurrent double-join a no-op.
    const inserted = await db
      .insert(meetupAttendees)
      .values({ meetupId, userId, status: 'going' })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json({ success: true, action: inserted.length ? 'joined' : 'already_joined' });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json({ success: false, message: 'Failed to update RSVP' }, { status: 500 });
  }
}
