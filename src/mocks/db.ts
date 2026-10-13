import { faker } from '@faker-js/faker/locale/en'
import type { SortState, User, UserFilters, UserInput } from '../types/user'
import { AGE_MAX, AGE_MIN } from '../validation/user'

const SEED = 20261013
const ROW_COUNT = 2000

export const POSITIONS = [
  'Frontend Engineer',
  'Backend Engineer',
  'QA Engineer',
  'Product Manager',
  'Designer',
  'DevOps Engineer',
  'Data Analyst',
  'HR Specialist',
]

export const LOCATIONS = ['Taipei', 'Taichung', 'Kaohsiung', 'Tokyo', 'Singapore', 'San Francisco', 'London', 'Berlin']

faker.seed(SEED)

let nextId = 1
const newId = () => String(nextId++)

const users: User[] = Array.from({ length: ROW_COUNT }, () => ({
  id: newId(),
  userName: faker.person.fullName(),
  position: faker.helpers.arrayElement(POSITIONS),
  location: faker.helpers.arrayElement(LOCATIONS),
  age: faker.number.int({ min: AGE_MIN, max: AGE_MAX }),
  dateStart: faker.date.between({ from: '2010-01-01', to: '2026-10-01' }).toISOString().slice(0, 10),
  version: 1,
}))

export class DbError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const includesIgnoreCase = (value: string, keyword: string) =>
  !keyword || value.toLowerCase().includes(keyword.trim().toLowerCase())

const matches = (u: User, f: UserFilters) =>
  includesIgnoreCase(u.userName, f.userName) &&
  (f.position.length === 0 || f.position.includes(u.position)) &&
  includesIgnoreCase(u.location, f.location) &&
  (f.ageMin == null || u.age >= f.ageMin) &&
  (f.ageMax == null || u.age <= f.ageMax) &&
  (!f.dateFrom || u.dateStart >= f.dateFrom) &&
  (!f.dateTo || u.dateStart <= f.dateTo)

// Tie-break on id so offset paging stays stable across requests when sort values collide.
const compare = (sort: SortState) => (a: User, b: User) => {
  if (sort.key) {
    const av = a[sort.key]
    const bv = b[sort.key]
    const diff = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv))
    if (diff !== 0) return sort.dir === 'asc' ? diff : -diff
  }
  return Number(a.id) - Number(b.id)
}

export interface QueryParams {
  filters: UserFilters
  sort: SortState
  offset: number
  limit: number
  excludeIds: Set<string>
  ids: Set<string> | null
}

export function queryUsers(p: QueryParams) {
  const rows = users
    .filter((u) => !p.excludeIds.has(u.id) && (!p.ids || p.ids.has(u.id)) && matches(u, p.filters))
    .sort(compare(p.sort))
  return { items: rows.slice(p.offset, p.offset + p.limit), total: rows.length }
}

export function createUser(input: UserInput): User {
  const user: User = { ...input, id: newId(), version: 1 }
  users.push(user)
  return user
}

function findIndexOrThrow(id: string, version: number) {
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) throw new DbError(404, 'User not found')
  if (users[index].version !== version) throw new DbError(409, 'Version conflict')
  return index
}

export function updateUser(id: string, input: UserInput, version: number): User {
  const index = findIndexOrThrow(id, version)
  users[index] = { ...users[index], ...input, version: version + 1 }
  return users[index]
}

export function deleteUser(id: string, version: number) {
  users.splice(findIndexOrThrow(id, version), 1)
}

export function findUser(id: string): User {
  const user = users.find((u) => u.id === id)
  if (!user) throw new DbError(404, 'User not found')
  return user
}

export function touchUser(id: string): User {
  const user = findUser(id)
  user.age = user.age >= AGE_MAX ? AGE_MIN : user.age + 1
  user.version += 1
  return user
}
