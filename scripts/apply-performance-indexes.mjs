import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: '.env.local' });
loadEnv();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });

const indexStatements = [
  // Photos
  `CREATE INDEX IF NOT EXISTS "photos_user_order_idx" ON "photos" ("user_id", "order_index");`,
  // User Interests & Prompts
  `CREATE INDEX IF NOT EXISTS "user_interests_user_idx" ON "user_interests" ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "user_prompt_answers_user_idx" ON "user_prompt_answers" ("user_id");`,
  // Swipes
  `CREATE INDEX IF NOT EXISTS "swipes_swiper_idx" ON "swipes" ("swiper_id");`,
  `CREATE INDEX IF NOT EXISTS "swipes_swiped_idx" ON "swipes" ("swiped_id");`,
  // Matches
  `CREATE INDEX IF NOT EXISTS "matches_user1_active_idx" ON "matches" ("user1_id", "is_active");`,
  `CREATE INDEX IF NOT EXISTS "matches_user2_active_idx" ON "matches" ("user2_id", "is_active");`,
  // Messages
  `CREATE INDEX IF NOT EXISTS "messages_match_created_idx" ON "messages" ("match_id", "created_at" ASC);`,
  `CREATE INDEX IF NOT EXISTS "messages_receiver_read_idx" ON "messages" ("receiver_id", "is_read");`,
  // Notifications
  `CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notifications" ("user_id", "is_read");`,
  // Blocks
  `CREATE INDEX IF NOT EXISTS "blocks_blocker_blocked_idx" ON "blocks" ("blocker_id", "blocked_id");`,
  // Users last active & created
  `CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");`,
];

console.log('Applying database performance indexes to Neon PostgreSQL...\n');

let applied = 0;
let skipped = 0;

for (const stmt of indexStatements) {
  try {
    await pool.query(stmt);
    applied++;
    console.log(`✓ Applied: ${stmt}`);
  } catch (err) {
    console.error(`✗ Error on "${stmt}":`, err.message);
  }
}

console.log(`\n🎉 Done! Successfully applied ${applied} performance indexes.`);
await pool.end();
