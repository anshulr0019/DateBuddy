import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups, meetupAttendees } from '@/db/schema';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.userId;

    const { title, description, category, venueName, address, city, date, maxAttendees, imageUrl } =
      await request.json();

    if (typeof title !== 'string' || !title.trim() || title.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Title is required and must be under 200 characters' },
        { status: 400 }
      );
    }
    if (typeof category !== 'string' || !category.trim()) {
      return NextResponse.json({ success: false, message: 'Category is required' }, { status: 400 });
    }

    const parsedDate = typeof date === 'string' && !isNaN(Date.parse(date)) ? new Date(date) : null;
    if (!parsedDate) {
      return NextResponse.json({ success: false, message: 'A valid date is required' }, { status: 400 });
    }
    if (parsedDate.getTime() <= Date.now()) {
      return NextResponse.json({ success: false, message: 'The date must be in the future' }, { status: 400 });
    }

    const capacity = Number(maxAttendees);
    const safeCapacity = Number.isInteger(capacity) && capacity >= 2 && capacity <= 100 ? capacity : 10;

    const [newMeetup] = await db
      .insert(meetups)
      .values({
        hostId: currentUserId,
        title: title.trim(),
        description: typeof description === 'string' ? description.slice(0, 2000) : '',
        category: category.trim().slice(0, 50),
        venueName: typeof venueName === 'string' ? venueName.slice(0, 200) : null,
        address: typeof address === 'string' ? address : null,
        city: typeof city === 'string' ? city.slice(0, 100) : null,
        date: parsedDate,
        maxAttendees: safeCapacity,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
      })
      .returning();

    await db
      .insert(meetupAttendees)
      .values({ meetupId: newMeetup.id, userId: currentUserId, status: 'going' })
      .onConflictDoNothing();

    return NextResponse.json({ success: true, meetup: newMeetup });
  } catch (error) {
    console.error('Error creating meetup:', error);
    return NextResponse.json({ success: false, message: 'Failed to create meetup' }, { status: 500 });
  }
}
