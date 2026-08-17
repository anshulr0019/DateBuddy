import { Ratelimit } from '@upstash/ratelimit';
import { redis, isRedisConfigured } from './redis';
import { RATE_LIMITS, type RateLimitKey } from './random-chat-config';

/* ─────────────────────────────────────────────────
   Distributed Rate Limiter (Upstash Redis + In-Memory Fallback)
   Protects serverless endpoints across all edge lambdas
   using sliding window rate limiting.
───────────────────────────────────────────────── */

interface Bucket {
  hits: number[];
}

const localBuckets = new Map<string, Bucket>();

// Initialize Upstash Ratelimit instances if Redis is configured
const redisLimiters = new Map<RateLimitKey, Ratelimit>();

if (isRedisConfigured && redis) {
  for (const [action, config] of Object.entries(RATE_LIMITS)) {
    const windowSec = Math.max(1, Math.round(config.windowMs / 1000));
    redisLimiters.set(
      action as RateLimitKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.max, `${windowSec} s`),
        prefix: `ratelimit:${action}`,
      })
    );
  }
}

function localKeyFor(userId: number, action: RateLimitKey): string {
  return `${userId}:${action}`;
}

/** Synchronous local sliding-window check */
export function rateLimitHit(userId: number, action: RateLimitKey): boolean {
  const { windowMs, max } = RATE_LIMITS[action];
  const key = localKeyFor(userId, action);
  const now = Date.now();

  let bucket = localBuckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    localBuckets.set(key, bucket);
  }

  const cutoff = now - windowMs;
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= max) {
    return false;
  }
  bucket.hits.push(now);
  return true;
}

/** Asynchronous distributed rate check (uses Upstash Redis if available, falls back to local) */
export async function checkRateLimitAsync(userId: number, action: RateLimitKey): Promise<boolean> {
  const limiter = redisLimiters.get(action);
  if (limiter) {
    try {
      const result = await limiter.limit(String(userId));
      return result.success;
    } catch {
      // Fallback to local on Redis network issues
      return rateLimitHit(userId, action);
    }
  }
  return rateLimitHit(userId, action);
}

/** In-memory hygiene */
export function pruneRateLimits() {
  const now = Date.now();
  for (const [key, bucket] of localBuckets) {
    if (bucket.hits.length === 0 || now - bucket.hits[bucket.hits.length - 1] > 60_000) {
      localBuckets.delete(key);
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(pruneRateLimits, 10 * 60_000).unref?.();
}
