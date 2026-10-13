import { describe, expect, it } from 'vitest'
import { normalizeUserInput, validateUserInput } from './user'

const valid = {
  userName: 'Klay Lee',
  position: 'Designer',
  location: 'Taipei',
  age: 30,
  dateStart: '2026-10-13',
}

describe('validateUserInput', () => {
  it('accepts a valid input', () => {
    expect(validateUserInput(valid, ['Designer'])).toEqual({})
  })

  it('requires every field', () => {
    expect(Object.keys(validateUserInput({}))).toEqual(['userName', 'location', 'position', 'age', 'dateStart'])
  })

  it('rejects blank text', () => {
    expect(validateUserInput({ ...valid, userName: '   ' }).userName).toBe('User name is required')
  })

  it('rejects text longer than 100 characters', () => {
    expect(validateUserInput({ ...valid, location: 'x'.repeat(101) }).location).toMatch(/100 characters/)
  })

  it.each([
    [17, 'Age must be between 18 and 65'],
    [18, undefined],
    [65, undefined],
    [66, 'Age must be between 18 and 65'],
    [30.5, 'Age must be a whole number'],
    ['30', 'Age must be a whole number'],
  ])('validates age %s', (age, message) => {
    expect(validateUserInput({ ...valid, age }).age).toBe(message)
  })

  it.each(['2026-02-30', '2026/10/13', '13-10-2026', '2026-1-5'])('rejects date %s', (dateStart) => {
    expect(validateUserInput({ ...valid, dateStart }).dateStart).toBe('Date must be a valid YYYY-MM-DD date')
  })

  it('accepts a leap day', () => {
    expect(validateUserInput({ ...valid, dateStart: '2024-02-29' }).dateStart).toBeUndefined()
  })

  it('rejects a position outside the known set', () => {
    expect(validateUserInput({ ...valid, position: 'CEO' }, ['Designer']).position).toBe('Unknown position')
  })
})

describe('normalizeUserInput', () => {
  it('trims text fields', () => {
    expect(normalizeUserInput({ ...valid, userName: '  Klay  ', location: ' Taipei ' })).toMatchObject({
      userName: 'Klay',
      location: 'Taipei',
    })
  })
})
