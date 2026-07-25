export type Seat = number

export type TokenColor = 'gray' | 'blue' | 'brown' | 'green' | 'yellow' | 'red'

/** Axial coordinate "q,r" of a flat-top hex. */
export type HexId = string

export interface GameConfig {
  playerCount: number
  /** Agreed once by the host; all shared randomness derives from it. */
  sharedSeed: number
  startingSeat: Seat
  names: string[]
  rulesVersion: number
}

/** A terrain requirement printed on an animal card. */
export type RequiredRead =
  | { type: 'water' }
  | { type: 'field' }
  | { type: 'building' }
  | { type: 'tree'; size: 1 | 2 | 3 }
  | { type: 'mountain'; height: 1 | 2 | 3 }

export interface PatternHex {
  q: number
  r: number
  read: RequiredRead
}

export interface CardDef {
  id: string
  name: string
  /** Habitat shape, axial offsets from an arbitrary anchor. */
  pattern: PatternHex[]
  /** Index into `pattern` of the hex that receives cubes. */
  cube: number
  /** Escalating points per placed cube; length = cube count. */
  track: number[]
}

export interface InProgressCard {
  cardId: string
  cubesPlaced: number
}

export interface PlayerState {
  /** Stacks, bottom → top. Absent key = empty hex. */
  board: Record<HexId, TokenColor[]>
  /** hex → cardId whose cube occupies it. A cubed hex is locked forever (R4.8). */
  cubes: Record<HexId, string>
  inProgress: InProgressCard[]
  completed: string[]
}

export interface ScoreBreakdown {
  trees: number
  mountains: number
  fields: number
  buildings: number
  water: number
  /** cardId → points earned from that card. */
  animals: Record<string, number>
  animalTotal: number
  total: number
}

export interface GameResult {
  breakdown: ScoreBreakdown[]
  winners: Seat[]
}

export interface GameState {
  players: PlayerState[]
  /** 5 central slots, each 0–3 tokens (short only during the final round, RL-5/6). */
  slots: TokenColor[][]
  /** 5 face-up cards; null = slot empty because the deck ran out. */
  cardRow: (string | null)[]
  /** Full seed-shuffled deck; deckCursor = next card to reveal. */
  deck: string[]
  deckCursor: number
  /** Full seed-shuffled bag; bagCursor = next token to draw. */
  bag: TokenColor[]
  bagCursor: number
  turn: Seat
  startingSeat: Seat
  /** Turn-grammar flags for the current turn. */
  tookSlot: boolean
  takenSlot: number | null
  pendingTokens: TokenColor[]
  tookCard: boolean
  /** An end-of-game trigger has fired (R7.1/R7.2); finish the round. */
  endTriggered: boolean
  turnsTaken: number[]
  result: GameResult | null
}

export type Move =
  | { type: 'takeSlot'; slot: number }
  /**
   * Place pendingTokens[index] on `hex`. `hex: null` discards the token to the
   * box, legal only when it has no legal placement (RL-7).
   */
  | { type: 'placeToken'; index: number; hex: HexId | null }
  | { type: 'takeCard'; row: number }
  | { type: 'placeCube'; cardId: string; hex: HexId }
  | { type: 'endTurn' }
