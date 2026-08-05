/**
 * One-time brand asset pipeline.
 * Source of truth: telegram-bot-profile.jpeg (official DateBuddy logo, white bg).
 * Extracts the heart mark, removes the white background (JPEG has no alpha),
 * and regenerates every icon/splash asset. Re-run with: node scripts/process-logo.mjs
 */
import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';

const SRC = 'telegram-bot-profile.jpeg';
const DARK = { r: 13, g: 11, b: 24, alpha: 1 }; // #0D0B18 splash background

// ---- 1. Crop to the heart mark (wordmark in the source is baked black text —
//         never used; wordmarks are rendered as live text app-wide) ----
const markRegion = { left: 380, top: 380, width: 1300, height: 920 };

const { data, info } = await sharp(SRC)
  .extract(markRegion)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// ---- 2. White removal ----
// Solid logo pixels keep their original color (alpha 255). Pixels near white
// become transparent. Edge pixels (logo blended into white by anti-aliasing)
// get partial alpha and are un-matted from white so no light fringe remains.
// Near-gray low-contrast pixels (JPEG noise / soft shadows) are dropped.
const T0 = 18;  // distance-from-white below this => fully transparent
const T1 = 90;  // distance-from-white above this => fully opaque
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const d = Math.max(255 - r, 255 - g, 255 - b);
  const sat = Math.max(r, g, b) - Math.min(r, g, b);

  let a;
  if (d <= T0 || (d < 70 && sat < 18)) {
    a = 0;
  } else if (d >= T1) {
    a = 255;
  } else {
    a = Math.round(((d - T0) / (T1 - T0)) * 255);
    // un-matte from white: c_true = (c - (1 - a)*255) / a
    for (let c = 0; c < 3; c++) {
      const v = ((data[i + c] - (255 - a)) * 255) / a;
      data[i + c] = Math.max(0, Math.min(255, Math.round(v)));
    }
  }
  data[i + 3] = a;
}

// ---- 3. Tight bounding box of visible pixels ----
let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 40) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log('mark bbox:', { minX, minY, maxX, maxY });

const mark = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
const markPng = await mark.png().toBuffer();

/** Transparent mark resized to fit a box. */
const markFit = (size) =>
  sharp(markPng).resize(size, size, { fit: 'inside', withoutEnlargement: false }).png().toBuffer();

/** Opaque square icon: mark centered on the dark brand background. */
async function darkIcon(size, markScale = 0.62) {
  const m = await markFit(Math.round(size * markScale));
  return sharp({ create: { width: size, height: size, channels: 4, background: DARK } })
    .composite([{ input: m, gravity: 'centre' }])
    .removeAlpha()
    .png()
    .toBuffer();
}

// ---- 4. Emit assets ----
await mkdir('public/brand', { recursive: true });

await sharp(await markFit(1024)).toFile('public/brand/logo-mark.png');       // app-wide mark (transparent)
await sharp(await markFit(512)).toFile('src/app/icon.png');                  // favicon (transparent)
await sharp(await darkIcon(180)).toFile('src/app/apple-icon.png');           // apple touch icon
await sharp(await darkIcon(192)).toFile('public/icon-192.png');              // PWA manifest
await sharp(await darkIcon(512)).toFile('public/icon-512.png');              // PWA manifest
await sharp(await darkIcon(1024)).toFile('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');

// iOS native splash: mark centered on dark, 2732x2732 (all three variants identical)
const splashMark = await markFit(560);
const splash = await sharp({ create: { width: 2732, height: 2732, channels: 4, background: DARK } })
  .composite([{ input: splashMark, gravity: 'centre' }])
  .removeAlpha()
  .png()
  .toBuffer();
const splashDir = 'ios/App/App/Assets.xcassets/Splash.imageset';
await sharp(splash).toFile(`${splashDir}/splash-2732x2732.png`);
await copyFile(`${splashDir}/splash-2732x2732.png`, `${splashDir}/splash-2732x2732-1.png`);
await copyFile(`${splashDir}/splash-2732x2732.png`, `${splashDir}/splash-2732x2732-2.png`);

console.log('done: public/brand/logo-mark.png, favicons, PWA icons, iOS icon + splash');
