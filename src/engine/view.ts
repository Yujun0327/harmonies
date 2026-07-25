import type { GameState, Seat } from './types'

/**
 * Harmonies is fully open information: no hands, no hidden stacks, and the
 * bag/deck order is seed-derived identically on every client. Redaction is
 * the identity — kept so the session layer's shape matches splendor's.
 */
export function redact(state: GameState, _viewer: Seat | null): GameState {
  return state
}
