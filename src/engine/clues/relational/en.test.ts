import { describe, expect, it } from 'vitest'
import { checkClue } from '../check.ts'
import { renderClue } from '../en.ts'
import { people, scene } from '../testing.fixture.ts'
import { RELATIONAL_CLUE_TYPES } from './types.ts'
import type { RelationalClue } from './types.ts'

const ctx = { scene, people }

const samples: [RelationalClue, string][] = [
  [{ personId: 'A', type: 'directionOf', args: { side: 'north', otherId: 'B' } }, 'A stood further north than B.'],
  [{ personId: 'A', type: 'directionOf', args: { side: 'south', otherId: 'B' } }, 'A stood further south than B.'],
  [{ personId: 'A', type: 'directionOf', args: { side: 'east', otherId: 'V' } }, 'A stood further east than V.'],
  [{ personId: 'A', type: 'directionOf', args: { side: 'west', otherId: 'B' } }, 'A stood further west than B.'],
  [
    { personId: 'A', type: 'directionOf', args: { side: 'north', otherId: 'B', roomId: 'kitchen' } },
    'A was in the Kitchen, further north than B.',
  ],
  [
    { personId: 'A', type: 'directionOf', args: { side: 'west', otherId: 'B', alone: true } },
    'A was alone, further west than B.',
  ],
  [
    { personId: 'A', type: 'directionOfObject', args: { side: 'east', objectType: 'table' } },
    'A stood further east than a table.',
  ],
  [
    { personId: 'A', type: 'exactDistance', args: { side: 'north', count: 1, otherId: 'B' } },
    'A stood exactly one row above B.',
  ],
  [
    { personId: 'A', type: 'exactDistance', args: { side: 'south', count: 3, otherId: 'B' } },
    'A stood exactly three rows below B.',
  ],
  [
    { personId: 'A', type: 'exactDistance', args: { side: 'east', count: 1, otherId: 'B' } },
    'A stood exactly one column right of B.',
  ],
  [
    { personId: 'A', type: 'exactDistance', args: { side: 'west', count: 2, otherId: 'V' } },
    'A stood exactly two columns left of V.',
  ],
  [
    {
      personId: 'A',
      type: 'exactDistance',
      args: { side: 'north', count: 1, otherId: 'B', alone: true, roomId: 'study' },
    },
    'A was alone in the Study, exactly one row above B.',
  ],
  [
    { personId: 'A', type: 'directlyNextToObject', args: { side: 'south', objectType: 'easel' } },
    'A stood on the square directly below an easel.',
  ],
  [
    { personId: 'A', type: 'directlyNextToObject', args: { side: 'west', objectType: 'tree' } },
    'A stood on the square directly left of a tree.',
  ],
  [{ personId: 'A', type: 'diagonal', args: { otherId: 'B' } }, 'A stood on the same diagonal as B.'],
  [
    { personId: 'A', type: 'diagonal', args: { otherId: 'B', direction: 'northwest' } },
    'A stood on the diagonal to the northwest of B.',
  ],
  [
    { personId: 'A', type: 'diagonal', args: { otherId: 'B', steps: 1 } },
    'A stood exactly one square diagonally from B.',
  ],
  [
    { personId: 'A', type: 'diagonal', args: { otherId: 'B', steps: 2, direction: 'southeast' } },
    'A stood exactly two squares diagonally to the southeast of B.',
  ],
  [
    { personId: 'A', type: 'diagonal', args: { otherId: 'B', roomId: 'living', alone: true } },
    'A was alone in the Living Room, on the same diagonal as B.',
  ],
  [
    { personId: 'A', type: 'quadrant', args: { direction: 'northeast', otherId: 'B' } },
    'A stood somewhere to the northeast of B.',
  ],
  [
    { personId: 'A', type: 'quadrant', args: { direction: 'southwest', otherId: 'B' } },
    'A stood somewhere to the southwest of B.',
  ],
  [{ personId: 'A', type: 'sameRoom', args: { otherId: 'B' } }, 'A was in the same room as B.'],
  [{ personId: 'A', type: 'differentRoom', args: { otherId: 'V' } }, 'A was in a different room from V.'],
  [{ personId: 'A', type: 'notWith', args: { otherId: 'B' } }, 'A was not with B.'],
  [
    { personId: 'A', type: 'notBesideObject', args: { objectType: 'bookshelf' } },
    'A did not stand next to a bookshelf.',
  ],
]

describe('clue text: relational kinds', () => {
  it.each(samples)('%j', (clue, sentence) => {
    expect(renderClue(clue, ctx)).toBe(sentence)
  })

  it('has a sample for every relational kind', () => {
    expect(new Set(samples.map(([c]) => c.type))).toEqual(new Set(RELATIONAL_CLUE_TYPES))
  })

  it('every sample is a well-formed clue', () => {
    for (const [clue] of samples) expect(checkClue(clue, ctx), JSON.stringify(clue)).toEqual([])
  })

  it('a name change shows up in the text', () => {
    const named = { scene, people: [{ id: 'A', kind: 'suspect' as const, label: 'Alice' }, { id: 'B', kind: 'suspect' as const, label: 'Ben' }] }
    expect(renderClue({ personId: 'A', type: 'notWith', args: { otherId: 'B' } }, named)).toBe(
      'Alice was not with Ben.',
    )
  })

  it('uses the compass words of the four sides', () => {
    for (const [side, word] of [
      ['north', 'further north'],
      ['south', 'further south'],
      ['east', 'further east'],
      ['west', 'further west'],
    ] as const) {
      const clue: RelationalClue = { personId: 'A', type: 'directionOf', args: { side, otherId: 'B' } }
      expect(renderClue(clue, ctx)).toContain(word)
    }
  })
})
