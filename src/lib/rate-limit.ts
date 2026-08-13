import { RATE_LIMITS, type RateLimitKey } from './random-chat-config';

/* ─────────────────────────────────────────────────
   In-memory sliding-window rate limiter.
   Keyed per (userId, action). Windows slide by timestamp,
   so an old burst expires naturally. This is per-instance
   memory — the same honest constraint as the app's pool:
   fine for a single server, documented as the Upstash path.
───────────────────────────────────────────────── */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

function keyFor(userId: number, action: RateLimitKey): string {
  return `${userId}:${action}`;
}

/** Returns true when the action is allowed, and records the hit. */
export function rateLimitHit(userId: number, action: RateLimitKey): boolean {
  const { windowMs, max } = RATE_LIMITS[action];
  const key = keyFor(userId, action);
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }

  const cutoff = now - windowMs;
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= max) {
    return false;
  }
  bucket.hits.push(now);
  return true;
}

/** Best-effort memory hygiene: drop empty/stale buckets occasionally. */
export function pruneRateLimits() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.hits.length === 0 || now - bucket.hits[bucket.hits.length - 1] > 60_000) {
      buckets.delete(key);
    }
  }
}

setInterval(pruneRateLimits, 10 * 60_000).unref?.();
