import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is not set in .env.local');
  process.exit(1);
}

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  console.log('📦 Starting database backup to:', backupFile);

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl?.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const tables = [
    'users',
    'photos',
    'preferences',
    'interests',
    'user_interests',
    'prompts',
    'user_prompt_answers',
    'swipes',
    'matches',
    'messages',
    'meetups',
    'meetup_attendees',
    'groups',
    'group_members',
    'activity_requests',
    'check_ins',
    'notifications',
    'subscriptions',
  ];

  const backupData: Record<string, unknown[]> = {};

  try {
    const client = await pool.connect();
    for (const table of tables) {
      try {
        const { rows } = await client.query(`SELECT * FROM "${table}"`);
        backupData[table] = rows;
        console.log(`  ✓ Saved table "${table}" (${rows.length} records)`);
      } catch {
        // Table might not exist or empty
      }
    }
    client.release();

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`\n🎉 Backup successfully created at: ${backupFile}`);
    console.log(`   Total tables backed up: ${Object.keys(backupData).length}`);
  } catch (err) {
    console.error('❌ Backup failed:', (err as Error).message);
  } finally {
    await pool.end();
  }
}

backup();
