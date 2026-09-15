// PLAYWRIGHT_MODULE=/path/to/playwright node scripts/test-voice-notes.mjs
// Browser checks use real composer/useChat/player with fake mic and API transports.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = process.cwd();
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'infyn-voice-check-'));
const harness = `
import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Composer } from './src/app/chat/[id]/components/Composer';
import { VoiceMessagePlayer } from './src/app/chat/[id]/components/VoiceMessagePlayer';
import { useChat } from './src/app/chat/[id]/useChat';
import s from './src/app/chat/[id]/chat.module.css';
function Harness() {
  const chat = useChat(77, Number(new URLSearchParams(location.search).get('user')) || 1);
  const [value, setValue] = useState(''); const inputRef = useRef(null);
  const [show, setShow] = useState(true); const [blocked, setBlocked] = useState(false);
  window.voiceHarness = { chat, setShow, setBlocked, setValue };
  return <div className={s.root}><div className={s.shell}>
    <div style={{ padding: 24 }}>Voice note verification</div>
    <div style={{flex:1,overflowY:'auto',padding:20}}>{chat.messages.map(m => <div key={m.id} data-message-status={m.status} style={{marginBottom:16,padding:12,border:'1px solid #e8ddc9',borderRadius:16}}>
      {m.type === 'voice' ? <VoiceMessagePlayer audioUrl={m.content} isMine durationSec={m.metadata?.durationSec}/> : m.content}
      <span>{m.status}</span>{m.status === 'failed' && <button onClick={()=>chat.retry(m.id)}>Retry</button>}
    </div>)}</div>
    {chat.phase==='ready' && show && <Composer value={value} onChange={setValue} inputRef={inputRef}
      onSend={()=>{chat.sendText(value);setValue('');}} onSendVoice={(file,seconds)=>chat.sendVoice(file,seconds,{id:'42',senderName:'Partner',content:'Hello',type:'text'})}
      onPickFile={chat.sendPhoto} emojiOpen={false} onToggleEmoji={()=>{}} gifOpen={false} onToggleGif={()=>{}} onFocusInput={()=>{}}
      recordingBlocked={blocked} error={chat.composerError}/>} </div></div>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Harness/></React.StrictMode>);`;
await build({ stdin: { contents: harness, resolveDir: root, loader: 'tsx' }, bundle: true, outfile: path.join(dir, 'app.js'), jsx: 'automatic', external: ['/fonts/*'], plugins: [{ name: 'fake-realtime', setup(build) {
  build.onResolve({ filter: /lib\/(pusher-client|haptics|image-compress)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
  build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path.endsWith('pusher-client') ? 'export const getPusherClient=()=>null;' : args.path.endsWith('image-compress') ? 'export const compressImageForUpload=async file=>file;' : 'export const hapticLight=()=>{}; export const hapticMedium=()=>{}; export const hapticWarning=()=>{};' }));
} }] });
const css = await postcss([tailwind({ base: root })]).process(fs.readFileSync('src/app/globals.css','utf8'), { from: path.join(root, 'src/app/globals.css') });
fs.writeFileSync(path.join(dir, 'global.css'), css.css);
fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');

// A valid one-second PCM file lets the real browser player verify receipt/playback.
const wav = Buffer.alloc(44 + 16000 * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8); wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(1,22); wav.writeUInt32LE(16000,24); wav.writeUInt32LE(32000,28); wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34); wav.write('data',36); wav.writeUInt32LE(wav.length-44,40);
for(let i=0;i<16000;i++) wav.writeInt16LE(Math.sin(i * 2 * Math.PI * 440 / 16000)*3000,44+i*2);

const browser = await (process.env.WEBKIT ? webkit : chromium).launch({ headless: true, ...(process.env.WEBKIT ? {} : { channel: 'chrome' }) });
try {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const requests = []; let messages = []; let failUpload = false; let failSend = false;
  await page.context().route('https://infyn.test/**', async route => {
    const request = route.request(); const u = new URL(request.url());
    if(u.pathname === '/voice.mp3') return route.fulfill({contentType:'audio/wav',body:wav});
    if(u.pathname === '/api/upload') { requests.push('upload'); return route.fulfill({status:failUpload?502:200,json:failUpload?{success:false}:{success:true,url:'https://infyn.test/voice.mp3'}}); }
    if(u.pathname === '/api/messages' && request.method() === 'POST') {
      const body = request.postDataJSON(); requests.push(body);
      if(failSend) return route.fulfill({status:500,json:{success:false}});
      const message = {...body,id:100+messages.length,senderId:1,receiverId:2,createdAt:new Date().toISOString(),isRead:false}; messages.push(message);
      return route.fulfill({json:{success:true,message}});
    }
    if(u.pathname === '/api/messages' && request.method() === 'GET') return route.fulfill({json:{success:true,messages,hasMore:false,partner:{matchId:77,partnerId:2,name:'Partner',photo:null,verified:true}}});
    if(u.pathname.startsWith('/api/')) return route.fulfill({json:{success:true}});
    const file = u.pathname==='/' ? path.join(dir,'index.html') : u.pathname.startsWith('/fonts/') ? path.join(root,'public',u.pathname) : path.join(dir,u.pathname);
    return fs.existsSync(file) ? route.fulfill({path:file}) : route.fulfill({status:404,body:''});
  });
  await page.addInitScript((wave) => {
    window.micTest = { mode:'ok', starts:0, stops:0, requested:0, bytes:0, format:null };
    const mic = window.micTest;
    const getUserMedia = async () => {
      mic.requested++;
      if(mic.mode==='denied') throw new DOMException('Denied','NotAllowedError');
      if(mic.mode==='pending') await new Promise(resolve=>mic.resolve=resolve);
      const track = { onended:null, stop() {mic.stops++;} };
      return { getTracks:()=>[track], getAudioTracks:()=>[track] };
    };
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia}});
    window.MediaRecorder = class {
      static isTypeSupported(type) { return type === (mic.format || 'audio/mp4'); }
      constructor(stream, options) { this.mimeType=options.mimeType; this.state='inactive'; }
      start() {this.state='recording';mic.starts++;}
      stop() {this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob([mic.bytes ? new Uint8Array(mic.bytes) : new Uint8Array(wave)],{type:this.mimeType})});this.onstop?.();});}
    };
  }, Array.from(wav));
  const mic = () => page.getByRole('button',{name:'Hold to record voice note',exact:true});
  const recording = () => page.getByRole('group',{name:'Voice recording'});
  async function reset() { messages=[];requests.length=0;failUpload=false;failSend=false;await page.goto('https://infyn.test/');await mic().waitFor(); }
  async function hold() {const b=await mic().boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await recording().waitFor();await page.waitForTimeout(750);return {x:b.x+b.width/2,y:b.y+b.height/2};}
  async function lock() {const p=await hold();await page.mouse.move(p.x,p.y-85,{steps:5});await page.mouse.up();await page.getByRole('button',{name:'Stop recording',exact:true}).waitFor();}
  await reset();
  await page.getByRole('textbox',{name:'Message',exact:true}).fill('hello'); await page.getByRole('button',{name:'Send message',exact:true}).click();
  await mic().waitFor(); assert.equal(requests[0].type,'text');
  await page.getByRole('textbox',{name:'Message',exact:true}).fill('   '); assert.equal(await mic().count(),1);
  await reset(); await mic().click(); await page.waitForTimeout(300); assert.equal(await page.evaluate(()=>micTest.starts),0); assert.equal(requests.length,0);
  await hold(); await page.mouse.up(); await page.locator('[data-message-status="sent"]').waitFor();
  assert.equal(requests[0],'upload'); assert.equal(requests[1].type,'voice'); assert.equal(requests[1].content,'https://infyn.test/voice.mp3'); assert.equal(requests[1].metadata.replyTo.id,'42'); assert(requests[1].metadata.durationSec>=0.6);
  await page.reload(); await mic().waitFor(); await page.getByRole('button',{name:'Play audio note',exact:true}).click(); await page.getByRole('button',{name:'Pause audio note',exact:true}).waitFor();
  const recipient = await page.context().newPage();
  await recipient.goto('https://infyn.test/?user=2');
  await recipient.getByRole('button',{name:'Play audio note',exact:true}).click();await recipient.getByRole('button',{name:'Pause audio note',exact:true}).waitFor();
  assert.equal(await recipient.evaluate(()=>voiceHarness.chat.messages[0].senderId),1);await recipient.close();
  console.log('PASS: mic/send toggle, short tap, hold/release, upload-before-send, reply metadata, playback after reload');
  await reset(); let p=await hold(); await page.mouse.move(p.x-110,p.y,{steps:5});await page.mouse.up();await mic().waitFor();assert.equal(requests.length,0);assert(await page.evaluate(()=>micTest.stops)>0);
  await lock(); assert.equal(requests.length,0);await page.getByRole('button',{name:'Stop recording',exact:true}).click();await page.getByRole('button',{name:'Delete recording',exact:true}).waitFor();assert.equal(requests.length,0);
  await page.getByRole('button',{name:'Send voice note',exact:true}).click();await page.locator('[data-message-status="sent"]').waitFor();
  await reset();await lock();await page.getByRole('button',{name:'Delete recording',exact:true}).click();await mic().waitFor();assert.equal(requests.length,0);
  console.log('PASS: slide left discards, slide up locks without sending on release, stop/preview/send, delete');
  await reset();await page.evaluate(()=>micTest.mode='pending');const pendingBox=await mic().boundingBox();await page.mouse.move(pendingBox.x+20,pendingBox.y+20);await page.mouse.down();await recording().waitFor();await page.mouse.up();await page.evaluate(()=>micTest.resolve());await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>micTest.starts),0);assert(await page.evaluate(()=>micTest.stops)>0);assert.equal(requests.length,0);
  await reset();await page.evaluate(()=>micTest.mode='denied');const denyBox=await mic().boundingBox();await page.mouse.move(denyBox.x+20,denyBox.y+20);await page.mouse.down();await page.getByRole('status').filter({hasText:'Microphone access is blocked'}).waitFor();await page.mouse.up();assert.equal(requests.length,0);
  await reset();await lock();await page.evaluate(()=>window.dispatchEvent(new Event('infyn:call-interruption')));await page.getByRole('button',{name:'Play audio note',exact:true}).waitFor();assert.equal(requests.length,0);
  await reset();await lock();await page.evaluate(()=>voiceHarness.setBlocked(true));await page.getByRole('button',{name:'Play audio note',exact:true}).waitFor();assert.equal(requests.length,0);
  await reset();await hold();await page.evaluate(()=>voiceHarness.setShow(false));await page.mouse.up();assert(await page.evaluate(()=>micTest.stops)>0);assert.equal(requests.length,0);
  console.log('PASS: permission-release race, permission denial, incoming/outgoing call interruptions, unmount cleanup');
  await reset();failUpload=true;await hold();await page.mouse.up();await page.locator('[data-message-status="failed"]').waitFor();assert.deepEqual(requests,['upload']);failUpload=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await page.locator('[data-message-status="sent"]').waitFor();assert.equal(requests.at(-1).type,'voice');
  await reset();failSend=true;await hold();await page.mouse.up();await page.locator('[data-message-status="failed"]').waitFor();failSend=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await page.locator('[data-message-status="sent"]').waitFor();assert.equal(requests.filter(r=>r==='upload').length,1);
  console.log('PASS: upload failure cannot post a blob URL, retry preserves audio, message retry reuses uploaded URL');
  await reset();failUpload=true;await hold();await page.mouse.up();await page.locator('[data-message-status="failed"]').waitFor();failUpload=false;
  await page.evaluate(()=>{const id=voiceHarness.chat.messages[0].id;voiceHarness.chat.retry(id);voiceHarness.chat.retry(id);});await page.locator('[data-message-status="sent"]').waitFor();
  assert.equal(requests.filter(r=>typeof r==='object').length,1);
  await reset();await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:false});window.dispatchEvent(new Event('offline'));});
  await hold();await page.mouse.up();await page.locator('[data-message-status="queued"]').waitFor();assert.equal(requests.length,0);
  await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'));});await page.locator('[data-message-status="sent"]').waitFor();
  console.log('PASS: receiving account playback, concurrent-retry guard, offline queue/reconnect');
  await reset();await mic().focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Stop recording',exact:true}).waitFor();await page.waitForTimeout(750);await page.keyboard.press('Escape');await mic().waitFor();assert.equal(requests.length,0);
  for(const width of [320,375,393,430]) {
    await reset();await page.setViewportSize({width,height:740});await lock();
    await page.screenshot({path:path.join(dir,`locked-${width}.png`)});
    for(const name of ['Delete recording','Stop recording','Send voice note']) {const b=await page.getByRole('button',{name,exact:true}).boundingBox();assert(b.x>=0&&b.x+b.width<=width);assert(b.width>=44&&b.height>=44);}
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.getByRole('button',{name:'Stop recording',exact:true}).click();await page.getByRole('button',{name:'Play audio note',exact:true}).waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(dir,`preview-${width}.png`)});
  }
  await reset();await page.clock.install();await mic().focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Stop recording',exact:true}).waitFor();await page.clock.fastForward(121_000);await page.getByRole('button',{name:'Play audio note',exact:true}).waitFor();assert.equal(requests.length,0);await page.clock.resume();
  await reset();await page.evaluate(()=>micTest.bytes=3*1024*1024+1);await hold();await page.mouse.up();await mic().waitFor();assert.equal(requests.length,0);
  // Touch dispatch exercises pointer capture and touch-action without synthesizing DOM events.
  if(!process.env.WEBKIT) {
    const cdp=await page.context().newCDPSession(page);
    const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
    for(const action of ['send','cancel','lock']) {
      await reset();const b=await mic().boundingBox();const x=b.x+b.width/2,y=b.y+b.height/2;
      await touch('touchStart',x,y);await recording().waitFor();await page.waitForTimeout(750);
      if(action==='cancel') await touch('touchMove',x-110,y);
      if(action==='lock') await touch('touchMove',x,y-85);
      await touch('touchEnd',x,y);
      if(action==='send') await page.locator('[data-message-status="sent"]').waitFor();
      else {await page.waitForTimeout(100);assert.equal(requests.length,0);}
      if(action==='lock') await page.getByRole('button',{name:'Stop recording',exact:true}).waitFor();
    }
    console.log('PASS: actual touch event hold/send, left cancel and up lock');
  }
  await page.emulateMedia({reducedMotion:'reduce'});assert.deepEqual(errors,[]);
  console.log('PASS: keyboard/Escape, 320–430px layouts, 44px recording controls, duration cap without automatic send');
  console.log('Screenshots:',dir);
} finally { await browser.close(); }
