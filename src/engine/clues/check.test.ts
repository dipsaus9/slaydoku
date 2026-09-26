import { describe, expect, it } from 'vitest'
import { checkClue, isStructuralClue } from './check.ts'
import { people, scene } from './testing.fixture.ts'
import { STRUCTURAL_CLUE_TYPES } from './types.ts'

const puzzle = { scene, people }
const check = (type: string, args: Record<string, unknown> = {}, personId = 'A') =>
  checkClue({ personId, type, args }, puzzle)

describe('checkClue', () => {
  it('accepts well-formed clues of every kind', () => {
    const good: [string, Record<string, unknown>, string?][] = [
      ['onObject', { objectType: 'car' }],
      ['squareWithObject', { objectType: 'framedPainting' }],
      ['besideObject', { objectType: 'table', exactlyOne: true }],
      ['onlyOnObject', { objectType: 'chair' }],
      ['inRoom', { roomId: 'kitchen' }],
      ['inRoomOr', { roomIds: ['kitchen', 'study'] }],
      ['inCorner', {}],
      ['inCorner', { roomId: 'living' }],
      ['besideFeature', { feature: 'window' }],
      ['inFrontOfDoor', {}],
      ['alone', {}],
      ['alone', { roomId: 'study' }],
      ['withPerson', { otherId: 'B', roomId: 'kitchen' }],
      ['aloneWith', { otherId: 'V' }],
      ['emptyRoom', { roomId: 'living' }],
      ['roomHasGender', { gender: 'vrouw' }],
      ['aloneWithGender', { gender: 'man' }],
      ['inRow', { index: 5 }],
      ['inColumn', { index: 0 }],
      ['onLine', { axis: 'row', position: 'first' }],
      ['inRoomEdge', { edge: 'north' }],
      ['inRoomEdge', { roomId: 'kitchen', edge: 'east' }],
      ['both', { a: { type: 'besideObject', args: { objectType: 'table' } }, b: { type: 'roomHasGender', args: { gender: 'vrouw' } } }],
      ['aloneWithMurderer', {}, 'V'],
    ]
    expect(new Set(good.map(([type]) => type))).toEqual(new Set(STRUCTURAL_CLUE_TYPES))
    for (const [type, args, holder] of good) expect(check(type, args, holder)).toEqual([])
  })

  it('rejects unknown types and holders', () => {
    expect(check('northOf')).toHaveLength(1)
    expect(check('alone', {}, 'Z')).toHaveLength(1)
  })

  it('rejects params that name nothing', () => {
    expect(check('onObject', { objectType: 'spaceship' })).toHaveLength(1)
    expect(check('onObject')).toHaveLength(1)
    expect(check('inRoom', { roomId: 'attic' })).toHaveLength(1)
    expect(check('alone', { roomId: 'attic' })).toHaveLength(1)
    expect(check('inRoomOr', { roomIds: ['kitchen', 'kitchen'] })).toHaveLength(1)
    expect(check('inRoomOr', { roomIds: ['kitchen'] })).toHaveLength(1)
    expect(check('withPerson', { otherId: 'Z' })).toHaveLength(1)
    expect(check('besideFeature', { feature: 'stairs' })).toHaveLength(1)
    expect(check('besideObject', { objectType: 'table', exactlyOne: 'yes' })).toHaveLength(1)
  })

  it('rejects out-of-range indexes', () => {
    expect(check('inRow', { index: 6 })).toHaveLength(1)
    expect(check('inRow', { index: -1 })).toHaveLength(1)
    expect(check('inColumn', { index: 1.5 })).toHaveLength(1)
  })

  it('rejects a middle line on an even grid', () => {
    expect(check('onLine', { axis: 'row', position: 'middle' })).toHaveLength(1)
    expect(check('onLine', { axis: 'diagonal', position: 'first' })).toHaveLength(1)
    expect(check('onLine', { axis: 'row', position: 'top' })).toHaveLength(1)
  })

  it('inRoomEdge needs one of the four edges and, when given, a known room', () => {
    expect(check('inRoomEdge', {})).toHaveLength(1)
    expect(check('inRoomEdge', { edge: 'top' })).toHaveLength(1)
    expect(check('inRoomEdge', { edge: 'north', roomId: 'attic' })).toHaveLength(1)
    expect(check('inRoomEdge', { roomId: 'living', edge: 'south' })).toEqual([])
  })

  it('a clue cannot refer to its own holder', () => {
    expect(check('withPerson', { otherId: 'A' })).toHaveLength(1)
  })

  it('the murderer card belongs on the victim', () => {
    expect(check('aloneWithMurderer', {}, 'A')).toHaveLength(1)
  })

  it('gender clues need a gender that somebody else in the puzzle has', () => {
    expect(check('roomHasGender', { gender: 'robot' })).toHaveLength(1)
    expect(check('aloneWithGender')).toHaveLength(1)
    // B is the only woman: a card of B about "a woman" has nobody to be about.
    expect(check('roomHasGender', { gender: 'vrouw' }, 'B')).toHaveLength(1)
    expect(check('aloneWithGender', { gender: 'vrouw' }, 'B')).toHaveLength(1)
    expect(check('roomHasGender', { gender: 'man' }, 'B')).toEqual([])
  })

  it('a puzzle where nobody has a gender rejects the gender clues', () => {
    const plain = { scene, people: people.map(({ gender: _gender, ...rest }) => rest) }
    for (const type of ['roomHasGender', 'aloneWithGender']) {
      expect(checkClue({ personId: 'A', type, args: { gender: 'man' } }, plain)).toHaveLength(1)
    }
  })

  it('the gender clues do not belong on the victim card', () => {
    expect(check('roomHasGender', { gender: 'man' }, 'V')).toHaveLength(1)
  })

  it('isStructuralClue tells kinds apart', () => {
    expect(isStructuralClue({ personId: 'A', type: 'alone' })).toBe(true)
    expect(isStructuralClue({ personId: 'A', type: 'northOf' })).toBe(false)
  })
})
