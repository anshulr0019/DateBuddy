import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users, photos, preferences, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  console.log('🚀 Complete onboarding API called');
  
  try {
    const db = getDb();
    const body = await request.json();
    console.log('📥 Received data:', body);

    const { 
      phoneNumber, 
      basicInfo, 
      location, 
      photos: photoUrls, 
      bio, 
      interests: selectedInterests, 
      preferences: userPrefs 
    } = body;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Phone number required' },
        { status: 400 }
      );
    }

    if (!basicInfo?.name || !basicInfo?.dateOfBirth) {
      return NextResponse.json(
        { success: false, message: 'Name and date of birth required' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed');

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    let user;

    if (existingUser.length > 0) {
      console.log('👤 User exists, updating...');
      // Update existing user
      const [updated] = await db.update(users)
        .set({
          name: basicInfo.name,
          dateOfBirth: new Date(basicInfo.dateOfBirth),
          gender: basicInfo.gender || 'other',
          lookingFor: basicInfo.lookingFor || 'everyone',
          city: location || null,
          bio: bio?.bio || bio?.promptAnswer || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      
      user = updated;
    } else {
      console.log('👤 Creating new user...');
      // Create new user
      const [newUser] = await db.insert(users).values({
        phoneNumber,
        name: basicInfo.name,
        dateOfBirth: new Date(basicInfo.dateOfBirth),
        gender: basicInfo.gender || 'other',
        lookingFor: basicInfo.lookingFor || 'everyone',
        city: location || null,
        bio: bio?.bio || bio?.promptAnswer || null,
      }).returning();
      
      user = newUser;
    }

    console.log('✅ User created/updated:', user.id);

    // Save photos
    if (photoUrls && photoUrls.length > 0) {
      // Delete existing photos for this user
      await db.delete(photos).where(eq(photos.userId, user.id));
      
      const validPhotos = photoUrls.filter((url: string) => url && url.trim());
      
      if (validPhotos.length > 0) {
        await db.insert(photos).values(
          validPhotos.map((url: string, index: number) => ({
            userId: user.id,
            url,
            orderIndex: index,
          }))
        );
        console.log('✅ Photos saved:', validPhotos.length);
      }
    }

    // Save/update preferences
    const existingPrefs = await db.select()
      .from(preferences)
      .where(eq(preferences.userId, user.id))
      .limit(1);

    if (existingPrefs.length > 0) {
      await db.update(preferences)
        .set({
          ageMin: userPrefs?.ageRange?.[0] || 18,
          ageMax: userPrefs?.ageRange?.[1] || 30,
          distanceMax: userPrefs?.distance || 50,
        })
        .where(eq(preferences.userId, user.id));
    } else {
      await db.insert(preferences).values({
        userId: user.id,
        ageMin: userPrefs?.ageRange?.[0] || 18,
        ageMax: userPrefs?.ageRange?.[1] || 30,
        distanceMax: userPrefs?.distance || 50,
      });
    }
    console.log('✅ Preferences saved');

    // Save subscription (only if new user)
    if (existingUser.length === 0) {
      await db.insert(subscriptions).values({
        userId: user.id,
        tier: 'free',
      });
      console.log('✅ Subscription saved');
    }

    console.log('🎉 Onboarding completed!');

    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      message: 'Onboarding completed successfully' 
    });

  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to complete onboarding',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
