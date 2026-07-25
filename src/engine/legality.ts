import { CARDS, SIDE_A, SIDE_A_SET } from '../data'
import { cubePlacements } from './patterns'
import { MAX_IN_PROGRESS } from './setup'
import { canAdd } from './terrain'
import type { GameState, HexId, Move, PlayerState, Seat, TokenColor } from './types'

/** Hexes where `color` may legally be placed: legal stack addition, no cube lock. */
export function legalPlacementHexes(player: PlayerState, color: TokenColor): HexId[] {
  return SIDE_A.filter(
    (h) => player.cubes[h] === undefined && canAdd(player.board[h], color),
  )
}

/**
 * Every legal move for `seat`. The UI renders ONLY these; the reducer
 * revalidates everything anyway. For the turn holder this is never empty:
 * endTurn is always reachable once the mandatory take/placements resolve
 * (unplaceable tokens discharge via `hex: null`, RL-7; an all-empty central
 * board waives the mandatory take, RL-8).
 */
export function legalMoves(state: GameState, seat: Seat): Move[] {
  if (state.result || seat !== state.turn) return []
  const moves: Move[] = []
  const player = state.players[seat]

  if (!state.tookSlot) {
    state.slots.forEach((slot, i) => {
      if (slot.length > 0) moves.push({ type: 'takeSlot', slot: i })
    })
  }

  if (state.pendingTokens.length > 0) {
    const seenColor = new Set<TokenColor>()
    state.pendingTokens.forEach((color, index) => {
      if (seenColor.has(color)) return // identical pending tokens ⇒ identical options
      seenColor.add(color)
      const hexes = legalPlacementHexes(player, color)
      if (hexes.length === 0) moves.push({ type: 'placeToken', index, hex: null })
      else for (const hex of hexes) moves.push({ type: 'placeToken', index, hex })
    })
  }

  if (!state.tookCard && player.inProgress.length < MAX_IN_PROGRESS) {
    state.cardRow.forEach((id, row) => {
      if (id !== null) moves.push({ type: 'takeCard', row })
    })
  }

  for (const ip of player.inProgress) {
    const card = CARDS[ip.cardId]
    for (const hex of cubePlacements(player, card, SIDE_A_SET)) {
      moves.push({ type: 'placeCube', cardId: card.id, hex })
    }
  }

  const slotsAllEmpty = state.slots.every((s) => s.length === 0)
  if ((state.tookSlot || slotsAllEmpty) && state.pendingTokens.length === 0) {
    moves.push({ type: 'endTurn' })
  }

  return moves
}
