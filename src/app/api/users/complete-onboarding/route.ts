import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, photos, preferences, subscriptions, prompts, userPromptAnswers } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { getAuthSession, setAuthSession } from '@/lib/auth';
import { syncUserInterests } from '@/lib/interests';

export const dynamic = 'force-dynamic';

const GENDERS = ['male', 'female', 'non-binary', 'other'];
const LOOKING_FOR = ['men', 'women', 'everyone'];
const MAX_PHOTOS = 6;

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.userId;

    const body = await request.json();
    const {
      basicInfo = {},
      location,
      photos: photoUrls = [],
      bio = {},
      interests: interestNames = [],
      preferences: userPrefs = {},
    } = body;

    if (typeof basicInfo.name !== 'string' || !basicInfo.name.trim()) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }
    if (basicInfo.gender && !GENDERS.includes(basicInfo.gender)) {
      return NextResponse.json({ success: false, message: 'Invalid gender' }, { status: 400 });
    }
    if (basicInfo.lookingFor && !LOOKING_FOR.includes(basicInfo.lookingFor)) {
      return NextResponse.json({ success: false, message: 'Invalid lookingFor' }, { status: 400 });
    }

    const dob =
      basicInfo.dateOfBirth && !isNaN(Date.parse(basicInfo.dateOfBirth))
        ? new Date(basicInfo.dateOfBirth)
        : null;
    if (!dob) {
      return NextResponse.json({ success: false, message: 'A valid date of birth is required' }, { status: 400 });
    }

    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) {
      return NextResponse.json({ success: false, message: 'You must be 18 or older' }, { status: 400 });
    }

    const [updated] = await db
      .update(users)
      .set({
        name: basicInfo.name.trim().slice(0, 100),
        dateOfBirth: dob,
        gender: basicInfo.gender || 'other',
        lookingFor: basicInfo.lookingFor || 'everyone',
        city: typeof location === 'string' ? location.slice(0, 100) : '',
        bio: (bio?.bio || bio?.promptAnswer || '').slice(0, 500) || null,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Account not found' }, { status: 401 });
    }

    const validPhotos = (Array.isArray(photoUrls) ? photoUrls : [])
      .filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0)
      .slice(0, MAX_PHOTOS);

    if (validPhotos.length > 0) {
      await db.delete(photos).where(eq(photos.userId, userId));
      await db.insert(photos).values(
        validPhotos.map((url, index) => ({ userId, url, orderIndex: index }))
      );
    }

    await syncUserInterests(userId, interestNames);

    // Save prompt answers (from multi-prompt onboarding step)
    const rawPrompts = Array.isArray(bio?.selectedPrompts) ? bio.selectedPrompts : [];
    const validAnswers = rawPrompts.filter(
      (p: unknown): p is { prompt: string; answer: string } =>
        typeof p === 'object' && p !== null &&
        typeof (p as Record<string, unknown>).prompt === 'string' &&
        typeof (p as Record<string, unknown>).answer === 'string' &&
        ((p as Record<string, unknown>).answer as string).trim().length > 0
    ).slice(0, 6);

    if (validAnswers.length > 0) {
      // Clear old answers
      await db.delete(userPromptAnswers).where(eq(userPromptAnswers.userId, userId));
      // Upsert each prompt text then insert answer
      for (const item of validAnswers) {
        const text = item.prompt.trim().slice(0, 200);
        const answer = item.answer.trim().slice(0, 300);
        // Find or create the prompt row
        const existing = await db.select().from(prompts).where(eq(prompts.text, text)).limit(1);
        const promptId = existing.length > 0
          ? existing[0].id
          : (await db.insert(prompts).values({ text, isActive: true }).returning())[0].id;
        await db.insert(userPromptAnswers).values({ userId, promptId, answer });
      }
    }

    const prefValues = {
      ageMin: Number(userPrefs?.ageRange?.[0]) || 18,
      ageMax: Number(userPrefs?.ageRange?.[1]) || 30,
      distanceMax: Number(userPrefs?.distance) || 50,
    };

    const existingPrefs = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, userId))
      .limit(1);

    if (existingPrefs.length > 0) {
      await db.update(preferences).set(prefValues).where(eq(preferences.userId, userId));
    } else {
      await db.insert(preferences).values({ userId, ...prefValues });
    }

    // ── FIRST 500 VIP FOUNDER LIFETIME GOLD GRANT ──
    const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(users);
    const userNumber = Number(totalUsers) || 1;
    const isFounder = userNumber <= 500;

    const assignedTier = isFounder ? 'monthly' : 'free';
    const assignedEndDate = isFounder ? new Date('2099-12-31') : null;

    const existingSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existingSub.length > 0) {
      await db
        .update(subscriptions)
        .set({ tier: assignedTier, endDate: assignedEndDate })
        .where(eq(subscriptions.userId, userId));
    } else {
      await db
        .insert(subscriptions)
        .values({ userId, tier: assignedTier, endDate: assignedEndDate });
    }

    // Re-mint the cookie so middleware stops gating this user at onboarding.
    await setAuthSession(userId, updated.phoneNumber ?? session.phoneNumber, true);

    return NextResponse.json({
      success: true,
      userId,
      isFounder,
      founderNumber: userNumber,
      message: 'Onboarding completed',
    });
  } catch (error) {
    console.error('Onboarding failed:', error);
    return NextResponse.json(
      { success: false, message: 'Could not save your profile. Please try again.' },
      { status: 500 }
    );
  }
}
