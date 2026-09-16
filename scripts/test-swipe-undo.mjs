// Run: node --test scripts/test-swipe-undo.mjs
// Exercises the DELETE handler without a network connection or live database.
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const fixture = {
  session: { userId: 7 },
  latest: { id: 41, swipedId: 12, action: 'like' },
  hasMatch: false,
  deleted: [],
  notificationSignals: [],
};
globalThis.__infynSwipeUndoFixture = fixture;

function fakeQuery(kind) {
  return {
    from() { return this; },
    where() { return kind === 'delete' ? Promise.resolve(fixture.deleted.push('swipe')) : this; },
    orderBy() { return this; },
    limit() { return this; },
    for() { return Promise.resolve(fixture.latest ? [fixture.latest] : []); },
    then(resolve, reject) { return Promise.resolve(fixture.hasMatch ? [{ id: 9 }] : []).then(resolve, reject); },
  };
}

fixture.db = {
  transaction: async (callback) => callback({
    select() {
      fixture.selects = (fixture.selects || 0) + 1;
      return fakeQuery('select');
    },
    delete() {
      fixture.deletes = (fixture.deletes || 0) + 1;
      return {
        where() {
          fixture.deleted.push(fixture.deletes === 1 ? 'swipe' : 'notification');
          return Promise.resolve();
        },
      };
    },
  }),
};

const result = await build({
  entryPoints: ['src/app/api/swipes/route.ts'],
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'test-dependencies', setup(build) {
    build.onResolve({ filter: /^@\/(db$|lib\/(auth|pusher-server)$)/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => {
      if (args.path === '@/db') return { contents: 'export const db = globalThis.__infynSwipeUndoFixture.db;' };
      if (args.path === '@/lib/auth') return { contents: 'export const getAuthSession = async () => globalThis.__infynSwipeUndoFixture.session;' };
      return { contents: 'export const triggerPusherEvent = async () => true; export const triggerUserNotification = async (id, payload) => { globalThis.__infynSwipeUndoFixture.notificationSignals.push({ id, payload }); };' };
    });
  } }],
});

const compiled = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const { DELETE } = compiled.exports;
const request = (body) => DELETE(new Request('http://localhost/api/swipes', {
  method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}));

beforeEach(() => {
  fixture.session = { userId: 7 };
  fixture.latest = { id: 41, swipedId: 12, action: 'like' };
  fixture.hasMatch = false;
  fixture.deleted = [];
  fixture.notificationSignals = [];
  fixture.deletes = 0;
  fixture.selects = 0;
});

test('requires authentication and a valid target before reading swipes', async () => {
  fixture.session = null;
  assert.equal((await request({ swipedUserId: 12 })).status, 401);
  fixture.session = { userId: 7 };
  for (const id of [0, -1, 7, 'not-a-number']) {
    assert.equal((await request({ swipedUserId: id })).status, 400);
  }
  assert.equal(fixture.selects, 0);
});

test('undoes the selected like and its exact notification', async () => {
  const response = await request({ swipedUserId: 12, swipeId: 41, action: 'like' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.deepEqual(fixture.deleted, ['swipe', 'notification']);
  assert.deepEqual(fixture.notificationSignals, [{ id: 12, payload: { type: 'like-removed' } }]);
});

test('undoes a pass without touching notifications', async () => {
  fixture.latest.action = 'pass';
  const response = await request({ swipedUserId: 12, swipeId: 41, action: 'pass' });
  assert.equal(response.status, 200);
  assert.deepEqual(fixture.deleted, ['swipe']);
  assert.deepEqual(fixture.notificationSignals, []);
});

test('rejects target, ID, or action mismatches without deleting anything', async () => {
  for (const body of [
    { swipedUserId: 13, swipeId: 41, action: 'like' },
    { swipedUserId: 12, swipeId: 40, action: 'like' },
    { swipedUserId: 12, swipeId: 41, action: 'pass' },
  ]) {
    assert.equal((await request(body)).status, 409);
  }
  assert.deepEqual(fixture.deleted, []);
});

test('does not undo a swipe that produced a match', async () => {
  fixture.hasMatch = true;
  assert.equal((await request({ swipedUserId: 12, swipeId: 41, action: 'like' })).status, 409);
  assert.deepEqual(fixture.deleted, []);
});
