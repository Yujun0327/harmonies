import type { CardDef, HexId } from '../engine/types'
import { hexId } from '../engine/hex'
import boardsJson from './boards.json'
import cardsJson from './cards.json'

export const CARDS_PROVISIONAL: boolean = cardsJson.provisional

export const CARDS: Record<string, CardDef> = Object.fromEntries(
  (cardsJson.cards as CardDef[]).map((c) => [c.id, c]),
)

/** Draw-deck contents, in a stable authoring order (shuffled at setup). */
export const CARD_IDS: string[] = (cardsJson.cards as CardDef[]).map((c) => c.id)

/** Personal board side A: 23 hexes, columns 5-4-5-4-5. */
export const SIDE_A: HexId[] = (boardsJson.sideA as [number, number][]).map(([q, r]) =>
  hexId(q, r),
)

export const SIDE_A_SET: Set<HexId> = new Set(SIDE_A)
