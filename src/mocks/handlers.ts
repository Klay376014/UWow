import { delay, http, HttpResponse } from 'msw'
import type { SortableKey, SortDir, UserFilters, UserInput } from '../types/user'
import { normalizeUserInput, validateUserInput } from '../validation/user'
import { createUser, DbError, deleteUser, findUser, POSITIONS, queryUsers, touchUser, updateUser } from './db'

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

function parseInput(body: Partial<UserInput>) {
  const errors = validateUserInput(body, POSITIONS)
  const message = Object.values(errors)[0]
  return message ? { message } : { input: normalizeUserInput(body as UserInput) }
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

  http.get('/api/users/:id', async ({ params }) => {
    await latency()
    try {
      return HttpResponse.json(findUser(String(params.id)))
    } catch (e) {
      return errorResponse(e)
    }
  }),

  http.post('/api/users', async ({ request }) => {
    await latency()
    const { input, message } = parseInput((await request.json()) as Partial<UserInput>)
    if (!input) return HttpResponse.json({ message }, { status: 400 })
    return HttpResponse.json(createUser(input), { status: 201 })
  }),

  http.put('/api/users/:id', async ({ request, params }) => {
    await latency()
    const { version, ...body } = (await request.json()) as Partial<UserInput> & { version: number }
    const { input, message } = parseInput(body)
    if (!input) return HttpResponse.json({ message }, { status: 400 })
    try {
      return HttpResponse.json(updateUser(String(params.id), input, version))
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

  http.post('/api/dev/users/:id/touch', ({ params }) => {
    try {
      return HttpResponse.json(touchUser(String(params.id)))
    } catch (e) {
      return errorResponse(e)
    }
  }),
]
