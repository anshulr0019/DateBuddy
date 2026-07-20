import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups, meetupAttendees, users, photos } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetupId = parseInt(params.id);
    
    const [meetup] = await db.select()
      .from(meetups)
      .where(eq(meetups.id, meetupId));

    if (!meetup) {
      return NextResponse.json(
        { success: false, message: 'Meetup not found' },
        { status: 404 }
      );
    }

    // Get host info
    const hostData = await db.select({
      id: users.id,
      name: users.name,
      photo: photos.url,
      verified: users.isVerified,
    })
    .from(users)
    .leftJoin(photos, eq(users.id, photos.userId))
    .where(eq(users.id, meetup.hostId))
    .limit(1);

    // Get attendees
    const attendeesData = await db.select({
      id: users.id,
      name: users.name,
      photo: photos.url,
    })
    .from(meetupAttendees)
    .leftJoin(users, eq(meetupAttendees.userId, users.id))
    .leftJoin(photos, eq(users.id, photos.userId))
    .where(eq(meetupAttendees.meetupId, meetupId));

    return NextResponse.json({
      success: true,
      meetup: {
        ...meetup,
        host: hostData[0] || null,
        attendees: attendeesData,
        attendeesCount: attendeesData.length,
      },
    });
  } catch (error) {
    console.error('Error fetching meetup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch meetup' },
      { status: 500 }
    );
  }
}