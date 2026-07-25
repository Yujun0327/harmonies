# Harmonies (fan game)

A browser adaptation of the board game **Harmonies** (Libellud, 2024, design Johan
Benvenuto) for private play among friends. Fan-made homage: original code, original
art, no assets copied from the published game, not affiliated with or endorsed by
Libellud/Asmodee, never monetized. If you enjoy it, buy the real one.

No accounts, no servers: create a room, share the code, play. Multiplayer is
peer-to-peer WebRTC (Trystero over Nostr signaling); game state lives only in the
players' browsers.

## Play

- `npm install && npm run dev` — then open the printed URL.
- **Hotseat**: one device passed around.
- **Online**: create a room, send the invite link; 2–4 players plus any number of
  late-joining spectators. Refreshing mid-game resumes from localStorage.
- Dev routes: `#gallery` (component gallery), `#demo` (auto-seated 3P hotseat).

## Architecture

- `src/engine/` — pure rules engine: deterministic `createGame(cfg.sharedSeed)`,
  a single `applyMove` reducer, `legalMoves` enumeration (UI renders only legal
  actions), 6-rotation habitat pattern matcher (no mirroring), per-terrain scoring
  with a branch-and-bound longest-river search. No DOM, no network.
- `src/data/` — board layout and the animal card catalog as JSON.
  **The card set is provisional** (see `rulings.md` RL-1) until transcribed from a
  physical copy; swapping it is a data-only change.
- `src/transport/` — Trystero adapter with pinned Nostr relays + TURN fallback,
  behind a `Transport` interface (an MQTT fallback can drop in if WebRTC misbehaves).
- `src/app/session.svelte.ts` — sync via turn-holder sequencing: the actor stamps
  `seq` and a full-state hash on every move; hash mismatch or seq gap triggers a
  resync (longer log wins). Host is authoritative only for lobby/seating/start.
- `src/ui/` — Svelte 5. The look is governed by `src/assets/art-bible.md`
  ("naturalist's field guide"): wobbly-ink lines, 2.5D wooden chips, paper grain.
- `docs/RULES.md` — the rules spec the engine implements; `rulings.md` pins every
  ambiguity with a decision and a test. Official rulebook kept in `docs/reference/`.

## Tests

`npm test` — 69 tests: rulebook worked examples, random-playout invariants,
log-replay determinism, and full multiplayer scenarios over a deterministic
in-memory mesh (drops, resyncs, reconnects, spectators, mid-turn refresh).
`npm run check` — svelte-check + tsc.

## Deploy

Static build (`npm run build` → `dist/`); `netlify.toml` included. Keep the URL
unlisted.

## Known limitations

- Seed-derived bag/deck are technically readable via devtools — fine among friends,
  don't play for money.
- A room lives only in its players' localStorage; there is no lobby server to
  rediscover it.
