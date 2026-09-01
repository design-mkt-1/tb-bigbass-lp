# LP — Big Bass Bonanza: Aruncă undița și câștigă bonusul

## Overview
Landing page interactiv de tip casino, inspirat din jocul Big Bass Bonanza (Pragmatic Play).
Mechanic: userul aruncă undița (swipe sau tap+hold), peștele prins determină nivelul bonusului.
Winner framing mereu — orice pește = bonus, peștele mare = bonus mai mare.
Flow: 1 interacțiune (swipe/tap) → animație prindere pește → reveal → înregistrare.

---

## Stack
- HTML + CSS + Vanilla JS (un singur fișier `index.html`)
- Fără framework, fără bundler
- Mobile-first, responsive (375px → 1440px)
- Touch events pentru swipe (mobile) + click pentru desktop
- Animații: CSS keyframes + JS pentru fishing sequence

---

## File structure
```
/
├── index.html
├── assets/
│   ├── img/
│   │   ├── logo.svg
│   │   ├── bg-water.jpg          # background apă/lac (overhead sau lateral)
│   │   ├── fisherman.png         # personaj pescar (stânga sau centru)
│   │   ├── rod.png               # undiță (animată separat)
│   │   └── fish/
│   │       ├── small.png         # pește mic (bonus tier 1)
│   │       ├── medium.png        # pește mediu (bonus tier 2)
│   │       ├── large.png         # pește mare (bonus tier 3)
│   │       ├── bass.png          # big bass (bonus tier 4 — jackpot)
│   │       └── treasure.png      # cufăr (bonus special, rar)
│   └── sounds/
│       ├── splash.mp3            # sunet la aruncat undița
│       ├── reel.mp3              # sunet la tras undița
│       ├── catch.mp3             # sunet prindere pește
│       └── win.mp3
```

---

## Screens

### Screen 1 — Interacțiunea (Fishing)

**Layout:**
- Background: scenă de pescuit (apă, nori, lumină de zi)
- Logo brand sus centrat sau sus-stânga
- Headline: `"Aruncă undița și câștigă bonusul!"` — bold, alb cu shadow
- Sub: `"Swipe în sus pentru a arunca"` (mobile) / `"Apasă și ține pentru a arunca"` (desktop)

**Scena de pescuit:**
- Personaj pescar: stânga sau centru-jos
- Undiță: element SVG sau PNG animat, rotit din mâna pescarului
- Apă: zona centrală/inferioară a ecranului
- Bule/pești siluetă vizibile sub apă (hint că sunt pești acolo)
- Linie de undiță: SVG `<line>` sau CSS border, animată

**Instrucțiune vizuală:**
- Săgeată animată care sugerează swipe-ul în sus
- Label: `"Swipe ↑"` (mobile) sau `"Click & Hold"` (desktop)

**Comportament la interacțiune:**
1. User face swipe în sus (touchstart → touchend, calculat direcție) sau apasă butonul
2. Animație: undița se arcuiește, linia zboară spre apă
3. Splash mic la impactul cu apa (CSS)
4. Pauză suspans: 1.5–2s (linia tremură, bule sub apă)
5. Trag automat: linia se retrage
6. Reveal: peștele apare sărind din apă
7. Tranziție spre Screen 2

**Fish outcome logic:**
- La load: se alege random un tier (ponderat)
- Ponderare sugerată: small 40%, medium 30%, large 20%, bass 10%
- Toate duc la bonus — diferă doar suma
- Peștele ales determină și animația (pește mai mare = animație mai spectaculoasă)

---

### Screen 1b — Fishing Sequence (animații detaliate)

```
t=0ms      User swipe / tap buton
t=0–300ms  Undița se arcuiește (CSS rotate + transform-origin la mâna pescarului)
t=300ms    Linia se extinde spre apă (CSS height grow)
t=400ms    Splash la suprafața apei (CSS ripple)
t=400–1800ms  Suspans: linia tremură ușor (CSS shake, subtil)
t=1800ms   Linia începe să se retragă (CSS height shrink)
t=2000ms   Peștele sare din apă (translateY de jos în sus, rotate)
t=2000–2300ms  Pește în aer, celebrare scurtă
t=2300ms   Fade-out scenă → fade-in Screen 2
```

---

### Screen 2 — Bonus Reveal + Reg Form

**Tranziție:** fade cu overlay albastru-verzui

**Layout:**
- Background: același sau darker overlay
- Pește câștigat afișat mare (imagine + glow)
- Bonus tier badge: `"🐟 Mic"` / `"🐠 Mediu"` / `"🐡 Mare"` / `"🦈 Jackpot!"`
- Bonus headline: `"Ai prins un {tier}! Bonusul tău:"` — alb, bold
- Suma bonusului: mare, animată cu count-up din 0
- Sub-text: `"Înregistrează-te acum pentru a revendica"`

**Reg Form:**
- Câmp: Număr de telefon (type=tel)
- Câmp: Parolă (type=password)
- Dropdown: Selectează bonus
- Buton CTA: `"Revendică bonusul →"` — albastru (#185FA5), full-width
- Link: `"Ai deja cont? Conectează-te"`

**Form behavior:**
- Validare basic: telefon ≥ 8 cifre, parolă ≥ 6 caractere
- Submit → redirect la REGISTER_URL

---

## Visual style

| Token | Valoare |
|-------|---------|
| Background | `#0a1628` (fallback — apă noapte) |
| Water color | `#1a3a5c` |
| Accent primary | `#1D9E75` (verde-teal, Big Bass brand) |
| Accent secondary | `#F5A623` (portocaliu pește / cârlig) |
| Text primary | `#FFFFFF` |
| Text muted | `rgba(255,255,255,0.6)` |
| Fish tier 1 color | `#85B7EB` (albastru deschis — pește mic) |
| Fish tier 2 color | `#F5A623` (portocaliu — mediu) |
| Fish tier 3 color | `#E24B4A` (roșu — mare) |
| Fish tier 4 color | `#F0B429` (auriu — jackpot bass) |
| Button bg | `#1D9E75` |
| Button text | `#FFFFFF` |
| Input bg | `rgba(255,255,255,0.08)` |
| Input border | `rgba(255,255,255,0.2)` |
| Border radius buttons | `50px` |
| Border radius cards | `12px` |

---

## Animations

| Animație | Descriere |
|----------|-----------|
| `waterRipple` | Unde de apă continue pe suprafața lacului (CSS, subtil) |
| `fishShadow` | Siluete de pești se mișcă lent sub apă (hint) |
| `rodSwing` | Undița se arcuiește la aruncat (CSS rotate, 300ms) |
| `lineCast` | Linia se extinde spre apă (CSS scaleY grow, 300ms) |
| `splash` | Ripple la impactul liniei cu apa (CSS radial expand) |
| `lineShake` | Linia tremură în apă — suspans (CSS keyframes, loop 3×) |
| `lineReel` | Linia se retrage (CSS scaleY shrink, 200ms) |
| `fishJump` | Peștele sare din apă (translateY + rotate, 300ms ease-out) |
| `fishLand` | Peștele "cade" pe ecran la reveal (300ms ease-in) |
| `countUp` | Suma bonusului crește de la 0 la valoarea finală (JS, 1000ms) |
| `bonusGlow` | Glow pulsant în culoarea tier-ului pe peștele afișat |

---

## Config variables

```js
const CONFIG = {
  REGISTER_URL: 'https://example.com/register',
  FISH_TIERS: [
    { id: 'small',  label: 'Pește mic',    bonus: '100 RON + 50 Free Spins',    weight: 40 },
    { id: 'medium', label: 'Pește mediu',  bonus: '250 RON + 100 Free Spins',   weight: 30 },
    { id: 'large',  label: 'Pește mare',   bonus: '500 RON + 150 Free Spins',   weight: 20 },
    { id: 'bass',   label: 'Big Bass! 🎉', bonus: '1.000 RON + 200 Free Spins', weight: 10 },
  ],
  SUSPENSE_DURATION: 1800,   // ms — cât tremură linia în apă
  BRAND_NAME: 'WinBoss',
  LANG: 'ro',
};

// Weighted random selection
function pickFishTier(tiers) {
  const total = tiers.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const tier of tiers) {
    r -= tier.weight;
    if (r <= 0) return tier;
  }
  return tiers[tiers.length - 1];
}
```

---

## Copy (RO)

| Element | Text |
|---------|------|
| Headline | Aruncă undița și câștigă bonusul! |
| Sub mobile | Swipe ↑ pentru a arunca |
| Sub desktop | Apasă butonul pentru a arunca |
| Button cast | 🎣 ARUNCĂ UNDIȚA |
| Suspense label | Stai... ai prins ceva! |
| Reveal tier | Ai prins un {tier label}! |
| Reveal bonus | Bonusul tău: {bonus} |
| Reveal sub | Înregistrează-te acum pentru a revendica |
| Form phone | Număr de telefon |
| Form password | Parolă |
| Form CTA | Revendică bonusul → |
| Form login link | Ai deja cont? Conectează-te |
| Disclaimer | 18+ \| Joacă responsabil \| T&C se aplică |

---

## Responsive breakpoints

| Breakpoint | Comportament |
|------------|-------------|
| < 430px | Scena mai compactă, pescar mai mic, buton CAST full-width jos |
| 430–768px | Layout standard |
| > 768px | Scenă mai largă, pescar mai mare stânga, apă ocupă 60% lățime, form dreapta |

---

## Interaction — swipe vs. tap

**Mobile (touch):**
- `touchstart` → salvează y initial
- `touchend` → dacă deltaY < -50px (swipe în sus) → trigger cast
- Fallback: buton `🎣 ARUNCĂ UNDIȚA` sub scenă pentru utilizatorii care nu știu de swipe

**Desktop:**
- Buton principal: `🎣 ARUNCĂ UNDIȚA` — click simplu
- Opțional: drag în sus cu mousedown/mouseup

---

## Notes
- Fish tier-ul se alege la pageload sau la primul tap — nu la render, pentru a evita pattern-uri predictibile
- Nu afișa tier-ul ales înainte de animația completă (nu "spoilera" peștele)
- Disclaimerul 18+ fix jos sau sub CTA — vizibil mereu
- Sunetele sunt opționale — LP funcționează fără assets audio
- Nu stoca date local — submit direct spre REGISTER_URL
