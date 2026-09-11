// Run: node --test scripts/test-chat-loading.mjs
// Exercise the real route and Drizzle SQL with a fake PostgreSQL transport.
// No database connection, credentials, or external requests are used.
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { drizzle } from 'drizzle-orm/node-postgres';

const fixture = { session: null, participant: true, queries: [], failMessages: false };
globalThis.__infynChatLoadingTest = fixture;
const now = new Date().toISOString();
const driverNow = now.replace('T', ' ').replace('Z', '');
fixture.db = drizzle({
  async query(query, values) {
    const text = query.text;
    fixture.queries.push({ text, values });
    assert.match(text, /^select /i, 'GET must remain read-only');
    if (text.includes('from "matches"')) {
      assert.match(text, /"is_active" = \$2/);
      assert.match(text, /"user1_id" = \$3 or "matches"\."user2_id" = \$4/);
      assert.deepEqual(values, [77, true, fixture.session.userId, fixture.session.userId]);
      return { rows: fixture.participant ? [[77, 1, 2, driverNow, true]] : [] };
    }
    if (text.includes('from "users"')) {
      assert.deepEqual(values, [fixture.session.userId === 1 ? 2 : 1, 1]);
      return { rows: [['Test Partner', true, driverNow]] };
    }
    if (text.includes('from "photos"')) {
      assert.deepEqual(values, [fixture.session.userId === 1 ? 2 : 1, 1]);
      assert.match(text, /order by "photos"\."order_index"/);
      return { rows: [['/test-photo.jpg']] };
    }
    if (text.includes('from "messages"')) {
      if (fixture.failMessages) throw new Error('Simulated database outage');
      assert.equal(values[0], 77);
      assert.equal(values.at(-1), 51);
      assert.match(text, /order by "messages"\."id" desc/);
      const newest = values.length === 3 ? values[1] - 1 : 100;
      return { rows: Array.from({ length: 51 }, (_, i) => [newest - i, 77, 2, 1, 'text', `Message ${newest - i}`, null, true, driverNow]) };
    }
    throw new Error(`Unexpected query: ${text}`);
  },
});

const result = await build({
  entryPoints: ['src/app/api/messages/route.ts'],
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'test-dependencies', setup(build) {
    build.onResolve({ filter: /^@\/(db$|lib\/(auth|pusher-server|push-notify)$)/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => {
      if (args.path === '@/db') return { contents: 'export const db = globalThis.__infynChatLoadingTest.db;' };
      if (args.path === '@/lib/auth') return { contents: 'export const getAuthSession = async () => globalThis.__infynChatLoadingTest.session;' };
      return { contents: 'export const triggerChatMessage = () => {}; export const triggerReadReceipt = () => {}; export const triggerMessageReaction = () => {}; export const pushNotifyUser = () => {};' };
    });
  } }],
});
const compiled = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const { GET } = compiled.exports;
const request = query => GET(new Request(`http://localhost/api/messages?${query}`));

beforeEach(() => {
  fixture.session = { userId: 1 };
  fixture.participant = true;
  fixture.queries = [];
  fixture.failMessages = false;
});

test('unauthenticated and malformed requests never read chat data', async () => {
  fixture.session = null;
  assert.equal((await request('matchId=77&includePartner=true')).status, 401);
  assert.equal(fixture.queries.length, 0);
  fixture.session = { userId: 1 };
  for (const value of ['0', '-1', 'hello', '1.5']) {
    assert.equal((await request(`matchId=${value}&includePartner=true`)).status, 400);
  }
  assert.equal(fixture.queries.length, 0);
});

test('inactive or nonparticipant matches return 404 without reading partner or messages', async () => {
  fixture.participant = false;
  const response = await request('matchId=77&includePartner=true');
  assert.equal(response.status, 404);
  assert.equal(fixture.queries.length, 1);
});

test('initial load returns only the authorized partner and the latest 50 messages', async () => {
  for (const userId of [1, 2]) {
    fixture.session = { userId };
    fixture.queries = [];
    const response = await request('matchId=77&includePartner=true');
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.deepEqual(data.partner, {
      matchId: 77, partnerId: userId === 1 ? 2 : 1, name: 'Test Partner',
      photo: '/test-photo.jpg', verified: true, online: true, lastActiveAt: now,
    });
    assert.equal(data.messages.length, 50);
    assert.equal(data.messages[0].id, 51);
    assert.equal(data.messages.at(-1).id, 100);
    assert.equal(data.hasMore, true);
    assert.equal(fixture.queries.length, 4);
  }
});

test('polling and older-page responses retain their existing contract and avoid header queries', async () => {
  for (const suffix of ['', '&before=40']) {
    fixture.queries = [];
    const response = await request(`matchId=77${suffix}`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.deepEqual(Object.keys(data).sort(), ['hasMore', 'messages', 'success']);
    assert.equal(data.messages.at(-1).id, suffix ? 39 : 100);
    assert.equal(fixture.queries.length, 2);
  }
});

test('invalid pagination and database failures cannot return a partial ready response', async () => {
  assert.equal((await request('matchId=77&before=invalid&includePartner=true')).status, 400);
  assert.equal(fixture.queries.length, 1);
  fixture.failMessages = true;
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await request('matchId=77&includePartner=true');
    assert.equal(response.status, 500);
    assert.equal((await response.json()).success, false);
  } finally { console.error = originalError; }
});
