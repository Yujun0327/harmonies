import { CARD_IDS } from '../data'
import { mulberry32, seededShuffle } from './rng'
import type { GameConfig, GameState, TokenColor } from './types'

/** Official token mix — 120 total (RULES.md §1). */
export const TOKEN_COUNTS: Record<TokenColor, number> = {
  gray: 23,
  blue: 23,
  brown: 21,
  green: 19,
  yellow: 19,
  red: 15,
}

export const SLOT_COUNT = 5
export const CARD_ROW_SIZE = 5
export const MAX_IN_PROGRESS = 4

/**
 * Deterministic setup: every draw derives from cfg.sharedSeed through ONE rng
 * in a FIXED order (bag shuffle, then deck shuffle). This determinism is what
 * makes log replay and resync work — never reorder these calls.
 */
export function createGame(cfg: GameConfig): GameState {
  const rng = mulberry32(cfg.sharedSeed)

  const fullBag: TokenColor[] = []
  for (const [color, n] of Object.entries(TOKEN_COUNTS) as [TokenColor, number][]) {
    for (let i = 0; i < n; i++) fullBag.push(color)
  }
  const bag = seededShuffle(fullBag, rng)
  const deck = seededShuffle(CARD_IDS, rng)

  let bagCursor = 0
  const slots: TokenColor[][] = []
  for (let i = 0; i < SLOT_COUNT; i++) {
    slots.push(bag.slice(bagCursor, bagCursor + 3))
    bagCursor += 3
  }

  return {
    players: Array.from({ length: cfg.playerCount }, () => ({
      board: {},
      cubes: {},
      inProgress: [],
      completed: [],
    })),
    slots,
    cardRow: deck.slice(0, CARD_ROW_SIZE),
    deck,
    deckCursor: CARD_ROW_SIZE,
    bag,
    bagCursor,
    turn: cfg.startingSeat,
    startingSeat: cfg.startingSeat,
    tookSlot: false,
    takenSlot: null,
    pendingTokens: [],
    tookCard: false,
    endTriggered: false,
    turnsTaken: Array.from({ length: cfg.playerCount }, () => 0),
    result: null,
  }
}
