import type { RequiredRead, TokenColor } from './types'

/** What a stack of tokens reads as, per the rulebook's three stack shapes. */
export type TerrainRead =
  | { kind: 'empty' }
  | { kind: 'water' }
  | { kind: 'field' }
  | { kind: 'tree'; size: 1 | 2 | 3 }
  | { kind: 'mountain'; height: 1 | 2 | 3 }
  | { kind: 'building' }
  /** Legal intermediates that score nothing and satisfy no pattern: */
  | { kind: 'bareBrown'; height: 1 | 2 }
  | { kind: 'bareRed' }

export function readStack(stack: TokenColor[] | undefined): TerrainRead {
  if (!stack || stack.length === 0) return { kind: 'empty' }
  const top = stack[stack.length - 1]
  if (top === 'blue') return { kind: 'water' }
  if (top === 'yellow') return { kind: 'field' }
  if (top === 'green') return { kind: 'tree', size: stack.length as 1 | 2 | 3 }
  if (top === 'red') {
    return stack.length === 2 ? { kind: 'building' } : { kind: 'bareRed' }
  }
  if (top === 'gray') return { kind: 'mountain', height: stack.length as 1 | 2 | 3 }
  return { kind: 'bareBrown', height: stack.length as 1 | 2 }
}

/**
 * Which colors may legally be added on top of this stack (R4, legal-top table
 * in RULES.md §4). Placement on a cubed hex is excluded elsewhere (R4.8).
 */
export function legalAdditions(stack: TokenColor[] | undefined): TokenColor[] {
  if (!stack || stack.length === 0) return ['gray', 'blue', 'brown', 'green', 'yellow', 'red']
  const key = stack.join(',')
  switch (key) {
    case 'brown':
      return ['brown', 'green', 'red']
    case 'brown,brown':
      return ['green']
    case 'gray':
      return ['gray', 'red']
    case 'gray,gray':
      return ['gray']
    case 'red':
      return ['red']
    default:
      return []
  }
}

export function canAdd(stack: TokenColor[] | undefined, color: TokenColor): boolean {
  return legalAdditions(stack).includes(color)
}

/** Does a board read satisfy a card's terrain requirement? (R5.2/R5.3) */
export function readSatisfies(read: TerrainRead, req: RequiredRead): boolean {
  switch (req.type) {
    case 'water':
      return read.kind === 'water'
    case 'field':
      return read.kind === 'field'
    case 'building':
      return read.kind === 'building'
    case 'tree':
      return read.kind === 'tree' && read.size === req.size
    case 'mountain':
      return read.kind === 'mountain' && read.height === req.height
  }
}
