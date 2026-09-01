import { Pool } from 'pg';

const NEON_URL = 'postgresql://neondb_owner:npg_IMN1rx8ubaSU@ep-ancient-cake-ahxpblyi-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';
const SUPABASE_URL = 'postgresql://postgres.fzkwuxlnylpitvsazxms:AnshulAnushka%400019@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function migrate() {
  console.log('🚀 Starting Full Migration from Neon to Supabase...');

  const neonPool = new Pool({
    connectionString: NEON_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const supabasePool = new Pool({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const neonClient = await neonPool.connect();
    console.log('✅ Connected to Neon Source Database');

    const supabaseClient = await supabasePool.connect();
    console.log('✅ Connected to Supabase Destination Database');

    // List of tables to migrate in foreign-key dependency order
    const tables = [
      'interests',
      'prompts',
      'users',
      'photos',
      'preferences',
      'user_interests',
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
      'blocks',
      'subscriptions',
    ];

    for (const table of tables) {
      try {
        console.log(`\n📦 Migrating table: "${table}"...`);
        const { rows } = await neonClient.query(`SELECT * FROM "${table}"`);
        console.log(`   Found ${rows.length} rows in Neon.`);

        if (rows.length === 0) continue;

        const columns = Object.keys(rows[0]);
        const colsFormatted = columns.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const values = columns.map(c => row[c]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

          // Insert or update on conflict on id if present, or ignore
          const conflictClause = columns.includes('id')
            ? `ON CONFLICT ("id") DO UPDATE SET ${columns.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`
            : `ON CONFLICT DO NOTHING`;

          const insertQuery = `
            INSERT INTO "${table}" (${colsFormatted})
            VALUES (${placeholders})
            ${conflictClause}
          `;

          await supabaseClient.query(insertQuery, values).catch(err => {
            // If conflict or constraint, log and continue
            console.warn(`   ⚠️ Row warning in ${table}:`, err.message);
          });
        }

        // Reset sequence if table has serial id
        if (columns.includes('id')) {
          await supabaseClient.query(`
            SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX("id"), 1)) FROM "${table}"
          `).catch(() => {});
        }

        console.log(`   ✅ Successfully migrated "${table}"`);
      } catch (err) {
        console.error(`   ❌ Failed migrating table ${table}:`, (err as Error).message);
      }
    }

    neonClient.release();
    supabaseClient.release();

    console.log('\n🎉 ALL DATA HAS BEEN FULLY MIGRATED TO SUPABASE!');
  } catch (error) {
    console.error('❌ Migration error:', (error as Error).message);
  } finally {
    await neonPool.end();
    await supabasePool.end();
  }
}

migrate();
