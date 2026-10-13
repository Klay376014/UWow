import { describe, expect, it } from 'vitest'
import { insertPin, mergePinned, pinsInWindow, type PinnedItem } from './mergePinned'

const pin = (item: string, position: number): PinnedItem<string> => ({ item, position })

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function reference(regular: string[], pins: PinnedItem<string>[]) {
  const total = regular.length + pins.length
  const out: (string | null)[] = Array(total).fill(null)
  pins.forEach((p, i) => (out[Math.min(p.position, total - pins.length + i)] = p.item))
  let r = 0
  return out.map((x) => x ?? regular[r++])
}

function loadInPages(regular: string[], pins: PinnedItem<string>[], pageSize: number) {
  let loaded: string[] = []
  while (loaded.length < regular.length) {
    const start = mergePinned(loaded, pins, false).length
    const limit = pageSize - pinsInWindow(pins, start, pageSize)
    loaded = [...loaded, ...regular.slice(loaded.length, loaded.length + limit)]
  }
  return mergePinned(loaded, pins, true)
}

describe('mergePinned', () => {
  it('places pinned items at their positions', () => {
    expect(mergePinned(['a', 'b', 'c', 'd'], [pin('X', 0), pin('Y', 3)], true)).toEqual(['X', 'a', 'b', 'Y', 'c', 'd'])
  })

  it('keeps pins beyond the loaded rows hidden until the list is complete', () => {
    expect(mergePinned(['a', 'b'], [pin('X', 1), pin('Y', 10)], false)).toEqual(['a', 'X', 'b'])
  })

  it('moves pins past the end of the result to the tail once complete', () => {
    expect(mergePinned(['a', 'b'], [pin('X', 1), pin('Y', 10), pin('Z', 20)], true)).toEqual(['a', 'X', 'b', 'Y', 'Z'])
  })

  it('returns only pins when there are no regular rows', () => {
    expect(mergePinned([], [pin('X', 5)], true)).toEqual(['X'])
    expect(mergePinned([], [pin('X', 5)], false)).toEqual([])
  })

  it('matches a one-shot layout when loaded page by page', () => {
    const random = mulberry32(42)
    const int = (n: number) => Math.floor(random() * n)
    for (let run = 0; run < 2000; run++) {
      const regular = Array.from({ length: int(40) }, (_, i) => `r${i}`)
      const positions = new Set<number>()
      const pinCount = int(8)
      while (positions.size < pinCount) positions.add(int(60))
      const pins = [...positions].sort((a, b) => a - b).map((p, i) => pin(`p${i}`, p))
      const pageSize = 1 + int(7)
      expect(loadInPages(regular, pins, pageSize)).toEqual(reference(regular, pins))
    }
  })
})

describe('pinsInWindow', () => {
  it('counts pins inside [start, start + size)', () => {
    const pins = [pin('a', 0), pin('b', 4), pin('c', 5), pin('d', 9)]
    expect(pinsInWindow(pins, 0, 5)).toBe(2)
    expect(pinsInWindow(pins, 5, 5)).toBe(2)
    expect(pinsInWindow(pins, 10, 5)).toBe(0)
  })
})

describe('insertPin', () => {
  const p = (userId: string, position: number) => ({ userId, position })

  it('inserts into an empty list', () => {
    expect(insertPin([], p('x', 3))).toEqual([p('x', 3)])
  })

  it('pushes the occupant and any adjacent pins down by one', () => {
    expect(insertPin([p('a', 2), p('b', 3), p('c', 5)], p('x', 2))).toEqual([p('x', 2), p('a', 3), p('b', 4), p('c', 5)])
  })

  it('stops pushing at the first gap', () => {
    expect(insertPin([p('a', 2), p('b', 4)], p('x', 2))).toEqual([p('x', 2), p('a', 3), p('b', 4)])
  })

  it('leaves pins alone when the slot is free', () => {
    expect(insertPin([p('a', 2), p('b', 3)], p('x', 7))).toEqual([p('a', 2), p('b', 3), p('x', 7)])
  })
})
