import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  photos,
  swipes,
  blocks,
  interests,
  userInterests,
  prompts,
  userPromptAnswers,
} from '@/db/schema';
import { eq, ne, notInArray, inArray, and, gt, asc } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

// Profiles that were passed reappear in the feed after this many hours.
const PASS_RECYCLE_HOURS = 24;
const PASS_RECYCLE_MS = PASS_RECYCLE_HOURS * 60 * 60 * 1000;

// "Active now" window — anything older is simply not reported as online.
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

// Haversine distance in km between two coordinate pairs.
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 100) * 100)}m away`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)}km away`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.userId;

    const cursorParam = request.nextUrl.searchParams.get('cursor');
    const cursor = cursorParam !== null ? Number(cursorParam) : null;
    const validCursor = cursor !== null && Number.isInteger(cursor) && cursor > 0 ? cursor : null;

    // Two separate exclusion buckets:
    //
    // 1. likedByMe — like/super_like swipes are permanent. The profile was
    //    already acted on positively; never show it again.
    //
    // 2. recentPassByMe — pass swipes only block the profile for
    //    PASS_RECYCLE_HOURS. After that window the profile can resurface,
    //    giving both sides another chance.
    //
    // All excluded-id columns are NOT NULL, so NOT IN is safe here.
    const likedByMe = db
      .select({ id: swipes.swipedId })
      .from(swipes)
      .where(and(eq(swipes.swiperId, currentUserId), ne(swipes.action, 'pass')));

    const recentPassByMe = db
      .select({ id: swipes.swipedId })
      .from(swipes)
      .where(
        and(
          eq(swipes.swiperId, currentUserId),
          eq(swipes.action, 'pass'),
          gt(swipes.createdAt, new Date(Date.now() - PASS_RECYCLE_MS))
        )
      );

    const blockedByMe = db
      .select({ id: blocks.blockedId })
      .from(blocks)
      .where(eq(blocks.blockerId, currentUserId));
    const blockedMe = db
      .select({ id: blocks.blockerId })
      .from(blocks)
      .where(eq(blocks.blockedId, currentUserId));

    const conditions = [
      ne(users.id, currentUserId),
      eq(users.isActive, true),
      notInArray(users.id, likedByMe),
      notInArray(users.id, recentPassByMe),
      notInArray(users.id, blockedByMe),
      notInArray(users.id, blockedMe),
    ];
    if (validCursor !== null) {
      conditions.push(gt(users.id, validCursor));
    }

    // Viewer coordinates and candidates are independent — fetch in parallel.
    const [[viewer], candidateUsers] = await Promise.all([
      db
        .select({ latitude: users.latitude, longitude: users.longitude })
        .from(users)
        .where(eq(users.id, currentUserId)),
      db
        .select({
          id: users.id,
          name: users.name,
          dateOfBirth: users.dateOfBirth,
          city: users.city,
          bio: users.bio,
          latitude: users.latitude,
          longitude: users.longitude,
          isVerified: users.isVerified,
          lastActiveAt: users.lastActiveAt,
        })
        .from(users)
        .where(and(...conditions))
        .orderBy(asc(users.id))
        .limit(PAGE_SIZE),
    ]);

    if (candidateUsers.length === 0) {
      return NextResponse.json({ success: true, profiles: [], nextCursor: null });
    }

    const candidateIds = candidateUsers.map((u) => u.id);

    const [allPhotos, allInterests, allPromptAnswers] = await Promise.all([
      db
        .select()
        .from(photos)
        .where(inArray(photos.userId, candidateIds))
        .orderBy(asc(photos.orderIndex)),
      db
        .select({ userId: userInterests.userId, name: interests.name })
        .from(userInterests)
        .innerJoin(interests, eq(userInterests.interestId, interests.id))
        .where(inArray(userInterests.userId, candidateIds)),
      db
        .select({ userId: userPromptAnswers.userId, question: prompts.text, answer: userPromptAnswers.answer })
        .from(userPromptAnswers)
        .innerJoin(prompts, eq(userPromptAnswers.promptId, prompts.id))
        .where(inArray(userPromptAnswers.userId, candidateIds)),
    ]);

    const photosByUser = new Map<number, string[]>();
    for (const p of allPhotos) {
      const list = photosByUser.get(p.userId) ?? [];
      list.push(p.url);
      photosByUser.set(p.userId, list);
    }

    const interestsByUser = new Map<number, string[]>();
    for (const row of allInterests) {
      const list = interestsByUser.get(row.userId) ?? [];
      list.push(row.name);
      interestsByUser.set(row.userId, list);
    }

    const promptsByUser = new Map<number, { q: string; a: string }[]>();
    for (const row of allPromptAnswers) {
      const list = promptsByUser.get(row.userId) ?? [];
      list.push({ q: row.question, a: row.answer });
      promptsByUser.set(row.userId, list);
    }

    const viewerLat = viewer?.latitude != null ? Number(viewer.latitude) : null;
    const viewerLon = viewer?.longitude != null ? Number(viewer.longitude) : null;
    const now = Date.now();

    const profiles = candidateUsers.map((u) => {
      const lat = u.latitude != null ? Number(u.latitude) : null;
      const lon = u.longitude != null ? Number(u.longitude) : null;

      let distance: string | null = null;
      if (viewerLat !== null && viewerLon !== null && lat !== null && lon !== null) {
        distance = formatDistance(distanceKm(viewerLat, viewerLon, lat, lon));
      }

      return {
        id: u.id,
        name: u.name,
        age: calculateAge(u.dateOfBirth),
        city: u.city,
        bio: u.bio,
        verified: u.isVerified === true,
        online: u.lastActiveAt ? now - new Date(u.lastActiveAt).getTime() < ONLINE_WINDOW_MS : false,
        distance,
        photos: photosByUser.get(u.id) ?? [],
        tags: interestsByUser.get(u.id) ?? [],
        prompts: promptsByUser.get(u.id) ?? [],
      };
    });

    return NextResponse.json({
      success: true,
      profiles,
      nextCursor: candidateUsers.length === PAGE_SIZE ? candidateUsers[candidateUsers.length - 1].id : null,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { success: false, message: 'Could not load profiles' },
      { status: 503 }
    );
  }
}
