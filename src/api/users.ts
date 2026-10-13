import type { PageResult, User, UserInput, UserQuery } from '../types/user'

export const PAGE_SIZE = 500

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? res.statusText)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

function toSearchParams({ filters, sort }: UserQuery) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
    else if (value !== '' && value != null) params.set(key, String(value))
  }
  if (sort.key) {
    params.set('sortBy', sort.key)
    params.set('sortDir', sort.dir)
  }
  return params
}

export interface FetchUsersOptions {
  offset: number
  limit: number
  excludeIds?: string[]
  ids?: string[]
  signal?: AbortSignal
}

export function fetchUsers(query: UserQuery, opts: FetchUsersOptions) {
  const params = toSearchParams(query)
  params.set('offset', String(opts.offset))
  params.set('limit', String(opts.limit))
  if (opts.excludeIds?.length) params.set('excludeIds', opts.excludeIds.join(','))
  if (opts.ids) params.set('ids', opts.ids.join(','))
  return request<PageResult<User>>(`/api/users?${params}`, { signal: opts.signal })
}

export const fetchPositions = () => request<string[]>('/api/positions')

export const createUser = (input: UserInput) =>
  request<User>('/api/users', { method: 'POST', body: JSON.stringify(input) })

export const updateUser = (id: string, input: UserInput, version: number) =>
  request<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ ...input, version }) })

export const deleteUser = (id: string, version: number) =>
  request<void>(`/api/users/${id}?version=${version}`, { method: 'DELETE' })
