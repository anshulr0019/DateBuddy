import { NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups } from '@/db/schema';

export async function GET() {
  try {
    const allMeetups = await db.select().from(meetups);

    return NextResponse.json({
      success: true,
      meetups: allMeetups,
    });
  } catch (error) {
    console.error('Error fetching meetups:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch meetups' },
      { status: 500 }
    );
  }
}