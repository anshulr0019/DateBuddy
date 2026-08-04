import { db } from './index';
import { users, photos, preferences, subscriptions } from './schema';
import { eq } from 'drizzle-orm';

const INITIAL_PROFILES = [
  {
    name: 'Ananya Gupta',
    phoneNumber: '+919876543211',
    dateOfBirth: new Date('1999-05-15'),
    gender: 'female' as const,
    lookingFor: 'men' as const,
    city: 'Mumbai',
    bio: 'Architect by day, salsa dancer by night 💃 Looking for someone who can keep up with my spontaneity!',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Riya Sharma',
    phoneNumber: '+919876543212',
    dateOfBirth: new Date('1998-11-20'),
    gender: 'female' as const,
    lookingFor: 'men' as const,
    city: 'Delhi',
    bio: 'Product Designer at Swiggy. Big fan of indie music, filter coffee, and weekend getaways 🌿',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Rohan Mehta',
    phoneNumber: '+919876543213',
    dateOfBirth: new Date('1996-08-10'),
    gender: 'male' as const,
    lookingFor: 'women' as const,
    city: 'Bangalore',
    bio: 'Software engineer who loves hiking, photography, and finding the best craft beer in town 🍺',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Sneha Patel',
    phoneNumber: '+919876543214',
    dateOfBirth: new Date('2000-02-14'),
    gender: 'female' as const,
    lookingFor: 'everyone' as const,
    city: 'Mumbai',
    bio: 'Foodie, dog mama 🐶, and film buff. Let us grab boba and talk about movies!',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

export async function seed() {
  console.log('🌱 Seeding database...');

  for (const profile of INITIAL_PROFILES) {
    const existing = await db.select().from(users).where(eq(users.phoneNumber, profile.phoneNumber)).limit(1);

    let userId: number;
    if (existing.length > 0) {
      userId = existing[0].id;
      console.log(`Updated existing user: ${profile.name}`);
    } else {
      const [newUser] = await db.insert(users).values({
        phoneNumber: profile.phoneNumber,
        name: profile.name,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        lookingFor: profile.lookingFor,
        city: profile.city,
        bio: profile.bio,
      }).returning();
      userId = newUser.id;

      await db.insert(preferences).values({
        userId,
        ageMin: 18,
        ageMax: 35,
        distanceMax: 50,
      });

      await db.insert(subscriptions).values({
        userId,
        tier: 'free',
      });

      console.log(`Created user: ${profile.name} (id: ${userId})`);
    }

    // Insert photos
    await db.delete(photos).where(eq(photos.userId, userId));
    for (let i = 0; i < profile.photos.length; i++) {
      await db.insert(photos).values({
        userId,
        url: profile.photos[i],
        orderIndex: i,
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
