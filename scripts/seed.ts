import { db, pool } from '../src/db';
import { users, photos, interests, userInterests, prompts, userPromptAnswers, preferences, matches, messages } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seeding for Dil Se...');

  try {
    // 1. Insert Interests
    const interestItems = [
      { name: 'Coffee', icon: '☕', category: 'Food & Drink' },
      { name: 'Yoga', icon: '🧘', category: 'Fitness' },
      { name: 'Travel', icon: '✈️', category: 'Lifestyle' },
      { name: 'Design', icon: '🎨', category: 'Creativity' },
      { name: 'Books', icon: '📚', category: 'Culture' },
      { name: 'Music', icon: '🎵', category: 'Culture' },
      { name: 'Tech', icon: '💻', category: 'Professional' },
      { name: 'Dance', icon: '💃', category: 'Arts' },
      { name: 'Hiking', icon: '🥾', category: 'Outdoors' },
      { name: 'Anime', icon: '⛩️', category: 'Entertainment' },
      { name: 'Photography', icon: '📷', category: 'Arts' },
      { name: 'Poetry', icon: '✍️', category: 'Culture' },
      { name: 'Fitness', icon: '🏋️', category: 'Fitness' },
      { name: 'Badminton', icon: '🏸', category: 'Sports' },
      { name: 'Foodie', icon: '🍜', category: 'Food & Drink' },
    ];

    console.log('Inserting interest categories...');
    for (const item of interestItems) {
      await db.insert(interests).values(item).onConflictDoNothing().catch(() => {});
    }

    // 2. Insert Prompts
    const promptList = [
      'I can talk for hours about…',
      'My perfect weekend…',
      'Current obsession…',
      'Favorite destination…',
      'Fun fact…',
      'The key to my heart is…',
    ];

    console.log('Inserting prompt templates...');
    for (const text of promptList) {
      await db.insert(prompts).values({ text }).catch(() => {});
    }

    // 3. Seed Users
    const seedUsersData = [
      {
        phoneNumber: '+919868595497',
        name: 'Priya Sharma',
        dateOfBirth: new Date('2000-05-14'),
        gender: 'female' as const,
        lookingFor: 'everyone' as const,
        city: 'Mumbai',
        latitude: '19.0760000',
        longitude: '72.8777000',
        bio: 'Day dreamer 🌸 | Coffee & sunsets | Finding more of myself these days ✨',
        isVerified: true,
        photos: [
          'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
        ],
        promptAnswers: [
          { promptId: 1, answer: 'The intersection of design and human emotion.' },
          { promptId: 2, answer: 'Farmers market, long drive, good book.' },
        ],
      },
      {
        phoneNumber: '+919876543211',
        name: 'Ananya Gupta',
        dateOfBirth: new Date('1998-11-20'),
        gender: 'female' as const,
        lookingFor: 'everyone' as const,
        city: 'Delhi',
        latitude: '28.6139000',
        longitude: '77.2090000',
        bio: "Bookworm 📚 | Chai over coffee | Let's spark real conversations 💬",
        isVerified: true,
        photos: [
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&auto=format&fit=crop&q=80',
        ],
        promptAnswers: [
          { promptId: 3, answer: 'Learning to play the guitar between meetings.' },
          { promptId: 5, answer: 'I can name every Oscar Best Picture since 1980.' },
        ],
      },
      {
        phoneNumber: '+919876543212',
        name: 'Kavya Menon',
        dateOfBirth: new Date('2002-03-08'),
        gender: 'female' as const,
        lookingFor: 'everyone' as const,
        city: 'Bangalore',
        latitude: '12.9716000',
        longitude: '77.5946000',
        bio: 'Engineer by day, dancer by night 💃 | Vibe check: good energy only',
        isVerified: false,
        photos: [
          'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=800&auto=format&fit=crop&q=80',
        ],
        promptAnswers: [
          { promptId: 4, answer: 'Coorg during monsoon. Nothing beats it.' },
          { promptId: 2, answer: 'Hackathon on Saturday, trek on Sunday.' },
        ],
      },
      {
        phoneNumber: '+919876543213',
        name: 'Meera Nair',
        dateOfBirth: new Date('1996-09-15'),
        gender: 'female' as const,
        lookingFor: 'everyone' as const,
        city: 'Chennai',
        latitude: '13.0827000',
        longitude: '80.2707000',
        bio: 'Startup founder | Foodie | Occasional philosopher 🧠',
        isVerified: true,
        photos: [
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
        ],
        promptAnswers: [
          { promptId: 1, answer: 'Behavioral economics and why people do what they do.' },
          { promptId: 3, answer: 'Building in public and open startups.' },
        ],
      },
      {
        phoneNumber: '+919876543214',
        name: 'Riya Kapoor',
        dateOfBirth: new Date('1999-07-22'),
        gender: 'female' as const,
        lookingFor: 'everyone' as const,
        city: 'Pune',
        latitude: '18.5204000',
        longitude: '73.8567000',
        bio: 'Photographer & storyteller 📷 | Mountains > Malls',
        isVerified: false,
        photos: [
          'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80',
        ],
        promptAnswers: [
          { promptId: 4, answer: 'Spiti Valley — went 3 times and still not enough.' },
          { promptId: 5, answer: "I've photographed 12 different countries by 25." },
        ],
      },
      {
        phoneNumber: '+919876543215',
        name: 'Aisha Khan',
        dateOfBirth: new Date('2001-01-10'),
        gender: 'female' as const,
        lookingFor: 'everyone' as const,
        city: 'Hyderabad',
        latitude: '17.3850000',
        longitude: '78.4867000',
        bio: 'AI researcher | Poetry | Making sense of the world, slowly 🌿',
        isVerified: true,
        photos: [
          'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=800&auto=format&fit=crop&q=80',
        ],
        promptAnswers: [
          { promptId: 1, answer: 'Large language models and what consciousness even means.' },
          { promptId: 3, answer: 'Urdu poetry and neural embeddings — not that different.' },
        ],
      },
    ];

    console.log('Inserting seed users & profiles...');
    const createdUserIds: number[] = [];

    for (const userData of seedUsersData) {
      // Check existing
      const existing = await db.select().from(users).where(eq(users.phoneNumber, userData.phoneNumber)).catch(() => []);
      let userId: number;

      if (existing && existing.length > 0) {
        userId = existing[0].id;
        console.log(`User ${userData.name} exists with ID ${userId}`);
      } else {
        const [newUser] = await db.insert(users).values({
          phoneNumber: userData.phoneNumber,
          name: userData.name,
          dateOfBirth: userData.dateOfBirth,
          gender: userData.gender,
          lookingFor: userData.lookingFor,
          city: userData.city,
          latitude: userData.latitude,
          longitude: userData.longitude,
          bio: userData.bio,
          isVerified: userData.isVerified,
        }).returning();
        userId = newUser.id;
        console.log(`Created user ${userData.name} with ID ${userId}`);
      }

      createdUserIds.push(userId);

      // Photos
      await db.delete(photos).where(eq(photos.userId, userId)).catch(() => {});
      for (let i = 0; i < userData.photos.length; i++) {
        await db.insert(photos).values({
          userId,
          url: userData.photos[i],
          orderIndex: i,
        }).catch(() => {});
      }

      // Preferences
      await db.insert(preferences).values({
        userId,
        ageMin: 18,
        ageMax: 35,
        distanceMax: 50,
      }).onConflictDoNothing().catch(() => {});

      // Prompts
      for (const pa of userData.promptAnswers) {
        await db.insert(userPromptAnswers).values({
          userId,
          promptId: pa.promptId,
          answer: pa.answer,
        }).catch(() => {});
      }
    }

    // 4. Create sample matches & conversations for User 1
    if (createdUserIds.length >= 2) {
      const user1 = createdUserIds[0];
      const user2 = createdUserIds[1];
      const user3 = createdUserIds[2];

      console.log(`Creating matches between user ${user1} and users ${user2}, ${user3}...`);

      // Match 1
      const existingMatch1 = await db.select().from(matches).where(eq(matches.user1Id, Math.min(user1, user2))).catch(() => []);
      let match1Id = existingMatch1[0]?.id;
      if (!match1Id) {
        const [newMatch] = await db.insert(matches).values({
          user1Id: Math.min(user1, user2),
          user2Id: Math.max(user1, user2),
        }).returning();
        match1Id = newMatch.id;
      }

      // Seed messages for Match 1
      await db.insert(messages).values([
        { matchId: match1Id, senderId: user2, receiverId: user1, type: 'text', content: "Hey! Working on some new UI designs. How about you?", isRead: true },
        { matchId: match1Id, senderId: user1, receiverId: user2, type: 'text', content: "Are we still on for coffee today at Café Zoe?", isRead: true },
        { matchId: match1Id, senderId: user2, receiverId: user1, type: 'text', content: "Yes! On my way right now 🚗", isRead: false },
      ]).catch(() => {});

      // Match 2
      const existingMatch2 = await db.select().from(matches).where(eq(matches.user1Id, Math.min(user1, user3))).catch(() => []);
      let match2Id = existingMatch2[0]?.id;
      if (!match2Id) {
        const [newMatch] = await db.insert(matches).values({
          user1Id: Math.min(user1, user3),
          user2Id: Math.max(user1, user3),
        }).returning();
        match2Id = newMatch.id;
      }

      await db.insert(messages).values([
        { matchId: match2Id, senderId: user3, receiverId: user1, type: 'text', content: "Loved your prompt about Coorg! Have you trekked Kodachadri?", isRead: false },
      ]).catch(() => {});
    }

    console.log('✅ Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
