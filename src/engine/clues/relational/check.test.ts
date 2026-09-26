import { describe, expect, it } from 'vitest'
import { checkClue } from '../check.ts'
import { people, scene } from '../testing.fixture.ts'
import { RELATIONAL_CLUE_TYPES, isRelationalClue } from './types.ts'

const puzzle = { scene, people }
const check = (type: string, args: Record<string, unknown> = {}, personId = 'A') =>
  checkClue({ personId, type, args }, puzzle)

describe('checkClue: relational kinds', () => {
  it('accepts well-formed clues of every kind', () => {
    const good: [string, Record<string, unknown>][] = [
      ['directionOf', { side: 'north', otherId: 'B' }],
      ['directionOf', { side: 'west', otherId: 'V', roomId: 'kitchen', alone: true }],
      ['directionOfObject', { side: 'south', objectType: 'table' }],
      ['exactDistance', { side: 'north', count: 1, otherId: 'B' }],
      ['exactDistance', { side: 'east', count: 5, otherId: 'B', alone: true, roomId: 'study' }],
      ['directlyNextToObject', { side: 'south', objectType: 'easel' }],
      ['diagonal', { otherId: 'B' }],
      ['diagonal', { otherId: 'B', direction: 'northwest', steps: 2 }],
      ['quadrant', { direction: 'southeast', otherId: 'B' }],
      ['sameRoom', { otherId: 'B' }],
      ['differentRoom', { otherId: 'V' }],
      ['notWith', { otherId: 'B' }],
      ['notBesideObject', { objectType: 'bookshelf' }],
    ]
    expect(new Set(good.map(([type]) => type))).toEqual(new Set(RELATIONAL_CLUE_TYPES))
    for (const [type, args] of good) expect(check(type, args)).toEqual([])
  })

  it('tells relational kinds apart', () => {
    expect(isRelationalClue({ type: 'directionOf' })).toBe(true)
    expect(isRelationalClue({ type: 'inRow' })).toBe(false)
  })

  it('rejects an unknown holder, reference or self reference', () => {
    expect(check('sameRoom', { otherId: 'B' }, 'Z')).toHaveLength(1)
    expect(check('sameRoom', { otherId: 'Z' })).toHaveLength(1)
    expect(check('sameRoom', {})).toHaveLength(1)
    expect(check('notWith', { otherId: 'A' })).toEqual(['A clue cannot refer to its own holder.'])
    expect(check('directionOf', { side: 'north', otherId: 'A' })).toHaveLength(1)
  })

  it('rejects a bad side, direction or object type', () => {
    expect(check('directionOf', { side: 'up', otherId: 'B' })).toHaveLength(1)
    expect(check('directionOf', { otherId: 'B' })).toHaveLength(1)
    expect(check('quadrant', { direction: 'north', otherId: 'B' })).toHaveLength(1)
    expect(check('diagonal', { otherId: 'B', direction: 'up' })).toHaveLength(1)
    expect(check('directionOfObject', { side: 'north', objectType: 'sofa2' })).toHaveLength(1)
    expect(check('notBesideObject', {})).toHaveLength(1)
  })

  it('rejects qualifiers that name no room or are not booleans', () => {
    expect(check('directionOf', { side: 'north', otherId: 'B', roomId: 'attic' })).toHaveLength(1)
    expect(check('directionOf', { side: 'north', otherId: 'B', alone: 'yes' })).toHaveLength(1)
  })

  it('rejects a count that can never be true on this grid', () => {
    const at = (side: string, count: unknown) =>
      check('exactDistance', { side, count, otherId: 'B' })
    expect(at('north', 5)).toEqual([])
    expect(at('north', 6)).toHaveLength(1)
    expect(at('east', 0)).toHaveLength(1)
    expect(at('east', 1.5)).toHaveLength(1)
    expect(at('south', -1)).toHaveLength(1)
    expect(check('diagonal', { otherId: 'B', steps: 6 })).toHaveLength(1)
    expect(check('diagonal', { otherId: 'B', steps: 5 })).toEqual([])
  })
})
