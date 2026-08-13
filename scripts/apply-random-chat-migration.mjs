// One-off idempotent apply of the random-chat portion of drizzle/0004 to the
// live (push-managed) database. Skips the pre-existing meetups.require_approval
// drift (already present live) and any already-applied statements.
import { readFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

loadEnv({ path: '.env.local' });
loadEnv();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });

const sql = readFileSync(new URL('../drizzle/0004_warm_runaways.sql', import.meta.url), 'utf8');
const statements = sql
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((s) => !/ALTER TABLE "meetups" ADD COLUMN "require_approval"/.test(s));

let applied = 0;
let skipped = 0;

for (const stmt of statements) {
  const tableMatch = stmt.match(/^CREATE TABLE "([^"]+)"/);
  const indexMatch = stmt.match(/^CREATE INDEX "([^"]+)"/);

  try {
    if (tableMatch) {
      const { rows } = await pool.query(
        `SELECT to_regclass('public.${tableMatch[1]}') AS tbl`
      );
      if (rows[0]?.tbl) {
        console.log(`SKIP (exists) ${tableMatch[1]}`);
        skipped += 1;
        continue;
      }
    }
    if (indexMatch) {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_indexes WHERE indexname = '${indexMatch[1]}'`
      );
      if (rows.length > 0) {
        console.log(`SKIP (exists) ${indexMatch[1]}`);
        skipped += 1;
        continue;
      }
    }
    await pool.query(stmt);
    applied += 1;
    console.log(`OK ${stmt.slice(0, 60).replace(/\n/g, ' ')}…`);
  } catch (err) {
    console.error(`FAIL ${stmt.slice(0, 80).replace(/\n/g, ' ')}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log(`\nDone — applied ${applied}, skipped ${skipped}`);
await pool.end();
