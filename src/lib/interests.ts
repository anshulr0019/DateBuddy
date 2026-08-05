import { db } from '@/db';
import { interests, userInterests } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

const MAX_INTERESTS = 25;
const MAX_NAME_LENGTH = 50;

/**
 * The onboarding UI ships interests as display labels ("📷 Photography"), but the
 * interests table is keyed by unique name. Rows are created on demand so a label the
 * seed data doesn't know about still persists instead of being silently dropped.
 */
export async function syncUserInterests(userId: number, rawNames: unknown) {
  if (!Array.isArray(rawNames)) return;

  const names = Array.from(
    new Set(
      rawNames
        .filter((n: unknown): n is string => typeof n === 'string')
        .map((n) => n.trim().slice(0, MAX_NAME_LENGTH))
        .filter((n) => n.length > 0)
    )
  ).slice(0, MAX_INTERESTS);

  await db.delete(userInterests).where(eq(userInterests.userId, userId));
  if (names.length === 0) return;

  await db
    .insert(interests)
    .values(names.map((name) => ({ name })))
    .onConflictDoNothing();

  const rows = await db
    .select({ id: interests.id })
    .from(interests)
    .where(inArray(interests.name, names));

  if (rows.length === 0) return;

  await db
    .insert(userInterests)
    .values(rows.map((r) => ({ userId, interestId: r.id })))
    .onConflictDoNothing();
}
