export interface User {
  id: string
  userName: string
  position: string
  location: string
  age: number
  dateStart: string
  version: number
}

export type UserInput = Omit<User, 'id' | 'version'>

export type SortableKey = keyof UserInput

export type SortDir = 'asc' | 'desc'

export interface SortState {
  key: SortableKey | null
  dir: SortDir
}

export interface UserFilters {
  userName: string
  position: string
  location: string
  ageMin: number | null
  ageMax: number | null
  dateFrom: string
  dateTo: string
}

export interface UserQuery {
  filters: UserFilters
  sort: SortState
}

export interface PageResult<T> {
  items: T[]
  total: number
}

export interface Pin {
  userId: string
  position: number
}

export const createEmptyFilters = (): UserFilters => ({
  userName: '',
  position: '',
  location: '',
  ageMin: null,
  ageMax: null,
  dateFrom: '',
  dateTo: '',
})
