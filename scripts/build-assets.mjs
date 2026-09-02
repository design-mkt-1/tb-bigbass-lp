/**
 * One-shot asset optimizer for the TopBet x Big Bass Bonanza LP.
 *
 * Three sources feed this:
 *   assets/Game Art/  - the raw Pragmatic Play art pack
 *   assets/GIFS/      - the pack's animated characters; we take single frames
 *   assets/generated/ - fish generated with Higgsfield, style-matched to the
 *                       pack's bass and already background-removed
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
const GIFS = path.join(ROOT, 'assets', 'GIFS');
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
 *
 * `page` picks one frame out of an animated source. The characters ship as
 * GIFs; the LP wants a still, and decoding 180 frames to throw 179 away is
 * both slower and heavier than asking sharp for the one we keep.
 */
async function still({ label, from, to, width, quality, trim = false, page }) {
  if (!existsSync(from)) throw new Error(`missing source: ${from}`);
  const o = out(to);
  if (await isFresh(from, o)) return console.log(`  ${label.padEnd(14)} up to date`);

  let img = page === undefined ? sharp(from) : sharp(from, { page });
  if (trim) img = img.trim({ threshold: 1 });
  await img.resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(o);
  await report(label, from, o);
}

await mkdir(OUT, { recursive: true });
console.log('\nBuilding assets -> assets/build/\n');

// ---- Screen 2's backdrop ---------------------------------------------------
// The game screen paints its own water in CSS now — a photographic lake was a
// large part of why it did not read like the reference game. This art survives
// only as the blurred, heavily desaturated backdrop behind the reveal and the
// registration card, which is the one place a photo still helps.
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

// ---- The angler -----------------------------------------------------------
// One frame of the pack's character loop: the Big Bass fisherman, full body,
// already background-free, holding a rod that points up and to the left with
// its own rigging drawn on it. That last part is why this replaces the old
// isolated rod symbol — the rod arrives attached to someone holding it, so the
// scene gains a character for free and loses the "rod held from off-screen"
// compromise.
//
// Page 30, not 0: the loop flexes the rod, and this frame is the one where the
// tip sits at the very top-left of the trimmed box. That corner is where the
// line is anchored from CSS, so a frame with a different flex would silently
// detach the line from the rod.
await still({
  label: 'angler',
  from: path.join(GIFS, 'Big Bass Bonanza 1000_Character.gif'),
  to: 'angler.webp',
  page: 30,
  width: 380,
  quality: 86,
  trim: true,
});

// ---- Fish -----------------------------------------------------------------
// Two sprites, and only two. The game has exactly one quarry — the gold fish,
// three of them — and one common fish that fills the water around it. Every
// other species was dropped when the objective became "catch the 3 gold
// fish": a crowd of five different shapes made the player re-read which one
// they were hunting instead of knowing it at a glance.
//
// Both are stills. The fish are already in motion (the game loop drifts them
// across the water), so per-sprite frame animation buys almost nothing at this
// size, and the animated Pragmatic bass alone cost 464KB.
//
// Both are also generated. The pack's own bass carries a very thick, blobby
// white sticker outline sized for a slot reel; shrunk to ~80px in the water
// that halo swallows the fish and it reads as a white blob. The generated set
// was style-matched to that bass from a reference frame of it, so the scene
// still reads as Big Bass Bonanza art.
//
// bass / perch / carp / pike / catfish and the bobber are no longer built.
// Their sources are still in assets/generated/ and the art pack, so any of
// them comes back by re-adding one line here. Keeping assets/build/ equal to
// what the page actually loads is the point.
for (const [label, file, to] of [
  ['fish gold', 'fish-gold.png', 'fish-gold.webp'],
  ['fish roach', 'fish-roach.png', 'fish-roach.webp'],
]) {
  await still({ label, from: path.join(GEN, file), to, width: 260, quality: 86, trim: true });
}

const files = (await readdir(OUT)).sort();
const sizes = await Promise.all(files.map((f) => stat(out(f)).then((s) => s.size)));
console.log(`\n${files.length} files, ${kb(sizes.reduce((a, b) => a + b, 0))} total`);
console.log(files.map((f, i) => `  ${f.padEnd(22)} ${kb(sizes[i])}`).join('\n') + '\n');
