# Harmonies — Rules Specification (ground truth for the engine)

Source: official EN rulebook (Libellud, 2024) — `docs/reference/harmonies-rulebook-en.pdf`.
Every numbered fact here is encoded as at least one test. Ambiguities are pinned in
`rulings.md`, never resolved silently in code.

Scope of this implementation: **2–4 player game, board side A**. Solo mode, side B
(islands), and Nature's Spirit cards are out of scope for v1.

## 1. Components

- Token bag, 120 tokens: **gray 23, blue 23, brown 21, green 19, yellow 19, red 15**.
- Central board: **5 slots**, each holding 3 tokens drawn from the bag (15 visible).
- **32 animal cards**; 5 face-up in the card row at all times (refilled from the deck).
- Animal cubes: effectively unlimited pool (physical game: 75). Cards carry 2–3 cube slots.
- Personal board (side A): **23 flat-top hexes in 5 columns of heights 5-4-5-4-5**,
  odd columns (1st/3rd/5th) higher, brick-offset. See `src/data/boards.json`.

## 2. Setup

1. Shuffle bag; fill each of the 5 central slots with 3 tokens.
2. Shuffle animal deck; reveal 5 cards as the card row.
3. Each player gets an empty personal board. First player = seat 0 (`startingSeat`).

All shuffling/drawing derives from `cfg.sharedSeed` in a FIXED order (bag first, then
deck) so every peer reconstructs the same game (see `engine/setup.ts`).

## 3. Turn structure

On your turn, actions in any order, interleaving allowed:

- **[Mandatory, exactly once] Take tokens**: choose ONE central slot, take all 3 tokens.
  Place all 3 on your board, one at a time, each following §4. Other optional actions
  may happen between individual placements.
- **[Optional, max once] Take an animal card** from the 5 face-up cards. It joins your
  in-progress area (max **4 in-progress cards**; completed cards don't count).
- **[Optional, unlimited] Place an animal cube** (one per action): choose one of your
  in-progress cards whose habitat pattern currently exists on your board (§5); take the
  card's bottommost remaining cube; place it on the pattern's designated hex.

- **End of turn** (automatic bookkeeping): refill the emptied central slot to 3 from the
  bag (or fewer/none if the bag runs out — see §7); refill the card row to 5.

## 4. Token placement & stacking

A token may be placed:
- on any **empty** hex, always; or
- on top of existing token(s) ONLY when the result is one of the three legal stack shapes:

| Shape | Definition | Height |
|---|---|---|
| Mountain | 1–3 gray, gray only | 1–3 |
| Tree | green on top of 0–2 brown | 1–3 (green always topmost) |
| Building | red on top of exactly ONE token: brown, gray, or red | exactly 2 |

Derived constraints the engine enforces:
- **R4.1** Blue (water) and yellow (field): ground only, height 1, nothing ever on top.
- **R4.2** Bare brown stacks (1–2 brown, no green cap) are legal intermediates; a third
  token on 2 brown can only be green.
- **R4.3** A bare red on the ground is legal (height 1) but is not a building; the only
  legal token on top of it is red (making a building).
- **R4.4** Gray stacking: gray on 1–2 gray only. Red on 1 gray converts a mountain-read
  to a building (rulebook's own example). Red on 2 gray is ILLEGAL (building = red on
  exactly one token).
- **R4.5** Green: on empty ground (size-1 tree) or on 1–2 brown. Nothing on top of green.
- **R4.6** Brown: on empty ground or on 1 brown. (Brown on anything else: illegal.)
- **R4.7** Tokens are never moved or removed once placed.
- **R4.8** A hex carrying an animal cube is permanently locked: no token may ever be
  placed there again.

Legal-top table (what may be added onto an existing stack, by current stack profile):

| Current stack (bottom→top) | Legal additions |
|---|---|
| empty | any color |
| B (brown) | brown, green, red |
| BB | green |
| G / bG / bbG (any tree) | nothing |
| g (gray) | gray, red |
| gg | gray |
| ggg | nothing |
| R (red) | red |
| any building (xR) | nothing |
| blue / yellow | nothing |

## 5. Animal cards & habitat patterns

- A card defines: a habitat **pattern** (1–3 hexes with exact terrain reads), the
  **cube hex** within the pattern, and a **point track** (2–3 escalating values).
- **R5.1** Patterns match in any of the **6 rotations**. **Mirroring is NOT allowed.**
- **R5.2** Heights are exact: a size-2 tree requirement is not met by size-1 or size-3.
- **R5.3** A building requirement is satisfied by any legal building (red on brown, gray,
  or red).
- **R5.4** The cube hex must currently satisfy its required read AND hold no cube
  (one cube per hex, ever — across all cards).
- **R5.5** Non-cube hexes of a pattern may hold cubes (theirs or other cards'), and one
  board hex may satisfy several patterns simultaneously.
- **R5.6** Cube placement is final. Later alteration of OTHER pattern hexes (e.g. a gray
  support capped by red) never removes a placed cube or its points.
- **R5.7** Placing a cube takes the card's bottommost remaining cube (lowest value first).
  When the last cube leaves a card, the card is complete: it moves aside and frees an
  in-progress slot.

## 6. Scoring

Total = terrain (trees + mountains + fields + buildings + water) + animal cards.

- **S6.1 Trees**: per tree, by size — 1 / 3 / 7 points (sizes 1/2/3). Bare brown: 0.
- **S6.2 Mountains**: per mountain adjacent to ≥1 other mountain, by height —
  1 / 3 / 7. Isolated mountains: 0 (any height).
- **S6.3 Fields**: per contiguous group of ≥2 yellow: flat 5. Singletons: 0. Group size
  beyond 2 adds nothing (two pairs = 10 beats one blob of 4 = 5).
- **S6.4 Buildings**: per building whose adjacent occupied hexes' TOP tokens show ≥3
  distinct colors: 5. Otherwise 0. Empty neighbors are ignored (ruling RL-2).
- **S6.5 Water (side A, river)**: only your single longest contiguous blue chain scores:
  lengths 1–6 → 0 / 2 / 5 / 8 / 11 / 15, then **+4 per token beyond the 6th**.
  Chain length = number of tokens in the longest simple path (ruling RL-4).
- **S6.6 Animal cards**: each card (in-progress or complete) scores the value of the
  highest-value slot whose cube has been PLACED on the board; a card with no cubes
  placed scores 0 (ruling RL-3: "score what you've achieved, not the next target").

## 7. Game end

- **R7.1** Trigger A: the bag is empty when a refill is required. (Partial refills happen
  first: if the bag holds 1–2 tokens, refill partially; trigger fires when a refill is
  needed and the bag has 0.)  → pinned as ruling RL-5.
- **R7.2** Trigger B: at the end of any player's turn, that player has ≤2 empty hexes.
- **R7.3** After a trigger, play continues until all players have had an equal number of
  turns (finish the round; the player to the first player's right always ends the game).
- **R7.4** Winner: highest total. Tie: most animal cubes placed on board. Still tied:
  shared victory.

## 8. Worked scoring examples (each is a test fixture)

### E1 — Trees
Board: hex a=[green], hex b=[brown,green], hex c=[brown,brown,green], hex d=[brown].
Trees: sizes 1,2,3 → 1+3+7 = **11**. Hex d bare brown → 0.

### E2 — Mountains
Board: a=[gray] (isolated); b=[gray,gray] and c=[gray,gray,gray] adjacent to each other.
a isolated → 0. b→3, c→7. Total **10**.

### E3 — Fields
Board: yellow at {a,b} contiguous; yellow singleton at f; yellow at {c,d,e} contiguous.
Groups ≥2: two → **10**.

### E4 — Buildings
Building at hex x=[gray,red]. Neighbors' top tokens: green(tree top), blue, yellow →
3 distinct colors → **5**. Same building with neighbors blue, blue, empty → 1 color → 0.
Note: neighbor colors are TOP tokens; a [brown,green] tree neighbor contributes green.

### E5 — River
Chain of 7 blue in a line: 15 + 4 = **19**. Two chains (5 and 3): best only → 11.

### E6 — Animal card
Card track [4, 9, 16] (3 cubes). Two cubes placed → scores **9**. No cubes → 0.
All three → 16, card complete.

### E7 — Full end-of-game tally
(Constructed in `test/engine.test.ts` as the golden fixture: a 23-hex board using every
scoring rule at once; hand-summed total asserted.)
