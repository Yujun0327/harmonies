import { CARDS, SIDE_A, SIDE_A_SET } from '../data'
import { deepClone } from './clone'
import { legalPlacementHexes } from './legality'
import { cubePlacements } from './patterns'
import { computeResult } from './scoring'
import { canAdd } from './terrain'
import { MAX_IN_PROGRESS } from './setup'
import type { GameState, Move, Seat } from './types'

export class RulesError extends Error {}

/**
 * The single pure reducer: validates and applies one move, returning a new
 * state. Never mutates `prev`. Throws RulesError on any illegal move — the
 * session layer treats a throw on a remote move as a desync tripwire.
 */
export function applyMove(prev: GameState, actor: Seat, move: Move): GameState {
  if (prev.result) throw new RulesError('game is over')
  if (actor !== prev.turn) throw new RulesError('not your turn')
  const s = deepClone(prev)
  const player = s.players[actor]

  switch (move.type) {
    case 'takeSlot': {
      if (s.tookSlot) throw new RulesError('already took a slot this turn (§3)')
      const slot = s.slots[move.slot]
      if (!slot) throw new RulesError('no such slot')
      if (slot.length === 0) throw new RulesError('slot is empty')
      s.pendingTokens = slot
      s.slots[move.slot] = []
      s.tookSlot = true
      s.takenSlot = move.slot
      break
    }

    case 'placeToken': {
      const color = s.pendingTokens[move.index]
      if (color === undefined) throw new RulesError('no such pending token')
      if (move.hex === null) {
        // RL-7: discard to the box, only when truly unplaceable
        if (legalPlacementHexes(player, color).length > 0)
          throw new RulesError('token has legal placements; cannot discard (RL-7)')
      } else {
        if (!SIDE_A_SET.has(move.hex)) throw new RulesError('hex is not on the board')
        if (player.cubes[move.hex] !== undefined)
          throw new RulesError('hex is locked by an animal cube (R4.8)')
        if (!canAdd(player.board[move.hex], color))
          throw new RulesError('illegal stack shape (§4)')
        ;(player.board[move.hex] ??= []).push(color)
      }
      s.pendingTokens.splice(move.index, 1)
      break
    }

    case 'takeCard': {
      if (s.tookCard) throw new RulesError('already took a card this turn (§3)')
      if (player.inProgress.length >= MAX_IN_PROGRESS)
        throw new RulesError('already 4 cards in progress (§3)')
      const id = s.cardRow[move.row]
      if (id === null || id === undefined) throw new RulesError('card row slot is empty')
      player.inProgress.push({ cardId: id, cubesPlaced: 0 })
      s.cardRow[move.row] = null
      s.tookCard = true
      break
    }

    case 'placeCube': {
      const ip = player.inProgress.find((c) => c.cardId === move.cardId)
      if (!ip) throw new RulesError('card is not in progress')
      const card = CARDS[move.cardId]
      if (!cubePlacements(player, card, SIDE_A_SET).includes(move.hex))
        throw new RulesError('habitat pattern not satisfied at that hex (§5)')
      player.cubes[move.hex] = card.id
      ip.cubesPlaced++
      if (ip.cubesPlaced >= card.track.length) {
        player.inProgress = player.inProgress.filter((c) => c.cardId !== card.id)
        player.completed.push(card.id)
      }
      break
    }

    case 'endTurn': {
      const slotsAllEmpty = s.slots.every((sl) => sl.length === 0)
      if (!s.tookSlot && !slotsAllEmpty)
        throw new RulesError('must take a slot of tokens this turn (§3)')
      if (s.pendingTokens.length > 0)
        throw new RulesError('all taken tokens must be placed (or discarded) first')

      // Refill the emptied slot from the bag (RL-5: partial or empty refills).
      if (s.takenSlot !== null) {
        const remaining = s.bag.length - s.bagCursor
        if (remaining <= 0) {
          s.endTriggered = true // R7.1
        } else {
          const n = Math.min(3, remaining)
          s.slots[s.takenSlot] = s.bag.slice(s.bagCursor, s.bagCursor + n)
          s.bagCursor += n
        }
      }

      // Refill the card row from the deck.
      for (let i = 0; i < s.cardRow.length; i++) {
        if (s.cardRow[i] === null && s.deckCursor < s.deck.length) {
          s.cardRow[i] = s.deck[s.deckCursor++]
        }
      }

      // R7.2: board nearly full.
      const emptyHexes = SIDE_A.filter((h) => (player.board[h]?.length ?? 0) === 0).length
      if (emptyHexes <= 2) s.endTriggered = true

      s.turnsTaken[actor]++
      s.tookSlot = false
      s.takenSlot = null
      s.tookCard = false

      // R7.3: once triggered, finish the round so all seats have equal turns.
      const allEqual = s.turnsTaken.every((t) => t === s.turnsTaken[0])
      if (s.endTriggered && allEqual) {
        s.result = computeResult(s)
      } else {
        s.turn = (s.turn + 1) % s.players.length
      }
      break
    }
  }

  return s
}
