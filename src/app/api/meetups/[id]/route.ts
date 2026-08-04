import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups, meetupAttendees, users, photos } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meetupId = Number(id);
    if (!Number.isInteger(meetupId) || meetupId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid meetup id' }, { status: 400 });
    }

    const [meetup] = await db.select().from(meetups).where(eq(meetups.id, meetupId));
    if (!meetup) {
      return NextResponse.json({ success: false, message: 'Meetup not found' }, { status: 404 });
    }

    const [host] = await db
      .select({ id: users.id, name: users.name, verified: users.isVerified })
      .from(users)
      .where(eq(users.id, meetup.hostId));

    const attendeeRows = await db
      .select({ id: users.id, name: users.name })
      .from(meetupAttendees)
      .innerJoin(users, eq(meetupAttendees.userId, users.id))
      .where(eq(meetupAttendees.meetupId, meetupId));

    // Fetch photos separately — joining them inflates the attendee row count.
    const relevantIds = [...new Set([meetup.hostId, ...attendeeRows.map((a) => a.id)])];
    const allPhotos = relevantIds.length
      ? await db.select().from(photos).where(inArray(photos.userId, relevantIds))
      : [];

    const photoByUser = new Map<number, string>();
    for (const p of allPhotos) {
      if (!photoByUser.has(p.userId)) photoByUser.set(p.userId, p.url);
    }

    const attendees = attendeeRows.map((a) => ({ ...a, photo: photoByUser.get(a.id) ?? null }));

    return NextResponse.json({
      success: true,
      meetup: {
        ...meetup,
        host: host ? { ...host, photo: photoByUser.get(host.id) ?? null } : null,
        attendees,
        attendeesCount: attendees.length,
      },
    });
  } catch (error) {
    console.error('Error fetching meetup:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch meetup' }, { status: 500 });
  }
}
