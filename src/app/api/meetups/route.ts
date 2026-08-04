import { NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups } from '@/db/schema';
import { and, eq, gt, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allMeetups = await db
      .select()
      .from(meetups)
      .where(and(eq(meetups.status, 'active'), gt(meetups.date, new Date())))
      .orderBy(asc(meetups.date))
      .limit(50);

    return NextResponse.json({ success: true, meetups: allMeetups });
  } catch (error) {
    console.error('Error fetching meetups:', error);
    return NextResponse.json(
      { success: false, message: 'Could not load meetups' },
      { status: 503 }
    );
  }
}
