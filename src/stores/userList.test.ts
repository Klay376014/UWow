import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchUsers, type FetchUsersOptions } from '../api/users'
import { findUser, queryUsers } from '../mocks/db'
import { createEmptyFilters, type UserQuery } from '../types/user'
import { usePinStore } from './pins'
import { useUserListStore } from './userList'

const api = vi.hoisted(() => ({ delays: [] as number[], fail: false }))

vi.mock('../api/users', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/users')>()),
  fetchUsers: vi.fn(async (query: UserQuery, opts: FetchUsersOptions) => {
    const filters = { ...query.filters, position: [...query.filters.position] }
    const sort = { ...query.sort }
    await new Promise((r) => setTimeout(r, api.delays.shift() ?? 0))
    if (api.fail) throw new Error('Network down')
    return queryUsers({
      filters,
      sort,
      offset: opts.offset,
      limit: opts.limit,
      excludeIds: new Set(opts.excludeIds ?? []),
      ids: opts.ids ? new Set(opts.ids) : null,
    })
  }),
}))

beforeEach(() => {
  vi.mocked(fetchUsers).mockClear()
  localStorage.clear()
  api.delays = []
  api.fail = false
  setActivePinia(createPinia())
})

async function loadAll(store: ReturnType<typeof useUserListStore>) {
  while (store.hasMore) await store.loadMore()
}

const indexOf = (store: ReturnType<typeof useUserListStore>, id: string) => store.rows.findIndex((r) => r.id === id)

describe('user list store', () => {
  it('loads the first page of 500', async () => {
    const store = useUserListStore()
    await store.reload()
    expect(store.rows).toHaveLength(500)
    expect(store.total).toBe(2000)
    expect(store.hasMore).toBe(true)
  })

  it('keeps pinned rows at their positions across pages and sort orders', async () => {
    usePinStore().pin('10', 'Ten', 2)
    usePinStore().pin('20', 'Twenty', 700)
    const store = useUserListStore()

    for (const sort of [{ key: null, dir: 'asc' }, { key: 'age', dir: 'desc' }, { key: 'userName', dir: 'asc' }] as const) {
      Object.assign(store.sort, sort)
      await store.reload()
      expect(store.rows).toHaveLength(500)
      await loadAll(store)
      expect(store.rows).toHaveLength(2000)
      expect(new Set(store.rows.map((r) => r.id)).size).toBe(2000)
      expect(indexOf(store, '10')).toBe(2)
      expect(indexOf(store, '20')).toBe(700)
    }
  })

  it('hides pinned rows that do not match the filters', async () => {
    usePinStore().pin('10', 'Ten', 0)
    const store = useUserListStore()
    await store.reload()
    const pinned = store.rows[0]
    await store.applyFilters({ ...createEmptyFilters(), location: pinned.location === 'Tokyo' ? 'Berlin' : 'Tokyo' })
    expect(indexOf(store, '10')).toBe(-1)
    expect(store.rows.every((r) => r.location !== pinned.location)).toBe(true)
  })

  it('moves a pin past the end of a small result to the tail', async () => {
    const target = findUser('10')
    usePinStore().pin('10', 'Ten', 1500)
    const store = useUserListStore()
    await store.applyFilters({ ...createEmptyFilters(), position: [target.position], location: target.location })
    await loadAll(store)
    expect(store.total).toBeLessThan(100)
    expect(indexOf(store, '10')).toBe(store.rows.length - 1)
  })

  it('keeps pin positions when a regular row above them is removed', async () => {
    usePinStore().pin('10', 'Ten', 3)
    const store = useUserListStore()
    await store.reload()
    const victim = store.rows[0].id
    store.removeRow(victim)
    expect(indexOf(store, victim)).toBe(-1)
    expect(indexOf(store, '10')).toBe(3)
    expect(store.total).toBe(1999)
  })

  it('unpins a pinned row when it is removed', async () => {
    const pins = usePinStore()
    pins.pin('10', 'Ten', 3)
    const store = useUserListStore()
    await store.reload()
    store.removeRow('10')
    expect(indexOf(store, '10')).toBe(-1)
    expect(pins.pins).toEqual([])
  })

  it('ignores a slower response from an outdated query', async () => {
    const store = useUserListStore()
    api.delays = [200, 0]
    const first = store.applyFilters({ ...createEmptyFilters(), location: 'Tokyo' })
    await vi.waitFor(() => expect(fetchUsers).toHaveBeenCalledTimes(1), { interval: 1 })
    const second = store.applyFilters({ ...createEmptyFilters(), location: 'Berlin' })
    await Promise.all([first, second])
    expect(store.rows.length).toBeGreaterThan(0)
    expect(store.rows.every((r) => r.location === 'Berlin')).toBe(true)
    expect(store.loading).toBe(false)
  })

  it('surfaces errors and recovers on retry', async () => {
    const store = useUserListStore()
    api.fail = true
    await store.reload()
    expect(store.error).toBe('Network down')
    expect(store.rows).toEqual([])
    api.fail = false
    await store.retry()
    expect(store.error).toBeNull()
    expect(store.rows).toHaveLength(500)
  })
})
