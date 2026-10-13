import type { UserInput } from '../types/user'

export type UserInputErrors = Partial<Record<keyof UserInput, string>>

export const TEXT_MAX = 100
export const AGE_MIN = 18
export const AGE_MAX = 65

const isValidDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().startsWith(value)

export function normalizeUserInput(input: UserInput): UserInput {
  return {
    ...input,
    userName: input.userName.trim(),
    position: input.position.trim(),
    location: input.location.trim(),
  }
}

export function validateUserInput(
  input: Partial<Record<keyof UserInput, unknown>>,
  positions?: string[],
): UserInputErrors {
  const errors: UserInputErrors = {}

  const requireText = (key: 'userName' | 'location', label: string) => {
    const value = input[key]
    if (typeof value !== 'string' || !value.trim()) errors[key] = `${label} is required`
    else if (value.trim().length > TEXT_MAX) errors[key] = `${label} must be ${TEXT_MAX} characters or fewer`
  }

  requireText('userName', 'User name')
  requireText('location', 'Location')

  if (typeof input.position !== 'string' || !input.position) errors.position = 'Position is required'
  else if (positions && !positions.includes(input.position)) errors.position = 'Unknown position'

  const age = input.age
  if (age === null || age === undefined || age === '') errors.age = 'Age is required'
  else if (typeof age !== 'number' || !Number.isInteger(age)) errors.age = 'Age must be a whole number'
  else if (age < AGE_MIN || age > AGE_MAX) errors.age = `Age must be between ${AGE_MIN} and ${AGE_MAX}`

  const date = input.dateStart
  if (typeof date !== 'string' || !date) errors.dateStart = 'Date start is required'
  else if (!isValidDate(date)) errors.dateStart = 'Date must be a valid YYYY-MM-DD date'

  return errors
}
