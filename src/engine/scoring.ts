import { CARDS, SIDE_A } from '../data'
import { neighbors } from './hex'
import { readStack } from './terrain'
import type { GameResult, GameState, HexId, PlayerState, ScoreBreakdown, Seat } from './types'

/** S6.1 — trees score 1/3/7 by size; bare brown scores 0. */
export function scoreTrees(player: PlayerState): number {
  const POINTS = { 1: 1, 2: 3, 3: 7 } as const
  let total = 0
  for (const stack of Object.values(player.board)) {
    const read = readStack(stack)
    if (read.kind === 'tree') total += POINTS[read.size]
  }
  return total
}

/** S6.2 — mountains score 1/3/7 by height, but only when adjacent to another mountain. */
export function scoreMountains(player: PlayerState): number {
  const POINTS = { 1: 1, 2: 3, 3: 7 } as const
  let total = 0
  for (const [hex, stack] of Object.entries(player.board)) {
    const read = readStack(stack)
    if (read.kind !== 'mountain') continue
    const hasMountainNeighbor = neighbors(hex).some(
      (n) => readStack(player.board[n]).kind === 'mountain',
    )
    if (hasMountainNeighbor) total += POINTS[read.height]
  }
  return total
}

/** S6.3 — each contiguous yellow group of ≥2 scores a flat 5. */
export function scoreFields(player: PlayerState): number {
  const yellows = new Set<HexId>(
    Object.entries(player.board)
      .filter(([, stack]) => readStack(stack).kind === 'field')
      .map(([hex]) => hex),
  )
  let groups = 0
  const seen = new Set<HexId>()
  for (const start of yellows) {
    if (seen.has(start)) continue
    let size = 0
    const queue = [start]
    seen.add(start)
    while (queue.length) {
      const h = queue.pop()!
      size++
      for (const n of neighbors(h)) {
        if (yellows.has(n) && !seen.has(n)) {
          seen.add(n)
          queue.push(n)
        }
      }
    }
    if (size >= 2) groups++
  }
  return groups * 5
}

/** S6.4 — a building scores 5 when ≥3 distinct colors top its occupied neighbors (RL-2). */
export function scoreBuildings(player: PlayerState): number {
  let total = 0
  for (const [hex, stack] of Object.entries(player.board)) {
    if (readStack(stack).kind !== 'building') continue
    const colors = new Set<string>()
    for (const n of neighbors(hex)) {
      const nStack = player.board[n]
      if (nStack && nStack.length > 0) colors.add(nStack[nStack.length - 1])
    }
    if (colors.size >= 3) total += 5
  }
  return total
}

const RIVER_POINTS = [0, 0, 2, 5, 8, 11, 15]

/** S6.5 — only the single longest blue chain scores (RL-4: longest simple path). */
export function scoreWater(player: PlayerState): number {
  const blues = new Set<HexId>(
    Object.entries(player.board)
      .filter(([, stack]) => readStack(stack).kind === 'water')
      .map(([hex]) => hex),
  )
  if (blues.size === 0) return 0
  let best = 0
  const visited = new Set<HexId>()
  const dfs = (h: HexId, len: number): void => {
    if (len > best) best = len
    for (const n of neighbors(h)) {
      if (blues.has(n) && !visited.has(n)) {
        visited.add(n)
        dfs(n, len + 1)
        visited.delete(n)
      }
    }
  }
  for (const start of blues) {
    visited.add(start)
    dfs(start, 1)
    visited.delete(start)
  }
  return best < RIVER_POINTS.length ? RIVER_POINTS[best] : 15 + 4 * (best - 6)
}

/** S6.6 — per card: value of the highest slot whose cube is placed (RL-3). */
export function scoreAnimals(player: PlayerState): Record<string, number> {
  const out: Record<string, number> = {}
  for (const ip of player.inProgress) {
    out[ip.cardId] = ip.cubesPlaced > 0 ? CARDS[ip.cardId].track[ip.cubesPlaced - 1] : 0
  }
  for (const id of player.completed) {
    out[id] = CARDS[id].track[CARDS[id].track.length - 1]
  }
  return out
}

export function scoreBreakdown(player: PlayerState): ScoreBreakdown {
  const animals = scoreAnimals(player)
  const animalTotal = Object.values(animals).reduce((a, b) => a + b, 0)
  const trees = scoreTrees(player)
  const mountains = scoreMountains(player)
  const fields = scoreFields(player)
  const buildings = scoreBuildings(player)
  const water = scoreWater(player)
  return {
    trees,
    mountains,
    fields,
    buildings,
    water,
    animals,
    animalTotal,
    total: trees + mountains + fields + buildings + water + animalTotal,
  }
}

/** R7.4 — highest total; tie → most cubes on board; still tied → shared victory. */
export function computeResult(state: GameState): GameResult {
  const breakdown = state.players.map(scoreBreakdown)
  const maxScore = Math.max(...breakdown.map((b) => b.total))
  let winners: Seat[] = breakdown
    .map((b, seat) => ({ b, seat }))
    .filter(({ b }) => b.total === maxScore)
    .map(({ seat }) => seat)
  if (winners.length > 1) {
    const cubeCount = (seat: Seat) => Object.keys(state.players[seat].cubes).length
    const maxCubes = Math.max(...winners.map(cubeCount))
    winners = winners.filter((seat) => cubeCount(seat) === maxCubes)
  }
  return { breakdown, winners }
}

/** Convenience for tests/UI: how many empty hexes a player has left. */
export function emptyHexCount(player: PlayerState): number {
  return SIDE_A.filter((h) => (player.board[h]?.length ?? 0) === 0).length
}
