import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { meetups, meetupAttendees, users, photos, notifications } from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

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

    const session = await getAuthSession();

    const [meetup] = await db.select().from(meetups).where(eq(meetups.id, meetupId));
    if (!meetup) {
      return NextResponse.json({ success: false, message: 'Meetup not found' }, { status: 404 });
    }

    const [host] = await db
      .select({ id: users.id, name: users.name, verified: users.isVerified })
      .from(users)
      .where(eq(users.id, meetup.hostId));

    const attendeeRows = await db
      .select({ id: users.id, name: users.name, status: meetupAttendees.status })
      .from(meetupAttendees)
      .innerJoin(users, eq(meetupAttendees.userId, users.id))
      .where(eq(meetupAttendees.meetupId, meetupId))
      .orderBy(desc(meetupAttendees.id));

    // Fetch photos separately — joining them inflates the attendee row count.
    const relevantIds = [...new Set([meetup.hostId, ...attendeeRows.map((a) => a.id)])];
    const allPhotos = relevantIds.length
      ? await db.select().from(photos).where(inArray(photos.userId, relevantIds))
      : [];

    const photoByUser = new Map<number, string>();
    for (const p of allPhotos) {
      if (!photoByUser.has(p.userId)) photoByUser.set(p.userId, p.url);
    }

    const isHost = session ? session.userId === meetup.hostId : false;
    const myRecord = session ? attendeeRows.find((a) => a.id === session.userId) : null;
    const userJoinStatus = myRecord ? myRecord.status ?? 'going' : null;

    const going = attendeeRows
      .filter((a) => a.status === 'going' || !a.status)
      .map((a) => ({ id: a.id, name: a.name, photo: photoByUser.get(a.id) ?? null }));

    const pendingRequests = isHost
      ? attendeeRows
          .filter((a) => a.status === 'pending')
          .map((a) => ({ id: a.id, name: a.name, photo: photoByUser.get(a.id) ?? null }))
      : [];

    return NextResponse.json({
      success: true,
      meetup: {
        ...meetup,
        host: host ? { ...host, photo: photoByUser.get(host.id) ?? null } : null,
        attendees: going,
        attendeesCount: going.length,
        pendingRequests,
        isHost,
        isJoined: userJoinStatus === 'going',
        userJoinStatus,
        requireApproval: meetup.requireApproval ?? false,
      },
    });
  } catch (error) {
    console.error('Error fetching meetup:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch meetup' }, { status: 500 });
  }
}

// Host-only: edit fields, pin announcement, or cancel the meetup.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const meetupId = Number(id);
    if (!Number.isInteger(meetupId) || meetupId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid meetup id' }, { status: 400 });
    }

    const [meetup] = await db.select().from(meetups).where(eq(meetups.id, meetupId));
    if (!meetup) {
      return NextResponse.json({ success: false, message: 'Meetup not found' }, { status: 404 });
    }
    if (meetup.hostId !== session.userId) {
      return NextResponse.json({ success: false, message: 'Only the host can manage this meetup' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));

    const allowedFields: Record<string, unknown> = {};
    const scalarFields: (keyof typeof meetups.$inferSelect)[] = [
      'title',
      'description',
      'category',
      'activityType',
      'venueName',
      'address',
      'city',
      'latitude',
      'longitude',
      'duration',
      'maxAttendees',
      'imageUrl',
    ];
    for (const f of scalarFields) {
      if (f in body) allowedFields[f] = body[f] ?? null;
    }

    // title & category remain required (mirror create validation)
    if ('title' in allowedFields && typeof allowedFields.title === 'string') {
      const t = (allowedFields.title as string).trim();
      if (!t) return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
      if (t.length > 200) return NextResponse.json({ success: false, message: 'Title too long' }, { status: 400 });
      allowedFields.title = t;
    }
    if ('category' in allowedFields && typeof allowedFields.category === 'string') {
      const c = (allowedFields.category as string).trim();
      if (!c) return NextResponse.json({ success: false, message: 'Category is required' }, { status: 400 });
      allowedFields.category = c;
    }
    if ('maxAttendees' in allowedFields) {
      const cap = allowedFields.maxAttendees as number;
      if (Number.isNaN(cap) || cap < 2 || cap > 100) {
        return NextResponse.json({ success: false, message: 'maxAttendees must be between 2 and 100' }, { status: 400 });
      }
      allowedFields.maxAttendees = Math.round(cap);
    }
    if ('date' in body) {
      if (!body.date) return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
      const d = new Date(body.date);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ success: false, message: 'Invalid date' }, { status: 400 });
      }
      if (d.getTime() <= Date.now()) {
        return NextResponse.json({ success: false, message: 'Date must be in the future' }, { status: 400 });
      }
      allowedFields.date = d;
    }
    if ('pinnedMessage' in body) {
      const p = body.pinnedMessage;
      if (p !== null && typeof p === 'string') {
        if (p.trim().length > 500) {
          return NextResponse.json({ success: false, message: 'Pinned message too long' }, { status: 400 });
        }
        allowedFields.pinnedMessage = p.trim();
      } else {
        allowedFields.pinnedMessage = null;
      }
    }
    if ('status' in body) {
      if (body.status !== 'cancelled' && body.status !== 'active') {
        return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
      }
      allowedFields.status = body.status;
    }

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ success: false, message: 'Nothing to update' }, { status: 400 });
    }

    allowedFields.updatedAt = new Date();

    const [updated] = await db
      .update(meetups)
      .set(allowedFields)
      .where(eq(meetups.id, meetupId))
      .returning();

    // Notify all attendees (except the host) about cancel / date change / new announcement.
    const affected: string[] = [];
    if (allowedFields.status === 'cancelled') affected.push('cancelled');
    if (allowedFields.date) affected.push('date');
    if (allowedFields.pinnedMessage !== undefined) affected.push('announcement');

    if (affected.length > 0 && updated.status !== 'completed') {
      const attendeeRows = await db
        .select({ id: users.id })
        .from(meetupAttendees)
        .innerJoin(users, eq(meetupAttendees.userId, users.id))
        .where(eq(meetupAttendees.meetupId, meetupId));
      const targets = attendeeRows.map((a) => a.id).filter((uid) => uid !== session.userId);

      if (affected.includes('cancelled')) {
        const values = targets.map((userId) => ({
          userId,
          type: 'event',
          title: 'Squad Cancelled',
          body: `${updated.title || 'Your squad'} has been cancelled by the host.`,
          metadata: { meetupId },
        }));
        if (values.length) await db.insert(notifications).values(values);
      } else if (affected.includes('date')) {
        const d = updated.date ? new Date(updated.date) : null;
        const when = d ? d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
        const values = targets.map((userId) => ({
          userId,
          type: 'event',
          title: 'Squad Rescheduled',
          body: `${d ? `New time: ${when}` : ''}`.trim() || 'The host updated the squad details.',
          metadata: { meetupId },
        }));
        if (values.length) await db.insert(notifications).values(values);
      } else if (affected.includes('announcement')) {
        const values = targets.map((userId) => ({
          userId,
          type: 'event',
          title: 'New Announcement',
          body: updated.pinnedMessage || 'The host pinned a new announcement.',
          metadata: { meetupId },
        }));
        if (values.length) await db.insert(notifications).values(values);
      }
    }

    return NextResponse.json({ success: true, meetup: updated });
  } catch (error) {
    console.error('Error updating meetup:', error);
    return NextResponse.json({ success: false, message: 'Failed to update meetup' }, { status: 500 });
  }
}
