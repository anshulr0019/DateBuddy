import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, preferences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { setAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp || otp.length !== 4) {
      return NextResponse.json(
        { success: false, message: 'Phone number and 4-digit code are required' },
        { status: 400 }
      );
    }

    // Lookup existing user by phone number
    const existingUsers = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    let currentUser = existingUsers[0];
    let isNewUser = false;

    if (!currentUser) {
      isNewUser = true;
      // Create new user profile with defaults
      const [newUser] = await db.insert(users).values({
        phoneNumber,
        name: 'New User',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'female',
        lookingFor: 'everyone',
        city: 'Mumbai',
        bio: 'Hey there! I am using Dil Se.',
        isVerified: true,
      }).returning();

      currentUser = newUser;

      // Create default search preferences
      await db.insert(preferences).values({
        userId: currentUser.id,
        ageMin: 18,
        ageMax: 30,
        distanceMax: 50,
      });
    }

    // Set secure HTTP-only auth cookie
    await setAuthSession(currentUser.id, currentUser.phoneNumber);

    return NextResponse.json({
      success: true,
      user: currentUser,
      isNewUser,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
