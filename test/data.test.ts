import { describe, expect, it } from 'vitest'
import { CARDS, CARD_IDS, SIDE_A, SIDE_A_SET } from '../src/data'
import { DIRS, hexId, neighbors, parseHex } from '../src/engine'

describe('board data (side A)', () => {
  it('has exactly 23 hexes', () => {
    expect(SIDE_A).toHaveLength(23)
    expect(SIDE_A_SET.size).toBe(23)
  })

  it('has columns of heights 5-4-5-4-5', () => {
    const byCol = new Map<number, number>()
    for (const h of SIDE_A) {
      const [q] = parseHex(h)
      byCol.set(q, (byCol.get(q) ?? 0) + 1)
    }
    expect([...byCol.entries()].sort(([a], [b]) => a - b)).toEqual([
      [0, 5],
      [1, 4],
      [2, 5],
      [3, 4],
      [4, 5],
    ])
  })

  it('is fully connected', () => {
    const seen = new Set<string>([SIDE_A[0]])
    const queue = [SIDE_A[0]]
    while (queue.length) {
      for (const n of neighbors(queue.pop()!)) {
        if (SIDE_A_SET.has(n) && !seen.has(n)) {
          seen.add(n)
          queue.push(n)
        }
      }
    }
    expect(seen.size).toBe(23)
  })
})

describe('card data', () => {
  it('has exactly 32 cards with unique ids', () => {
    expect(CARD_IDS).toHaveLength(32)
    expect(new Set(CARD_IDS).size).toBe(32)
  })

  it('every card has a 2-3 slot strictly ascending track', () => {
    for (const card of Object.values(CARDS)) {
      expect(card.track.length, card.id).toBeGreaterThanOrEqual(2)
      expect(card.track.length, card.id).toBeLessThanOrEqual(3)
      for (let i = 1; i < card.track.length; i++) {
        expect(card.track[i], card.id).toBeGreaterThan(card.track[i - 1])
      }
    }
  })

  it('cube index points inside the pattern', () => {
    for (const card of Object.values(CARDS)) {
      expect(card.cube, card.id).toBeGreaterThanOrEqual(0)
      expect(card.cube, card.id).toBeLessThan(card.pattern.length)
    }
  })

  it('patterns are connected shapes of 1-3 hexes with no duplicate hexes', () => {
    for (const card of Object.values(CARDS)) {
      const hexes = card.pattern.map((p) => hexId(p.q, p.r))
      expect(hexes.length, card.id).toBeGreaterThanOrEqual(1)
      expect(hexes.length, card.id).toBeLessThanOrEqual(3)
      expect(new Set(hexes).size, card.id).toBe(hexes.length)
      // connectivity via BFS over axial neighbors
      const set = new Set(hexes)
      const seen = new Set([hexes[0]])
      const queue = [hexes[0]]
      while (queue.length) {
        const [q, r] = parseHex(queue.pop()!)
        for (const [dq, dr] of DIRS) {
          const n = hexId(q + dq, r + dr)
          if (set.has(n) && !seen.has(n)) {
            seen.add(n)
            queue.push(n)
          }
        }
      }
      expect(seen.size, `${card.id} pattern must be contiguous`).toBe(hexes.length)
    }
  })

  it('tree/mountain requirements carry valid sizes', () => {
    for (const card of Object.values(CARDS)) {
      for (const p of card.pattern) {
        if (p.read.type === 'tree') expect([1, 2, 3], card.id).toContain(p.read.size)
        if (p.read.type === 'mountain') expect([1, 2, 3], card.id).toContain(p.read.height)
      }
    }
  })
})
