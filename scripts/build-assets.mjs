/**
 * One-shot asset optimizer for the TopBet x Big Bass Bonanza LP.
 *
 * Two sources feed this:
 *   assets/Game Art/  - the raw Pragmatic Play art pack
 *   assets/generated/ - fish and UI generated with Higgsfield, style-matched
 *                       to the pack's bass and already background-removed
 *
 * Outputs land in assets/build/, which is what index.html loads and which is
 * committed, so serving the LP needs no build step.
 *
 * Run: npm install && npm run assets
 */
import sharp from 'sharp';
import { mkdir, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART = path.join(ROOT, 'assets', 'Game Art', 'Game Art');
const GEN = path.join(ROOT, 'assets', 'generated');
const OUT = path.join(ROOT, 'assets', 'build');

const out = (name) => path.join(OUT, name);

/** Skip work when the output already exists and is newer than its source. */
async function isFresh(srcPath, outPath) {
  if (!existsSync(outPath)) return false;
  const [s, o] = await Promise.all([stat(srcPath), stat(outPath)]);
  return o.mtimeMs >= s.mtimeMs;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)}KB`;

async function report(label, srcPath, outPath) {
  const [s, o] = await Promise.all([stat(srcPath), stat(outPath)]);
  const pct = ((1 - o.size / s.size) * 100).toFixed(0);
  const meta = await sharp(outPath).metadata();
  console.log(
    `  ${label.padEnd(14)} ${kb(s.size).padStart(7)} -> ${kb(o.size).padStart(6)} (-${pct}%)  ` +
    `${meta.width}x${meta.height}`,
  );
}

/**
 * Resize to a target width and encode as WebP.
 *
 * `trim` crops fully-transparent padding first. The generated sprites carry a
 * lot of it, and every wasted pixel is both bytes and a bigger hit box for a
 * sprite that has to sit precisely against the hook.
 */
async function still({ label, from, to, width, quality, trim = false }) {
  if (!existsSync(from)) throw new Error(`missing source: ${from}`);
  const o = out(to);
  if (await isFresh(from, o)) return console.log(`  ${label.padEnd(14)} up to date`);

  let img = sharp(from);
  if (trim) img = img.trim({ threshold: 1 });
  await img.resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(o);
  await report(label, from, o);
}

await mkdir(OUT, { recursive: true });
console.log('\nBuilding assets -> assets/build/\n');

// ---- The lake -------------------------------------------------------------
// Underwater shot with the surface near the top of the frame, which is exactly
// the composition the mini-game needs: rod above the line, fish below it.
for (const [label, to, width] of [
  ['bg 1600w', 'bg-water.webp', 1600],
  ['bg 800w', 'bg-water@800.webp', 800],
]) {
  await still({
    label,
    from: path.join(ART, 'Big Bass Bonanza_Game Art_3554x1998_Background_22.jpg'),
    to,
    width,
    quality: 75,
  });
}

// ---- Tackle, from the pack ------------------------------------------------
await still({
  label: 'rod',
  from: path.join(ART, 'Big Bass Bonanza_Game Art_352x321_Symbol_15.png'),
  to: 'rod.webp',
  width: 300,
  quality: 88,
  trim: true,
});

await still({
  label: 'bobber',
  from: path.join(ART, 'Big Bass Bonanza_Game Art_320x311_Symbol_4.png'),
  to: 'bobber.webp',
  width: 130,
  quality: 88,
  trim: true,
});

// ---- Fish -----------------------------------------------------------------
// All four are stills. The fish are already in motion (CSS drift across the
// lake), so per-sprite frame animation buys almost nothing at this size, and
// the animated Pragmatic bass alone cost 464KB.
//
// All four are also generated. The pack's own bass carries a very thick,
// blobby white sticker outline sized for a slot reel; shrunk to ~80px in the
// lake that halo swallows the fish and it reads as a white blob next to the
// others. The generated set was style-matched to that bass from a reference
// frame of it, so the lake still reads as Big Bass Bonanza art while the
// four sprites stay consistent with each other.
// Pike, roach and catfish were added when the mini-game became a steering game:
// eight depth lanes drawn from four species put the same sprite on screen twice
// at once, which reads as a rendering fault rather than as a shoal.
for (const [label, file, to] of [
  ['fish bass', 'fish-bass.png', 'fish-bass.webp'],
  ['fish perch', 'fish-perch.png', 'fish-perch.webp'],
  ['fish carp', 'fish-carp.png', 'fish-carp.webp'],
  ['fish gold', 'fish-gold.png', 'fish-gold.webp'],
  ['fish pike', 'fish-pike.png', 'fish-pike.webp'],
  ['fish roach', 'fish-roach.png', 'fish-roach.webp'],
  ['fish catfish', 'fish-catfish.png', 'fish-catfish.webp'],
]) {
  await still({ label, from: path.join(GEN, file), to, width: 260, quality: 86, trim: true });
}

// ---- Progress plank -------------------------------------------------------
await still({
  label: 'plank',
  from: path.join(GEN, 'plank.png'),
  to: 'plank.webp',
  width: 520,
  quality: 84,
  trim: true,
});

const files = (await readdir(OUT)).sort();
const sizes = await Promise.all(files.map((f) => stat(out(f)).then((s) => s.size)));
console.log(`\n${files.length} files, ${kb(sizes.reduce((a, b) => a + b, 0))} total`);
console.log(files.map((f, i) => `  ${f.padEnd(22)} ${kb(sizes[i])}`).join('\n') + '\n');
