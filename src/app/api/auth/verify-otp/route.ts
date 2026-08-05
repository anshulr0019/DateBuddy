import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { db } from '@/db';
import { users, preferences, otpCodes } from '@/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { setAuthSession } from '@/lib/auth';
import { hashOtp, normalizePhone } from '@/lib/otp';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;

const INVALID_CODE = NextResponse.json(
  { success: false, message: 'Invalid or expired verification code' },
  { status: 401 }
);

function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json();
    const normalized = normalizePhone(phoneNumber);

    if (!normalized || typeof otp !== 'string' || otp.length < 4) {
      return NextResponse.json(
        { success: false, message: 'Phone number and a valid verification code are required' },
        { status: 400 }
      );
    }

    const [record] = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.phoneNumber, normalized), isNull(otpCodes.consumedAt)))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!record) return INVALID_CODE;

    if (record.attempts >= MAX_ATTEMPTS) {
      await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, record.id));
      return NextResponse.json(
        { success: false, message: 'Too many incorrect attempts. Request a new code.' },
        { status: 429 }
      );
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, record.id));
      return INVALID_CODE;
    }

    if (!hashesMatch(record.codeHash, hashOtp(normalized, otp))) {
      await db
        .update(otpCodes)
        .set({ attempts: sql`${otpCodes.attempts} + 1` })
        .where(eq(otpCodes.id, record.id));
      return INVALID_CODE;
    }

    // Correct code: burn it so it cannot be replayed.
    await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, record.id));

    const [existing] = await db.select().from(users).where(eq(users.phoneNumber, normalized)).limit(1);

    if (existing) {
      const onboardingComplete = existing.onboardingCompletedAt !== null;
      await setAuthSession(existing.id, existing.phoneNumber ?? normalized, onboardingComplete);
      return NextResponse.json({
        success: true,
        user: { id: existing.id, name: existing.name, phoneNumber: existing.phoneNumber },
        isNewUser: false,
        onboardingComplete,
      });
    }

    const [newUser] = await db
      .insert(users)
      .values({
        phoneNumber: normalized,
        name: 'New User',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'female',
        lookingFor: 'everyone',
        city: 'Mumbai',
        bio: null,
        isVerified: true,
      })
      .returning();

    await db.insert(preferences).values({
      userId: newUser.id,
      ageMin: 18,
      ageMax: 30,
      distanceMax: 50,
    });

    await setAuthSession(newUser.id, newUser.phoneNumber ?? normalized, false);

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, name: newUser.name, phoneNumber: newUser.phoneNumber },
      isNewUser: true,
      onboardingComplete: false,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Could not verify code. Please try again.' },
      { status: 500 }
    );
  }
}
