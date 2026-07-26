import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups, meetupAttendees } from '@/db/schema';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const currentUserId = session?.userId || 1;

    const { title, description, category, venueName, address, city, date, maxAttendees, imageUrl } = await request.json();

    if (!title || !category) {
      return NextResponse.json(
        { success: false, message: 'Title and category are required' },
        { status: 400 }
      );
    }

    const [newMeetup] = await db.insert(meetups).values({
      hostId: currentUserId,
      title,
      description: description || '',
      category,
      venueName: venueName || 'City Center',
      address: address || '',
      city: city || 'Mumbai',
      date: date ? new Date(date) : new Date(Date.now() + 86400000 * 2), // Default 2 days from now
      maxAttendees: parseInt(maxAttendees) || 10,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    }).returning();

    // Auto-join host as first attendee
    await db.insert(meetupAttendees).values({
      meetupId: newMeetup.id,
      userId: currentUserId,
      status: 'going',
    });

    return NextResponse.json({
      success: true,
      meetup: newMeetup,
    });
  } catch (error) {
    console.error('Error creating meetup:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create meetup' },
      { status: 500 }
    );
  }
}
