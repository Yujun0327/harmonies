import { describe, expect, it } from 'vitest'
import {
  applyMove,
  createGame,
  legalMoves,
  mulberry32,
  publicHash,
  scoreBreakdown,
  type GameState,
  type Move,
  type Seat,
} from '../src/engine'
import { makeConfig } from './helpers'

/**
 * Random playouts with a mild preference for interesting moves (cubes and
 * cards over bare placement), asserting the core invariants every step:
 * the turn holder always has a move, moves replay deterministically, and
 * the game terminates with a coherent result.
 */
function playout(playerCount: number, seed: number) {
  const cfg = makeConfig(playerCount, seed)
  let state = createGame(cfg)
  const rng = mulberry32(seed ^ 0x9e3779b9)
  const log: { actor: Seat; move: Move }[] = []
  let steps = 0

  while (!state.result) {
    steps++
    expect(steps, 'game must terminate').toBeLessThan(3000)
    const seat = state.turn
    const moves = legalMoves(state, seat)
    expect(moves.length, 'turn holder always has a legal move').toBeGreaterThan(0)

    const pick = <T extends Move['type']>(t: T) => moves.filter((m) => m.type === t)
    const cubes = pick('placeCube')
    const cards = pick('takeCard')
    let move: Move
    if (cubes.length > 0 && rng() < 0.9) {
      move = cubes[Math.floor(rng() * cubes.length)]
    } else if (cards.length > 0 && rng() < 0.35) {
      move = cards[Math.floor(rng() * cards.length)]
    } else {
      const rest = moves.filter((m) => m.type !== 'placeCube' && m.type !== 'takeCard')
      move = rest.length > 0 ? rest[Math.floor(rng() * rest.length)] : moves[0]
    }
    state = applyMove(state, seat, move)
    log.push({ actor: seat, move })
  }
  return { cfg, state, log }
}

function replay(cfg: ReturnType<typeof makeConfig>, log: { actor: Seat; move: Move }[]) {
  let state = createGame(cfg)
  for (const { actor, move } of log) state = applyMove(state, actor, move)
  return state
}

describe('random playouts', () => {
  for (const playerCount of [2, 3, 4]) {
    for (const seed of [7, 42, 1234]) {
      it(`${playerCount}p seed ${seed}: terminates, equal turns, replay-identical`, () => {
        const { cfg, state, log } = playout(playerCount, seed)

        // result is coherent
        expect(state.result).not.toBeNull()
        const result = state.result!
        expect(result.breakdown).toHaveLength(playerCount)
        expect(result.winners.length).toBeGreaterThan(0)

        // everyone took the same number of turns (R7.3)
        expect(new Set(state.turnsTaken).size).toBe(1)
        expect(state.turnsTaken[0]).toBeGreaterThan(0)

        // breakdown recomputes from final state and is internally consistent
        state.players.forEach((p, i) => {
          const b = scoreBreakdown(p)
          expect(b.total).toBe(result.breakdown[i].total)
          expect(b.total).toBe(
            b.trees + b.mountains + b.fields + b.buildings + b.water + b.animalTotal,
          )
          for (const v of [b.trees, b.mountains, b.fields, b.buildings, b.water]) {
            expect(v).toBeGreaterThanOrEqual(0)
          }
        })

        // the winner really has the top score
        const totals = result.breakdown.map((b) => b.total)
        const max = Math.max(...totals)
        for (const w of result.winners) expect(totals[w]).toBe(max)

        // determinism: replaying the log reproduces the exact final state
        expect(publicHash(replay(cfg, log))).toBe(publicHash(state))
      })
    }
  }

  it('board stacks never exceed height 3 and never sit on cubes (spot invariants)', () => {
    const { state } = playout(3, 99)
    for (const player of state.players) {
      for (const [hex, stack] of Object.entries(player.board)) {
        expect(stack.length).toBeLessThanOrEqual(3)
        expect(stack.length).toBeGreaterThan(0)
        void hex
      }
      // every cube sits on a hex that has tokens under it
      for (const hex of Object.keys(player.cubes)) {
        expect((player.board[hex] ?? []).length).toBeGreaterThan(0)
      }
    }
  })

  it('bag never overdraws and slots hold at most 3', () => {
    const { state } = playout(2, 5)
    expect(state.bagCursor).toBeLessThanOrEqual(state.bag.length)
    for (const slot of state.slots) expect(slot.length).toBeLessThanOrEqual(3)
  })
})
