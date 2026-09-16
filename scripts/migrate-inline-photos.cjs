/*
 * Move legacy base64 photos out of PostgreSQL and into Cloudinary.
 *
 * Dry run (safe):
 *   npm run db:migrate-photos
 *
 * Apply (writes a private rollback file before changing the database):
 *   npm run db:migrate-photos -- --apply --backup=/tmp/infyn-inline-photos.json
 *
 * Restore the original database values:
 *   npm run db:migrate-photos -- --restore=/tmp/infyn-inline-photos.json
 */

require('dotenv').config({ path: '.env.local' });
const { writeFile, readFile } = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const { v2: cloudinary } = require('cloudinary');

function argumentValue(prefix) {
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
}

function createPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  });
}

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are incomplete.');
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function requireExternalBackupPath(backupPath) {
  if (!backupPath || !path.isAbsolute(backupPath)) {
    throw new Error('Use an absolute --backup path outside the repository.');
  }
  const relative = path.relative(process.cwd(), backupPath);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error('The rollback file must be outside the repository so it cannot be committed.');
  }
}

async function restore(restorePath) {
  if (!path.isAbsolute(restorePath)) throw new Error('Use an absolute --restore path.');
  const backup = JSON.parse(await readFile(restorePath, 'utf8'));
  if (!Array.isArray(backup.photos) || backup.photos.length === 0) {
    throw new Error('The rollback file contains no photos.');
  }

  const pool = createPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const photo of backup.photos) {
      if (!Number.isInteger(photo.id) || typeof photo.url !== 'string' || !photo.url.startsWith('data:image/')) {
        throw new Error('The rollback file contains an invalid photo entry.');
      }
      await client.query('UPDATE photos SET url = $1 WHERE id = $2', [photo.url, photo.id]);
    }
    await client.query('COMMIT');
    console.log(`Restored ${backup.photos.length} inline photo value(s).`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function migrate() {
  const apply = process.argv.includes('--apply');
  const backupPath = argumentValue('--backup=');
  const pool = createPool();
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT id, user_id AS "userId", url
       FROM photos
       WHERE url LIKE 'data:image/%;base64,%'
       ORDER BY id`,
    );
    const totalBytes = rows.reduce((sum, photo) => sum + Buffer.byteLength(photo.url, 'utf8'), 0);
    console.log(`Found ${rows.length} inline photo(s), using ${(totalBytes / 1024 / 1024).toFixed(1)} MB in API payload data.`);

    if (rows.length === 0 || !apply) {
      if (rows.length > 0) console.log('Dry run only. Re-run with --apply and an external --backup path.');
      return;
    }

    requireExternalBackupPath(backupPath);
    configureCloudinary();
    await writeFile(
      backupPath,
      JSON.stringify({ createdAt: new Date().toISOString(), photos: rows }),
      { encoding: 'utf8', mode: 0o600, flag: 'wx' },
    );
    console.log(`Rollback data written before migration to ${backupPath}`);

    await client.query('BEGIN');
    for (const photo of rows) {
      const result = await cloudinary.uploader.upload(photo.url, {
        resource_type: 'image',
        folder: `infyn/users/${photo.userId}`,
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      });
      if (!result.secure_url || !result.secure_url.startsWith('https://')) {
        throw new Error(`Cloudinary did not return a secure URL for photo ${photo.id}.`);
      }
      const update = await client.query(
        'UPDATE photos SET url = $1 WHERE id = $2 AND url = $3',
        [result.secure_url, photo.id, photo.url],
      );
      if (update.rowCount !== 1) throw new Error(`Photo ${photo.id} changed during migration.`);
      console.log(`Migrated photo ${photo.id}.`);
    }
    await client.query('COMMIT');
    console.log(`Migrated ${rows.length} photo(s). Keep the rollback file private until verification is complete.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const restorePath = argumentValue('--restore=');
(restorePath ? restore(restorePath) : migrate()).catch((error) => {
  console.error(`Inline photo migration failed: ${error.message}`);
  process.exitCode = 1;
});
