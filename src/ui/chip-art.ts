/**
 * Shared 2.5D wooden-chip geometry and ink motifs (art-bible: The board).
 * Everything is drawn relative to a chip whose top-face ellipse has radii
 * (rx, ry) centered on (0, 0); callers translate/stack via <g transform>.
 */
import type { TokenColor } from '../engine'
import { wobblyLine } from './wobble'

export type ChipColor = TokenColor | 'wild'

export const CHIP = {
  /** top-face x radius as a fraction of hex size */
  rxOf: (size: number) => size * 0.58,
  /** ellipse squash */
  squash: 0.48,
  /** cylinder height as a fraction of hex size */
  heightOf: (size: number) => size * 0.3,
}

export function chipFills(color: ChipColor): { top: string; side: string } {
  if (color === 'wild') return { top: 'var(--paper-deep)', side: 'var(--line)' }
  return { top: `var(--${color}-hi)`, side: `var(--${color}-lo)` }
}

/** Cylinder side path for a chip whose top ellipse sits at (0,0). */
export function chipSidePath(rx: number, ry: number, h: number): string {
  return `M ${-rx} 0 v ${h} A ${rx} ${ry} 0 0 0 ${rx} ${h} v ${-h}`
}

/**
 * The ink motif for a chip's top face, keyed by what the chip is when it is
 * the TOP of its stack. Paths are sized for rx≈12 and scaled by the caller.
 * All strokes: var(--ink), width 1.6, round caps — one hand, one pen.
 */
export function topMotif(color: ChipColor, rx: number): string[] {
  const s = rx / 12
  switch (color) {
    case 'green': // canopy blob + trunk tick
      return [
        `M ${-6 * s} ${1 * s} Q ${-7 * s} ${-4 * s} ${-2 * s} ${-3.4 * s} Q ${0} ${-6 * s} ${3 * s} ${-3.8 * s} Q ${7 * s} ${-4 * s} ${5.4 * s} ${0.4 * s} Q ${6 * s} ${3 * s} ${2 * s} ${2.6 * s} Q ${-1 * s} ${4.4 * s} ${-4 * s} ${2.6 * s} Q ${-7 * s} ${3 * s} ${-6 * s} ${1 * s} Z`,
      ]
    case 'gray': // twin peaks
      return [
        `M ${-8 * s} ${3.4 * s} L ${-3 * s} ${-3.4 * s} L ${-0.5 * s} ${0.6 * s} L ${2.5 * s} ${-2.4 * s} L ${7 * s} ${3.4 * s}`,
      ]
    case 'blue': // two wave strokes
      return [
        wobblyLine(-7 * s, -1.4 * s, 7 * s, -1.4 * s, 1.7 * s, 3),
        wobblyLine(-5 * s, 2.4 * s, 5 * s, 2.4 * s, 1.4 * s, 2),
      ]
    case 'yellow': // seed dots (drawn as tiny strokes)
      return [-5, 0, 5].flatMap((x) => [
        `M ${x * s} ${-2 * s} l ${0.01} 0`,
        `M ${(x + 2.4) * s} ${2 * s} l ${0.01} 0`,
      ])
    case 'red': // gabled roof
      return [
        `M ${-6 * s} ${2.6 * s} L ${0} ${-3.6 * s} L ${6 * s} ${2.6 * s} Z`,
        `M ${-3 * s} ${2.6 * s} v ${-0.01}`,
      ]
    case 'brown': // growth rings
      return [
        `M ${-4.4 * s} 0 A ${4.4 * s} ${2.1 * s} 0 1 0 ${4.4 * s} 0 A ${4.4 * s} ${2.1 * s} 0 1 0 ${-4.4 * s} 0`,
        `M ${-1.8 * s} 0 A ${1.8 * s} ${0.9 * s} 0 1 0 ${1.8 * s} 0 A ${1.8 * s} ${0.9 * s} 0 1 0 ${-1.8 * s} 0`,
      ]
    case 'wild': // three ticks: "any support"
      return [
        `M ${-4 * s} ${1.5 * s} l ${2 * s} ${-3 * s}`,
        `M ${-0.6 * s} ${1.5 * s} l ${2 * s} ${-3 * s}`,
        `M ${2.8 * s} ${1.5 * s} l ${2 * s} ${-3 * s}`,
      ]
  }
}
