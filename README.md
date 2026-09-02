# TopBet × Big Bass Bonanza — Landing Page

A gamified acquisition LP: a Big Bass Bonanza fishing mini-game, built on the
loop from **Tiny Fishing** — set the cast with a spinner, sink, then reel back
up sweeping fish onto the line. Three casts, then registration for the bonus.

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

1. A thin top bar: brand, and `200% SPORT BONUS`. A visitor arriving from a "200%"
   ad meets that number in the first frame; the full amount sits in the line
   directly above the cast button.
2. The stage: sky, the Big Bass angler on a jetty at the waterline, and depth all
   the way down, with fish drifting through it.
3. HUD, borrowed from the reference: score top-left, `Cast 1 / 3` top-right, and a
   depth ruler in metres down the right edge.
4. `CAST THE LINE`.

**One cast is five beats:**

| Beat | |
|---|---|
| **aim** | A power marker sweeps a gradient bar. Tap again to lock it. |
| **fly** | The hook arcs out over the water and splashes in. |
| **sink** | It drops to the depth that power bought. **Nothing is caught on the way down** — the reference's rule, and the hook is visibly dimmed while it falls so the rule is legible rather than surprising. |
| **reel** | The long playable beat: the hook rises while the player steers — drag on touch, mouse on desktop, `←`/`→` on a keyboard — and every fish the barb touches rides the line up with it, until the line is full. |
| **payout** | At the surface each fish is sold and its value flies to the score. |

Casting power sets **both** how far out the hook lands and how deep it may sink, and
that is the whole decision: the fish worth most only live deep, and a deep cast also
spends longer reeling back up through them. It is what replaces the reference's
upgrade shop, which an acquisition LP has no room for — a visitor who has to earn and
spend currency before the game gets good never reaches the form. Line capacity grows
per cast instead (`3 / 4 / 5`), so the third cast is the big one.

The hook's position lives in exactly one place — the `--hook-x` / `--hook-y` custom
properties on `.stage` — and the line, hook sprite, float, ripple and splash all read
from there. The game loop writes those two numbers every frame and the whole rig
follows. **Never move any of those elements directly.**

**After the third cast** the screen cross-fades to the reveal: the fish actually
caught, the offer, and the registration form.

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
- **The catch has weight**: a flash on the fish as it takes the hook, a full line
  hauling in nearly three times faster, an expanding white ring at the surface (a
  bordered ring, not a filled disc — a box-shadow spread over dark water just reads as
  a grey blob), droplets, a score pop and a short screen shake.

### The stage is a portrait box, on purpose

`.stage` is width-capped at 560px and centred at every viewport. That is not
cosmetic. The previous build let the play area stretch to the window's full width,
which on a desktop gave the hook ~1300px of sideways travel against ~370px of depth —
a slider, not a fishing rod — and needed a `STEER.REACH` constant to paper over it.
A portrait box makes reach *be* the width, and that constant is gone.

For the same reason cast speeds are expressed in **water columns per second**, not
pixels per second. In pixels the same numbers made two different games: a 725px
desktop column took ~9s to reel and a 330px phone column ~3.8s, so the phone player
got a third of the sweeping time and a far easier catch. The barb's reach scales with
the sprites for the same reason.

**Screen 2 — registration.** Built 1:1 from Figma node `3:2176`: Phone/Email tabs,
country selector, SMS code step, bonus dropdown with radio options, error and success
field states, and the "Registration Successful" card.

### The offer is fixed — this matters

`CONFIG.OFFER` is **one campaign shown to every visitor**: `200%`, up to
`1 000 000 UZS`, `+150 FS`. It matches the Figma promo header and the `Sport Bonus`
option inside the form's dropdown.

The mini-game is **engagement**, not a prize draw. Fish carry a `value`, but it is a
**score** shown as points beside a coin — never a currency, never a bonus amount. An
earlier revision had each fish award a different sum; it was removed because it
contradicted the fixed header above it, contradicted the dropdown's own amounts below
it, and could not be honoured — the redirect carries no tier, so a bigger promise
simply evaporated on click.

**Do not reintroduce per-catch amounts** without also removing the dropdown and
passing the result through to the operator.

### The outcome is skill, and it is still bounded

There is no catch rate. Whether a fish is landed is decided by collision: the hook's
barb against a shrunken slice of the sprite's box (`STEER.PAD_W/PAD_H` — a fish is an
ellipse inside a rectangle, and full-box hit testing lands catches on visibly empty
water, which reads as a bug rather than as generosity).

Three fixed casts already guarantee the visitor reaches the form, so unlike the old
build nothing here is load-bearing for the funnel. What `CONFIG.ASSIST` prevents is
the flat note of watching an empty hook come up:

- `MAGNET` — once a cast is more than `FROM` of the way back up with nothing on the
  line, the barb's reach widens.
- `AIM_FROM` — past that point it also drifts toward the nearest fish above it.

Assist only takes the wheel while the player has their hands off. Dragging — or
pressing an arrow key — stands it down for the rest of the cast; yanking the hook out
of someone's hand feels worse than letting them miss.

### Two invariants, both learned the hard way

**The game loop owns every position it collides with.** The school drifts because the
loop moves it, not because a CSS keyframe does. The previous build animated the school
with `swim` keyframes, and CSS animations outrank inline styles in the cascade — so
`prefers-reduced-motion`, which kills all animation, parked every fish in one stack at
`x: 0`: nothing to steer into, the game unwinnable, the visitor stranded before the
form. Owning the positions in the loop removes the whole class of bug instead of
special-casing it, and reduce-motion now only slows the drift. **CSS animation is for
decoration only** — clouds, bubbles, shafts, kelp, splashes. Check `.fish` computes
`animation-name: none` before shipping any change here.

**A frozen `requestAnimationFrame` must never freeze the funnel.** rAF does not only
stop for hidden tabs: Chrome also suspends it for a window fully occluded by another
window, and that window still reports `visibilityState: 'visible'` and
`hasFocus(): true` — observed on this build, where the loop simply stopped mid-reel
with the hook underwater and the cast button disabled for good. Timers keep running in
all of those states, so a watchdog interval closes the cast out by paying whatever is
on the line after two frameless seconds. `payout()` is idempotent per cast so the
watchdog and the loop cannot both fire it. Hidden tabs are deliberately left alone —
the player is not watching and rAF resumes on return — and returning to the tab resets
the watchdog's clock so it cannot kill a cast that was about to carry on.

### Testing a game with no frames

`window.__lp` exposes `state()`, `setAim()`, `lockAt()`, `surface()`, `school()` and
`pump(frames, dt)`. `pump` steps the loop by hand, which is the only way to assert on
the game's timing in any environment where rAF is throttled — that is most automated
ones, and it was this build's own.

---

## What is real vs. mocked

| | State |
|---|---|
| Visual design, tokens, layout, responsive | **Real** — screen 2 is 1:1 with Figma `3:2176`; verified with no scroll and the CTA above the fold at 321×655, 391×839 and 2552×1227 |
| Mini-game: spinner, steering, collision, multi-catch, payout, assist | **Real** |
| Field validation, error/success states, tabs, bonus dropdown | **Real** — client-side |
| Asset pipeline | **Real** — 206KB for everything a desktop visitor loads, of which 147KB is the game screen (angler, float, seven fish); the rest is screen 2's backdrop |
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
| `bobber.webp` | `Symbol_4.png` (pack) | Float, sits at `--entry-x` where the line pierces the water. |
| `fish-{bass,perch,carp,gold,pike,roach,catfish}.webp` | `assets/generated/` | **Generated** — see below. |
| `bg-water.webp` + `@800` | `Background_22.jpg` (pack) | **Screen 2 only.** The backdrop behind the reveal and the form; the game paints its own water in CSS. Not preloaded — nobody reaches screen 2 in under a minute. |

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
detaches from the rod. `rod.webp` and `plank.webp` are gone; the progress plank went
with the three-slot tracker.

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

Which species can appear at a given depth is `band` in `CONFIG.FISH`, and that is the
game's risk/reward curve, not decoration: roach and perch live near the surface and
are worth 5 and 10, the catfish only below 72% and is worth 150. `assets/generated/
plank.png` is now an unused source — the progress plank it fed no longer exists.

---

## Still open

- **Feel.** The constants in `CONFIG.CAST`, `CONFIG.STEER` and `CONFIG.ASSIST` were
  set by measuring the loop, not by playing it: the browser available here never ran
  `requestAnimationFrame` at all (see the watchdog above), so every timing above was
  verified through `__lp.pump()` rather than at 60fps by hand. Spinner speed, reel
  speed, hit radius and fish density are the numbers most likely to want nudging once
  someone actually plays it.
- **`CLAUDE-big-bass-bonanza.md` is stale.** It describes the original design — swipe
  to cast, weighted RNG, four bonus tiers, Romanian copy — none of which is what this
  page does any more. Left untouched deliberately; it is not this repo's document to
  rewrite.

`pike`, `roach` and `catfish` were added when the mini-game became a steering game.
Eleven depth lanes drawn from four species put the same sprite on screen twice at once,
which reads as a rendering fault rather than as a shoal. All seven are drawn facing
**left**, which is what `face: 1` in `CONFIG.FISH` means; a future right-facing sprite
drops in with `face: -1` and needs no new keyframes.

Unused from the pack: `Character_*` (the fisherman — the brief called for the rod
only), `Fish_*.gif` and `Symbol_7/11/13/17` (framed tiles), and the heavy
`Character.gif` / `Float.gif`.
