import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { MAX_PINS, usePinStore } from './pins'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

const positions = (store: ReturnType<typeof usePinStore>) => store.pins.map((p) => [p.userId, p.position])

describe('pin store', () => {
  it('pushes the existing pin down when a slot is taken', () => {
    const store = usePinStore()
    store.pin('a', 'A', 2)
    store.pin('b', 'B', 3)
    store.pin('x', 'X', 2)
    expect(positions(store)).toEqual([
      ['x', 2],
      ['a', 3],
      ['b', 4],
    ])
  })

  it('moves a re-pinned row instead of duplicating it', () => {
    const store = usePinStore()
    store.pin('a', 'A', 2)
    store.pin('a', 'A', 8)
    expect(positions(store)).toEqual([['a', 8]])
  })

  it('does not pull other pins back up on unpin', () => {
    const store = usePinStore()
    store.pin('a', 'A', 2)
    store.pin('x', 'X', 2)
    store.unpin('x')
    expect(positions(store)).toEqual([['a', 3]])
  })

  it(`stops at ${MAX_PINS} pins`, () => {
    const store = usePinStore()
    for (let i = 0; i < MAX_PINS; i++) expect(store.pin(`u${i}`, `U${i}`, i)).toBe(true)
    expect(store.pin('extra', 'Extra', 500)).toBe(false)
    expect(store.pin('u0', 'U0', 600)).toBe(true)
    expect(store.pins).toHaveLength(MAX_PINS)
  })

  it('renames and retains pins', () => {
    const store = usePinStore()
    store.pin('a', 'A', 0)
    store.pin('b', 'B', 1)
    store.rename('a', 'Alice')
    store.retain(new Set(['a']))
    expect(store.pins).toEqual([{ userId: 'a', userName: 'Alice', position: 0 }])
  })

  it('persists to localStorage', async () => {
    usePinStore().pin('a', 'A', 4)
    await nextTick()
    expect(JSON.parse(localStorage.getItem('uwow:pins')!)).toEqual([{ userId: 'a', userName: 'A', position: 4 }])
  })
})
