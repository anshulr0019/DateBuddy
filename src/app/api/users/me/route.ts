import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  photos,
  preferences,
  interests,
  userInterests,
  meetups,
  meetupAttendees,
  groups,
  groupMembers,
  activityRequests,
  checkIns,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getAuthSession, clearAuthSession } from '@/lib/auth';
import { syncUserInterests } from '@/lib/interests';

export const dynamic = 'force-dynamic';

const GENDERS = ['male', 'female', 'non-binary', 'other'];
const LOOKING_FOR = ['men', 'women', 'everyone'];
const MAX_PHOTOS = 6;
const MIN_AGE = 18;

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!user) {
      return NextResponse.json({ success: false, message: 'Account no longer exists' }, { status: 401 });
    }

    const [userPhotos, userPrefs, tags] = await Promise.all([
      db.select().from(photos).where(eq(photos.userId, user.id)).orderBy(photos.orderIndex),
      db.select().from(preferences).where(eq(preferences.userId, user.id)).limit(1),
      db
        .select({ name: interests.name })
        .from(userInterests)
        .innerJoin(interests, eq(userInterests.interestId, interests.id))
        .where(eq(userInterests.userId, user.id)),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        photos: userPhotos.map((p) => p.url),
        interests: tags.map((t) => t.name),
        preferences: userPrefs[0] ?? null,
      },
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    return NextResponse.json({ success: false, message: 'Could not load profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.userId;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if ('name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ success: false, message: 'Name cannot be empty' }, { status: 400 });
    }
    updates.name = name.slice(0, 100);
  }

  if ('bio' in body) {
    updates.bio = typeof body.bio === 'string' && body.bio.trim() ? body.bio.trim().slice(0, 500) : null;
  }

  if ('city' in body) {
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    if (!city) {
      return NextResponse.json({ success: false, message: 'City cannot be empty' }, { status: 400 });
    }
    updates.city = city.slice(0, 100);
  }

  if ('gender' in body) {
    if (!GENDERS.includes(body.gender as string)) {
      return NextResponse.json({ success: false, message: 'Invalid gender' }, { status: 400 });
    }
    updates.gender = body.gender;
  }

  if ('lookingFor' in body) {
    if (!LOOKING_FOR.includes(body.lookingFor as string)) {
      return NextResponse.json({ success: false, message: 'Invalid lookingFor' }, { status: 400 });
    }
    updates.lookingFor = body.lookingFor;
  }

  if ('dateOfBirth' in body) {
    const raw = body.dateOfBirth;
    if (typeof raw !== 'string' || isNaN(Date.parse(raw))) {
      return NextResponse.json({ success: false, message: 'Invalid date of birth' }, { status: 400 });
    }
    const dob = new Date(raw);
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < MIN_AGE) {
      return NextResponse.json(
        { success: false, message: `You must be ${MIN_AGE} or older` },
        { status: 400 }
      );
    }
    updates.dateOfBirth = dob;
  }

  try {
    let updated;
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
      if (!updated) {
        return NextResponse.json({ success: false, message: 'Account not found' }, { status: 401 });
      }
    }

    if ('photos' in body) {
      const urls = (Array.isArray(body.photos) ? body.photos : [])
        .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0)
        .slice(0, MAX_PHOTOS);
      await db.delete(photos).where(eq(photos.userId, userId));
      if (urls.length > 0) {
        await db.insert(photos).values(urls.map((url, i) => ({ userId, url, orderIndex: i })));
      }
    }

    if ('interests' in body) {
      await syncUserInterests(userId, body.interests);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, message: 'Could not save your changes' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.userId;

  try {
    // Six tables reference users without ON DELETE CASCADE, so they must be cleared by
    // hand or the final delete fails on a foreign key violation.
    await db.transaction(async (tx) => {
      const hosted = await tx
        .select({ id: meetups.id })
        .from(meetups)
        .where(eq(meetups.hostId, userId));
      const hostedIds = hosted.map((m) => m.id);

      if (hostedIds.length > 0) {
        await tx.delete(meetupAttendees).where(inArray(meetupAttendees.meetupId, hostedIds));
      }
      await tx.delete(meetupAttendees).where(eq(meetupAttendees.userId, userId));
      if (hostedIds.length > 0) {
        await tx.delete(meetups).where(inArray(meetups.id, hostedIds));
      }

      await tx.delete(groupMembers).where(eq(groupMembers.userId, userId));
      await tx.update(groups).set({ createdBy: null }).where(eq(groups.createdBy, userId));
      await tx.delete(activityRequests).where(eq(activityRequests.userId, userId));
      await tx.delete(checkIns).where(eq(checkIns.userId, userId));

      await tx.delete(users).where(eq(users.id, userId));
    });

    await clearAuthSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ success: false, message: 'Could not delete your account' }, { status: 500 });
  }
}
