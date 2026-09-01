# TopBet × Big Bass Bonanza — Landing Page

A gamified acquisition LP: a Big Bass Bonanza fishing mini-game where the visitor
lands 3 fish, then registers to claim the welcome bonus.

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

**Screen 1 — the lake.** Everything fits one screen; the visitor never scrolls to
find the button.

1. Brand, then the offer immediately: `200% SPORT BONUS · up to 1 000 000 UZS + 150 FS`.
   A visitor arriving from a "200%" ad sees that number in the first frame.
2. A wooden plank with 3 empty slots — the progress tracker.
3. The lake: an underwater scene with fish drifting through eleven depth lanes. No
   fisherman — just the rod, entering from off-screen with its tip over the water.
4. `CAST THE LINE`.

**One cast** is a skill check, not a coin flip:

1. The rod dips and the line drops (320ms).
2. **The hook sinks and the player steers it** — drag on touch, mouse move on
   desktop, `←`/`→` on a keyboard. The first fish it touches on the way down is
   landed and the descent ends there.
3. Reaching the bottom without touching a fish is a miss; the hook comes up empty.

On a catch the fish is lifted clear of the water and a plank slot fills with a gold
flash; on a miss a toast says so. Either way the button re-enables and the visitor
casts again.

The hook's position lives in exactly one place — the `--hook-x` / `--hook-y` custom
properties on `.lake` — and the rod, line, hook sprite, float, ripple and splash all
read from there. The game loop writes those two numbers every frame and the whole rig
follows. **Never move any of those elements directly.**

**At 3/3** the screen cross-fades to the reveal: the three fish actually caught, the
offer, and the registration form.

### What makes the lake feel alive

All of it is CSS on `transform`/`opacity`/`filter`, so it stays on the compositor and
costs no layout on mobile:

- **Depth.** Each lane gets a `--murk` value derived from how deep it sits, driving
  opacity, blur and saturation together. Surface fish are crisp at ~0.95 opacity;
  the deepest lane sits at ~0.54, blurred and desaturated. That single variable is
  what turns eleven sprite lanes into a sense of water depth. The lanes are level
  design now, not decoration: they have to span the descent band
  (`--surface` .. `STEER.MAX_DEPTH`) or stretches of the descent have nothing in them.
- **Rolling surface.** Two offset bands of wide, flat, low-contrast ellipses
  scrolling at different rates. Tighter or brighter and the waterline reads as a
  string of beads instead of moving water.
- **Bubbles and kelp**, generated in JS so the counts stay tunable and the markup
  does not carry a wall of decorative empty elements. The kelp is near-black
  silhouette, not green stalks — at that depth almost no colour survives, and
  saturated green reads as plastic.
- **Drifting light shafts** through the surface.
- **The catch has weight**: an expanding white ring (a bordered ring, not a filled
  disc — a box-shadow spread over dark water just reads as a grey blob), five
  droplets thrown off the surface, a gold slot flash on the plank, and a short
  screen shake.
- **Empty plank slots show a light fish silhouette**, so the plank reads as "three
  fish go here" rather than three anonymous holes.
- The lake **fades into the footer** instead of ending on a hard horizontal cut.

**Screen 2 — registration.** Built 1:1 from Figma node `3:2176`: Phone/Email tabs,
country selector, SMS code step, bonus dropdown with radio options, error and success
field states, and the "Registration Successful" card.

### The offer is fixed — this matters

`CONFIG.OFFER` is **one campaign shown to every visitor**: `200%`, up to
`1 000 000 UZS`, `+150 FS`. It matches the Figma promo header and the `Sport Bonus`
option inside the form's dropdown.

The mini-game is **engagement**, not a prize draw. Which fish you land changes the
sprite on the plank and nothing else. An earlier revision had each fish award a
different amount; it was removed because it contradicted the fixed header above it,
contradicted the dropdown's own amounts below it, and could not be honoured — the
redirect carries no tier, so a bigger promise simply evaporated on click.

**Do not reintroduce per-catch amounts** without also removing the dropdown and
passing the result through to the operator.

### The outcome is skill, and it is still bounded

There is no catch rate. Whether a cast lands is decided by collision: the hook's barb
against a shrunken slice of each fish sprite's box (`STEER.PAD_W/PAD_H` — a fish is an
ellipse inside a rectangle, and full-box hit testing lands catches on visibly empty
water, which reads as a bug rather than as generosity).

A skill check with no floor can strand a bad player on the game forever, which is the
exact failure the old odds guards existed to prevent. So `CONFIG.CATCH` keeps both,
re-expressed as **difficulty assist**:

- `FIRST_IS_GUIDED` — on cast 1 the hook auto-steers onto the nearest reachable fish,
  so nobody meets a miss before they understand the loop.
- `PITY_AFTER: 2` — after two misses in a row the hook auto-steers again, and
  `resolve()` pays out even if the interception still fails (the fish drifted out of
  reach, the tab was throttled). Worst case is still **3 misses per catch**.

Assist only takes the wheel while the player has their hands off. Dragging — or
pressing an arrow key — stands it down for the rest of the cast; yanking the hook out
of someone's hand feels worse than letting them miss.

### Two things that will silently break the game

**`prefers-reduced-motion`.** The school's horizontal position comes *entirely* from
the `swim`/`swimBack` keyframes; `.fish` declares no transform of its own. The global
reduce-motion block kills all animations, which parks every fish in one overlapping
stack at `x: 0` — nothing to steer into, the game unwinnable, the visitor stranded
before the form. The reduce-motion block therefore parks the school at a static
spread instead (`--rest-x`, written per lane by `buildSchool`). The fish stop moving;
the hook still moves, so it is still a game. Test with DevTools → Rendering →
*Emulate prefers-reduced-motion*.

**Backgrounded tabs.** `requestAnimationFrame` is suspended when the tab is hidden, so
a visitor who switches away mid-descent would return to a hook frozen halfway down,
`isCasting` stuck true and the CTA disabled for good. Timers still fire, so `castOnce`
arms a safety-net `setTimeout` that closes the cast out regardless; `resolve()` is
idempotent per cast, so whichever fires first wins and the other is a no-op.

### Steering reach is tied to depth, not width

`STEER.MIN_X/MAX_X` alone are a trap on desktop. On a 2552×430 lake they give the hook
~1300px of horizontal travel against ~370px of depth — a slider, not a fishing rod,
with the line stretched to a near-horizontal thread. `STEER.REACH` caps sideways
travel at 1.1× the lake's *height*, which keeps the rig at a believable angle at any
aspect ratio. On a phone the lake is roughly square, so it resolves back to the full
`MIN_X..MAX_X` band and nothing is lost.

---

## What is real vs. mocked

| | State |
|---|---|
| Visual design, tokens, layout, responsive | **Real** — 1:1 with Figma `3:2176`, verified 375 → 2835px, no overflow |
| Mini-game: steering, collision, progress, assist guards | **Real** |
| Field validation, error/success states, tabs, bonus dropdown | **Real** — client-side |
| Asset pipeline | **Real** — 199KB total for every asset the page loads |
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

`scripts/build-assets.mjs` reads two sources and writes web-sized WebP into
`assets/build/`.

| Output | Source | Note |
|---|---|---|
| `bg-water.webp` + `@800` | `Background_22.jpg` (pack) | The lake. Heavily desaturated toward brand graphite/red. |
| `rod.webp` | `Symbol_15.png` (pack) | Isolated rod, anchored at `--rod-x`. Its own drawn line and hook are clipped away in CSS — see below. |
| `bobber.webp` | `Symbol_4.png` (pack) | Float, sits at `--entry-x` where the line pierces the water. |
| `fish-{bass,perch,carp,gold,pike,roach,catfish}.webp` | `assets/generated/` | **Generated** — see below. |
| `plank.webp` | `assets/generated/` | **Generated** — wooden progress banner. |

### The rod sprite is clipped, on purpose

`rod.webp` is drawn with its own fishing line and hook hanging off the tip, down the
left edge. That was invisible while the rod was anchored to `--hook-x`: the sprite's
drawn hook and the real one sat in exactly the same place. Now that the rod stands
still at `--rod-x` and the player steers the hook away from it, the drawn one is left
behind as a phantom second hook in the water. `.rod`'s `clip-path` cuts that column
out. If you ever re-export the rod, re-check the polygon.

### Why the fish are generated

The Pragmatic pack contains exactly **one** loose fish
(`Isolated Character Animated_2.gif`); every other fish in it is a framed slot tile
with a white border and an orange background, unusable as a swimming sprite.

That one bass also carries a very thick, blobby white sticker outline sized for a
slot reel. Shrunk to ~80px in the lake, the halo swallows the fish and it reads as a
white blob beside anything else.

So every fish was generated with Higgsfield, **style-matched to that bass**: a frame
of it was uploaded as an image reference and each species generated in its exact
rendering, then background-removed. The lake still reads as Big Bass Bonanza art, and
the sprites are consistent with each other. Source PNGs are committed in
`assets/generated/` so the pipeline is reproducible.

`pike`, `roach` and `catfish` were added when the mini-game became a steering game.
Eleven depth lanes drawn from four species put the same sprite on screen twice at once,
which reads as a rendering fault rather than as a shoal. All seven are drawn facing
**left**, which is what `face: 1` in `CONFIG.FISH` means; a future right-facing sprite
drops in with `face: -1` and needs no new keyframes.

Unused from the pack: `Character_*` (the fisherman — the brief called for the rod
only), `Fish_*.gif` and `Symbol_7/11/13/17` (framed tiles), and the heavy
`Character.gif` / `Float.gif`.
