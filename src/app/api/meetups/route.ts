import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { meetups, meetupAttendees, users, photos } from '@/db/schema';
import { eq, desc, gte } from 'drizzle-orm';

// GET all meetups
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Mumbai';
    const category = searchParams.get('category');

    let query = db.select({
      meetup: meetups,
      host: {
        id: users.id,
        name: users.name,
        photo: photos.url,
      }
    })
    .from(meetups)
    .leftJoin(users, eq(meetups.hostId, users.id))
    .leftJoin(photos, eq(users.id, photos.userId))
    .where(eq(meetups.status, 'active'))
    .orderBy(desc(meetups.date));

    const allMeetups = await query;
    
    // Get attendee counts
    const meetupsWithCounts = await Promise.all(
      allMeetups.map(async (m) => {
        const attendees = await db.select()
          .from(meetupAttendees)
          .where(eq(meetupAttendees.meetupId, m.meetup.id));
        
        return {
          ...m.meetup,
          host: m.host,
          attendeesCount: attendees.length,
        };
      })
    );

    return NextResponse.json({ success: true, meetups: meetupsWithCounts });
  } catch (error) {
    console.error('Error fetching meetups:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch meetups' },
      { status: 500 }
    );
  }
}

// POST create meetup
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { userId, title, description, category, venueName, address, date, maxAttendees, imageUrl } = body;

    const [meetup] = await db.insert(meetups).values({
      hostId: userId,
      title,
      description,
      category,
      venueName,
      address,
      date: new Date(date),
      maxAttendees: maxAttendees || 10,
      imageUrl,
    }).returning();

    // Auto-add host as attendee
    await db.insert(meetupAttendees).values({
      meetupId: meetup.id,
      userId,
      status: 'going',
    });

    return NextResponse.json({ success: true, meetupId: meetup.id });
  } catch (error) {
    console.error('Error creating meetup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create meetup' },
      { status: 500 }
    );
  }
}
