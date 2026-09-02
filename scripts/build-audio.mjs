/**
 * One-shot audio optimizer for the TopBet x Big Bass Bonanza LP.
 *
 * Source is assets/audio-src/ — sound effects generated with ElevenLabs, which
 * hands back 44.1kHz stereo 128kbps MP3 padded out to a whole number of
 * seconds. Eight of those is ~185KB, which is more than the entire rest of the
 * page's assets put together and not something a landing page can spend.
 *
 * Outputs land in assets/build/audio/, which is what index.html loads and which
 * is committed, so serving the LP needs no build step. Same contract as
 * build-assets.mjs, and the same reason: the page loads what is committed, and
 * the tool that made it is a developer convenience rather than a dependency.
 *
 * Run: npm install && npm run audio
 */
import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets', 'audio-src');
const OUT = path.join(ROOT, 'assets', 'build', 'audio');

/**
 * Output format. Mono, because nothing in the game is panned and stereo is a
 * flat 2x for information no one can hear. 22.05kHz, because these are short
 * effects and a 11kHz ceiling costs a little air on the bells and nothing at
 * all on the splashes. 96kbps because below it the reel click starts to smear.
 */
const RATE = 22050;

/**
 * VBR rather than a fixed bitrate. These eight clips are wildly different
 * material — a 45ms wooden click, a 1.4s splash, a 1.7s brass fanfare — and a
 * single CBR figure has to be set for the hardest of them and then wasted on
 * the rest. At CBR 96k the set came to 87KB, over budget, with most of it spent
 * on splash tails that did not need it.
 *
 * -q:a 6 lands around 60kbps at this sample rate. The reel click is the one
 * place low bitrate would show as pre-echo on the transient, and it is 45ms
 * long, so it gets its own setting rather than dragging the other seven up.
 */
const QUALITY = '6';
const REEL_QUALITY = '2';

/**
 * Every clip is normalised to the same peak, and the mix lives entirely in
 * CONFIG.SOUND.GAIN in index.html. Splitting it — some level baked into the
 * file, some applied at playback — is how "the catch is too loud" becomes a
 * question of which of two places to edit.
 */
const PEAK_DB = -1.0;

/**
 * `dur` is a ceiling, not a length: the trailing silence is trimmed off
 * automatically, so a clip that ends early simply ends early. The number only
 * matters where the source keeps going past the part we want.
 *
 * `reel` is the one clip cut rather than trimmed. Asking the model for a single
 * isolated click returned near-silence twice — a one-second file with a -41dB
 * blip in it. Asking for a fast click train returned a clean one, so this takes
 * the first click out of it: content starts at 0 and the gap after it lands at
 * ~27ms, which is what the 45ms window is measured from.
 */
const SPEC = [
  { name: 'ui', dur: 0.30, fadeIn: 0.001 },
  { name: 'cast', dur: 0.60 },
  { name: 'splash', dur: 1.40 },
  /* A 4ms fade, not the default 20ms: the click is ~20ms long, so a 20ms fade
     is the whole sound and the normalised peak never survives to playback. */
  { name: 'reel', dur: 0.045, fadeIn: 0.001, fadeOut: 0.004, quality: REEL_QUALITY },
  { name: 'catch', dur: 0.80 },
  { name: 'all3', dur: 1.50 },
  { name: 'fail', dur: 0.90 },
  { name: 'win', dur: 1.70 },
];

const src = (file) => path.join(SRC, file);
const out = (file) => path.join(OUT, file);

/** Skip work when the output already exists and is newer than its source. */
async function isFresh(srcPath, outPath) {
  if (!existsSync(outPath)) return false;
  const [s, o] = await Promise.all([stat(srcPath), stat(outPath)]);
  return o.mtimeMs >= s.mtimeMs;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)}KB`;

/** ffmpeg writes everything worth reading to stderr, including on success. */
async function ffmpeg(args) {
  try {
    const { stderr } = await run(ffmpegPath, ['-hide_banner', '-y', ...args], {
      maxBuffer: 1 << 24,
    });
    return stderr;
  } catch (err) {
    if (err.stderr) throw new Error(err.stderr.split('\n').slice(-6).join('\n'));
    throw err;
  }
}

/**
 * Trim, then cap. Both ends are cut at -45dB peak: the generator pads its
 * output to a whole second, and shipping that padding would mean paying bytes
 * for silence and — worse — firing a cue whose first audible sample is 200ms
 * after the frame that asked for it.
 *
 * The trailing cut keeps 20ms of the tail so a decaying bell is not clipped
 * flat at the point it drops under the threshold.
 */
function chain({ dur, fadeIn = 0.003 }) {
  return [
    `atrim=duration=${dur}`,
    'asetpts=N/SR/TB',
    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0:detection=peak',
    'areverse',
    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02:detection=peak',
    'areverse',
    `afade=t=in:st=0:d=${fadeIn}`,
  ];
}

/**
 * Peak level and duration of a filter chain's output, without encoding it.
 *
 * ffmpeg reports progress as a running `time=`, so the LAST one is the length —
 * matching the first gives 0.00 and a fade-out scheduled at zero seconds, which
 * silences the clip it was supposed to smooth. That bug shipped once already.
 */
async function measure(from, filters) {
  const log = await ffmpeg([
    '-i', from,
    '-af', [...filters, 'volumedetect'].join(','),
    '-f', 'null', '-',
  ]);
  const peak = Number(/max_volume: (-?[\d.]+) dB/.exec(log)?.[1]);
  const times = [...log.matchAll(/time=(\d+):(\d+):([\d.]+)/g)];
  const last = times[times.length - 1];
  const secs = last ? Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]) : 0;
  if (!Number.isFinite(peak)) throw new Error(`no level detected in ${from}`);
  if (!(secs > 0)) throw new Error(`no duration detected in ${from}`);
  return { peak, secs };
}

async function build(spec) {
  const from = src(`${spec.name}.mp3`);
  if (!existsSync(from)) throw new Error(`missing source: ${from}`);
  const o = out(`${spec.name}.mp3`);
  if (await isFresh(from, o)) {
    console.log(`  ${spec.name.padEnd(8)} up to date`);
    return;
  }

  /* Two passes: the first only to learn how far under the target this clip
     peaks, the second to encode it with that difference made up. ffmpeg has no
     single-pass peak normaliser, and loudnorm is the wrong tool — it targets
     perceived loudness over a window, which for a 40ms click means pushing a
     transient into a limiter to hit an LUFS figure it cannot meaningfully
     have. */
  const filters = chain(spec);
  const { peak, secs } = await measure(from, filters);

  const gain = PEAK_DB - peak;
  const fadeOut = spec.fadeOut ?? 0.02;
  const outFilters = [
    ...filters,
    `volume=${gain.toFixed(2)}dB`,
    `afade=t=out:st=${Math.max(0, secs - fadeOut).toFixed(3)}:d=${fadeOut}`,
  ];

  await ffmpeg([
    '-i', from,
    '-af', outFilters.join(','),
    '-ac', '1', '-ar', String(RATE), '-q:a', spec.quality ?? QUALITY,
    '-map_metadata', '-1',
    o,
  ]);

  const [s, d] = await Promise.all([stat(from), stat(o)]);
  const pct = ((1 - d.size / s.size) * 100).toFixed(0);
  console.log(
    `  ${spec.name.padEnd(8)} ${kb(s.size).padStart(8)} -> ${kb(d.size).padStart(7)} (-${pct}%)  ` +
      `${secs.toFixed(2)}s  ${gain >= 0 ? '+' : ''}${gain.toFixed(1)}dB`,
  );
}

await mkdir(OUT, { recursive: true });
console.log('\nBuilding audio -> assets/build/audio/\n');

for (const spec of SPEC) await build(spec);

const files = (await readdir(OUT)).sort();
const sizes = await Promise.all(files.map((f) => stat(out(f)).then((s) => s.size)));
const total = sizes.reduce((a, b) => a + b, 0);
console.log(`\n${files.length} files, ${kb(total)} total`);
console.log(files.map((f, i) => `  ${f.padEnd(14)} ${kb(sizes[i]).padStart(8)}`).join('\n'));

/* The budget is not decoration. This is a landing page whose entire image set
   is ~154KB; audio quietly growing past that is exactly how a page gets slow
   one commit at a time. Fail the build rather than let it through unnoticed. */
const BUDGET = 80 * 1024;
const PER_FILE = 16 * 1024;

const fat = files.filter((_, i) => sizes[i] > PER_FILE);
if (total > BUDGET || fat.length) {
  if (total > BUDGET) console.error(`\nOVER BUDGET: ${kb(total)} > ${kb(BUDGET)}.`);
  for (const f of fat) console.error(`OVER PER-FILE: ${f} > ${kb(PER_FILE)}.`);
  console.error('Shorten a clip. Do not raise the bitrate.\n');
  process.exit(1);
}
console.log(`\nBudget ${kb(total)} / ${kb(BUDGET)} — ok\n`);
