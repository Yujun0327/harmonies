import type {
  GameConfig,
  GameState,
  HexId,
  PlayerState,
  TokenColor,
} from '../src/engine'
import { createGame } from '../src/engine'

export function makeConfig(playerCount = 2, seed = 42): GameConfig {
  return {
    playerCount,
    sharedSeed: seed,
    startingSeat: 0,
    names: Array.from({ length: playerCount }, (_, i) => `P${i + 1}`),
    rulesVersion: 1,
  }
}

export function newGame(playerCount = 2, seed = 42): GameState {
  return createGame(makeConfig(playerCount, seed))
}

export function emptyPlayer(): PlayerState {
  return { board: {}, cubes: {}, inProgress: [], completed: [] }
}

/** Build a player with a hand-authored board for scoring/pattern fixtures. */
export function boardOf(entries: Record<HexId, TokenColor[]>): PlayerState {
  return { ...emptyPlayer(), board: structuredClone(entries) }
}
