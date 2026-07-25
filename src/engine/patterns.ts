import type { CardDef, HexId, PatternHex, PlayerState } from './types'
import { hexId, parseHex, rotate60 } from './hex'
import { readStack, readSatisfies } from './terrain'

function rotateOnce(p: PatternHex[]): PatternHex[] {
  return p.map(({ q, r, read }) => {
    const [nq, nr] = rotate60(q, r)
    return { q: nq, r: nr, read }
  })
}

const orientationCache = new Map<string, PatternHex[][]>()

/**
 * The card's habitat in all 6 rotations (R5.1 — NO mirroring), exact
 * duplicates removed (e.g. a single-hex pattern has one orientation).
 * Array order is preserved by rotation, so `card.cube` indexes every
 * orientation identically.
 */
export function orientations(card: CardDef): PatternHex[][] {
  const cached = orientationCache.get(card.id)
  if (cached) return cached
  const out: PatternHex[][] = []
  const seen = new Set<string>()
  let cur = card.pattern
  for (let i = 0; i < 6; i++) {
    const key = JSON.stringify(cur)
    if (!seen.has(key)) {
      seen.add(key)
      out.push(cur)
    }
    cur = rotateOnce(cur)
  }
  orientationCache.set(card.id, out)
  return out
}

/**
 * Every hex where this card's cube could legally be placed right now:
 * some orientation anchored somewhere on the board has all its reads
 * satisfied (R5.2/R5.3), and the pattern's cube hex is cube-free (R5.4).
 * Non-cube pattern hexes may hold cubes (R5.5).
 */
export function cubePlacements(
  player: PlayerState,
  card: CardDef,
  boardSet: Set<HexId>,
): HexId[] {
  const result = new Set<HexId>()
  for (const orient of orientations(card)) {
    for (const anchor of boardSet) {
      const [aq, ar] = parseHex(anchor)
      let cubeHex: HexId | null = null
      let ok = true
      for (let i = 0; i < orient.length; i++) {
        const ph = orient[i]
        const h = hexId(aq + ph.q, ar + ph.r)
        if (!boardSet.has(h) || !readSatisfies(readStack(player.board[h]), ph.read)) {
          ok = false
          break
        }
        if (i === card.cube) {
          if (player.cubes[h] !== undefined) {
            ok = false
            break
          }
          cubeHex = h
        }
      }
      if (ok && cubeHex !== null) result.add(cubeHex)
    }
  }
  return [...result]
}
