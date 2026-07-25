import { describe, expect, it } from 'vitest'
import { CARDS, SIDE_A_SET } from '../src/data'
import {
  applyMove,
  canAdd,
  computeResult,
  createGame,
  cubePlacements,
  legalMoves,
  legalPlacementHexes,
  orientations,
  publicHash,
  readStack,
  RulesError,
  scoreBreakdown,
  scoreBuildings,
  scoreFields,
  scoreMountains,
  scoreTrees,
  scoreWater,
  TOKEN_COUNTS,
  type GameState,
  type Move,
  type Seat,
} from '../src/engine'
import { boardOf, makeConfig, newGame } from './helpers'

// ---------------------------------------------------------------- setup

describe('setup', () => {
  it('is deterministic from the shared seed', () => {
    const a = createGame(makeConfig(3, 123))
    const b = createGame(makeConfig(3, 123))
    expect(publicHash(a)).toBe(publicHash(b))
    const c = createGame(makeConfig(3, 124))
    expect(publicHash(c)).not.toBe(publicHash(a))
  })

  it('builds the official 120-token bag and fills 5 slots of 3', () => {
    const g = newGame()
    expect(g.bag).toHaveLength(120)
    const counts: Record<string, number> = {}
    for (const t of g.bag) counts[t] = (counts[t] ?? 0) + 1
    expect(counts).toEqual(TOKEN_COUNTS)
    expect(g.slots).toHaveLength(5)
    for (const slot of g.slots) expect(slot).toHaveLength(3)
    expect(g.bagCursor).toBe(15)
  })

  it('reveals 5 cards and keeps the rest in the deck', () => {
    const g = newGame()
    expect(g.cardRow).toHaveLength(5)
    expect(g.cardRow.every((c) => c !== null)).toBe(true)
    expect(g.deckCursor).toBe(5)
    expect(g.deck).toHaveLength(32)
  })
})

// ------------------------------------------------------- stacking rules (§4)

describe('stacking legality (RULES.md §4 legal-top table)', () => {
  it('anything goes on an empty hex', () => {
    for (const c of ['gray', 'blue', 'brown', 'green', 'yellow', 'red'] as const) {
      expect(canAdd(undefined, c)).toBe(true)
      expect(canAdd([], c)).toBe(true)
    }
  })

  it('brown accepts brown/green/red; double brown accepts only green', () => {
    expect(canAdd(['brown'], 'brown')).toBe(true)
    expect(canAdd(['brown'], 'green')).toBe(true)
    expect(canAdd(['brown'], 'red')).toBe(true)
    expect(canAdd(['brown'], 'gray')).toBe(false)
    expect(canAdd(['brown'], 'blue')).toBe(false)
    expect(canAdd(['brown', 'brown'], 'green')).toBe(true)
    expect(canAdd(['brown', 'brown'], 'brown')).toBe(false)
    expect(canAdd(['brown', 'brown'], 'red')).toBe(false)
  })

  it('gray accepts gray/red; double gray accepts only gray (R4.4)', () => {
    expect(canAdd(['gray'], 'gray')).toBe(true)
    expect(canAdd(['gray'], 'red')).toBe(true)
    expect(canAdd(['gray'], 'green')).toBe(false)
    expect(canAdd(['gray', 'gray'], 'gray')).toBe(true)
    expect(canAdd(['gray', 'gray'], 'red')).toBe(false) // building = red on exactly ONE token
    expect(canAdd(['gray', 'gray', 'gray'], 'gray')).toBe(false)
  })

  it('bare red accepts only red; nothing goes on trees, buildings, water, fields', () => {
    expect(canAdd(['red'], 'red')).toBe(true)
    expect(canAdd(['red'], 'gray')).toBe(false)
    for (const c of ['gray', 'blue', 'brown', 'green', 'yellow', 'red'] as const) {
      expect(canAdd(['green'], c)).toBe(false)
      expect(canAdd(['brown', 'green'], c)).toBe(false)
      expect(canAdd(['gray', 'red'], c)).toBe(false)
      expect(canAdd(['blue'], c)).toBe(false)
      expect(canAdd(['yellow'], c)).toBe(false)
    }
  })

  it('reads stacks correctly', () => {
    expect(readStack(['green'])).toEqual({ kind: 'tree', size: 1 })
    expect(readStack(['brown', 'brown', 'green'])).toEqual({ kind: 'tree', size: 3 })
    expect(readStack(['gray', 'gray'])).toEqual({ kind: 'mountain', height: 2 })
    expect(readStack(['red'])).toEqual({ kind: 'bareRed' })
    expect(readStack(['red', 'red'])).toEqual({ kind: 'building' })
    expect(readStack(['brown', 'red'])).toEqual({ kind: 'building' })
    expect(readStack(['brown'])).toEqual({ kind: 'bareBrown', height: 1 })
    expect(readStack([])).toEqual({ kind: 'empty' })
  })
})

// ------------------------------------------------------------ scoring (§6)

describe('scoring worked examples (RULES.md §8)', () => {
  it('E1 trees: sizes 1/2/3 score 1/3/7, bare brown scores 0', () => {
    const p = boardOf({
      '0,0': ['green'],
      '0,2': ['brown', 'green'],
      '2,0': ['brown', 'brown', 'green'],
      '4,0': ['brown'],
    })
    expect(scoreTrees(p)).toBe(11)
  })

  it('E2 mountains: isolated scores 0; adjacent score 1/3/7 by height', () => {
    const p = boardOf({
      '0,4': ['gray'], // isolated
      '0,0': ['gray', 'gray'],
      '0,1': ['gray', 'gray', 'gray'],
    })
    expect(scoreMountains(p)).toBe(10)
  })

  it('E3 fields: each group of ≥2 scores flat 5; singletons 0', () => {
    const p = boardOf({
      '0,0': ['yellow'],
      '0,1': ['yellow'],
      '2,-1': ['yellow'],
      '2,0': ['yellow'],
      '2,1': ['yellow'],
      '4,2': ['yellow'],
    })
    expect(scoreFields(p)).toBe(10)
  })

  it('E4 buildings: 5 with ≥3 distinct neighbor top colors, else 0 (RL-2)', () => {
    const scoring = boardOf({
      '1,1': ['gray', 'red'],
      '2,1': ['brown', 'green'], // top: green
      '1,0': ['blue'],
      '0,1': ['yellow'],
    })
    expect(scoreBuildings(scoring)).toBe(5)

    const notScoring = boardOf({
      '1,1': ['gray', 'red'],
      '1,0': ['blue'],
      '0,1': ['blue'],
    })
    expect(scoreBuildings(notScoring)).toBe(0)
  })

  it('E5 water: chain of 7 scores 19; only the best of two chains counts', () => {
    const seven = boardOf({
      '0,0': ['blue'],
      '0,1': ['blue'],
      '0,2': ['blue'],
      '0,3': ['blue'],
      '0,4': ['blue'],
      '1,3': ['blue'],
      '2,3': ['blue'],
    })
    expect(scoreWater(seven)).toBe(19)

    const twoChains = boardOf({
      '0,0': ['blue'],
      '0,1': ['blue'],
      '0,2': ['blue'],
      '0,3': ['blue'],
      '0,4': ['blue'],
      '4,0': ['blue'],
      '4,1': ['blue'],
      '4,2': ['blue'],
    })
    expect(scoreWater(twoChains)).toBe(11)
  })

  it('E5b water: branched network scores its longest simple path (RL-4)', () => {
    // Col-0 line plus (1,1), which touches both (0,1) and (0,2): the path can
    // weave through the branch, so all 5 blues chain: 0,0 → 0,1 → 1,1 → 0,2 → 0,3.
    const p = boardOf({
      '0,0': ['blue'],
      '0,1': ['blue'],
      '0,2': ['blue'],
      '0,3': ['blue'],
      '1,1': ['blue'],
    })
    expect(scoreWater(p)).toBe(11)
  })

  it('E6 animals: value of the highest cubed slot; empty card 0 (RL-3)', () => {
    const p = boardOf({})
    p.inProgress = [
      { cardId: 'kingfisher', cubesPlaced: 2 }, // track [4,9,15] → 9
      { cardId: 'grey-heron', cubesPlaced: 0 }, // → 0
    ]
    p.completed = ['field-mouse'] // track [3,6] → 6
    const breakdown = scoreBreakdown(p)
    expect(breakdown.animals).toEqual({ kingfisher: 9, 'grey-heron': 0, 'field-mouse': 6 })
    expect(breakdown.animalTotal).toBe(15)
  })

  it('E7 golden tally: full board using every rule sums to 36', () => {
    const p = boardOf({
      '0,0': ['brown', 'green'], // tree 2 → 3
      '1,0': ['brown', 'brown', 'green'], // tree 3 → 7
      '2,0': ['gray', 'gray'], // mountain 2, adj (2,1) → 3
      '2,1': ['gray'], // mountain 1, adj (2,0) → 1
      '3,0': ['yellow'], // field pair → 5
      '3,1': ['yellow'],
      '1,1': ['red', 'red'], // building: neighbors gray/green/blue → 5
      '1,2': ['blue'], // river of 4 → 8
      '0,2': ['blue'],
      '0,3': ['blue'],
      '0,4': ['blue'],
    })
    p.inProgress = [{ cardId: 'kingfisher', cubesPlaced: 1 }] // → 4
    const b = scoreBreakdown(p)
    expect(b.trees).toBe(10)
    expect(b.mountains).toBe(4)
    expect(b.fields).toBe(5)
    expect(b.buildings).toBe(5)
    expect(b.water).toBe(8)
    expect(b.animalTotal).toBe(4)
    expect(b.total).toBe(36)
  })
})

// ------------------------------------------------- patterns & cubes (§5)

describe('habitat patterns', () => {
  it('single-hex patterns collapse to one orientation; lines to three or six', () => {
    expect(orientations(CARDS['dragonfly'])).toHaveLength(1)
    expect(orientations(CARDS['grey-heron']).length).toBeGreaterThan(1)
  })

  it('matches in any rotation but never mirrored (R5.1)', () => {
    // kingfisher: tree-1 with water to its "east" in authored orientation.
    // Build tree at (2,1) and water at each of the 6 neighbors in turn — all match.
    for (const waterHex of ['3,1', '3,0', '2,0', '1,1', '1,2', '2,2']) {
      const p = boardOf({ '2,1': ['green'], [waterHex]: ['blue'] })
      const placements = cubePlacements(p, CARDS['kingfisher'], SIDE_A_SET)
      expect(placements, `water at ${waterHex}`).toContain('2,1')
    }
  })

  it('requires exact heights (R5.2)', () => {
    const wrongSize = boardOf({ '2,1': ['brown', 'green'], '3,1': ['blue'] })
    expect(cubePlacements(wrongSize, CARDS['kingfisher'], SIDE_A_SET)).toHaveLength(0)
  })

  it('accepts any building base (R5.3)', () => {
    for (const base of ['brown', 'gray', 'red'] as const) {
      const p = boardOf({ '2,1': [base, 'red'] })
      expect(cubePlacements(p, CARDS['barn-swallow'], SIDE_A_SET)).toContain('2,1')
    }
  })

  it('cube hex must be cube-free; other pattern hexes may hold cubes (R5.4/R5.5)', () => {
    const p = boardOf({ '2,1': ['green'], '3,1': ['blue'] })
    p.cubes['2,1'] = 'somebody'
    expect(cubePlacements(p, CARDS['kingfisher'], SIDE_A_SET)).toHaveLength(0)
    // dragonfly wants the water hex itself — unaffected by the tree cube
    expect(cubePlacements(p, CARDS['dragonfly'], SIDE_A_SET)).toContain('3,1')
  })
})

// -------------------------------------------------------- turn grammar (§3)

/** Place all pending tokens legally (first legal option each time). */
function placeAllPending(state: GameState, actor: Seat): GameState {
  let s = state
  while (s.pendingTokens.length > 0) {
    const move = legalMoves(s, actor).find((m) => m.type === 'placeToken')
    if (!move) throw new Error('no placement available')
    s = applyMove(s, actor, move)
  }
  return s
}

describe('turn grammar', () => {
  it('requires the mandatory take before endTurn', () => {
    const g = newGame()
    expect(() => applyMove(g, 0, { type: 'endTurn' })).toThrow(RulesError)
  })

  it('rejects acting out of turn and taking two slots', () => {
    const g = newGame()
    expect(() => applyMove(g, 1, { type: 'takeSlot', slot: 0 })).toThrow(RulesError)
    const took = applyMove(g, 0, { type: 'takeSlot', slot: 0 })
    expect(() => applyMove(took, 0, { type: 'takeSlot', slot: 1 })).toThrow(RulesError)
  })

  it('requires all 3 tokens placed before endTurn, then refills the slot', () => {
    let g = applyMove(newGame(), 0, { type: 'takeSlot', slot: 2 })
    expect(g.pendingTokens).toHaveLength(3)
    expect(g.slots[2]).toHaveLength(0)
    expect(() => applyMove(g, 0, { type: 'endTurn' })).toThrow(RulesError)
    g = placeAllPending(g, 0)
    g = applyMove(g, 0, { type: 'endTurn' })
    expect(g.slots[2]).toHaveLength(3) // refilled from the bag
    expect(g.bagCursor).toBe(18)
    expect(g.turn).toBe(1)
    expect(g.tookSlot).toBe(false)
  })

  it('allows at most one card per turn and at most 4 in progress', () => {
    let g = applyMove(newGame(), 0, { type: 'takeSlot', slot: 0 })
    g = applyMove(g, 0, { type: 'takeCard', row: 0 })
    expect(g.players[0].inProgress).toHaveLength(1)
    expect(g.cardRow[0]).toBeNull()
    expect(() => applyMove(g, 0, { type: 'takeCard', row: 1 })).toThrow(RulesError)
  })

  it('refills the card row at end of turn', () => {
    let g = applyMove(newGame(), 0, { type: 'takeSlot', slot: 0 })
    g = applyMove(g, 0, { type: 'takeCard', row: 3 })
    g = placeAllPending(g, 0)
    g = applyMove(g, 0, { type: 'endTurn' })
    expect(g.cardRow[3]).toBe(g.deck[5]) // next deck card slid in
    expect(g.deckCursor).toBe(6)
  })

  it('blocks placement on a cubed hex (R4.8)', () => {
    const g = newGame()
    g.players[0].board['0,0'] = ['green']
    g.players[0].cubes['0,0'] = 'kingfisher'
    const taken = applyMove(g, 0, { type: 'takeSlot', slot: 0 })
    expect(() =>
      applyMove(taken, 0, { type: 'placeToken', index: 0, hex: '0,0' }),
    ).toThrow(RulesError)
  })

  it('RL-7: discard is legal only when the token has no legal hex', () => {
    const g = newGame()
    // fill the whole board with blue — nothing can ever stack
    for (const h of SIDE_A_SET) g.players[0].board[h] = ['blue']
    const taken = applyMove(g, 0, { type: 'takeSlot', slot: 0 })
    const color = taken.pendingTokens[0]
    expect(legalPlacementHexes(taken.players[0], color)).toHaveLength(0)
    const discarded = applyMove(taken, 0, { type: 'placeToken', index: 0, hex: null })
    expect(discarded.pendingTokens).toHaveLength(2)

    // but with an open board, discarding is rejected
    const g2 = applyMove(newGame(), 0, { type: 'takeSlot', slot: 0 })
    expect(() => applyMove(g2, 0, { type: 'placeToken', index: 0, hex: null })).toThrow(
      RulesError,
    )
  })
})

// ----------------------------------------------------- cubes through moves

describe('cube placement through the reducer', () => {
  function withKingfisherReady(): GameState {
    const g = newGame()
    g.players[0].board['2,1'] = ['green']
    g.players[0].board['3,1'] = ['blue']
    g.players[0].inProgress = [{ cardId: 'kingfisher', cubesPlaced: 0 }]
    return g
  }

  it('places a cube when the pattern exists, locks the hex, completes the card', () => {
    let g = withKingfisherReady()
    g = applyMove(g, 0, { type: 'placeCube', cardId: 'kingfisher', hex: '2,1' })
    expect(g.players[0].cubes['2,1']).toBe('kingfisher')
    expect(g.players[0].inProgress[0].cubesPlaced).toBe(1)

    // same hex again → the cube hex now holds a cube → illegal
    expect(() =>
      applyMove(g, 0, { type: 'placeCube', cardId: 'kingfisher', hex: '2,1' }),
    ).toThrow(RulesError)

    // build a second habitat and finish the card (track has 3 slots)
    g.players[0].board['0,0'] = ['green']
    g.players[0].board['0,1'] = ['blue']
    g = applyMove(g, 0, { type: 'placeCube', cardId: 'kingfisher', hex: '0,0' })
    g.players[0].board['4,0'] = ['green']
    g.players[0].board['4,1'] = ['blue']
    g = applyMove(g, 0, { type: 'placeCube', cardId: 'kingfisher', hex: '4,0' })
    expect(g.players[0].inProgress).toHaveLength(0)
    expect(g.players[0].completed).toEqual(['kingfisher'])
  })

  it('rejects cubes for patterns that are not on the board', () => {
    const g = newGame()
    g.players[0].inProgress = [{ cardId: 'kingfisher', cubesPlaced: 0 }]
    expect(() =>
      applyMove(g, 0, { type: 'placeCube', cardId: 'kingfisher', hex: '2,1' }),
    ).toThrow(RulesError)
  })
})

// ------------------------------------------------------------- game end (§7)

describe('game end', () => {
  it('R7.2: ≤2 empty hexes at end of turn triggers the final round', () => {
    const g = newGame(2)
    // pre-fill 21 hexes: ≤2 will be empty at end of turn no matter how the
    // 3 taken tokens land (stack, fill, or RL-7 discard)
    const hexes = [...SIDE_A_SET]
    for (let i = 0; i < 21; i++) g.players[0].board[hexes[i]] = ['blue']
    let s = applyMove(g, 0, { type: 'takeSlot', slot: 0 })
    s = placeAllPending(s, 0)
    s = applyMove(s, 0, { type: 'endTurn' })
    expect(s.endTriggered).toBe(true)
    expect(s.result).toBeNull() // seat 1 still gets an equal turn
    expect(s.turn).toBe(1)

    let t = applyMove(s, 1, { type: 'takeSlot', slot: 1 })
    t = placeAllPending(t, 1)
    t = applyMove(t, 1, { type: 'endTurn' })
    expect(t.result).not.toBeNull()
    expect(t.result!.breakdown).toHaveLength(2)
  })

  it('R7.4: tie broken by cubes on board; symmetric cubes share the victory', () => {
    const g = newGame(2)
    // equal scores (a size-1 tree each), but seat 1 has a cube placed
    g.players[0].board['0,0'] = ['green']
    g.players[1].board['0,0'] = ['green']
    g.players[1].cubes['0,0'] = 'x'
    expect(computeResult(g).winners).toEqual([1])

    g.players[0].cubes['0,0'] = 'y'
    expect(computeResult(g).winners).toEqual([0, 1]) // shared victory
  })
})

// --------------------------------------------------------------- legality

describe('legalMoves', () => {
  it('offers takeSlot options first, then placements, then endTurn', () => {
    const g = newGame()
    const first = legalMoves(g, 0)
    expect(first.filter((m) => m.type === 'takeSlot')).toHaveLength(5)
    expect(first.some((m) => m.type === 'endTurn')).toBe(false)
    expect(legalMoves(g, 1)).toHaveLength(0) // not their turn

    let s = applyMove(g, 0, { type: 'takeSlot', slot: 0 })
    expect(legalMoves(s, 0).some((m) => m.type === 'placeToken')).toBe(true)
    s = placeAllPending(s, 0)
    expect(legalMoves(s, 0).some((m) => m.type === 'endTurn')).toBe(true)
  })
})
