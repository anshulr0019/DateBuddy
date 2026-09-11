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

import { optimizeImageUrl } from '../components/shared';

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
const inflightFirstPages = new Map<string, Promise<FeedResult>>();
let cachedFilters: string | null = null;

export type FeedFilters = {
  ageMin?: number;
  ageMax?: number;
  verifiedOnly?: boolean;
};

async function fetchPage(cursor: number | null, filters?: FeedFilters): Promise<FeedResult> {
  try {
    const params = new URLSearchParams();
    if (cursor !== null) params.set('cursor', String(cursor));
    if (filters?.ageMin != null) params.set('ageMin', String(filters.ageMin));
    if (filters?.ageMax != null) params.set('ageMax', String(filters.ageMax));
    if (filters?.verifiedOnly) params.set('verifiedOnly', 'true');
    const url = `/api/feed${params.size > 0 ? `?${params}` : ''}`;
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

// Normalize omitted values to the API defaults; request order does not affect identity.
function filterKey(filters?: FeedFilters): string {
  return JSON.stringify([filters?.ageMin ?? 18, filters?.ageMax ?? 60, Boolean(filters?.verifiedOnly)]);
}

/* Only requests with the same filters share a first page. An older request
   must never clear a newer request or invalidate the deck being displayed. */
export function loadFeedPage(cursor: number | null, filters?: FeedFilters): Promise<FeedResult> {
  if (cursor !== null) return fetchPage(cursor, filters);
  const key = filterKey(filters);
  const pending = inflightFirstPages.get(key);
  if (pending) return pending;
  const request = fetchPage(null, filters).finally(() => {
    if (inflightFirstPages.get(key) === request) inflightFirstPages.delete(key);
  });
  inflightFirstPages.set(key, request);
  return request;
}

export function getCachedFeed(filters?: FeedFilters): CachedFeed | null {
  return cachedFilters === filterKey(filters) ? cache : null;
}

export function isCacheStale(filters?: FeedFilters): boolean {
  const cached = getCachedFeed(filters);
  return !cached || Date.now() - cached.fetchedAt > FEED_MAX_AGE_MS;
}

export function setCachedFeed(update: Omit<CachedFeed, 'fetchedAt'>, filters?: FeedFilters): void {
  const previous = getCachedFeed(filters);
  cache = { ...update, fetchedAt: previous?.fetchedAt ?? Date.now() };
  cachedFilters = filterKey(filters);
}

export function markCacheFresh(filters?: FeedFilters): void {
  const cached = getCachedFeed(filters);
  if (cached) cached.fetchedAt = Date.now();
}

/* Warm the first card photos so the deck never appears as a grey box. */
export function preloadDeckImages(profiles: FeedProfile[], count = 2): void {
  if (typeof window === 'undefined') return;
  for (const profile of profiles.slice(0, count)) {
    const src = profile.photos?.[0];
    if (src) {
      const optimized = optimizeImageUrl(src, { width: 800 }) || src;
      const img = new Image();
      img.src = optimized;
    }
  }
}

/* Fire-and-forget warmup, called from the app shell before the user
   ever taps Discover. No-ops when a deck is already cached or loading. */
export function prefetchFeed(): void {
  if (typeof window === 'undefined') return;
  if (cache) return;

  loadFeedPage(null).then((result) => {
    if (result.kind !== 'success' || cache) return; // never overwrite a live deck
    cachedFilters = filterKey();
    cache = {
      profiles: result.profiles,
      nextCursor: result.nextCursor,
      hasMore: result.nextCursor !== null && result.profiles.length > 0,
      fetchedAt: Date.now(),
    };
    preloadDeckImages(result.profiles);
  });
}
