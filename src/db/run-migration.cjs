const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  // Core columns that may be missing
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(60)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS snapchat_handle VARCHAR(60)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(100)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`,
  
  // Preferences table
  `ALTER TABLE preferences ADD COLUMN IF NOT EXISTS only_verified BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
  
  // Verify what columns exist
  `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`,
];

async function run() {
  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      try {
        const result = await client.query(sql);
        if (sql.startsWith('SELECT')) {
          console.log('Users table columns:', result.rows.map(r => `${r.column_name}(${r.data_type})`).join(', '));
        } else {
          console.log('✅', sql.substring(0, 60));
        }
      } catch (err) {
        console.error('❌ Error running:', sql.substring(0, 60));
        console.error('   ', err.message);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
