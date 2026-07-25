# Rulings

Every rules ambiguity gets pinned here with a decision and a test. If a real-game
dispute finds a better answer, change the ruling here first, then the code, then bump
`rulesVersion`.

## RL-1 — Animal card catalog is provisional
The rulebook prints no master table of the 32 cards' patterns/point tracks.
`src/data/cards.json` currently ships a **provisional set** (marked `"provisional": true`)
designed to be shape- and difficulty-representative. Replace with transcriptions from a
physical copy (photos) or the BGG "Animal Card Breakdown" thread when available. Card
data is pure JSON — swapping it requires no code changes, but bump `rulesVersion`.
Tests: `data.test.ts` validates schema, cube counts (2–3), ascending tracks, pattern
connectivity, and that cube-hex is part of the pattern.

## RL-2 — Building scoring vs. empty neighbors
Rulebook: a building scores 5 if "surrounded by at least 3 different colors."
Undefined: do empty adjacent hexes matter?
**Ruling: empty neighbors are ignored; count distinct colors among the TOP tokens of
occupied adjacent hexes only.** Edge-of-board buildings therefore just have fewer
candidate neighbors. Test: E4 in RULES.md.

## RL-3 — End-game animal card value
Rulebook wording ("points indicated on the last visible slot") is readable two ways.
**Ruling: a card scores the value of the highest slot whose cube has been placed;
zero cubes = 0 points.** (Matches every review/playthrough consulted and the escalier
design intent: each placed cube raises the card's value.) Test: E6.

## RL-4 — River length counting
Rulebook: "count the shortest path from one end to the other, ends included."
For branched blue networks this is ambiguous.
**Ruling: river score uses the LONGEST SIMPLE PATH (no repeated hex) through the
player's blue tokens; branches simply don't contribute to that path.** This matches the
physical game's intent (rivers are drawn as winding lines; branches waste tokens).
Test: E5 plus a branched fixture (Y-shape of 6 scores as its longest arm-path).

## RL-5 — Bag exhaustion & partial refills
**Ruling: at end of turn, refill the emptied slot with as many tokens as the bag holds
(0–3). The end-game trigger fires when a refill is required and the bag is empty
(refill of 0).** The final round then completes per R7.3. Slots may briefly hold fewer
than 3 tokens in the last round; taking a short slot still counts as the mandatory take
and the player places only what they took.

## RL-6 — Taking a slot with fewer than 3 tokens (end-game only)
Follows RL-5: legal; the mandatory placement covers exactly the tokens taken.

## RL-7 — No legal placement for a taken token
With 23 hexes and ≤2-empty end trigger, a player could theoretically hold a token with
no legal hex (board nearly full, token unstackable). Rulebook is silent.
**Ruling: if a taken token has no legal placement, it is discarded to the box (removed
from the game) and the turn continues.** Engine emits `placeToken` with `hex: null` only
when `legalHexes(token)` is empty; reducer validates that emptiness.

## RL-8 — All central slots empty (deep end-game)
If every central slot is empty (bag exhausted, slots drained during the final round),
the mandatory take is impossible. **Ruling: with all five slots empty, the mandatory
take is waived and `endTurn` is legal directly.** Prevents a soft-lock; only reachable
after the end trigger has already fired.
