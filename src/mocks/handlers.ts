import { delay, http, HttpResponse } from 'msw'
import type { SortableKey, SortDir, UserFilters, UserInput } from '../types/user'
import { createUser, DbError, deleteUser, POSITIONS, queryUsers, touchRandomUser, updateUser } from './db'

const SORTABLE: SortableKey[] = ['userName', 'position', 'location', 'age', 'dateStart']

const toNumber = (v: string | null) => (v === null || v === '' ? null : Number(v))
const toIdSet = (v: string | null) => new Set(v ? v.split(',') : [])

function parseFilters(q: URLSearchParams): UserFilters {
  return {
    userName: q.get('userName') ?? '',
    position: q.getAll('position'),
    location: q.get('location') ?? '',
    ageMin: toNumber(q.get('ageMin')),
    ageMax: toNumber(q.get('ageMax')),
    dateFrom: q.get('dateFrom') ?? '',
    dateTo: q.get('dateTo') ?? '',
  }
}

function validate(body: Partial<UserInput>): body is UserInput {
  return (
    typeof body.userName === 'string' &&
    body.userName.trim() !== '' &&
    typeof body.position === 'string' &&
    body.position.trim() !== '' &&
    typeof body.location === 'string' &&
    body.location.trim() !== '' &&
    Number.isInteger(body.age) &&
    typeof body.dateStart === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.dateStart)
  )
}

const errorResponse = (e: unknown) => {
  if (e instanceof DbError) return HttpResponse.json({ message: e.message }, { status: e.status })
  throw e
}

const latency = () => delay(Math.floor(200 + Math.random() * 300))

export const handlers = [
  http.get('/api/positions', async () => {
    await latency()
    return HttpResponse.json(POSITIONS)
  }),

  http.get('/api/users', async ({ request }) => {
    await latency()
    const q = new URL(request.url).searchParams
    const sortBy = q.get('sortBy') as SortableKey | null
    const result = queryUsers({
      filters: parseFilters(q),
      sort: {
        key: sortBy && SORTABLE.includes(sortBy) ? sortBy : null,
        dir: (q.get('sortDir') as SortDir) === 'desc' ? 'desc' : 'asc',
      },
      offset: Math.max(0, Number(q.get('offset') ?? 0)),
      limit: Math.min(500, Math.max(0, Number(q.get('limit') ?? 500))),
      excludeIds: toIdSet(q.get('excludeIds')),
      ids: q.has('ids') ? toIdSet(q.get('ids')) : null,
    })
    return HttpResponse.json(result)
  }),

  http.post('/api/users', async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<UserInput>
    if (!validate(body)) return HttpResponse.json({ message: 'Invalid payload' }, { status: 400 })
    return HttpResponse.json(createUser(body), { status: 201 })
  }),

  http.put('/api/users/:id', async ({ request, params }) => {
    await latency()
    const { version, ...body } = (await request.json()) as Partial<UserInput> & { version: number }
    if (!validate(body)) return HttpResponse.json({ message: 'Invalid payload' }, { status: 400 })
    try {
      return HttpResponse.json(updateUser(String(params.id), body, version))
    } catch (e) {
      return errorResponse(e)
    }
  }),

  http.delete('/api/users/:id', async ({ request, params }) => {
    await latency()
    const version = Number(new URL(request.url).searchParams.get('version'))
    try {
      deleteUser(String(params.id), version)
      return new HttpResponse(null, { status: 204 })
    } catch (e) {
      return errorResponse(e)
    }
  }),

  http.post('/api/dev/touch-random', () => HttpResponse.json(touchRandomUser())),
]
