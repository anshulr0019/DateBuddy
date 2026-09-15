// node --test scripts/test-voice-upload.mjs
// Exercise the upload route without reading credentials or using external storage.
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const fixture = { session: { userId: 17 }, uploads: [], fail: false };
globalThis.__voiceUploadTest = fixture;
const result = await build({
  entryPoints: ['src/app/api/upload/route.ts'], bundle: true, write: false,
  platform: 'node', format: 'cjs', packages: 'external',
  define: Object.fromEntries(['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].map(key => [`process.env.${key}`, '"test-only"'])),
  plugins: [{ name: 'fake-storage', setup(build) {
    build.onResolve({ filter: /^(@\/lib\/auth|cloudinary|fs\/promises)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents:
      args.path === '@/lib/auth' ? 'export const getAuthSession = async () => globalThis.__voiceUploadTest.session;' :
      args.path === 'cloudinary' ? `export const v2 = { config() {}, uploader: { async upload(data, options) {
        const f = globalThis.__voiceUploadTest; f.uploads.push({ data, options });
        if (f.fail) throw new Error('Storage unavailable');
        return { secure_url: 'https://media.example.test/voice.mp3' };
      } } };` : 'export const writeFile = () => { throw new Error("Disk fallback must not run for voice"); }; export const mkdir = writeFile;'
    }));
  } }],
});
const compiled = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
async function upload(type, size = 20) {
  const form = new FormData();
  form.append('file', new File([new Uint8Array(size)], 'recording', { type }));
  return compiled.exports.POST(new Request('http://localhost/api/upload', { method: 'POST', body: form }));
}
beforeEach(() => { fixture.session = { userId: 17 }; fixture.uploads = []; fixture.fail = false; });
test('audio requires authentication before reaching storage', async () => {
  fixture.session = null;
  assert.equal((await upload('audio/mp4')).status, 401);
  assert.equal(fixture.uploads.length, 0);
});
test('supported recorder formats upload as audio and produce a cross-browser playback URL', async () => {
  for (const type of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/mpeg']) {
    const response = await upload(type);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, url: 'https://media.example.test/voice.mp3' });
    const { data, options } = fixture.uploads.at(-1);
    assert.match(data, /^data:audio\//);
    assert.deepEqual(options, { resource_type: 'video', folder: 'infyn/users/17/voice', format: 'mp3' });
  }
});
test('empty, oversized, and unsupported recordings never upload', async () => {
  assert.equal((await upload('audio/mp4', 0)).status, 413);
  assert.equal((await upload('audio/mp4', 3 * 1024 * 1024 + 1)).status, 413);
  assert.equal((await upload('text/html')).status, 415);
  assert.equal(fixture.uploads.length, 0);
});
test('failed storage returns an honest failure, never a local URL or inline audio', async () => {
  fixture.fail = true;
  const response = await upload('audio/webm');
  assert.equal(response.status, 502);
  assert.equal((await response.json()).success, false);
});
test('existing photo uploads retain their image transformations', async () => {
  assert.equal((await upload('image/jpeg')).status, 200);
  const { options } = fixture.uploads[0];
  assert.equal(options.resource_type, undefined);
  assert.deepEqual(options.transformation, [{ quality: 'auto:good', fetch_format: 'auto' }, { width: 1200, crop: 'limit' }]);
});
