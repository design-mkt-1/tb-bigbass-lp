# TopBet × Big Bass Bonanza — Landing Page

A gamified acquisition LP: a Big Bass Bonanza fishing mini-game with the dive
loop from **Tiny Fishing**. One button, one dive, one objective — land the
three gold fish. Get them and the registration form opens; surface without them
and it is Start Again.

**Status: DEMO. Not a working funnel.** A banner at the top of the page says so.
See [What is real vs. mocked](#what-is-real-vs-mocked) before showing this to anyone.

---

## Run it

```bash
npm install          # sharp, used only by the asset script
npm run assets       # regenerate assets/build/ (already committed)
npm run serve        # http://localhost:8080
```

`assets/build/` is committed, so serving `index.html` from any static host works
with no build step. `npm run assets` is only needed if source art changes.

---

## The flow

**Screen 1 — the water column.** Everything fits one screen; the visitor never
scrolls to find the button.

1. A thin top bar: the brand, and nothing else. The offer used to sit here as a
   `200% SPORT BONUS` badge and was competing with the quest slots directly below
   it for the same glance, so the number moved to the line above the button —
   which is what a visitor actually reads before their first tap.
2. Three slots at the top of the stage, all showing the same gold fish as a light
   silhouette. That is the whole objective, stated before the player has seen the
   water.
3. The stage: sky, the Big Bass angler on a jetty at the waterline, depth all the
   way down, and a depth ruler in metres down the right edge.
4. A round `START` button.

**One dive is four beats:**

| Beat | |
|---|---|
| **fly** | The hook arcs out from the rod tip and splashes in. |
| **sink** | It drops to the bottom while the player steers — drag on touch, mouse on desktop, `←`/`→` on a keyboard. |
| **rise** | It comes back up, still steered. |
| **land** | At the surface: three fish on the line is a win, anything less is Start Again. |

**Catches count in both directions.** With a single dive there is no second
chance, and a rule about which half of it counts is one rule more than this game
needs. Landing a gold fish lights its slot, pops the screen, and once all three
are on the line the hook hauls in fast rather than making the player watch the
last stretch.

### One prize, one crowd

**Only the gold fish can be hooked, and there are exactly three of them.**
Everything else in the water is a **roach** — one species, nothing else — and the
hook passes straight through it. An earlier revision made three *different*
species special (bass, gold, catfish), and each of them looked like its own
prize: the player had to re-read the objective off the art instead of knowing it
at a glance. One prize shape and one crowd shape is what keeps the instruction to
a single line.

Three things carry that read, and all three are enforced rather than assumed:

- **Gold is always the biggest.** `CONFIG.GOLD_SIZE` sets the quarry; the roach
  rolls a size per fish and `seedFish` clamps it to `MAX_VS_GOLD` (0.75) of that
  number. The cap is code, not a comment, because "gold is the biggest" is the one
  rule the whole read rests on and it would silently stop being true the first
  time someone raised `SIZE_MAX`. Verified across 720 respawns: widest roach 87.8px
  against 117.3px of gold.
- **Gold never hides.** Full saturation, a gold rim glow, no depth haze however
  deep it sits, and its own layer above the school — a gold fish sliding behind a
  roach is the one occlusion the player cannot forgive.
- **Gold is always reachable.** One per depth band (shallow, middle, deep), so a
  single dive passes all three. They turn around at the edges rather than
  wrapping, and they start **on** the board: an earlier revision walked them in
  from off-screen, which quietly broke the game, because the deepest is also the
  slowest and needed ~17s to arrive against a dive lasting ~9s.

The roach still varies — many sizes, depths, speeds and directions — so the water
reads as a shoal rather than as a repeated sticker.

The hook's position lives in exactly one place — the `--hook-x` / `--hook-y` custom
properties on `.stage` — and the line, the hook sprite and the landing splash all
read from there. The game loop writes those two numbers every frame and the whole
rig follows. **Never move any of those elements directly.**

There is **no float and no entry ripple**. Both sat at `--entry-x` on the
waterline, drawing the eye to a spot where nothing happens and competing with the
hook, which is the only thing the player controls. `--entry-x` itself stays: the
landing splash still keys off it.

**On a win** the screen cross-fades to the reveal: the three fish, the offer, and
the registration form.

### What makes the scene feel alive

- **Painted water, not a photograph.** The depth gradient runs from a lit teal at the
  surface to near-black at the bottom. An earlier build laid the scene over a stock
  underwater photo, and it was a large part of why the page did not read like the
  reference: depth in this kind of game has to be legible at a glance, and a photo has
  its own lighting fighting the one the game needs.
- **Depth haze.** Each fish gets a `--murk` value from how deep it sits, driving
  opacity, blur and saturation together. That single variable is what turns a set of
  sprites into a sense of water depth.
- **Rolling waterline.** Two offset bands of wide, flat, low-contrast ellipses
  scrolling at different rates. Tighter or brighter and it reads as a string of beads
  instead of moving water.
- **Bubbles and kelp**, generated in JS so the counts stay tunable and the markup does
  not carry a wall of decorative empty elements. The kelp is near-black silhouette,
  not green stalks — at that depth almost no colour survives, and saturated green
  reads as plastic.
- **Drifting light shafts**, a dusk sky, and slow clouds. Dusk rather than the
  reference's midday blue: the Big Bass art is lit by a low warm sun, and a bright
  blue sky behind that character reads as two pictures.
- **The catch has weight**: a flash on the fish as it takes the hook, its slot
  lighting gold, a short screen shake, and at the surface an expanding white ring (a
  bordered ring, not a filled disc — a box-shadow spread over dark water just reads as
  a grey blob) plus droplets.
- **The gold fish pulse**, and that pulse animates **opacity only**. They are
  collision targets, and the loop owns every position it tests against — a keyframe
  touching `transform` here would reintroduce the exact bug described below.

### The stage is a portrait box, on purpose

`.stage` is width-capped at 560px and centred at every viewport. That is not
cosmetic. The previous build let the play area stretch to the window's full width,
which on a desktop gave the hook ~1300px of sideways travel against ~370px of depth —
a slider, not a fishing rod — and needed a `STEER.REACH` constant to paper over it.
A portrait box makes reach *be* the width, and that constant is gone.

For the same reason dive speeds are expressed in **water columns per second**, not
pixels per second. In pixels the same numbers made two different games: a 725px
desktop column took ~9s to reel and a 330px phone column ~3.8s, so the phone player
got a third of the steering time and a far easier catch. The barb's reach scales with
the sprites for the same reason, and so do the gold fish's turnaround points — a gold
fish is a large share of a phone's stage width, so a fixed edge margin left half of it
hanging outside the frame.

### The page never scrolls — as a contract, not a coincidence

`html, body` are locked to `height: 100%; overflow: hidden`, and `.app` / `.screen`
carry a fixed height rather than a `min-height` floor they could grow past. Anything
too tall for the viewport scrolls **inside its own container** instead:
`.reveal__inner` is that container on screen 2.

`svh` rather than `dvh` on purpose — with no page scroll a mobile URL bar never
collapses, so the two are equal here, and `dvh` would only reintroduce a resize
every time the keyboard opens over the form.

The bonus dropdown is now an **overlay** (`.options` is absolutely positioned)
rather than a block in the flow. Measured at 321×555 before the change, screen 2
overflowed the page by **+145px** by default, **+258px** with the SMS code step, and
**+406px** with the dropdown open — that dropdown alone was the single worst
offender, and in flow it also shoved the legal text and Create Account down the
screen mid-interaction. After: **0px** of page overflow in all three states, with
the card absorbing 61px / 174px / 174px internally.

**Screen 2 — registration.** Built 1:1 from Figma node `3:2176`: Phone/Email tabs,
country selector, SMS code step, bonus dropdown with radio options, error and success
field states, and the "Registration Successful" card.

### The offer is fixed — this matters

`CONFIG.OFFER` is **one campaign shown to every visitor**: `200%`, up to
`1 000 000 UZS`, `+150 FS`. It matches the Figma promo header and the `Sport Bonus`
option inside the form's dropdown.

The mini-game is **engagement**, not a prize draw. The three gold fish are an
objective, not a prize table: catching them unlocks the same fixed offer that catching
them in a different order would. An earlier revision had each fish award a different
sum; it was removed because it contradicted the fixed header above it, contradicted the
dropdown's own amounts below it, and could not be honoured — the redirect carries no
tier, so a bigger promise simply evaporated on click.

**Do not reintroduce per-catch amounts** without also removing the dropdown and
passing the result through to the operator.

### Failing is designed. Being stuck is not.

There is no catch rate. Whether a fish is landed is decided by collision: the hook's
barb against a shrunken slice of the sprite's box (`STEER.PAD_W/PAD_H` — a fish is an
ellipse inside a rectangle, and full-box hit testing lands catches on visibly empty
water, which reads as a bug rather than as generosity).

Surfacing without all three is a real loss and Start Again is a real restart: the
slots clear, the fish go back in the water, and the run begins from zero. But this is
still an acquisition page, and a visitor who cannot land three fish never reaches the
registration form at all — which is the one failure that costs real money. So
`CONFIG.ASSIST` makes every retry quietly more forgiving:

- `MAGNET_PER_TRY` — the barb's reach grows with each attempt, capped at `MAGNET_MAX`.
- `AIM_FROM_TRY` — from that attempt the hook also drifts toward the nearest uncaught
  fish.

Measured: a player who steers wins on attempt 1; a player who never touches the
controls at all lands 1, then 2, then 3, and reaches the form on attempt 3.

The drift only takes the wheel while the player's hands are off. Dragging — or
pressing an arrow key — stands it down for the rest of the dive; pulling the hook out
of someone's hand feels worse than letting them miss.

### Two invariants, both learned the hard way

**The game loop owns every position it collides with.** The school drifts because the
loop moves it, not because a CSS keyframe does. The previous build animated the school
with `swim` keyframes, and CSS animations outrank inline styles in the cascade — so
`prefers-reduced-motion`, which kills all animation, parked every fish in one stack at
`x: 0`: nothing to steer into, the game unwinnable, the visitor stranded before the
form. Owning the positions in the loop removes the whole class of bug instead of
special-casing it, and reduce-motion now only slows the drift. **CSS animation is for
decoration only** — clouds, bubbles, shafts, kelp, splashes, and the gold fish's
opacity pulse. Before shipping any change here, check that `#school .fish` computes
`animation-name: none` and that nothing collidable animates `transform`.

**A frozen `requestAnimationFrame` must never freeze the funnel.** rAF does not only
stop for hidden tabs: Chrome also suspends it for a window fully occluded by another
window, and that window still reports `visibilityState: 'visible'` and
`hasFocus(): true` — observed on this build, where the loop simply stopped mid-dive
with the hook underwater and the button disabled for good. Timers keep running in all
of those states, so a watchdog interval ends the dive after two frameless seconds.
`land()` is idempotent so the watchdog and the loop cannot both fire it. Hidden tabs
are deliberately left alone — the player is not watching and rAF resumes on return —
and returning to the tab resets the watchdog's clock so it cannot kill a dive that was
about to carry on.

### Testing a game with no frames

`window.__lp` exposes `state()`, `setAim()`, `start()`, `quarry()`, `school()` and
`pump(frames, dt)`. `pump` steps the loop by hand, which is the only way to assert on
the game's timing in any environment where rAF is throttled — that is most automated
ones, and it was this build's own.

---

## What is real vs. mocked

| | State |
|---|---|
| Visual design, tokens, layout, responsive | **Real** — screen 2 is 1:1 with Figma `3:2176`; verified with no scroll and the CTA above the fold at 321×655, 391×799 and 2552×1227 |
| Mini-game: steering, collision, the three-fish objective, Start Again, assist | **Real** |
| Field validation, error/success states, tabs, bonus dropdown | **Real** — client-side |
| Asset pipeline | **Real** — `assets/build/` is 150KB total, of which the game screen loads 69KB (angler, gold, roach); the rest is screen 2's backdrop |
| **Account creation** | **Mocked** — no backend; nothing is created |
| **SMS code** | **Mocked** — no SMS is sent; any 6 digits pass |
| **"Registration Successful!" card** | **Mocked** — a Figma design state, rendered statically |
| **Password in the recap** | **Mocked** — decorative dots; no password is ever collected |

`CONFIG.DEMO_MODE = true` renders the warning banner. Leave it on until the form is
wired to a real API.

---

## Handover to IT

This repo is the **mini-app and its look and feel**. The following are deliberate
placeholders for the IT team, not oversights:

| Placeholder | Where |
|---|---|
| `REGISTER_URL`, `LOGIN_URL`, `TERMS_URL`, `PRIVACY_URL` — all `example.com` | `CONFIG`, top of the `<script>` |
| Account creation, SMS send/verify — no backend | `#reg-form` submit handler |
| Offer figures, read off the Figma mockup | `CONFIG.OFFER` |
| Copy language: English / UZS / `+998` | `CONFIG.COPY`, `CURRENCY`, `DIAL_CODE` |
| Country selector renders `+998` but opens no picker | `#country-btn` |
| Age disclaimer says `18+` on the game screen and `21+` in the form | `CONFIG.COPY.disclaimer` / the form's legal line |

Everything tunable is in the `CONFIG` object at the top of the `<script>`, and every
user-facing string is in `CONFIG.COPY` — swap that one object to change language.
Set `CONFIG.DEMO_MODE = false` to drop the warning banner once the form is real.

---

## Assets

`scripts/build-assets.mjs` reads three sources and writes web-sized WebP into
`assets/build/`.

| Output | Source | Note |
|---|---|---|
| `angler.webp` | `Character.gif` (pack), frame 30 | The Big Bass fisherman, rod included — see below. |
| `fish-gold.webp` | `assets/generated/` | The quarry. **Generated** — see below. |
| `fish-roach.webp` | `assets/generated/` | The crowd. **Generated** — see below. |
| `bg-water.webp` + `@800` | `Background_22.jpg` (pack) | **Screen 2 only.** The backdrop behind the reveal and the form; the game paints its own water in CSS. Not preloaded — nobody reaches screen 2 in under a minute. |

Five files, 150KB, and `assets/build/` is deliberately kept equal to what the page
actually loads: nothing is built that nothing requests.

### The angler carries his own rod

The scene needs a rod pointing over the water. The pack's isolated rod symbol
(`Symbol_15.png`, previously `rod.webp`) came with its own line and hook drawn down
one edge, which had to be clipped away in CSS or it hung in the water as a phantom
second hook.

One frame of `Character.gif` solves it outright: the fisherman, full body, background
already clear, holding a rod whose rigging is drawn as rigging. So the angler stands
on the **right** and casts left across the water — the sprite used exactly as drawn,
rather than mirrored into a left-handed twin. The pack has no boat or dock, so the
jetty under him is CSS: a flat silhouette under a rendered 3D character reads better
than a second rendered object that does not match his lighting.

**Frame 30, not frame 0.** The loop flexes the rod, and 30 is the frame where the tip
sits at the very top-left of the trimmed box — which is where `measure()` anchors the
line (`tipX = anglerLeft + 3% of width`). Re-export a different frame and the line
detaches from the rod. `rod.webp` and `plank.webp` are gone.

### Why the fish are generated

The Pragmatic pack contains exactly **one** loose fish
(`Isolated Character Animated_2.gif`); every other fish in it is a framed slot tile
with a white border and an orange background, unusable as a swimming sprite.

That one bass also carries a very thick, blobby white sticker outline sized for a
slot reel. Shrunk to ~80px in the water, the halo swallows the fish and it reads as a
white blob beside anything else.

So every fish was generated with Higgsfield, **style-matched to that bass**: a frame
of it was uploaded as an image reference and each species generated in its exact
rendering, then background-removed. The scene still reads as Big Bass Bonanza art, and
the sprites are consistent with each other. Source PNGs are committed in
`assets/generated/` so the pipeline is reproducible.

Seven were generated; **two are built.** `CONFIG.SPECIALS` holds the quarry — three
entries, all the gold fish, one per depth band — and `CONFIG.FISH` holds the single
scenery species, the roach. **The two must never name the same sprite**: the moment
the crowd and the prize share a shape, the quest slots stop telling the player what
to chase, which is the whole reason the earlier three-species version was replaced.

Bass, perch, carp, pike and catfish are no longer built, and neither is the bobber.
Their sources are still in `assets/generated/` and the art pack, so any of them
returns by re-adding one line to `scripts/build-assets.mjs`.
`assets/generated/plank.png` is an unused source — the progress plank it fed no
longer exists.

Both sprites are drawn facing **left**, which is what `face: 1` means; a future
right-facing sprite drops in with `face: -1`.

Unused from the pack: the `Character_*` stills, `Fish_*.gif` and `Symbol_7/11/13/17`
(framed slot tiles), `Symbol_15.png` (the isolated rod), `Symbol_4.png` (the float),
and the heavy `Float.gif`.

---

## Still open

- **Feel.** The constants in `CONFIG.DIVE`, `CONFIG.STEER`, `CONFIG.ASSIST` and the
  `speed`/`bob` values in `CONFIG.SPECIALS` were set by measuring the loop, not by
  playing it: the browser available here never ran `requestAnimationFrame` at all (see
  the watchdog above), so every timing was verified through `__lp.pump()` rather than
  at 60fps by hand. Dive speed, hit radius and how fast the three gold fish patrol are
  the numbers most likely to want nudging once someone actually plays it.
- **Two copy contradictions inherited from Figma**, both visible on screen 2 at the
  same time and both campaign decisions rather than code ones: the promo header says
  `200% Sport Bonus` while the dropdown below it says `Sport Bonus (100% Freebet)`,
  and the game screen's disclaimer says `18+` while the form's legal line says
  `Must be 21+`.
- **`CLAUDE-big-bass-bonanza.md` is stale.** It describes the original design — swipe
  to cast, weighted RNG, four bonus tiers, Romanian copy — none of which is what this
  page does any more. Left untouched deliberately; it is not this repo's document to
  rewrite.
