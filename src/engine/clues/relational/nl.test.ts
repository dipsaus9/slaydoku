import { describe, expect, it } from 'vitest'
import { checkClue } from '../check.ts'
import { renderClue } from '../nl.ts'
import { people, scene } from '../testing.fixture.ts'
import { RELATIONAL_CLUE_TYPES } from './types.ts'
import type { RelationalClue } from './types.ts'

const ctx = { scene, people }

const samples: [RelationalClue, string][] = [
  [{ personId: 'A', type: 'directionOf', args: { side: 'north', otherId: 'B' } }, 'A stond noordelijker dan B.'],
  [{ personId: 'A', type: 'directionOf', args: { side: 'south', otherId: 'B' } }, 'A stond zuidelijker dan B.'],
  [{ personId: 'A', type: 'directionOf', args: { side: 'east', otherId: 'V' } }, 'A stond oostelijker dan V.'],
  [{ personId: 'A', type: 'directionOf', args: { side: 'west', otherId: 'B' } }, 'A stond westelijker dan B.'],
  [
    { personId: 'A', type: 'directionOf', args: { side: 'north', otherId: 'B', roomId: 'kitchen' } },
    'A was in de Keuken, noordelijker dan B.',
  ],
  [
    { personId: 'A', type: 'directionOf', args: { side: 'west', otherId: 'B', alone: true } },
    'A was alleen, westelijker dan B.',
  ],
  [
    { personId: 'A', type: 'directionOfObject', args: { side: 'east', objectType: 'table' } },
    'A stond oostelijker dan een tafel.',
  ],
  [
    { personId: 'A', type: 'exactDistance', args: { side: 'north', count: 1, otherId: 'B' } },
    'A stond precies één rij boven B.',
  ],
  [
    { personId: 'A', type: 'exactDistance', args: { side: 'south', count: 3, otherId: 'B' } },
    'A stond precies drie rijen onder B.',
  ],
  [
    { personId: 'A', type: 'exactDistance', args: { side: 'east', count: 1, otherId: 'B' } },
    'A stond precies één kolom rechts van B.',
  ],
  [
    { personId: 'A', type: 'exactDistance', args: { side: 'west', count: 2, otherId: 'V' } },
    'A stond precies twee kolommen links van V.',
  ],
  [
    {
      personId: 'A',
      type: 'exactDistance',
      args: { side: 'north', count: 1, otherId: 'B', alone: true, roomId: 'study' },
    },
    'A was alleen in het Kantoor, precies één rij boven B.',
  ],
  [
    { personId: 'A', type: 'directlyNextToObject', args: { side: 'south', objectType: 'easel' } },
    'A stond op het vakje direct onder een ezel.',
  ],
  [
    { personId: 'A', type: 'directlyNextToObject', args: { side: 'west', objectType: 'tree' } },
    'A stond op het vakje direct links van een boom.',
  ],
  [{ personId: 'A', type: 'diagonal', args: { otherId: 'B' } }, 'A stond op dezelfde diagonaal als B.'],
  [
    { personId: 'A', type: 'diagonal', args: { otherId: 'B', direction: 'northwest' } },
    'A stond op de diagonaal ten noordwesten van B.',
  ],
  [
    { personId: 'A', type: 'diagonal', args: { otherId: 'B', steps: 1 } },
    'A stond precies één vakje diagonaal van B.',
  ],
  [
    { personId: 'A', type: 'diagonal', args: { otherId: 'B', steps: 2, direction: 'southeast' } },
    'A stond precies twee vakjes diagonaal ten zuidoosten van B.',
  ],
  [
    { personId: 'A', type: 'diagonal', args: { otherId: 'B', roomId: 'living', alone: true } },
    'A was alleen in de Woonkamer, op dezelfde diagonaal als B.',
  ],
  [
    { personId: 'A', type: 'quadrant', args: { direction: 'northeast', otherId: 'B' } },
    'A stond ergens ten noordoosten van B.',
  ],
  [
    { personId: 'A', type: 'quadrant', args: { direction: 'southwest', otherId: 'B' } },
    'A stond ergens ten zuidwesten van B.',
  ],
  [{ personId: 'A', type: 'sameRoom', args: { otherId: 'B' } }, 'A was in dezelfde kamer als B.'],
  [{ personId: 'A', type: 'differentRoom', args: { otherId: 'V' } }, 'A was in een andere kamer dan V.'],
  [{ personId: 'A', type: 'notWith', args: { otherId: 'B' } }, 'A was niet samen met B.'],
  [
    { personId: 'A', type: 'notBesideObject', args: { objectType: 'bookshelf' } },
    'A stond niet naast een boekenkast.',
  ],
]

describe('Dutch clue text: relational kinds', () => {
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
      'Alice was niet samen met Ben.',
    )
  })

  it('uses the compass words of the four sides', () => {
    for (const [side, word] of [
      ['north', 'noordelijker'],
      ['south', 'zuidelijker'],
      ['east', 'oostelijker'],
      ['west', 'westelijker'],
    ] as const) {
      const clue: RelationalClue = { personId: 'A', type: 'directionOf', args: { side, otherId: 'B' } }
      expect(renderClue(clue, ctx)).toContain(word)
    }
  })
})
