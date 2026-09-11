/*
 * Remove the confirmed seed/demo accounts and their dependent demo content.
 *
 * Dry run (safe): node scripts/remove-demo-accounts.cjs
 * Apply:          node scripts/remove-demo-accounts.cjs --apply
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const DEMO_NAMES = [
  'Priya Sharma',
  'Ananya Gupta',
  'Kavya Menon',
  'Meera Nair',
  'Riya Kapoor',
  'Aisha Khan',
  'Riya Sharma',
  'Rohan Mehta',
  'Sneha Patel',
];

const DEMO_PHONES = [
  '+919868595497',
  '+919876543211',
  '+919876543212',
  '+919876543213',
  '+919876543214',
  '+919876543215',
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT id, name, phone_number
       FROM users
       WHERE name = ANY($1::text[]) OR phone_number = ANY($2::text[])
       ORDER BY id`,
      [DEMO_NAMES, DEMO_PHONES],
    );

    if (rows.length === 0) {
      console.log('No confirmed demo accounts found.');
      return;
    }

    console.log('Accounts matched for cleanup:');
    for (const row of rows) {
      console.log(`- ${row.id}: ${row.name}`);
    }

    if (!process.argv.includes('--apply')) {
      console.log('\nDry run only. Re-run with --apply to delete these accounts and demo content.');
      return;
    }

    const ids = rows.map((row) => row.id);
    await client.query('BEGIN');

    // These relationships do not all cascade, so clear them before users.
    const hosted = await client.query(
      'SELECT id FROM meetups WHERE host_id = ANY($1::int[])',
      [ids],
    );
    const meetupIds = hosted.rows.map((row) => row.id);

    if (meetupIds.length > 0) {
      await client.query(
        'DELETE FROM meetup_attendees WHERE meetup_id = ANY($1::int[])',
        [meetupIds],
      );
      await client.query(
        'DELETE FROM meetups WHERE id = ANY($1::int[])',
        [meetupIds],
      );
    }
    await client.query(
      'DELETE FROM meetup_attendees WHERE user_id = ANY($1::int[])',
      [ids],
    );
    await client.query(
      'DELETE FROM group_members WHERE user_id = ANY($1::int[])',
      [ids],
    );
    await client.query(
      'UPDATE groups SET created_by = NULL WHERE created_by = ANY($1::int[])',
      [ids],
    );
    await client.query(
      'DELETE FROM activity_requests WHERE user_id = ANY($1::int[])',
      [ids],
    );
    await client.query(
      'DELETE FROM check_ins WHERE user_id = ANY($1::int[])',
      [ids],
    );

    const deleted = await client.query(
      'DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id, name',
      [ids],
    );
    await client.query('COMMIT');

    console.log(`Deleted ${deleted.rowCount} demo account(s) and their dependent data.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Demo cleanup failed: ${error.message}`);
  process.exitCode = 1;
});
