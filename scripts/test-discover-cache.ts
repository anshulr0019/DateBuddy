/** Run with: node --import tsx --test scripts/test-discover-cache.ts */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCachedFeed, loadFeedPage, prefetchFeed, setCachedFeed, type FeedProfile } from '../src/app/lib/feedCache';

test('Discover isolates filter requests and protects a live deck from late prefetches', async () => {
  const originalFetch = globalThis.fetch;
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const requests: { url: string; resolve: (response: Response) => void }[] = [];
  globalThis.fetch = (input) => new Promise<Response>(resolve => {
    requests.push({ url: String(input), resolve });
  });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  const filters = { ageMin: 20, ageMax: 30, verifiedOnly: false };
  const revised = { ageMin: 35, ageMax: 45, verifiedOnly: true };
  const resolveRequest = (index: number) => requests[index].resolve(Response.json({ success: true, profiles: [], nextCursor: null }));
  try {
    // The navigation warmup starts before the user opens Discover.
    prefetchFeed();
    const first = loadFeedPage(null, filters);
    assert.equal(loadFeedPage(null, { verifiedOnly: false, ageMax: 30, ageMin: 20 }), first);
    const second = loadFeedPage(null, revised);
    assert.notEqual(first, second);
    assert.equal(requests.length, 3);
    assert.match(requests[2].url, /verifiedOnly=true/);

    // Resolving old preferences must not clear the newer in-flight request.
    resolveRequest(1);
    await first;
    assert.equal(loadFeedPage(null, revised), second);
    resolveRequest(2);
    await second;

    const profile: FeedProfile = { id: 12, name: 'Test', age: 36, city: null, bio: null, verified: true, online: false, distance: null, photos: [], tags: [], prompts: [] };
    setCachedFeed({ profiles: [profile], nextCursor: 12, hasMore: true }, revised);
    resolveRequest(0);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(getCachedFeed(revised)?.profiles, [profile]);
    assert.equal(getCachedFeed(filters), null);
    assert.equal(getCachedFeed(), null);

    // An exhausted deck is a valid cache hit, not a reason to start over.
    setCachedFeed({ profiles: [], nextCursor: null, hasMore: false }, revised);
    prefetchFeed();
    assert.equal(requests.length, 3);
    assert.equal(getCachedFeed(revised)?.hasMore, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
