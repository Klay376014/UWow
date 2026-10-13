import type { SortableKey } from './types/user'

export interface ColumnDef {
  key: SortableKey
  label: string
}

export const COLUMNS: ColumnDef[] = [
  { key: 'userName', label: 'User Name' },
  { key: 'position', label: 'Position' },
  { key: 'location', label: 'Location' },
  { key: 'age', label: 'Age' },
  { key: 'dateStart', label: 'Date Start' },
]
