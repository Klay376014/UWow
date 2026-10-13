import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyFilters, type SortState, type UserFilters } from '../types/user'

type Db = typeof import('./db')
let db: Db

beforeEach(async () => {
  vi.resetModules()
  db = await import('./db')
})

const query = (filters: Partial<UserFilters> = {}, sort: SortState = { key: null, dir: 'asc' }, offset = 0, limit = 5000) =>
  db.queryUsers({
    filters: { ...createEmptyFilters(), ...filters },
    sort,
    offset,
    limit,
    excludeIds: new Set(),
    ids: null,
  })

describe('queryUsers', () => {
  it('seeds 2,000 deterministic rows', async () => {
    const first = query().items.slice(0, 3)
    vi.resetModules()
    db = await import('./db')
    expect(query().total).toBe(2000)
    expect(query().items.slice(0, 3)).toEqual(first)
  })

  it('filters text columns by case-insensitive contains', () => {
    const { items } = query({ location: 'TAI' })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((u) => u.location.toLowerCase().includes('tai'))).toBe(true)
  })

  it('filters position by any of the selected values', () => {
    const { items } = query({ position: ['Designer', 'QA Engineer'] })
    expect(new Set(items.map((u) => u.position))).toEqual(new Set(['Designer', 'QA Engineer']))
  })

  it('filters age and date ranges inclusively', () => {
    const { items } = query({ ageMin: 30, ageMax: 30, dateFrom: '2020-01-01', dateTo: '2020-12-31' })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((u) => u.age === 30 && u.dateStart >= '2020-01-01' && u.dateStart <= '2020-12-31')).toBe(true)
  })

  it.each(['userName', 'position', 'location', 'age', 'dateStart'] as const)('sorts by %s in both directions', (key) => {
    const asc = query({}, { key, dir: 'asc' }).items.map((u) => u[key])
    const desc = query({}, { key, dir: 'desc' }).items.map((u) => u[key])
    const cmp = (a: string | number, b: string | number) =>
      typeof a === 'number' ? a - (b as number) : String(a).localeCompare(String(b))
    expect(asc).toEqual([...asc].sort(cmp))
    expect(desc).toEqual([...desc].sort((a, b) => cmp(b, a)))
  })

  it('pages consistently when sort values tie', () => {
    const sort: SortState = { key: 'age', dir: 'asc' }
    const pages = [0, 500, 1000, 1500].flatMap((offset) => query({}, sort, offset, 500).items.map((u) => u.id))
    expect(pages).toEqual(query({}, sort).items.map((u) => u.id))
    expect(new Set(pages).size).toBe(2000)
  })

  it('supports excludeIds and ids', () => {
    const base = { filters: createEmptyFilters(), sort: { key: null, dir: 'asc' } as SortState, offset: 0, limit: 5000 }
    expect(db.queryUsers({ ...base, excludeIds: new Set(['1', '2']), ids: null }).total).toBe(1998)
    expect(db.queryUsers({ ...base, excludeIds: new Set(), ids: new Set(['1', '2', 'nope']) }).items.map((u) => u.id)).toEqual(['1', '2'])
  })
})

describe('optimistic locking', () => {
  const input = { userName: 'Klay', position: 'Designer', location: 'Taipei', age: 30, dateStart: '2026-10-13' }

  it('updates and bumps the version', () => {
    const updated = db.updateUser('1', input, 1)
    expect(updated).toMatchObject({ ...input, id: '1', version: 2 })
  })

  it('rejects a stale version with 409', () => {
    db.touchUser('1')
    expect(() => db.updateUser('1', input, 1)).toThrow(expect.objectContaining({ status: 409 }))
    expect(() => db.deleteUser('1', 1)).toThrow(expect.objectContaining({ status: 409 }))
  })

  it('reports a missing user with 404', () => {
    db.deleteUser('1', 1)
    expect(() => db.updateUser('1', input, 1)).toThrow(expect.objectContaining({ status: 404 }))
    expect(() => db.deleteUser('1', 1)).toThrow(expect.objectContaining({ status: 404 }))
    expect(() => db.findUser('1')).toThrow(expect.objectContaining({ status: 404 }))
  })

  it('creates users with fresh ids', () => {
    const created = db.createUser(input)
    expect(created).toMatchObject({ id: '2001', version: 1 })
    expect(query().total).toBe(2001)
  })
})
