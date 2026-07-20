import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetupAttendees, meetups } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetupId = parseInt(params.id);
    const { userId } = await request.json();

    console.log('Join request:', { meetupId, userId });

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID required' },
        { status: 400 }
      );
    }

    // Get the meetup first
    const [meetup] = await db.select()
      .from(meetups)
      .where(eq(meetups.id, meetupId));

    if (!meetup) {
      return NextResponse.json(
        { success: false, message: 'Meetup not found' },
        { status: 404 }
      );
    }

    // Check if already joined
    const existing = await db.select()
      .from(meetupAttendees)
      .where(and(
        eq(meetupAttendees.meetupId, meetupId),
        eq(meetupAttendees.userId, userId)
      ));

    if (existing.length > 0) {
      // Leave meetup
      await db.delete(meetupAttendees)
        .where(and(
          eq(meetupAttendees.meetupId, meetupId),
          eq(meetupAttendees.userId, userId)
        ));
      return NextResponse.json({ success: true, action: 'left' });
    }

    // Check capacity
    const currentAttendees = await db.select()
      .from(meetupAttendees)
      .where(eq(meetupAttendees.meetupId, meetupId));

    const maxAttendees = meetup.maxAttendees || 10; // Default to 10 if null

    if (currentAttendees.length >= maxAttendees) {
      return NextResponse.json(
        { success: false, message: 'Event is full' },
        { status: 400 }
      );
    }

    // Join meetup
    await db.insert(meetupAttendees).values({
      meetupId,
      userId,
      status: 'going',
    });

    return NextResponse.json({ success: true, action: 'joined' });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update RSVP' },
      { status: 500 }
    );
  }
}