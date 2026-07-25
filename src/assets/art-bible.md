# Harmonies — Art Bible: "The Naturalist's Field Guide"

Every visual decision checks against this page. If a screen doesn't look like a page
from a well-thumbed vintage field guide — cream paper, ink line, watercolor wash —
it isn't done.

## Mood

A 1930s pocket guide to hills and hedgerows: engraved animal plates, hand-inked
diagrams, muted botanical washes, letterpress numerals. Cozy, precise, unhurried.
NOT: glossy, neon, gradient-purple, glassmorphic, emoji-flavored.

## Surfaces

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F2EBD9` | page background |
| `--panel` / `--felt` | `#F8F3E4` | cards, sheets, modals |
| `--paper-deep` | `#E9DFC6` | wells, slots, insets |
| `--ink` | `#37321F`-ish `#3A3527` | text, line work |
| `--ink-soft` | `rgb(58 53 39 / .62)` | secondary text |
| `--line` | `rgb(58 53 39 / .28)` | hairlines, hex outlines |

Paper always carries the `--grain` turbulence overlay at low opacity. No pure white
anywhere; no pure black anywhere.

## The six functional colors (load-bearing — players know them from the real game)

Muted, dusty versions; hue readable at a glance, saturation kept low:

| Terrain | base | hi (top face) | lo (side/shade) |
|---|---|---|---|
| gray / mountain | `#8B93A0` | `#A6ADB8` | `#6E7684` |
| blue / water | `#6C93B4` | `#87AAC6` | `#54789A` |
| brown / trunk | `#8A6748` | `#A17E5C` | `#6E4F35` |
| green / leaf | `#5C7A4A` | `#749260` | `#465F38` |
| yellow / field | `#C9A94E` | `#DBBF6B` | `#A8893B` |
| red / building | `#A9553F` | `#C06E56` | `#87422F` |

## Line

Ink line `#3A3527`, 1.5–2px, with deliberate wobble: every hex outline and diagram
stroke passes through `wobble.ts` (seeded by position — stable across renders).
Nothing perfectly straight except type.

## Type

- **Fraunces** (variable): display. Headings, card names, numerals on plates.
  Optical size high, slight tightening. Small caps for labels where offered.
- **Alegreya**: body text, rules prose.
- **Alegreya Sans**: tiny UI labels, buttons — letterspaced lowercase or small caps.
- Numerals: tabular where they align (scores, tracks).

## Shape & depth

- One radius: `6px` for paper sheets; chips/tokens are ellipses. No pill buttons.
- Tokens are squat wooden discs drawn in 2.5D: ellipse top + short cylinder side,
  stacked with an 8–10px lift per level and ONE soft grounded shadow per stack.
- Shadows: single soft umbra `0 2px 6px rgb(58 53 39 / .18)`; never glows.

## The board

Parchment panel; hexes = wobbly ink outlines, empty cells washed `--paper-deep`
with a faint compass-dot center. Legal-target highlight: moss wash `#5B7A3A22`
+ 2px moss ink outline — never a glow. Terrain motifs on token top faces:
tree = trunk-and-canopy blob; mountain = twin peaks; water = two wave strokes;
field = seed dots in rows; building roof = gabled roof. All 2px ink, one style.

## Cards ("plates")

Field-guide plates: rule line, engraved-style animal name in Fraunces, pattern
diagram drawn with the same board glyphs, cube slot marked with a dashed ring,
point track as letterpress circles that fill with ink as cubes land. Plate number
(Pl. VII) as ornament. No illustration needed to look intentional.

## Motion

- Tokens DROP: fall 12px + settle-bounce (`settle` easing), 180–240ms; paired with
  the wooden `thock` foley (pitch rises with stack height).
- Cards slide; cubes tick; score numbers count up. Nothing floats or pulses idly.
- All durations through `dur()`; reduced-motion collapses to 0.

## Sound

WebAudio only (audio.ts): wooden thocks, paper slides, one songbird chime for a
completed card. Quiet by default disposition; mute persists.

## Anti-slop checklist (gate every screen against this)

- [ ] no gradients-as-decoration, no glassmorphism, no purple
- [ ] no emoji anywhere in UI
- [ ] no Inter/system-ui; only the three faces above
- [ ] one radius scale; no mixed rounding
- [ ] ink focus ring (`2px solid var(--ink)` offset 2) on every focusable
- [ ] empty states designed (dashed slots, "waiting…" prose), never spinners alone
- [ ] wobble on every drawn line; no perfectly straight SVG strokes
- [ ] paper grain present; no flat #fff panels
- [ ] every color from the tables above; nothing sampled ad hoc
