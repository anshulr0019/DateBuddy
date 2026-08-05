import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, preferences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const NOTIFICATION_KEYS = ['push', 'matches', 'messages', 'likes', 'meetups'] as const;
const PRIVACY_KEYS = ['incognito', 'hideDistance', 'showOnlineStatus'] as const;

const DEFAULTS = {
  notifications: { push: true, matches: true, messages: true, likes: false, meetups: true },
  privacy: { incognito: false, hideDistance: false, showOnlineStatus: true },
};

function pickBooleans(source: unknown, keys: readonly string[]) {
  const out: Record<string, boolean> = {};
  if (source && typeof source === 'object') {
    for (const key of keys) {
      const value = (source as Record<string, unknown>)[key];
      if (typeof value === 'boolean') out[key] = value;
    }
  }
  return out;
}

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [[user], [prefs]] = await Promise.all([
      db.select({ settings: users.settings }).from(users).where(eq(users.id, session.userId)),
      db.select().from(preferences).where(eq(preferences.userId, session.userId)).limit(1),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Account no longer exists' }, { status: 401 });
    }

    const stored = (user.settings ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      settings: {
        notifications: { ...DEFAULTS.notifications, ...pickBooleans(stored.notifications, NOTIFICATION_KEYS) },
        privacy: { ...DEFAULTS.privacy, ...pickBooleans(stored.privacy, PRIVACY_KEYS) },
        discovery: {
          ageMin: prefs?.ageMin ?? 18,
          ageMax: prefs?.ageMax ?? 30,
          distanceMax: prefs?.distanceMax ?? 50,
          onlyVerified: prefs?.onlyVerified ?? false,
        },
      },
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json({ success: false, message: 'Could not load settings' }, { status: 500 });
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

  try {
    if ('notifications' in body || 'privacy' in body) {
      const [current] = await db
        .select({ settings: users.settings })
        .from(users)
        .where(eq(users.id, userId));
      if (!current) {
        return NextResponse.json({ success: false, message: 'Account not found' }, { status: 401 });
      }
      const stored = (current.settings ?? {}) as Record<string, unknown>;

      const merged = {
        ...stored,
        notifications: {
          ...DEFAULTS.notifications,
          ...pickBooleans(stored.notifications, NOTIFICATION_KEYS),
          ...pickBooleans(body.notifications, NOTIFICATION_KEYS),
        },
        privacy: {
          ...DEFAULTS.privacy,
          ...pickBooleans(stored.privacy, PRIVACY_KEYS),
          ...pickBooleans(body.privacy, PRIVACY_KEYS),
        },
      };

      await db.update(users).set({ settings: merged, updatedAt: new Date() }).where(eq(users.id, userId));
    }

    if ('discovery' in body && body.discovery && typeof body.discovery === 'object') {
      const d = body.discovery as Record<string, unknown>;
      const ageMin = Math.min(Math.max(Number(d.ageMin) || 18, 18), 100);
      const ageMax = Math.min(Math.max(Number(d.ageMax) || 30, ageMin), 100);
      const distanceMax = Math.min(Math.max(Number(d.distanceMax) || 50, 1), 500);
      const onlyVerified = d.onlyVerified === true;

      const values = { ageMin, ageMax, distanceMax, onlyVerified, updatedAt: new Date() };
      await db
        .insert(preferences)
        .values({ userId, ...values })
        .onConflictDoUpdate({ target: preferences.userId, set: values });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, message: 'Could not save your settings' }, { status: 500 });
  }
}
