import { Redis } from '@upstash/redis';

/* ─────────────────────────────────────────────────
   Upstash Redis Singleton & Resilient Fallback Layer
   Provides in-memory RAM speed for matchmaking queues,
   distributed locks (SETNX), and rate-limiting with
   automatic graceful fallback if env keys aren't configured.
───────────────────────────────────────────────── */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isRedisConfigured = Boolean(redisUrl && redisToken);

// Real Upstash Redis instance (if configured)
export const redis = isRedisConfigured
  ? new Redis({
      url: redisUrl!,
      token: redisToken!,
    })
  : null;

// In-memory fallback map for local dev / unconfigured environments
class InMemoryFallbackStore {
  private store = new Map<string, { value: any; expiresAt?: number }>();
  private sortedSets = new Map<string, Map<string, number>>();

  private isExpired(entry?: { value: any; expiresAt?: number }): boolean {
    if (!entry) return true;
    if (entry.expiresAt && Date.now() > entry.expiresAt) return true;
    return false;
  }

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry!.value as T;
  }

  async set(key: string, value: any, opts?: { ex?: number; nx?: boolean }): Promise<'OK' | null> {
    const entry = this.store.get(key);
    if (opts?.nx && entry && !this.isExpired(entry)) {
      return null;
    }
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
      if (this.sortedSets.delete(key)) count++;
    }
    return count;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async zadd(key: string, scoreMember: { score: number; member: string }): Promise<number> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const set = this.sortedSets.get(key)!;
    const isNew = !set.has(scoreMember.member);
    set.set(scoreMember.member, scoreMember.score);
    return isNew ? 1 : 0;
  }

  async zrange(key: string, start: number, stop: number, opts?: { rev?: boolean }): Promise<string[]> {
    const set = this.sortedSets.get(key);
    if (!set) return [];
    const entries = Array.from(set.entries()).sort((a, b) => (opts?.rev ? b[1] - a[1] : a[1] - b[1]));
    const sliced = stop === -1 ? entries.slice(start) : entries.slice(start, stop + 1);
    return sliced.map((e) => e[0]);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;
    let count = 0;
    for (const m of members) {
      if (set.delete(m)) count++;
    }
    return count;
  }
}

export const fallbackRedis = new InMemoryFallbackStore();

/**
 * Acquire a distributed lock with automatic TTL
 * Useful for matchmaking pairing and atomic concurrency guards.
 */
export async function acquireLock(lockKey: string, ttlSeconds = 10): Promise<boolean> {
  const fullKey = `lock:${lockKey}`;
  if (redis) {
    try {
      const res = await redis.set(fullKey, 'locked', { nx: true, ex: ttlSeconds });
      return res === 'OK';
    } catch {
      // Redis network glitch fallback
      return (await fallbackRedis.set(fullKey, 'locked', { nx: true, ex: ttlSeconds })) === 'OK';
    }
  }
  return (await fallbackRedis.set(fullKey, 'locked', { nx: true, ex: ttlSeconds })) === 'OK';
}

/**
 * Release a distributed lock
 */
export async function releaseLock(lockKey: string): Promise<void> {
  const fullKey = `lock:${lockKey}`;
  if (redis) {
    try {
      await redis.del(fullKey);
      return;
    } catch {
      await fallbackRedis.del(fullKey);
      return;
    }
  }
  await fallbackRedis.del(fullKey);
}
