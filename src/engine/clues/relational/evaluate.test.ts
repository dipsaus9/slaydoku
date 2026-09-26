import { describe, expect, it } from 'vitest'
import { evaluate } from '../evaluate.ts'
import type { Scene } from '../../model/index.ts'
import { scene, stand } from '../testing.fixture.ts'
import type { RelationalClue } from './types.ts'

/** Truth table: one row per (placement -> expected) for one clue. */
function table(
  clue: RelationalClue,
  rows: [label: string, placements: ReturnType<typeof stand>, expected: boolean][],
) {
  for (const [label, placements, expected] of rows) {
    it(`${label} -> ${expected}`, () => {
      expect(evaluate(clue, scene, placements)).toBe(expected)
    })
  }
}

const A = 'A'
const dir = (side: 'north' | 'south' | 'east' | 'west', extra = {}): RelationalClue => ({
  personId: A,
  type: 'directionOf',
  args: { side, otherId: 'B', ...extra },
})

describe('directionOf: strict comparison, any room', () => {
  describe('north', () => {
    table(dir('north'), [
      ['one row above', stand(A, 1, 0, 'B', 2, 3), true],
      ['far above, other room', stand(A, 0, 5, 'B', 5, 0), true],
      ['same row is never north', stand(A, 2, 0, 'B', 2, 3), false],
      ['below', stand(A, 3, 0, 'B', 2, 3), false],
      ['reference on the top row: nothing is north of it', stand(A, 3, 0, 'B', 0, 3), false],
      ['holder on the top row', stand(A, 0, 0, 'B', 0, 3), false],
      ['not placed', stand('B', 2, 3), false],
      ['reference not placed', stand(A, 0, 0), false],
    ])
  })
  describe('south', () => {
    table(dir('south'), [
      ['below', stand(A, 3, 0, 'B', 2, 3), true],
      ['bottom row holder, top row reference', stand(A, 5, 0, 'B', 0, 3), true],
      ['above', stand(A, 1, 0, 'B', 2, 3), false],
      ['same row', stand(A, 2, 0, 'B', 2, 3), false],
      ['reference on the last row', stand(A, 4, 0, 'B', 5, 3), false],
    ])
  })
  describe('east', () => {
    table(dir('east'), [
      ['right of, same room', stand(A, 0, 2, 'B', 1, 0), true],
      ['right of, other room', stand(A, 4, 5, 'B', 0, 0), true],
      ['same column is never east', stand(A, 0, 2, 'B', 1, 2), false],
      ['left of', stand(A, 0, 1, 'B', 1, 3), false],
      ['reference in the last column', stand(A, 0, 4, 'B', 1, 5), false],
    ])
  })
  describe('west', () => {
    table(dir('west'), [
      ['left of', stand(A, 0, 1, 'B', 1, 3), true],
      ['first column holder', stand(A, 0, 0, 'B', 1, 5), true],
      ['reference in the first column', stand(A, 0, 2, 'B', 1, 0), false],
      ['same column', stand(A, 0, 2, 'B', 1, 2), false],
    ])
  })
  describe('victim as reference', () => {
    table({ personId: A, type: 'directionOf', args: { side: 'north', otherId: 'V' } }, [
      ['above the victim', stand(A, 0, 0, 'V', 4, 4), true],
      ['below the victim', stand(A, 5, 0, 'V', 4, 4), false],
    ])
  })
  describe('room qualifier pins the holder', () => {
    table(dir('north', { roomId: 'kitchen' }), [
      ['north and in the kitchen', stand(A, 0, 0, 'B', 4, 4), true],
      ['north but in the living room', stand(A, 0, 4, 'B', 4, 4), false],
      ['in the kitchen but south', stand(A, 2, 0, 'B', 1, 4), false],
    ])
  })
  describe('alone qualifier: nobody else in the room, victim counts', () => {
    table(dir('north', { alone: true }), [
      ['alone in the kitchen', stand(A, 0, 0, 'B', 4, 4, 'V', 3, 1), true],
      ['victim in the same room', stand(A, 0, 0, 'B', 4, 4, 'V', 1, 1), false],
      ['another suspect in the room', stand(A, 0, 0, 'B', 4, 4, 'C', 2, 2), false],
    ])
    table(dir('north', { alone: true, roomId: 'study' }), [
      ['alone in the study, north of B', stand(A, 3, 3, 'B', 5, 0), true],
      ['alone but in the wrong room', stand(A, 0, 0, 'B', 5, 5), false],
    ])
  })
})

describe('directionOfObject: strictly beyond the whole extent of at least one object of the type', () => {
  const obj = (side: 'north' | 'south' | 'east' | 'west', objectType: 'table' | 'bed' | 'bookshelf') =>
    ({ personId: A, type: 'directionOfObject', args: { side, objectType } }) as const
  describe('north of the table (r1c1)', () => {
    table(obj('north', 'table'), [
      ['row 0, other column', stand(A, 0, 5), true],
      ['same row', stand(A, 1, 4), false],
      ['below', stand(A, 4, 1), false],
    ])
  })
  describe('west of the table', () => {
    table(obj('west', 'table'), [
      ['first column, other room', stand(A, 4, 0), true],
      ['same column', stand(A, 4, 1), false],
    ])
  })
  describe('south of the table', () => {
    table(obj('south', 'table'), [
      ['last row', stand(A, 5, 2), true],
      ['same row', stand(A, 1, 0), false],
    ])
  })
  describe('east of the table', () => {
    table(obj('east', 'table'), [
      ['last column', stand(A, 0, 5), true],
      ['same column', stand(A, 0, 1), false],
    ])
  })
  describe('several objects of the type: one is enough', () => {
    // bookshelves at r0c3 and r1c4
    table(obj('north', 'bookshelf'), [
      ['north of the second shelf only', stand(A, 0, 0), true],
      ['on the row of the second shelf: not north of either', stand(A, 1, 0), false],
      ['below both', stand(A, 3, 0), false],
    ])
  })
  describe('multi-cell object: bed at r3c0 and r4c0 (the whole bed counts)', () => {
    table(obj('north', 'bed'), [
      ['on the row of the bed top is not north of the bed', stand(A, 3, 3), false],
      ['on the row of the bed bottom', stand(A, 4, 3), false],
      ['one row above the bed top', stand(A, 2, 3), true],
      ['far above', stand(A, 0, 3), true],
      ['on the last row', stand(A, 5, 3), false],
    ])
    table(obj('south', 'bed'), [
      ['on the row of the bed bottom is not south of the bed', stand(A, 4, 3), false],
      ['on the row of the bed top', stand(A, 3, 3), false],
      ['below the bed', stand(A, 5, 3), true],
    ])
    table(obj('east', 'bed'), [
      ['same column as the bed', stand(A, 0, 0), false],
      ['right of the bed', stand(A, 5, 1), true],
    ])
    table(obj('west', 'bed'), [['nothing lies left of a bed in the first column', stand(A, 0, 0), false]])
  })
  describe('with a room qualifier', () => {
    table(
      { personId: A, type: 'directionOfObject', args: { side: 'north', objectType: 'table', roomId: 'living' } },
      [
        ['north of the table, in the living room', stand(A, 0, 5), true],
        ['north of the table, in the kitchen', stand(A, 0, 0), false],
      ],
    )
  })
})

describe('exactDistance: exactly N rows or columns, only that axis counts', () => {
  const dist = (side: 'north' | 'south' | 'east' | 'west', count: number, extra = {}): RelationalClue => ({
    personId: A,
    type: 'exactDistance',
    args: { side, count, otherId: 'B', ...extra },
  })
  describe('one row north', () => {
    table(dist('north', 1), [
      ['exactly one row above, any column, any room', stand(A, 1, 0, 'B', 2, 4), true],
      ['two rows above', stand(A, 0, 0, 'B', 2, 4), false],
      ['same row', stand(A, 2, 0, 'B', 2, 4), false],
      ['one row below', stand(A, 3, 0, 'B', 2, 4), false],
      ['top row holder, reference on row 1', stand(A, 0, 3, 'B', 1, 0), true],
    ])
  })
  describe('two rows south', () => {
    table(dist('south', 2), [
      ['exactly two below', stand(A, 4, 0, 'B', 2, 3), true],
      ['three below', stand(A, 5, 0, 'B', 2, 3), false],
    ])
  })
  describe('columns', () => {
    table(dist('east', 2), [
      ['two columns right', stand(A, 0, 3, 'B', 1, 1), true],
      ['one column right', stand(A, 0, 2, 'B', 1, 1), false],
      ['two columns left', stand(A, 0, 0, 'B', 1, 2), false],
    ])
    table(dist('west', 3), [
      ['three columns left', stand(A, 0, 0, 'B', 1, 3), true],
      ['four columns left', stand(A, 0, 0, 'B', 1, 4), false],
    ])
  })
  describe('edge of the grid', () => {
    table(dist('south', 5), [
      ['top row to bottom row', stand(A, 5, 0, 'B', 0, 3), true],
      ['the other way round', stand(A, 0, 0, 'B', 5, 3), false],
    ])
  })
  describe('N larger than the grid is never true', () => {
    table(dist('north', 6), [['as far apart as possible', stand(A, 0, 0, 'B', 5, 3), false]])
    table(dist('east', 9), [['as far apart as possible', stand(A, 0, 5, 'B', 1, 0), false]])
  })
  describe('victim as reference', () => {
    table(
      { personId: A, type: 'exactDistance', args: { side: 'north', count: 1, otherId: 'V' } },
      [
        ['one row above the victim', stand(A, 3, 0, 'V', 4, 4), true],
        ['two rows above the victim', stand(A, 2, 0, 'V', 4, 4), false],
      ],
    )
  })
  describe('combined form: alone in a room, one row north of X', () => {
    table(dist('north', 1, { alone: true, roomId: 'study' }), [
      ['alone in the study, one row above B', stand(A, 3, 3, 'B', 4, 0, 'V', 5, 1), true],
      ['study shared with the victim', stand(A, 3, 3, 'B', 4, 0, 'V', 5, 4), false],
      ['alone, one row above B, but in the kitchen', stand(A, 0, 0, 'B', 1, 4), false],
      ['alone in the study but two rows above', stand(A, 3, 3, 'B', 5, 0), false],
    ])
  })
})

describe('directlyNextToObject: the square on that side of the object, same room', () => {
  const next = (side: 'north' | 'south' | 'east' | 'west', objectType: 'table' | 'bed' | 'painting' | 'oil') =>
    ({
      personId: A,
      type: 'directlyNextToObject',
      args: { side, objectType: objectType === 'painting' ? 'framedPainting' : objectType === 'oil' ? 'oilSlick' : objectType },
    }) as const
  describe('table at r1c1', () => {
    table(next('north', 'table'), [
      ['directly above', stand(A, 0, 1), true],
      ['two above is not directly', stand(A, 0, 0), false],
      ['below the table', stand(A, 2, 1), false],
    ])
    table(next('south', 'table'), [
      ['directly below', stand(A, 2, 1), true],
      ['above', stand(A, 0, 1), false],
    ])
    table(next('east', 'table'), [
      ['directly right', stand(A, 1, 2), true],
      ['left', stand(A, 1, 0), false],
    ])
    table(next('west', 'table'), [
      ['directly left', stand(A, 1, 0), true],
      ['right', stand(A, 1, 2), false],
      ['diagonal', stand(A, 0, 0), false],
    ])
  })
  describe('the wall between rooms breaks it', () => {
    // painting r2c0 (kitchen); r3c0 is the bedroom
    table(next('south', 'painting'), [['square below is in another room', stand(A, 3, 0), false]])
    table(next('north', 'painting'), [['square above is in the same room', stand(A, 1, 0), true]])
  })
  describe('multi-cell bed: next to any square of it, never on the bed itself', () => {
    table(next('south', 'bed'), [
      ['on the lower cell: on the bed, not directly south of it', stand(A, 4, 0), false],
      ['below the lower cell', stand(A, 5, 0), true],
      ['north of the upper cell', stand(A, 2, 0), false],
    ])
    table(next('north', 'bed'), [
      ['above the upper cell: other room', stand(A, 2, 0), false],
      ['on the upper cell: on the bed, not directly north of it', stand(A, 3, 0), false],
    ])
  })
  describe('object on the grid border', () => {
    // oil slick r5c3
    table(next('east', 'oil'), [['directly right', stand(A, 5, 4), true]])
    table(next('west', 'oil'), [['left, other room', stand(A, 5, 2), false]])
    table(next('south', 'oil'), [['there is no square below the border', stand(A, 5, 3), false]])
  })
})

describe('diagonal: same diagonal as another person', () => {
  const diag = (extra = {}): RelationalClue => ({
    personId: A,
    type: 'diagonal',
    args: { otherId: 'B', ...extra },
  })
  describe('any distance, any direction', () => {
    table(diag(), [
      ['one step', stand(A, 0, 0, 'B', 1, 1), true],
      ['two steps', stand(A, 0, 0, 'B', 2, 2), true],
      ['anti-diagonal', stand(A, 0, 4, 'B', 4, 0), true],
      ['across rooms', stand(A, 2, 2, 'B', 3, 3), true],
      ['knight move', stand(A, 0, 0, 'B', 1, 2), false],
      ['same row', stand(A, 1, 0, 'B', 1, 3), false],
      ['same column', stand(A, 0, 2, 'B', 4, 2), false],
      ['not placed', stand('B', 1, 1), false],
    ])
  })
  describe('direction: the holder lies on that ray from the reference', () => {
    table(diag({ direction: 'northwest' }), [
      ['up-left of B', stand(A, 1, 1, 'B', 3, 3), true],
      ['down-right of B', stand(A, 5, 5, 'B', 3, 3), false],
      ['up-right of B', stand(A, 1, 5, 'B', 3, 3), false],
    ])
    table(diag({ direction: 'southeast' }), [
      ['down-right of B', stand(A, 5, 5, 'B', 3, 3), true],
      ['up-left of B', stand(A, 1, 1, 'B', 3, 3), false],
    ])
    table(diag({ direction: 'northeast' }), [
      ['up-right of B', stand(A, 1, 5, 'B', 3, 3), true],
      ['down-left of B', stand(A, 5, 1, 'B', 3, 3), false],
    ])
    table(diag({ direction: 'southwest' }), [
      ['down-left of B', stand(A, 5, 1, 'B', 3, 3), true],
      ['up-right of B', stand(A, 1, 5, 'B', 3, 3), false],
    ])
  })
  describe('steps: exact distance along the diagonal', () => {
    table(diag({ steps: 2 }), [
      ['two steps', stand(A, 0, 0, 'B', 2, 2), true],
      ['one step', stand(A, 0, 0, 'B', 1, 1), false],
      ['three steps', stand(A, 0, 0, 'B', 3, 3), false],
    ])
    table(diag({ steps: 1, direction: 'southeast' }), [
      ['one step down-right', stand(A, 3, 3, 'B', 2, 2), true],
      ['one step up-left', stand(A, 1, 1, 'B', 2, 2), false],
    ])
  })
  describe('victim as reference', () => {
    table({ personId: A, type: 'diagonal', args: { otherId: 'V' } }, [
      ['on the victim diagonal', stand(A, 0, 0, 'V', 5, 5), true],
    ])
  })
  describe('qualifiers', () => {
    table(diag({ alone: true, roomId: 'kitchen' }), [
      ['alone in the kitchen, diagonal to B', stand(A, 0, 0, 'B', 3, 3, 'V', 4, 4), true],
      ['victim in the kitchen too', stand(A, 0, 0, 'B', 3, 3, 'V', 1, 2), false],
    ])
  })
})

describe('quadrant: strictly above-left, above-right, below-left, below-right', () => {
  const quad = (direction: 'northwest' | 'northeast' | 'southwest' | 'southeast'): RelationalClue => ({
    personId: A,
    type: 'quadrant',
    args: { direction, otherId: 'B' },
  })
  table(quad('northwest'), [
    ['up and left, any room', stand(A, 0, 0, 'B', 4, 4), true],
    ['up but same column', stand(A, 0, 4, 'B', 4, 4), false],
    ['left but same row', stand(A, 4, 0, 'B', 4, 4), false],
    ['up and right', stand(A, 0, 5, 'B', 4, 4), false],
  ])
  table(quad('northeast'), [
    ['up and right', stand(A, 0, 5, 'B', 4, 4), true],
    ['up and left', stand(A, 0, 0, 'B', 4, 4), false],
  ])
  table(quad('southwest'), [
    ['down and left', stand(A, 5, 0, 'B', 4, 4), true],
    ['down and right', stand(A, 5, 5, 'B', 4, 4), false],
  ])
  table(quad('southeast'), [
    ['down and right', stand(A, 5, 5, 'B', 4, 4), true],
    ['reference in the corner: nothing beyond it', stand(A, 3, 3, 'B', 5, 5), false],
  ])
})

describe('sameRoom / differentRoom / notWith', () => {
  const room = (type: 'sameRoom' | 'differentRoom' | 'notWith', otherId = 'B'): RelationalClue => ({
    personId: A,
    type,
    args: { otherId },
  })
  describe('sameRoom: others may be there too', () => {
    table(room('sameRoom'), [
      ['both in the kitchen', stand(A, 0, 0, 'B', 1, 2), true],
      ['a third person is there as well', stand(A, 0, 0, 'B', 1, 2, 'C', 2, 1), true],
      ['different rooms', stand(A, 0, 0, 'B', 1, 4), false],
      ['not placed', stand('B', 1, 4), false],
      ['reference not placed', stand(A, 0, 0), false],
    ])
    table(room('sameRoom', 'V'), [
      ['victim in the same room', stand(A, 0, 0, 'V', 2, 2), true],
      ['victim in another room', stand(A, 0, 0, 'V', 5, 5), false],
    ])
  })
  describe('differentRoom', () => {
    table(room('differentRoom'), [
      ['kitchen and living room', stand(A, 0, 0, 'B', 1, 4), true],
      ['same room', stand(A, 0, 0, 'B', 1, 2), false],
      ['adjacent cells across a wall are different rooms', stand(A, 2, 1, 'B', 3, 2), true],
      ['not placed', stand('B', 1, 4), false],
      ['reference not placed', stand(A, 0, 0), false],
    ])
    table(room('differentRoom', 'V'), [
      ['victim elsewhere', stand(A, 0, 0, 'V', 5, 5), true],
      ['victim in the same room', stand(A, 0, 0, 'V', 2, 2), false],
    ])
  })
  describe('notWith: negation of with, same truth as different room', () => {
    table(room('notWith'), [
      ['different rooms', stand(A, 0, 0, 'B', 4, 4), true],
      ['same room', stand(A, 0, 0, 'B', 2, 2), false],
      ['reference not placed', stand(A, 0, 0), false],
    ])
    table(room('notWith', 'V'), [
      ['not with the victim', stand(A, 0, 0, 'V', 4, 4), true],
      ['with the victim', stand(A, 0, 0, 'V', 2, 2), false],
    ])
  })
})

describe('notBesideObject: not beside any object of the type', () => {
  const notBeside = (objectType: 'table' | 'bookshelf' | 'bed' | 'framedPainting' | 'chair'): RelationalClue => ({
    personId: A,
    type: 'notBesideObject',
    args: { objectType },
  })
  describe('table at r1c1', () => {
    table(notBeside('table'), [
      ['far away', stand(A, 4, 4), true],
      ['diagonal is not beside', stand(A, 0, 0), true],
      ['above the table', stand(A, 0, 1), false],
      ['left of the table', stand(A, 1, 0), false],
      ['not placed', stand('B', 4, 4), false],
    ])
  })
  describe('the wall between rooms breaks beside', () => {
    // painting r2c0 kitchen; bed cell r3c0 is in the bedroom
    table(notBeside('framedPainting'), [
      ['below the painting, other room', stand(A, 3, 0), true],
      ['above the painting, same room', stand(A, 1, 0), false],
    ])
  })
  describe('several objects of the type: beside any of them is enough to fail', () => {
    // bookshelves r0c3 and r1c4
    table(notBeside('bookshelf'), [
      ['beside the first', stand(A, 0, 4), false],
      ['beside the second only', stand(A, 2, 4), false],
      ['beside neither', stand(A, 3, 3), true],
    ])
  })
  describe('multi-cell bed', () => {
    table(notBeside('bed'), [
      ['on the upper cell: on the bed, not beside it', stand(A, 3, 0), true],
      ['beside the side of the bed', stand(A, 3, 1), false],
      ['two cells away', stand(A, 3, 2), true],
    ])
  })
  describe('a chair may be "not beside a chair" while sitting on one', () => {
    table(notBeside('chair'), [['on the sole chair at r0c1', stand(A, 0, 1), true]])
  })
})

describe('directionOfObject on wide objects: a 2x2 bed and a 3x2 stairs (CAD-8.6)', () => {
  // 9x9, one room. Bed 2x2 at rows 4-5, cols 1-2. Stairs 2 deep x 3 wide at rows 0-1, cols 4-6.
  const at = (row: number, col: number) => ({ row, col })
  const wide: Scene = {
    width: 9,
    height: 9,
    rooms: [{ id: 'room', name: 'Kamer' }],
    cellRooms: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 'room')),
    objects: [
      { id: 'bed', type: 'bed', cells: [at(4, 1), at(4, 2), at(5, 1), at(5, 2)] },
      { id: 'stairs', type: 'stairs', cells: [at(0, 4), at(0, 5), at(0, 6), at(1, 4), at(1, 5), at(1, 6)] },
    ],
    edgeFeatures: [],
  }
  const holds = (side: 'north' | 'south' | 'east' | 'west', objectType: 'bed' | 'stairs', row: number, col: number, extra = {}) =>
    evaluate({ personId: A, type: 'directionOfObject', args: { side, objectType, ...extra } }, wide, stand(A, row, col))

  describe('2x2 bed (rows 4-5, cols 1-2)', () => {
    it('north: only rows above the top row 4', () => {
      expect(holds('north', 'bed', 3, 8)).toBe(true)
      expect(holds('north', 'bed', 4, 8)).toBe(false) // same row as the bed top
      expect(holds('north', 'bed', 5, 8)).toBe(false) // same row as the bed bottom
    })
    it('south: only rows below the bottom row 5', () => {
      expect(holds('south', 'bed', 6, 0)).toBe(true)
      expect(holds('south', 'bed', 5, 0)).toBe(false)
      expect(holds('south', 'bed', 4, 0)).toBe(false)
    })
    it('west: only columns left of the left column 1', () => {
      expect(holds('west', 'bed', 8, 0)).toBe(true)
      expect(holds('west', 'bed', 8, 1)).toBe(false)
      expect(holds('west', 'bed', 8, 2)).toBe(false)
    })
    it('east: only columns right of the right column 2', () => {
      expect(holds('east', 'bed', 0, 3)).toBe(true)
      expect(holds('east', 'bed', 0, 2)).toBe(false)
      expect(holds('east', 'bed', 0, 1)).toBe(false)
    })
  })

  describe('3x2 stairs (rows 0-1, cols 4-6)', () => {
    it('south: below the bottom row 1', () => {
      expect(holds('south', 'stairs', 2, 0)).toBe(true)
      expect(holds('south', 'stairs', 1, 0)).toBe(false)
      expect(holds('south', 'stairs', 0, 0)).toBe(false)
    })
    it('north: nothing lies above stairs on the top row', () => {
      for (let col = 0; col < 9; col++) expect(holds('north', 'stairs', 0, col), `c${col}`).toBe(false)
    })
    it('east: right of the right column 6, west: left of the left column 4', () => {
      expect(holds('east', 'stairs', 5, 7)).toBe(true)
      for (const col of [4, 5, 6]) expect(holds('east', 'stairs', 5, col), `east c${col}`).toBe(false)
      expect(holds('west', 'stairs', 5, 3)).toBe(true)
      for (const col of [4, 5, 6]) expect(holds('west', 'stairs', 5, col), `west c${col}`).toBe(false)
    })
  })

  it('room and alone qualifiers do not loosen the whole-object rule', () => {
    expect(holds('north', 'bed', 4, 8, { roomId: 'room' })).toBe(false)
    expect(holds('north', 'bed', 4, 8, { alone: true })).toBe(false)
    expect(holds('north', 'bed', 3, 8, { roomId: 'room', alone: true })).toBe(true)
    expect(holds('east', 'stairs', 5, 6, { roomId: 'room' })).toBe(false)
  })

  it('with several objects of the type, beyond one whole object is enough', () => {
    const two: Scene = {
      ...wide,
      objects: [
        { id: 'bed-a', type: 'bed', cells: [at(1, 0), at(2, 0)] },
        { id: 'bed-b', type: 'bed', cells: [at(6, 5), at(7, 5)] },
      ],
    }
    const north = (row: number) =>
      evaluate({ personId: A, type: 'directionOfObject', args: { side: 'north', objectType: 'bed' } }, two, stand(A, row, 8))
    expect(north(0)).toBe(true) // above both
    expect(north(1)).toBe(true) // not above bed-a, but above bed-b entirely
    expect(north(5)).toBe(true)
    expect(north(6)).toBe(false) // inside bed-b's rows, below bed-a's top
  })
})
