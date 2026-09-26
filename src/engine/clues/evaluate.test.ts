import { describe, expect, it } from 'vitest'
import type { Scene } from '../model/index.ts'
import { evaluate } from './evaluate.ts'
import { isCorner, lineIndex, roomEdgeIndex } from './geometry.ts'
import { people, scene, stand } from './testing.fixture.ts'
import type { StructuralClue } from './types.ts'

/** Truth table: one row per (placement -> expected) for one clue. */
function table(
  clue: StructuralClue,
  rows: [label: string, placements: ReturnType<typeof stand>, expected: boolean][],
  s: Scene = scene,
) {
  for (const [label, placements, expected] of rows) {
    it(`${label} -> ${expected}`, () => {
      expect(evaluate(clue, s, placements)).toBe(expected)
    })
  }
}

const A = 'A'

describe('onObject', () => {
  describe('chair', () => {
    table({ personId: A, type: 'onObject', args: { objectType: 'chair' } }, [
      ['on chair', stand(A, 0, 1), true],
      ['next to the chair', stand(A, 0, 0), false],
      ['on the other chair', stand(A, 5, 5), true],
      ['plain floor', stand(A, 0, 2), false],
      ['not placed', stand('B', 0, 1), false],
    ])
  })
  describe('bed, two cells: a person occupies either one', () => {
    table({ personId: A, type: 'onObject', args: { objectType: 'bed' } }, [
      ['upper cell', stand(A, 3, 0), true],
      ['lower cell', stand(A, 4, 0), true],
      ['beside the bed', stand(A, 3, 1), false],
    ])
  })
  describe('car', () => {
    table({ personId: A, type: 'onObject', args: { objectType: 'car' } }, [
      ['in the car', stand(A, 2, 4), true],
      ['elsewhere', stand(A, 2, 3), false],
    ])
  })
})

describe('squareWithObject', () => {
  table({ personId: A, type: 'squareWithObject', args: { objectType: 'framedPainting' } }, [
    ['on the painting square', stand(A, 2, 0), true],
    ['next to it', stand(A, 2, 1), false],
  ])
})

describe('besideObject: orthogonal, same room', () => {
  const beside = (objectType: 'bookshelf' | 'table' | 'bed' | 'chair') =>
    ({ personId: A, type: 'besideObject', args: { objectType } }) as const
  describe('table at r2c2 (0-based r1c1)', () => {
    table(beside('table'), [
      ['above', stand(A, 0, 1), true],
      ['below', stand(A, 2, 1), true],
      ['left', stand(A, 1, 0), true],
      ['right', stand(A, 1, 2), true],
      ['diagonal is not beside', stand(A, 0, 0), false],
      ['diagonal, other side', stand(A, 2, 2), false],
      ['two away', stand(A, 1, 3), false],
    ])
  })
  describe('shelf at r0c3: a neighbour across a wall is not beside', () => {
    table(beside('bookshelf'), [
      ['same room, right of it', stand(A, 0, 4), true],
      ['same room, below it', stand(A, 1, 3), true],
      ['left of it but in the kitchen', stand(A, 0, 2), false],
    ])
  })
  describe('bed (2 cells): beside the bed as a whole, not while lying on it', () => {
    table(beside('bed'), [
      ['beside the upper cell', stand(A, 3, 1), true],
      ['below the lower cell', stand(A, 5, 0), true],
      ['on the lower cell: on the bed, not beside it', stand(A, 4, 0), false],
      ['on the upper cell: on the bed, not beside it', stand(A, 3, 0), false],
      ['far away', stand(A, 5, 2), false],
    ])
  })
  describe('a chair beside another chair while sitting on one (FAQ)', () => {
    const twoChairs: Scene = {
      width: 3,
      height: 1,
      rooms: [{ id: 'r', name: 'Kamer' }],
      cellRooms: [['r', 'r', 'r']],
      objects: [
        { id: 'c1', type: 'chair', cells: [{ row: 0, col: 0 }] },
        { id: 'c2', type: 'chair', cells: [{ row: 0, col: 1 }] },
      ],
      edgeFeatures: [],
    }
    table(beside('chair'), [['on chair 1, chair 2 next to it', stand(A, 0, 0), true]], twoChairs)
    table({ personId: A, type: 'onObject', args: { objectType: 'chair' } }, [
      ['and sits on a chair', stand(A, 0, 0), true],
    ], twoChairs)
    table(beside('chair'), [['on chair 2, chair 1 next to it', stand(A, 0, 1), true]], twoChairs)
    table(beside('chair'), [['a sole chair is not beside itself', stand(A, 0, 0), false]], {
      ...twoChairs,
      objects: [{ id: 'c1', type: 'chair', cells: [{ row: 0, col: 0 }] }],
    })
  })
  describe('exactlyOne: beside several shelves is not exactly one', () => {
    const one = {
      personId: A,
      type: 'besideObject',
      args: { objectType: 'bookshelf', exactlyOne: true },
    } as const
    table(one, [
      ['beside only shelf2', stand(A, 1, 5), true],
      ['beside shelf1 and shelf2', stand(A, 0, 4), false],
      ['beside no shelf', stand(A, 5, 2), false],
    ])
    table(beside('bookshelf'), [['plain beside allows several', stand(A, 0, 4), true]])
  })
})

describe('onlyOnObject', () => {
  const only = { personId: A, type: 'onlyOnObject', args: { objectType: 'chair' } } as const
  table(only, [
    ['alone on a chair', stand(A, 0, 1, 'B', 3, 3), true],
    ['someone else on the other chair', stand(A, 0, 1, 'B', 5, 5), false],
    ['not on a chair at all', stand(A, 0, 0, 'B', 5, 5), false],
    ['victim on the other chair counts', stand(A, 0, 1, 'V', 5, 5), false],
  ])
})

describe('inRoom / inRoomOr', () => {
  table({ personId: A, type: 'inRoom', args: { roomId: 'kitchen' } }, [
    ['in the kitchen', stand(A, 0, 0), true],
    ['in the living room', stand(A, 0, 3), false],
  ])
  table({ personId: A, type: 'inRoomOr', args: { roomIds: ['kitchen', 'study'] } }, [
    ['first room', stand(A, 0, 0), true],
    ['second room', stand(A, 4, 4), true],
    ['neither', stand(A, 0, 3), false],
  ])
})

describe('inCorner: where two walls of a room meet', () => {
  describe('any room', () => {
    table({ personId: A, type: 'inCorner', args: {} }, [
      ['grid corner', stand(A, 0, 0), true],
      ['top wall + wall to the living room', stand(A, 0, 2), true],
      ['walls to two other rooms', stand(A, 2, 2), true],
      ['top border only', stand(A, 0, 1), false],
      ['left border only', stand(A, 1, 0), false],
      ['east wall only', stand(A, 1, 2), false],
      ['room centre', stand(A, 1, 1), false],
    ])
  })
  describe('pinned to a room', () => {
    table({ personId: A, type: 'inCorner', args: { roomId: 'kitchen' } }, [
      ['corner of the kitchen', stand(A, 0, 0), true],
      ['corner of the living room', stand(A, 0, 3), false],
    ])
  })
  describe('the L-shaped room of the official example', () => {
    // a a a / a a a / b a b
    const l: Scene = {
      width: 3,
      height: 3,
      rooms: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
      cellRooms: [
        ['a', 'a', 'a'],
        ['a', 'a', 'a'],
        ['b', 'a', 'b'],
      ],
      objects: [],
      edgeFeatures: [],
    }
    const corners = [
      [0, 0],
      [0, 2],
      [1, 0],
      [1, 2],
      [2, 1],
    ]
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const expected = row === 2 && col !== 1 ? true : corners.some(([r, c]) => r === row && c === col)
        it(`r${row + 1}c${col + 1} -> ${expected}`, () => {
          expect(isCorner(l, { row, col })).toBe(expected)
        })
      }
    }
    it('the middle of the room is no corner', () => {
      expect(isCorner(l, { row: 1, col: 1 })).toBe(false)
      expect(isCorner(l, { row: 0, col: 1 })).toBe(false)
    })
  })
  it('a corridor: opposite walls do not meet', () => {
    const corridor: Scene = {
      width: 3,
      height: 1,
      rooms: [{ id: 'r', name: 'Gang' }],
      cellRooms: [['r', 'r', 'r']],
      objects: [],
      edgeFeatures: [],
    }
    expect(isCorner(corridor, { row: 0, col: 0 })).toBe(true)
    expect(isCorner(corridor, { row: 0, col: 1 })).toBe(false)
    expect(isCorner(corridor, { row: 0, col: 2 })).toBe(true)
  })
  it('outside the grid is no corner', () => {
    expect(isCorner(scene, { row: -1, col: 0 })).toBe(false)
  })
})

describe('besideFeature / inFrontOfDoor', () => {
  describe('window between two cells: both sides count', () => {
    table({ personId: A, type: 'besideFeature', args: { feature: 'window' } }, [
      ['kitchen side (r2c3)', stand(A, 1, 2), true],
      ['living room side (r2c4)', stand(A, 1, 3), true],
      ['one further', stand(A, 1, 4), false],
      ['above the window cell', stand(A, 0, 2), false],
      ['outer window touches only its own cell', stand(A, 5, 5), true],
      ['next to the outer window cell', stand(A, 5, 4), false],
    ])
  })
  describe('door', () => {
    table({ personId: A, type: 'besideFeature', args: { feature: 'door' } }, [
      ['kitchen side', stand(A, 2, 1), true],
      ['bedroom side', stand(A, 3, 1), true],
      ['next to the door cell', stand(A, 2, 2), false],
      ['a window is not a door', stand(A, 1, 2), false],
    ])
    table({ personId: A, type: 'besideFeature', args: { feature: 'window' } }, [
      ['a door is not a window', stand(A, 2, 1), false],
    ])
  })
  describe('in front of a door', () => {
    table({ personId: A, type: 'inFrontOfDoor', args: {} }, [
      ['bedroom side', stand(A, 3, 1), true],
      ['kitchen side', stand(A, 2, 1), true],
      ['away from the door', stand(A, 4, 1), false],
      ['at a window only', stand(A, 1, 3), false],
    ])
  })
})

describe('alone: nobody else in the room, victim counts', () => {
  const alone = { personId: A, type: 'alone', args: {} } as const
  table(alone, [
    ['nobody else in the kitchen', stand(A, 0, 0, 'B', 0, 3, 'V', 3, 3), true],
    ['a suspect in the room', stand(A, 0, 0, 'B', 1, 2), false],
    ['the victim in the room', stand(A, 0, 0, 'V', 2, 2), false],
    ['only A placed', stand(A, 0, 0), true],
  ])
  describe('pinned to a room', () => {
    const inKitchen = { personId: A, type: 'alone', args: { roomId: 'kitchen' } } as const
    table(inKitchen, [
      ['alone in the kitchen', stand(A, 0, 0, 'B', 0, 3), true],
      ['alone, but in the living room', stand(A, 0, 3, 'B', 0, 0), false],
    ])
  })
})

describe('withPerson: same room, others may be there, victim may be the other', () => {
  const withB = { personId: A, type: 'withPerson', args: { otherId: 'B' } } as const
  table(withB, [
    ['same room', stand(A, 0, 0, 'B', 2, 2), true],
    ['same room with a third person', stand(A, 0, 0, 'B', 2, 2, 'C', 0, 1), true],
    ['other room', stand(A, 0, 0, 'B', 0, 3), false],
    ['B not placed', stand(A, 0, 0), false],
  ])
  table({ personId: A, type: 'withPerson', args: { otherId: 'V' } }, [
    ['with the victim', stand(A, 0, 0, 'V', 2, 2), true],
  ])
  describe('in a named room', () => {
    const inKitchen = { personId: A, type: 'withPerson', args: { otherId: 'B', roomId: 'kitchen' } } as const
    table(inKitchen, [
      ['together in the kitchen', stand(A, 0, 0, 'B', 2, 2), true],
      ['together, but in the living room', stand(A, 0, 3, 'B', 2, 5), false],
    ])
  })
})

describe('aloneWith: only these two in the room', () => {
  const aloneWithB = { personId: A, type: 'aloneWith', args: { otherId: 'B' } } as const
  table(aloneWithB, [
    ['exactly A and B', stand(A, 0, 0, 'B', 2, 2, 'C', 0, 3), true],
    ['a third person joins', stand(A, 0, 0, 'B', 2, 2, 'C', 1, 0), false],
    ['the victim joins', stand(A, 0, 0, 'B', 2, 2, 'V', 1, 0), false],
    ['B elsewhere', stand(A, 0, 0, 'B', 0, 3), false],
  ])
  table({ personId: A, type: 'aloneWith', args: { otherId: 'V' } }, [
    ['alone with the victim', stand(A, 0, 0, 'V', 2, 2), true],
  ])
  table({ personId: A, type: 'aloneWith', args: { otherId: 'B', roomId: 'living' } }, [
    ['alone with B, but in the kitchen', stand(A, 0, 0, 'B', 2, 2), false],
    ['alone with B in the living room', stand(A, 0, 3, 'B', 2, 5), true],
  ])
  table({ personId: A, type: 'aloneWith', args: { otherId: A } }, [
    ['cannot be alone with oneself', stand(A, 0, 0), false],
  ])
})

describe('roomHasGender: at least one OTHER person of that gender in the holder room', () => {
  const woman = { personId: A, type: 'roomHasGender', args: { gender: 'woman' } } as const
  const man = { personId: A, type: 'roomHasGender', args: { gender: 'man' } } as const
  const holds = (clue: StructuralClue, placements: ReturnType<typeof stand>, expected: boolean, label: string) =>
    it(`${label} -> ${expected}`, () => expect(evaluate(clue, scene, placements, people)).toBe(expected))

  holds(woman, stand(A, 0, 0, 'B', 2, 2, 'C', 3, 3), true, 'a woman shares the room')
  holds(woman, stand(A, 0, 0, 'B', 0, 3, 'C', 1, 1), false, 'the only woman is in another room')
  holds(woman, stand(A, 0, 0, 'C', 2, 2, 'B', 3, 3), false, 'only a man shares the room')
  holds(woman, stand(A, 0, 0, 'V', 2, 2), false, 'the victim has no gender, so does not count')
  holds(man, stand(A, 0, 0, 'B', 2, 2), false, 'the holder is a man himself but does not count: only a woman is with him')
  holds(man, stand(A, 0, 0), false, 'the holder alone in the room')
  holds(man, stand(A, 0, 0, 'C', 2, 2), true, 'another man in the room')
  holds({ ...woman, personId: 'B' }, stand('B', 0, 0, 'A', 2, 2), false, 'a woman holder with only a man in the room')
  holds({ ...woman, personId: 'B' }, stand('B', 0, 0), false, 'a woman holder alone: she does not count herself')
  holds(woman, stand('B', 0, 0), false, 'holder not placed')
  it('is false when the genders are not known', () => {
    expect(evaluate(woman, scene, stand(A, 0, 0, 'B', 2, 2))).toBe(false)
    expect(evaluate(woman, scene, stand(A, 0, 0, 'B', 2, 2), people.map((p) => ({ id: p.id })))).toBe(false)
  })
})

describe('aloneWithGender: exactly one other person in the room, of that gender', () => {
  const woman = { personId: A, type: 'aloneWithGender', args: { gender: 'woman' } } as const
  const man = { personId: A, type: 'aloneWithGender', args: { gender: 'man' } } as const
  const holds = (clue: StructuralClue, placements: ReturnType<typeof stand>, expected: boolean, label: string) =>
    it(`${label} -> ${expected}`, () => expect(evaluate(clue, scene, placements, people)).toBe(expected))

  holds(woman, stand(A, 0, 0, 'B', 2, 2, 'C', 0, 3), true, 'just the holder and a woman')
  holds(woman, stand(A, 0, 0, 'B', 2, 2, 'C', 1, 1), false, 'a man joins them')
  holds(woman, stand(A, 0, 0, 'B', 2, 2, 'V', 1, 1), false, 'the victim joins them')
  holds(woman, stand(A, 0, 0, 'C', 2, 2), false, 'alone with a man, not a woman')
  holds(woman, stand(A, 0, 0, 'B', 0, 3), false, 'the woman is in another room')
  holds(woman, stand(A, 0, 0), false, 'the holder alone in the room')
  holds(man, stand(A, 0, 0, 'C', 2, 2, 'B', 0, 3), true, 'alone with a man (the holder is a man too)')
  holds(man, stand(A, 0, 0, 'C', 2, 2, 'B', 1, 1), false, 'a man and a woman: not alone with a man')
  holds(woman, stand(A, 0, 0, 'V', 2, 2), false, 'alone with the gift')
  it('is false when the genders are not known', () => {
    expect(evaluate(woman, scene, stand(A, 0, 0, 'B', 2, 2))).toBe(false)
  })
})

describe('emptyRoom: nobody, not even the victim', () => {
  const emptyLiving = { personId: A, type: 'emptyRoom', args: { roomId: 'living' } } as const
  table(emptyLiving, [
    ['nobody in the living room', stand(A, 0, 0, 'B', 3, 3, 'V', 4, 4), true],
    ['a suspect in it', stand(A, 0, 0, 'B', 0, 3), false],
    ['the victim in it', stand(A, 0, 0, 'V', 1, 4), false],
    ['the holder in it', stand(A, 0, 3), false],
  ])
})

describe('inRow / inColumn (0-based index, shown 1-based)', () => {
  table({ personId: A, type: 'inRow', args: { index: 2 } }, [
    ['in the 3rd row', stand(A, 2, 4), true],
    ['in the 2nd row', stand(A, 1, 4), false],
  ])
  table({ personId: A, type: 'inColumn', args: { index: 1 } }, [
    ['in the 2nd column', stand(A, 4, 1), true],
    ['in the 3rd column', stand(A, 4, 2), false],
  ])
})

describe('onLine: top/last/middle row and column', () => {
  const l3: Scene = {
    width: 3,
    height: 3,
    rooms: [{ id: 'r', name: 'Kamer' }],
    cellRooms: [
      ['r', 'r', 'r'],
      ['r', 'r', 'r'],
      ['r', 'r', 'r'],
    ],
    objects: [],
    edgeFeatures: [],
  }
  const line = (axis: 'row' | 'column', position: 'first' | 'last' | 'middle') =>
    ({ personId: A, type: 'onLine', args: { axis, position } }) as const
  table(line('row', 'first'), [
    ['top row', stand(A, 0, 2), true],
    ['not top row', stand(A, 1, 2), false],
  ], l3)
  table(line('row', 'last'), [
    ['last row', stand(A, 2, 0), true],
    ['not last row', stand(A, 1, 0), false],
  ], l3)
  table(line('row', 'middle'), [
    ['middle row', stand(A, 1, 0), true],
    ['not middle row', stand(A, 0, 0), false],
  ], l3)
  table(line('column', 'first'), [['first column', stand(A, 2, 0), true]], l3)
  table(line('column', 'last'), [['last column', stand(A, 0, 2), true]], l3)
  table(line('column', 'middle'), [
    ['middle column', stand(A, 0, 1), true],
    ['not middle column', stand(A, 0, 2), false],
  ], l3)
  describe('an even grid has no middle', () => {
    table(line('row', 'middle'), [
      ['row 3 of 6', stand(A, 2, 0), false],
      ['row 4 of 6', stand(A, 3, 0), false],
    ])
    it('lineIndex', () => {
      expect(lineIndex(6, 'middle')).toBeNull()
      expect(lineIndex(7, 'middle')).toBe(3)
      expect(lineIndex(6, 'last')).toBe(5)
    })
  })
})

describe('inRoomEdge: top/bottom row, leftmost/rightmost column of a room', () => {
  /**
   * 5x5 with an L-shaped room 'L' (the letter L) and a room 'R' that fills the rest:
   *
   *   r0  L R R R R
   *   r1  L R R R R
   *   r2  L L L R R
   *   r3  R R R R R
   *   r4  R R R R R
   *
   * L: rows 0-2, columns 0-2. Its top row is r0 (only c0), its bottom row r2, its leftmost column c0 and its
   * rightmost column c2 (only r2). R wraps around it: rows 0-4, columns 0-4, but its column 0 starts at r3.
   */
  const lShape: Scene = {
    width: 5,
    height: 5,
    rooms: [
      { id: 'L', name: 'Corner' },
      { id: 'R', name: 'Remainder' },
    ],
    cellRooms: ['LRRRR', 'LRRRR', 'LLLRR', 'RRRRR', 'RRRRR'].map((row) => [...row]),
    objects: [],
    edgeFeatures: [],
  }
  const edge = (edge: 'north' | 'south' | 'east' | 'west', roomId?: string) =>
    ({ personId: A, type: 'inRoomEdge', args: roomId === undefined ? { edge } : { roomId, edge } }) as const

  it('the top row of an irregular room is the smallest row that holds a square of it', () => {
    expect(roomEdgeIndex(lShape, 'L', 'north')).toBe(0)
    expect(roomEdgeIndex(lShape, 'L', 'south')).toBe(2)
    expect(roomEdgeIndex(lShape, 'L', 'west')).toBe(0)
    expect(roomEdgeIndex(lShape, 'L', 'east')).toBe(2)
    // Room R starts at column 0 only from r3 on: its leftmost column is still c0.
    expect(roomEdgeIndex(lShape, 'R', 'west')).toBe(0)
    expect(roomEdgeIndex(lShape, 'R', 'north')).toBe(0)
    expect(roomEdgeIndex(lShape, 'nowhere', 'north')).toBeNull()
  })

  describe("the holder's own room (no roomId)", () => {
    table(edge('north'), [
      ['top row of L: r0c0', stand(A, 0, 0), true],
      ['r1c0 is in L, but not its top row', stand(A, 1, 0), false],
      ['top row of R is r0 too', stand(A, 0, 3), true],
      ['r1c3 is not the top row of R', stand(A, 1, 3), false],
      ['r3c0 is in R, whose top row is r0', stand(A, 3, 0), false],
      ['not placed', stand('B', 0, 0), false],
    ], lShape)
    table(edge('south'), [
      ['bottom row of L is r2 (any of its columns)', stand(A, 2, 1), true],
      ['r2c0 is in L too', stand(A, 2, 0), true],
      ['r0c0 is the top, not the bottom of L', stand(A, 0, 0), false],
      ['bottom row of R', stand(A, 4, 4), true],
      ['r2c4 is in R, not on its bottom row', stand(A, 2, 4), false],
    ], lShape)
    table(edge('east'), [
      ['rightmost column of L is c2, only at r2', stand(A, 2, 2), true],
      ['r1c0 is in L but c0 is not its rightmost column', stand(A, 1, 0), false],
      ['rightmost column of R', stand(A, 3, 4), true],
    ], lShape)
    table(edge('west'), [
      ['leftmost column of L', stand(A, 1, 0), true],
      ['r2c1 is in L, not on its leftmost column', stand(A, 2, 1), false],
      ['leftmost column of R is c0 (r3, r4)', stand(A, 4, 0), true],
      ['r0c1 is in R but not on its leftmost column', stand(A, 0, 1), false],
    ], lShape)
  })

  describe('a named room', () => {
    table(edge('north', 'L'), [
      ['on the top row of L', stand(A, 0, 0), true],
      ['top row of R does not count for L', stand(A, 0, 3), false],
    ], lShape)
    table(edge('west', 'R'), [
      ['leftmost column of R', stand(A, 3, 0), true],
      ['leftmost column of L is no answer for R', stand(A, 0, 0), false],
    ], lShape)
  })

  describe('a regular room: the outer lines of the room, not of the grid', () => {
    table(edge('north', 'living'), [
      ['top row of the living room', stand(A, 0, 4), true],
      ['top row of the bedroom is not the living room', stand(A, 3, 1), false],
    ])
    table(edge('north'), [
      ['top row of the bedroom (own room) is row 3', stand(A, 3, 1), true],
      ['row 4 of the bedroom', stand(A, 4, 1), false],
    ])
    table(edge('east'), [
      ['rightmost column of the kitchen is column 2', stand(A, 1, 2), true],
      ['rightmost column of the study is column 5', stand(A, 4, 5), true],
      ['column 4 of the study', stand(A, 4, 4), false],
    ])
  })
})

describe('aloneWithMurderer (victim card)', () => {
  const card = { personId: 'V', type: 'aloneWithMurderer', args: {} } as const
  table(card, [
    ['victim with exactly one suspect', stand('V', 0, 0, A, 2, 2, 'B', 0, 3), true],
    ['two suspects in the victim room', stand('V', 0, 0, A, 2, 2, 'B', 1, 0), false],
    ['victim alone: there is no murderer', stand('V', 0, 0, A, 0, 3, 'B', 3, 3), false],
    ['victim not placed', stand(A, 2, 2), false],
  ])
})
