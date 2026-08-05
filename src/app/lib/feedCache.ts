/* ─────────────────────────────────────────────────
   Discover feed cache

   Module-level cache so the swipe deck survives client-side
   navigation: re-entering /discover renders instantly from here
   while the deck tops up in the background. Also dedupes the
   first-page request so a nav-triggered prefetch and the page's
   own initial load share one network call.

   Module state resets on a full page load, which is exactly when
   the cache would be cold anyway.
───────────────────────────────────────────────── */

export type FeedProfile = {
  id: number;
  name: string;
  age: number;
  city: string | null;
  bio: string | null;
  verified: boolean;
  online: boolean;
  distance: string | null;
  photos: string[];
  tags: string[];
  prompts: { q: string; a: string }[];
};

export interface CachedFeed {
  profiles: FeedProfile[];
  nextCursor: number | null;
  hasMore: boolean;
  fetchedAt: number;
}

export type FeedResult =
  | { kind: 'success'; profiles: FeedProfile[]; nextCursor: number | null }
  | { kind: 'unauthorized' }
  | { kind: 'error' };

/* How long a cached deck is served without a background refresh. */
export const FEED_MAX_AGE_MS = 5 * 60 * 1000;

let cache: CachedFeed | null = null;
let inflightFirstPage: Promise<FeedResult> | null = null;

async function fetchPage(cursor: number | null): Promise<FeedResult> {
  try {
    const url = cursor === null ? '/api/feed' : `/api/feed?cursor=${cursor}`;
    const res = await fetch(url);
    if (res.status === 401) return { kind: 'unauthorized' };
    if (!res.ok) return { kind: 'error' };
    const data = await res.json();
    if (!data.success) return { kind: 'error' };
    return { kind: 'success', profiles: data.profiles ?? [], nextCursor: data.nextCursor ?? null };
  } catch {
    return { kind: 'error' };
  }
}

/* First-page loads are shared: concurrent callers get one request. */
export function loadFeedPage(cursor: number | null): Promise<FeedResult> {
  if (cursor !== null) return fetchPage(cursor);
  if (!inflightFirstPage) {
    inflightFirstPage = fetchPage(null).finally(() => {
      inflightFirstPage = null;
    });
  }
  return inflightFirstPage;
}

export function getCachedFeed(): CachedFeed | null {
  return cache;
}

export function isCacheStale(): boolean {
  return !cache || Date.now() - cache.fetchedAt > FEED_MAX_AGE_MS;
}

export function setCachedFeed(update: Omit<CachedFeed, 'fetchedAt'>): void {
  cache = { ...update, fetchedAt: cache?.fetchedAt ?? Date.now() };
}

export function markCacheFresh(): void {
  if (cache) cache.fetchedAt = Date.now();
}

/* Warm the first card photos so the deck never appears as a grey box. */
export function preloadDeckImages(profiles: FeedProfile[], count = 2): void {
  if (typeof window === 'undefined') return;
  for (const profile of profiles.slice(0, count)) {
    const src = profile.photos?.[0];
    if (src) {
      const img = new Image();
      img.src = src;
    }
  }
}

/* Fire-and-forget warmup, called from the app shell before the user
   ever taps Discover. No-ops when a deck is already cached or loading. */
export function prefetchFeed(): void {
  if (typeof window === 'undefined') return;
  if (cache && cache.profiles.length > 0) return;

  loadFeedPage(null).then((result) => {
    if (result.kind !== 'success') return; // stay silent — the page handles errors itself
    cache = {
      profiles: result.profiles,
      nextCursor: result.nextCursor,
      hasMore: result.nextCursor !== null && result.profiles.length > 0,
      fetchedAt: Date.now(),
    };
    preloadDeckImages(result.profiles);
  });
}
