import { pgTable, text, serial, timestamp, integer, boolean, varchar, jsonb, decimal, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const genderEnum = pgEnum('gender', ['male', 'female', 'non-binary', 'other']);
export const lookingForEnum = pgEnum('looking_for', ['men', 'women', 'everyone']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'daily', 'weekly', 'monthly']);
export const swipeActionEnum = pgEnum('swipe_action', ['like', 'pass', 'super_like']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'photo', 'voice', 'gif', 'location']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'verified', 'failed']);
export const reportReasonEnum = pgEnum('report_reason', ['inappropriate', 'spam', 'harassment', 'photos', 'fake', 'other']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phoneNumber: varchar('phone_number', { length: 15 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  gender: genderEnum('gender').notNull(),
  lookingFor: lookingForEnum('looking_for').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  bio: text('bio'),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Photos table
export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Interests table
export const interests = pgTable('interests', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  icon: varchar('icon', { length: 50 }),
  category: varchar('category', { length: 50 }),
});

// User interests junction table
export const userInterests = pgTable('user_interests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  interestId: integer('interest_id').notNull().references(() => interests.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Prompts table
export const prompts = pgTable('prompts', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  isActive: boolean('is_active').default(true),
});

// User prompt answers
export const userPromptAnswers = pgTable('user_prompt_answers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  promptId: integer('prompt_id').notNull().references(() => prompts.id),
  answer: text('answer').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Preferences table
export const preferences = pgTable('preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  ageMin: integer('age_min').notNull().default(18),
  ageMax: integer('age_max').notNull().default(30),
  distanceMax: integer('distance_max').notNull().default(50), // in km
  onlyVerified: boolean('only_verified').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Swipes table
export const swipes = pgTable('swipes', {
  id: serial('id').primaryKey(),
  swiperId: integer('swiper_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  swipedId: integer('swiped_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: swipeActionEnum('action').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Matches table
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  user1Id: integer('user1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  user2Id: integer('user2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  matchedAt: timestamp('matched_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

// Messages table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: messageTypeEnum('type').notNull().default('text'),
  content: text('content').notNull(),
  metadata: jsonb('metadata'), // For voice duration, photo URL, gif URL, etc.
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  tier: subscriptionTierEnum('tier').notNull().default('free'),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),
  autoRenew: boolean('auto_renew').default(false),
  transactionId: varchar('transaction_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Daily limits table (for free users)
export const dailyLimits = pgTable('daily_limits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull().defaultNow(),
  likesUsed: integer('likes_used').default(0),
  superLikesUsed: integer('super_likes_used').default(0),
  rewindsUsed: integer('rewinds_used').default(0),
  revealsUsed: integer('reveals_used').default(0),
});

// Verifications table
export const verifications = pgTable('verifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoUrl: text('video_url'),
  status: verificationStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  verifiedAt: timestamp('verified_at'),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // match, like, message, etc.
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  metadata: jsonb('metadata'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Reports table
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterId: integer('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reportedId: integer('reported_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: reportReasonEnum('reason').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Blocks table
export const blocks = pgTable('blocks', {
  id: serial('id').primaryKey(),
  blockerId: integer('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: integer('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Profile views (for insights)
export const profileViews = pgTable('profile_views', {
  id: serial('id').primaryKey(),
  viewerId: integer('viewer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewedId: integer('viewed_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});
// Meetups/Events
export const meetups = pgTable('meetups', {
  id: serial('id').primaryKey(),
  hostId: integer('host_id').notNull().references(() => users.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // sports, arts, tech, food, etc.
  activityType: varchar('activity_type', { length: 50 }),
  
  // Location
  venueName: varchar('venue_name', { length: 200 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  latitude: text('latitude'),
  longitude: text('longitude'),
  
  // Time
  date: timestamp('date').notNull(),
  duration: integer('duration'), // in minutes
  
  // Details
  maxAttendees: integer('max_attendees').default(10),
  isPublic: boolean('is_public').default(true),
  imageUrl: text('image_url'),
  
  createdAt: timestamp('created_at').defaultNow(),
  status: varchar('status', { length: 20 }).default('active'), // active, cancelled, completed
});

export const meetupAttendees = pgTable('meetup_attendees', {
  id: serial('id').primaryKey(),
  meetupId: integer('meetup_id').notNull().references(() => meetups.id),
  userId: integer('user_id').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).default('going'), // going, maybe, cancelled
  joinedAt: timestamp('joined_at').defaultNow(),
});

// Groups/Communities
export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }),
  coverImage: text('cover_image'),
  isPrivate: boolean('is_private').default(false),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const groupMembers = pgTable('group_members', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => groups.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: varchar('role', { length: 20 }).default('member'), // admin, moderator, member
  joinedAt: timestamp('joined_at').defaultNow(),
});

// Activity Partners
export const activityRequests = pgTable('activity_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // gym, travel, study
  skillLevel: varchar('skill_level', { length: 20 }), // beginner, intermediate, expert
  availability: text('availability'), // JSON array: ["weekends", "evenings"]
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Check-ins
export const checkIns = pgTable('check_ins', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  spotName: varchar('spot_name', { length: 200 }).notNull(),
  address: text('address'),
  message: varchar('message', { length: 200 }),
  duration: integer('duration').default(4), // hours
  isActive: boolean('is_active').default(true),
  checkedInAt: timestamp('checked_in_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
});