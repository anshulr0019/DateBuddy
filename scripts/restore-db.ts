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

async function restore() {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    console.error('❌ No backups directory found. Run "npm run db:backup" first.');
    process.exit(1);
  }

  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).sort().reverse();
  if (files.length === 0) {
    console.error('❌ No backup JSON files found in /backups.');
    process.exit(1);
  }

  const latestBackupFile = path.join(backupDir, files[0]);
  console.log(`📦 Restoring from latest backup: ${files[0]}`);

  const backupData: Record<string, Record<string, unknown>[]> = JSON.parse(fs.readFileSync(latestBackupFile, 'utf-8'));

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl?.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    for (const [table, rows] of Object.entries(backupData)) {
      if (!rows || rows.length === 0) continue;
      console.log(`  Restoring table "${table}" (${rows.length} rows)...`);

      const columns = Object.keys(rows[0]);
      const colsFormatted = columns.map(c => `"${c}"`).join(', ');

      for (const row of rows) {
        const values = columns.map(c => row[c]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const conflictClause = columns.includes('id')
          ? `ON CONFLICT ("id") DO UPDATE SET ${columns.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`
          : `ON CONFLICT DO NOTHING`;

        const query = `
          INSERT INTO "${table}" (${colsFormatted})
          VALUES (${placeholders})
          ${conflictClause}
        `;

        await client.query(query, values).catch(err => {
          console.warn(`   ⚠️ Warning in ${table}:`, err.message);
        });
      }

      if (columns.includes('id')) {
        await client.query(`
          SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX("id"), 1)) FROM "${table}"
        `).catch(() => {});
      }
    }

    console.log('\n🎉 Database successfully restored from backup!');
  } catch (err) {
    console.error('❌ Restore failed:', (err as Error).message);
  } finally {
    client.release();
    await pool.end();
  }
}

restore();
