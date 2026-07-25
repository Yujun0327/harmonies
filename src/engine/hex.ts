import type { HexId } from './types'

/** The six axial neighbor directions of a flat-top hex. */
export const DIRS: readonly (readonly [number, number])[] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
]

export const hexId = (q: number, r: number): HexId => `${q},${r}`

export function parseHex(id: HexId): [number, number] {
  const comma = id.indexOf(',')
  return [Number(id.slice(0, comma)), Number(id.slice(comma + 1))]
}

export function neighbors(id: HexId): HexId[] {
  const [q, r] = parseHex(id)
  return DIRS.map(([dq, dr]) => hexId(q + dq, r + dr))
}

/** Rotate an axial offset 60° clockwise: (q, r) → (-r, q + r). */
export function rotate60(q: number, r: number): [number, number] {
  return [-r, q + r]
}

/**
 * Pixel center of a flat-top hex with circumradius `size`:
 * x = 1.5·size·q, y = √3·size·(r + q/2). Used by the UI, kept here so the
 * board data and its geometry share one convention.
 */
export function hexToPixel(q: number, r: number, size: number): { x: number; y: number } {
  return { x: 1.5 * size * q, y: Math.sqrt(3) * size * (r + q / 2) }
}
