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
3. The lake: an underwater scene with fish drifting through depth lanes. No
   fisherman — just the rod, entering from off-screen with its tip over the water.
4. `CAST THE LINE`.

**One cast** runs a fixed timeline: rod dips and the line drops → ~1.5s of suspense
while a fish circles the hook → the result. On a catch the fish is yanked up and a
plank slot fills with a gold flash; on a miss it darts away and a toast says so.
Either way the button re-enables and the visitor casts again.

**At 3/3** the screen cross-fades to the reveal: the three fish actually caught, the
offer, and the registration form.

### What makes the lake feel alive

All of it is CSS on `transform`/`opacity`/`filter`, so it stays on the compositor and
costs no layout on mobile:

- **Depth.** Each lane gets a `--murk` value derived from how deep it sits, driving
  opacity, blur and saturation together. Surface fish are crisp at ~0.95 opacity;
  the deepest lane sits at ~0.54, blurred and desaturated. That single variable is
  what turns five sprite lanes into a sense of water depth.
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

### The catch odds are bounded, not raw

`CONFIG.CATCH` is a 60% base rate with two guards:

- `FIRST_ALWAYS_HITS` — the first cast always lands, so nobody meets a miss before
  they understand the loop.
- `PITY_AFTER: 2` — a forced catch after two misses in a row.

Raw 60% has a long tail that would strand a slice of visitors on the game instead of
the form. With the guards, 20 000 simulated runs give a mean of 4.1 casts and a hard
worst case of **7** (~17s). Verified by rigging `CATCH.RATE = 0`: even when every
random roll fails, the guards still deliver 3/3 in exactly 7 casts. **The funnel can
never block.**

---

## What is real vs. mocked

| | State |
|---|---|
| Visual design, tokens, layout, responsive | **Real** — 1:1 with Figma `3:2176`, verified 375 → 2835px, no overflow |
| Mini-game: casting, fish, progress, odds and guards | **Real** |
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
| `rod.webp` | `Symbol_15.png` (pack) | Isolated rod, tip anchored over the hook. |
| `bobber.webp` | `Symbol_4.png` (pack) | Float at the waterline. |
| `fish-{bass,perch,carp,gold}.webp` | `assets/generated/` | **Generated** — see below. |
| `plank.webp` | `assets/generated/` | **Generated** — wooden progress banner. |

### Why the fish are generated

The Pragmatic pack contains exactly **one** loose fish
(`Isolated Character Animated_2.gif`); every other fish in it is a framed slot tile
with a white border and an orange background, unusable as a swimming sprite.

That one bass also carries a very thick, blobby white sticker outline sized for a
slot reel. Shrunk to ~80px in the lake, the halo swallows the fish and it reads as a
white blob beside anything else.

So all four fish were generated with Higgsfield, **style-matched to that bass**: a
frame of it was uploaded as an image reference and each species generated in its
exact rendering, then background-removed. The lake still reads as Big Bass Bonanza
art, and the four sprites are consistent with each other. Source PNGs are committed
in `assets/generated/` so the pipeline is reproducible.

Unused from the pack: `Character_*` (the fisherman — the brief called for the rod
only), `Fish_*.gif` and `Symbol_7/11/13/17` (framed tiles), and the heavy
`Character.gif` / `Float.gif`.
