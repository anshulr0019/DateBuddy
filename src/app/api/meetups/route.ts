import { NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups, meetupAttendees, users } from '@/db/schema';
import { and, eq, gt, asc, inArray, count } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const allMeetups = await db
      .select()
      .from(meetups)
      .where(and(eq(meetups.status, 'active'), gt(meetups.date, new Date())))
      .orderBy(asc(meetups.date))
      .limit(50);

    if (allMeetups.length === 0) {
      return NextResponse.json({ success: true, meetups: [] });
    }

    const meetupIds = allMeetups.map((m) => m.id);
    const hostIds = [...new Set(allMeetups.map((m) => m.hostId))];

    const [counts, myRsvps, hosts] = await Promise.all([
      db
        .select({ meetupId: meetupAttendees.meetupId, attendees: count() })
        .from(meetupAttendees)
        .where(
          and(
            inArray(meetupAttendees.meetupId, meetupIds),
            eq(meetupAttendees.status, 'going')
          )
        )
        .groupBy(meetupAttendees.meetupId),
      db
        .select({ meetupId: meetupAttendees.meetupId, status: meetupAttendees.status })
        .from(meetupAttendees)
        .where(
          and(
            inArray(meetupAttendees.meetupId, meetupIds),
            eq(meetupAttendees.userId, session.userId)
          )
        ),
      db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, hostIds)),
    ]);

    const countByMeetup = new Map(counts.map((c) => [c.meetupId, Number(c.attendees)]));
    const rsvpStatusByMeetup = new Map(myRsvps.map((r) => [r.meetupId, r.status ?? 'going']));
    const hostById = new Map(hosts.map((h) => [h.id, h.name]));

    const enriched = allMeetups.map((m) => {
      const userJoinStatus = rsvpStatusByMeetup.get(m.id) ?? null;
      return {
        ...m,
        hostName: hostById.get(m.hostId) ?? 'Host',
        attendeesCount: countByMeetup.get(m.id) ?? 0,
        joined: userJoinStatus === 'going',
        userJoinStatus,
        requireApproval: m.requireApproval ?? false,
      };
    });

    return NextResponse.json({ success: true, meetups: enriched });
  } catch (error) {
    console.error('Error fetching meetups:', error);
    return NextResponse.json(
      { success: false, message: 'Could not load meetups' },
      { status: 503 }
    );
  }
}
