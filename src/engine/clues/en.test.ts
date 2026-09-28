import { describe, expect, it } from 'vitest'
import { OBJECT_TYPES } from '../model/index.ts'
import { checkClue } from './check.ts'
import { OBJECT_WORDS, VICTIM_TEXT, capitalizeLabel, countWord, objectNouns, objectOn, renderClue, roomName, upperFirst, withArticle } from './en.ts'
import { renderClue as renderClueLocale } from './render.ts'
import { people, scene } from './testing.fixture.ts'
import { STRUCTURAL_CLUE_TYPES } from './types.ts'
import type { CatalogClue, StructuralClue } from './types.ts'

const ctx = { scene, people }
const say = (clue: StructuralClue) => renderClue(clue, ctx)
const sayNl = (clue: StructuralClue) => renderClueLocale(clue, ctx, 'nl')

const samples: [StructuralClue, string][] = [
  [{ personId: 'A', type: 'onObject', args: { objectType: 'car' } }, 'A sat in a car.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'chair' } }, 'A sat on a chair.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'rug' } }, 'A stood on a rug.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'bed' } }, 'A lay on a bed.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'easel' } }, 'A stood on an easel.'],
  [
    { personId: 'A', type: 'squareWithObject', args: { objectType: 'framedPainting' } },
    "There was a framed painting on A's square.",
  ],
  [
    { personId: 'B', type: 'besideObject', args: { objectType: 'bookshelf' } },
    'B stood next to a bookshelf.',
  ],
  [{ personId: 'A', type: 'besideObject', args: { objectType: 'table' } }, 'A stood next to a table.'],
  [
    { personId: 'B', type: 'besideObject', args: { objectType: 'bookshelf', exactlyOne: true } },
    'B stood next to exactly one bookshelf.',
  ],
  [
    { personId: 'C', type: 'onlyOnObject', args: { objectType: 'chair' } },
    'C was the only person on a chair.',
  ],
  [
    { personId: 'C', type: 'onlyOnObject', args: { objectType: 'car' } },
    'C was the only person in a car.',
  ],
  [{ personId: 'A', type: 'inRoom', args: { roomId: 'kitchen' } }, 'A was in the Kitchen.'],
  [
    { personId: 'A', type: 'inRoomOr', args: { roomIds: ['kitchen', 'study'] } },
    'A was in the Kitchen or the Study.',
  ],
  [{ personId: 'A', type: 'inCorner', args: {} }, 'A stood in a corner.'],
  [
    { personId: 'A', type: 'inCorner', args: { roomId: 'living' } },
    'A stood in a corner of the Living Room.',
  ],
  [{ personId: 'A', type: 'besideFeature', args: { feature: 'window' } }, 'A stood next to a window.'],
  [{ personId: 'A', type: 'besideFeature', args: { feature: 'door' } }, 'A stood next to a door.'],
  [{ personId: 'A', type: 'inFrontOfDoor', args: {} }, 'A stood in front of a door.'],
  [{ personId: 'A', type: 'alone', args: {} }, 'A was alone.'],
  [{ personId: 'A', type: 'alone', args: { roomId: 'bedroom' } }, 'A was alone in the Bedroom.'],
  [{ personId: 'A', type: 'withPerson', args: { otherId: 'B' } }, 'A was with B.'],
  [
    { personId: 'A', type: 'withPerson', args: { otherId: 'B', roomId: 'living' } },
    'A was with B in the Living Room.',
  ],
  [{ personId: 'A', type: 'aloneWith', args: { otherId: 'V' } }, 'A was alone with V.'],
  [
    { personId: 'A', type: 'aloneWith', args: { otherId: 'B', roomId: 'study' } },
    'A was alone with B in the Study.',
  ],
  [{ personId: 'A', type: 'emptyRoom', args: { roomId: 'living' } }, 'There was nobody in the Living Room.'],
  [{ personId: 'A', type: 'roomHasGender', args: { gender: 'woman' } }, "There was at least one woman in A's room."],
  [{ personId: 'A', type: 'roomHasGender', args: { gender: 'man' } }, "There was at least one man in A's room."],
  [{ personId: 'B', type: 'aloneWithGender', args: { gender: 'man' } }, 'B was alone with a man.'],
  [{ personId: 'A', type: 'aloneWithGender', args: { gender: 'woman' } }, 'A was alone with a woman.'],
  [{ personId: 'A', type: 'inRow', args: { index: 2 } }, 'A stood in row 3.'],
  [{ personId: 'A', type: 'inColumn', args: { index: 1 } }, 'A stood in column 2.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'row', position: 'first' } }, 'A stood in the top row.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'row', position: 'last' } }, 'A stood in the bottom row.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'row', position: 'middle' } }, 'A stood in the middle row.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'column', position: 'first' } }, 'A stood in the leftmost column.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'column', position: 'last' } }, 'A stood in the rightmost column.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'column', position: 'middle' } }, 'A stood in the middle column.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'north' } }, 'A stood in the top row of the room.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'south' } }, 'A stood in the bottom row of the room.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'west' } }, 'A stood in the leftmost column of the room.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'east' } }, 'A stood in the rightmost column of the room.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { roomId: 'kitchen', edge: 'north' } }, 'A stood in the top row of the Kitchen.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { roomId: 'study', edge: 'east' } }, 'A stood in the rightmost column of the Study.'],
  [
    {
      personId: 'A',
      type: 'both',
      args: { a: { type: 'besideObject', args: { objectType: 'table' } }, b: { type: 'roomHasGender', args: { gender: 'woman' } } },
    },
    'A stood next to a table and there was at least one woman in the same room.',
  ],
  [
    {
      personId: 'A',
      type: 'both',
      args: { a: { type: 'alone', args: { roomId: 'kitchen' } }, b: { type: 'onLine', args: { axis: 'row', position: 'first' } } },
    },
    'A was alone in the Kitchen and stood in the top row.',
  ],
  [{ personId: 'V', type: 'aloneWithMurderer', args: {} }, 'The victim was alone with the murderer.'],
]

/**
 * The Dutch counterpart of `samples`, same clues in the same order (SLAY-3.2): the object and room
 * nouns stay the English words `samples` uses too (see `nl.ts`'s header), only the grammar around
 * them is Dutch.
 */
const samplesNl: [StructuralClue, string][] = [
  [{ personId: 'A', type: 'onObject', args: { objectType: 'car' } }, 'A zat in een car.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'chair' } }, 'A zat op een chair.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'rug' } }, 'A stond op een rug.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'bed' } }, 'A lag op een bed.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'easel' } }, 'A stond op een easel.'],
  [
    { personId: 'A', type: 'squareWithObject', args: { objectType: 'framedPainting' } },
    "Er lag een framed painting op A's vakje.",
  ],
  [
    { personId: 'B', type: 'besideObject', args: { objectType: 'bookshelf' } },
    'B stond naast een bookshelf.',
  ],
  [{ personId: 'A', type: 'besideObject', args: { objectType: 'table' } }, 'A stond naast een table.'],
  [
    { personId: 'B', type: 'besideObject', args: { objectType: 'bookshelf', exactlyOne: true } },
    'B stond naast precies één bookshelf.',
  ],
  [
    { personId: 'C', type: 'onlyOnObject', args: { objectType: 'chair' } },
    'C was de enige persoon op een chair.',
  ],
  [
    { personId: 'C', type: 'onlyOnObject', args: { objectType: 'car' } },
    'C was de enige persoon in een car.',
  ],
  [{ personId: 'A', type: 'inRoom', args: { roomId: 'kitchen' } }, 'A was in de Keuken.'],
  [
    { personId: 'A', type: 'inRoomOr', args: { roomIds: ['kitchen', 'study'] } },
    'A was in de Keuken of de Studeerkamer.',
  ],
  [{ personId: 'A', type: 'inCorner', args: {} }, 'A stond in een hoek.'],
  [
    { personId: 'A', type: 'inCorner', args: { roomId: 'living' } },
    'A stond in een hoek van de Woonkamer.',
  ],
  [{ personId: 'A', type: 'besideFeature', args: { feature: 'window' } }, 'A stond naast een raam.'],
  [{ personId: 'A', type: 'besideFeature', args: { feature: 'door' } }, 'A stond naast een deur.'],
  [{ personId: 'A', type: 'inFrontOfDoor', args: {} }, 'A stond voor een deur.'],
  [{ personId: 'A', type: 'alone', args: {} }, 'A was alleen.'],
  [{ personId: 'A', type: 'alone', args: { roomId: 'bedroom' } }, 'A was alleen in de Slaapkamer.'],
  [{ personId: 'A', type: 'withPerson', args: { otherId: 'B' } }, 'A was samen met B.'],
  [
    { personId: 'A', type: 'withPerson', args: { otherId: 'B', roomId: 'living' } },
    'A was samen met B in de Woonkamer.',
  ],
  [{ personId: 'A', type: 'aloneWith', args: { otherId: 'V' } }, 'A was alleen met V.'],
  [
    { personId: 'A', type: 'aloneWith', args: { otherId: 'B', roomId: 'study' } },
    'A was alleen met B in de Studeerkamer.',
  ],
  [{ personId: 'A', type: 'emptyRoom', args: { roomId: 'living' } }, 'Er was niemand in de Woonkamer.'],
  [{ personId: 'A', type: 'roomHasGender', args: { gender: 'woman' } }, "Er was minstens één vrouw in A's kamer."],
  [{ personId: 'A', type: 'roomHasGender', args: { gender: 'man' } }, "Er was minstens één man in A's kamer."],
  [{ personId: 'B', type: 'aloneWithGender', args: { gender: 'man' } }, 'B was alleen met een man.'],
  [{ personId: 'A', type: 'aloneWithGender', args: { gender: 'woman' } }, 'A was alleen met een vrouw.'],
  [{ personId: 'A', type: 'inRow', args: { index: 2 } }, 'A stond in rij 3.'],
  [{ personId: 'A', type: 'inColumn', args: { index: 1 } }, 'A stond in kolom 2.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'row', position: 'first' } }, 'A stond in de bovenste rij.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'row', position: 'last' } }, 'A stond in de onderste rij.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'row', position: 'middle' } }, 'A stond in de middelste rij.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'column', position: 'first' } }, 'A stond in de meest linkse kolom.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'column', position: 'last' } }, 'A stond in de meest rechtse kolom.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'column', position: 'middle' } }, 'A stond in de middelste kolom.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'north' } }, 'A stond in de bovenste rij van de kamer.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'south' } }, 'A stond in de onderste rij van de kamer.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'west' } }, 'A stond in de meest linkse kolom van de kamer.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'east' } }, 'A stond in de meest rechtse kolom van de kamer.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { roomId: 'kitchen', edge: 'north' } }, 'A stond in de bovenste rij van de Keuken.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { roomId: 'study', edge: 'east' } }, 'A stond in de meest rechtse kolom van de Studeerkamer.'],
  [
    {
      personId: 'A',
      type: 'both',
      args: { a: { type: 'besideObject', args: { objectType: 'table' } }, b: { type: 'roomHasGender', args: { gender: 'woman' } } },
    },
    'A stond naast een table en er was minstens één vrouw in dezelfde kamer.',
  ],
  [
    {
      personId: 'A',
      type: 'both',
      args: { a: { type: 'alone', args: { roomId: 'kitchen' } }, b: { type: 'onLine', args: { axis: 'row', position: 'first' } } },
    },
    'A was alleen in de Keuken en stond in de bovenste rij.',
  ],
  [{ personId: 'V', type: 'aloneWithMurderer', args: {} }, 'Het slachtoffer was alleen met de moordenaar.'],
]

describe('clue text', () => {
  it.each(samples)('%j', (clue, sentence) => {
    expect(say(clue)).toBe(sentence)
  })

  it('has a sample for every structural kind', () => {
    expect(new Set(samples.map(([c]) => c.type))).toEqual(new Set(STRUCTURAL_CLUE_TYPES))
  })

  it('every sample is a well-formed clue', () => {
    // the even-grid "middle" samples are the one deliberate exception
    for (const [clue] of samples) {
      const issues = checkClue(clue, ctx)
      const middle = clue.type === 'onLine' && clue.args.position === 'middle'
      expect(issues.length === 0 || middle).toBe(true)
    }
  })

  it('reads as the examples of the design: natural, neutral English', () => {
    const named = {
      scene,
      people: [
        { id: 'A', kind: 'suspect' as const, label: 'Alice', gender: 'woman' as const },
        { id: 'B', kind: 'suspect' as const, label: 'Ben', gender: 'man' as const },
        { id: 'C', kind: 'suspect' as const, label: 'Chloe', gender: 'woman' as const },
        { id: 'D', kind: 'suspect' as const, label: 'Dan', gender: 'man' as const },
        { id: 'E', kind: 'suspect' as const, label: 'Emma', gender: 'woman' as const },
      ],
    }
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'table' } }, named)).toBe('Alice stood next to a table.')
    expect(renderClue({ personId: 'B', type: 'alone', args: { roomId: 'kitchen' } }, named)).toBe('Ben was alone in the Kitchen.')
    expect(renderClue({ personId: 'C', type: 'exactDistance', args: { side: 'west', count: 3, otherId: 'D' } }, named)).toBe(
      'Chloe stood exactly three columns left of Dan.',
    )
    expect(renderClue({ personId: 'D', type: 'roomHasGender', args: { gender: 'woman' } }, named)).toBe(
      "There was at least one woman in Dan's room.",
    )
    expect(renderClue({ personId: 'E', type: 'inRoomEdge', args: { roomId: 'study', edge: 'north' } }, named)).toBe(
      'Emma stood in the top row of the Study.',
    )
  })

  it('the gender sentences name the person by label and use neutral nouns, never he or she', () => {
    const named = {
      scene,
      people: [
        { id: 'A', kind: 'suspect' as const, label: 'Henry', gender: 'man' as const },
        { id: 'B', kind: 'suspect' as const, label: 'Chloe', gender: 'woman' as const },
      ],
    }
    expect(renderClue({ personId: 'A', type: 'roomHasGender', args: { gender: 'woman' } }, named)).toBe(
      "There was at least one woman in Henry's room.",
    )
    expect(renderClue({ personId: 'B', type: 'aloneWithGender', args: { gender: 'man' } }, named)).toBe(
      'Chloe was alone with a man.',
    )
    for (const [clue] of samples.filter(([c]) => c.type === 'roomHasGender' || c.type === 'aloneWithGender')) {
      expect(say(clue)).not.toMatch(/\b(he|she|him|her|his|hers)\b/i)
    }
  })

  it('names the person, so a name change shows up in the text', () => {
    const named = { scene, people: [{ id: 'A', kind: 'suspect' as const, label: 'Alice' }] }
    expect(renderClue({ personId: 'A', type: 'alone', args: {} }, named)).toBe('Alice was alone.')
  })

  it('renders every object type for onObject and besideObject', () => {
    for (const objectType of OBJECT_TYPES) {
      expect(say({ personId: 'A', type: 'onObject', args: { objectType } })).toMatch(/^A (stood|sat|lay) (on|in) an? /)
      expect(say({ personId: 'A', type: 'besideObject', args: { objectType } })).toMatch(/^A stood next to an? /)
    }
  })

  it('gives every object type a noun, a preposition and a verb', () => {
    expect(Object.keys(OBJECT_WORDS).sort()).toEqual([...OBJECT_TYPES].sort())
    expect(objectOn('car')).toBe('in a car')
    expect(objectOn('oilSlick')).toBe('on an oil slick')
  })

  it('picks a or an from the sound of the noun', () => {
    expect(withArticle('table')).toBe('a table')
    expect(withArticle('easel')).toBe('an easel')
    expect(withArticle('office chair')).toBe('an office chair')
    expect(withArticle('TV')).toBe('a TV')
    expect(withArticle('unicycle')).toBe('a unicycle')
  })
})

describe('clue text: Dutch (locale nl)', () => {
  it.each(samplesNl)('%j', (clue, sentence) => {
    expect(sayNl(clue)).toBe(sentence)
  })

  it('has a Dutch sample for every structural kind, same clues as the English samples', () => {
    expect(new Set(samplesNl.map(([c]) => c.type))).toEqual(new Set(STRUCTURAL_CLUE_TYPES))
    expect(samplesNl.map(([c]) => c)).toEqual(samples.map(([c]) => c))
  })

  it('every Dutch sample is a well-formed clue', () => {
    for (const [clue] of samplesNl) {
      const issues = checkClue(clue, ctx)
      const middle = clue.type === 'onLine' && clue.args.position === 'middle'
      expect(issues.length === 0 || middle).toBe(true)
    }
  })

  it('never uses a Dutch gendered pronoun (hij/zij/hem/haar)', () => {
    for (const [clue] of samplesNl) expect(sayNl(clue)).not.toMatch(/\b(hij|zij|hem|haar)\b/i)
  })

  it('locale defaults to English: renderClue with no locale argument is unaffected', () => {
    for (const [clue, sentence] of samples) expect(renderClueLocale(clue, ctx)).toBe(sentence)
  })
})

describe('room names', () => {
  const rooms = {
    rooms: [
      { id: 'bare', name: 'Balcony' },
      { id: 'article', name: 'the Balcony' },
      { id: 'capital', name: 'The Balcony' },
      { id: 'two', name: 'Meeting Room' },
    ],
  }
  const c = { scene: rooms, people }
  const inRoom = (roomId: string) => renderClue({ personId: 'A', type: 'inRoom', args: { roomId } }, c)

  it('room names are stored bare and read with "the"', () => {
    expect(roomName(c, 'bare')).toBe('the Balcony')
    expect(roomName(c, 'two')).toBe('the Meeting Room')
    expect(inRoom('bare')).toBe('A was in the Balcony.')
    expect(inRoom('two')).toBe('A was in the Meeting Room.')
  })

  it('a stored article is never doubled', () => {
    expect(inRoom('article')).toBe('A was in the Balcony.')
    expect(inRoom('capital')).toBe('A was in the Balcony.')
    for (const id of ['bare', 'article', 'capital', 'two']) expect(inRoom(id)).not.toMatch(/\bthe the\b/i)
  })

  it('reads right in every room position of a sentence', () => {
    const say2 = (clue: CatalogClue) => renderClue(clue, c)
    expect(say2({ personId: 'A', type: 'inCorner', args: { roomId: 'two' } })).toBe('A stood in a corner of the Meeting Room.')
    expect(say2({ personId: 'A', type: 'alone', args: { roomId: 'two' } })).toBe('A was alone in the Meeting Room.')
    expect(say2({ personId: 'A', type: 'emptyRoom', args: { roomId: 'two' } })).toBe('There was nobody in the Meeting Room.')
    expect(say2({ personId: 'A', type: 'inRoomOr', args: { roomIds: ['two', 'bare'] } })).toBe(
      'A was in the Meeting Room or the Balcony.',
    )
  })
})

describe('relational clue text', () => {
  const say2 = (clue: CatalogClue) => renderClue(clue, ctx)
  const next = (side: 'north' | 'east' | 'south' | 'west'): CatalogClue => ({
    personId: 'A',
    type: 'directlyNextToObject',
    args: { side, objectType: 'cabinet' },
  })
  const dist = (side: 'north' | 'east' | 'south' | 'west', count: number): CatalogClue => ({
    personId: 'A',
    type: 'exactDistance',
    args: { side, count, otherId: 'B' },
  })

  it('directly next to an object names the square on the plan, not stiff compass words', () => {
    expect(say2(next('north'))).toBe('A stood on the square directly above a cabinet.')
    expect(say2(next('south'))).toBe('A stood on the square directly below a cabinet.')
    expect(say2(next('east'))).toBe('A stood on the square directly right of a cabinet.')
    expect(say2(next('west'))).toBe('A stood on the square directly left of a cabinet.')
  })

  it('exact distances read as rows above or below and columns left or right', () => {
    expect(say2(dist('west', 3))).toBe('A stood exactly three columns left of B.')
    expect(say2(dist('east', 1))).toBe('A stood exactly one column right of B.')
    expect(say2(dist('north', 2))).toBe('A stood exactly two rows above B.')
    expect(say2(dist('south', 1))).toBe('A stood exactly one row below B.')
  })

  it('qualified forms keep the room and alone first', () => {
    const clue: CatalogClue = {
      personId: 'A',
      type: 'exactDistance',
      args: { side: 'north', count: 1, otherId: 'B', roomId: 'kitchen', alone: true },
    }
    expect(say2(clue)).toBe('A was alone in the Kitchen, exactly one row above B.')
  })

  it('never uses the stiff "to the north/south/east/west of" for these two kinds', () => {
    for (const side of ['north', 'south', 'east', 'west'] as const) {
      expect(say2(next(side))).not.toMatch(/to the (north|south|east|west) of/)
      expect(say2(dist(side, 2))).not.toMatch(/to the (north|south|east|west) of/)
    }
  })

  it('keeps compass words where they are the precise reading', () => {
    expect(say2({ personId: 'A', type: 'directionOf', args: { side: 'west', otherId: 'B' } })).toBe(
      'A stood further west than B.',
    )
    expect(say2({ personId: 'A', type: 'quadrant', args: { direction: 'northwest', otherId: 'V' } })).toBe(
      'A stood somewhere to the northwest of V.',
    )
  })

  it('writes small counts as words, big ones as digits', () => {
    expect(countWord(1)).toBe('one')
    expect(countWord(3)).toBe('three')
    expect(countWord(12)).toBe('twelve')
    expect(countWord(13)).toBe('13')
    expect(say2({ personId: 'A', type: 'diagonal', args: { otherId: 'B', steps: 2 } })).toBe(
      'A stood exactly two squares diagonally from B.',
    )
  })
})

describe('the victim label at the start of a sentence', () => {
  const victim = {
    scene,
    people: [
      { id: 'A', kind: 'suspect' as const, label: 'Alice' },
      { id: 'V', kind: 'victim' as const, label: VICTIM_TEXT.noun },
    ],
  }

  it('a clue held by the victim starts with a capital', () => {
    expect(renderClue({ personId: 'V', type: 'onObject', args: { objectType: 'bed' } }, victim)).toBe('The victim lay on a bed.')
    expect(renderClue({ personId: 'V', type: 'inRoom', args: { roomId: 'kitchen' } }, victim)).toBe('The victim was in the Kitchen.')
  })

  it('mid-sentence the victim stays lower case', () => {
    expect(renderClue({ personId: 'A', type: 'aloneWith', args: { otherId: 'V' } }, victim)).toBe('Alice was alone with the victim.')
    expect(renderClue({ personId: 'A', type: 'quadrant', args: { direction: 'northwest', otherId: 'V' } }, victim)).toBe(
      'Alice stood somewhere to the northwest of the victim.',
    )
  })

  it('Dutch: a clue that names the victim by reference says "het slachtoffer", never the stored English label (SLAY-5.2)', () => {
    expect(renderClueLocale({ personId: 'A', type: 'aloneWith', args: { otherId: 'V' } }, victim, 'nl')).toBe(
      'Alice was alleen met het slachtoffer.',
    )
    expect(renderClueLocale({ personId: 'A', type: 'quadrant', args: { direction: 'northwest', otherId: 'V' } }, victim, 'nl')).toBe(
      'Alice stond ergens ten noordwesten van het slachtoffer.',
    )
    expect(renderClueLocale({ personId: 'V', type: 'onObject', args: { objectType: 'bed' } }, victim, 'nl')).toBe(
      'Het slachtoffer lag op een bed.',
    )
  })

  it('upperFirst and capitalizeLabel only touch sentence starts', () => {
    expect(upperFirst('the victim')).toBe('The victim')
    expect(upperFirst('')).toBe('')
    expect(capitalizeLabel('the victim stood on r1c2. Alice stood next to the victim. the victim cannot.', 'the victim')).toBe(
      'The victim stood on r1c2. Alice stood next to the victim. The victim cannot.',
    )
    expect(capitalizeLabel('Alice: "the victim? no"', 'the victim')).toBe('Alice: "the victim? no"')
    expect(capitalizeLabel('the victims stand there', 'the victim')).toBe('the victims stand there')
    expect(capitalizeLabel('nothing', '')).toBe('nothing')
  })

  it('the victim noun is the label the puzzles carry, the rule card reads as one sentence', () => {
    expect(VICTIM_TEXT.noun).toBe('the victim')
    expect(VICTIM_TEXT.title).toBe(upperFirst(VICTIM_TEXT.noun))
    expect(VICTIM_TEXT.sentence).toBe('The victim was alone with the murderer.')
  })
})

describe('neutral wording, one text file', () => {
  const sources = import.meta.glob('./**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
  const production = Object.entries(sources).filter(([path]) => !/\.(test|fixture)\.ts$/.test(path))
  const gendered = /\b(he|she|him|her|his|hers|himself|herself)\b/i

  it('no gendered pronoun in any rendered sentence', () => {
    for (const [clue] of samples) expect(say(clue)).not.toMatch(gendered)
  })

  it('no gendered pronoun in the strings of any clue file', () => {
    expect(production.length).toBeGreaterThan(4)
    for (const [path, source] of production) {
      const strings = source.match(/(['"`])(?:(?!\1)[^\\\n]|\\.)*\1/g) ?? []
      for (const literal of strings) expect(literal, path).not.toMatch(gendered)
    }
  })

  it('the victim sentence is its title plus its clue', () => {
    const clue = VICTIM_TEXT.clue.charAt(0).toLowerCase() + VICTIM_TEXT.clue.slice(1)
    expect(VICTIM_TEXT.sentence).toBe(`${VICTIM_TEXT.title} ${clue}`)
  })
})

describe('object nouns follow what the board draws', () => {
  const at = (row: number, col: number) => ({ row, col })
  /** A 6x6 scene with only the given objects; ids are `<kind>-<n>` like the generated scenes. */
  const withObjects = (objects: { id: string; type: 'chair' | 'rug' | 'wardrobe' | 'desk'; cells: { row: number; col: number }[] }[]) => ({
    scene: { ...scene, objects },
    people,
  })
  const poofAndGardenChair = withObjects([
    { id: 'gardenChair-1', type: 'chair', cells: [at(0, 0)] },
    { id: 'poof-1', type: 'chair', cells: [at(3, 3)] },
  ])

  it('names both chairs, each by its own noun, when a poof and a garden chair are both engine type chair', () => {
    expect(objectNouns(poofAndGardenChair.scene.objects, 'chair')).toEqual(['garden chair', 'poof'])
    const beside = { personId: 'A', type: 'besideObject', args: { objectType: 'chair' } } as const
    expect(renderClue(beside, poofAndGardenChair)).toBe('A stood next to a garden chair or a poof.')
    expect(renderClue({ ...beside, args: { objectType: 'chair', exactlyOne: true } }, poofAndGardenChair)).toBe(
      'A stood next to exactly one garden chair or poof.',
    )
    expect(renderClue({ personId: 'A', type: 'onObject', args: { objectType: 'chair' } }, poofAndGardenChair)).toBe(
      'A sat on a garden chair or a poof.',
    )
    expect(renderClue({ personId: 'A', type: 'squareWithObject', args: { objectType: 'chair' } }, poofAndGardenChair)).toBe(
      "There was a garden chair or a poof on A's square.",
    )
    expect(renderClue({ personId: 'A', type: 'onlyOnObject', args: { objectType: 'chair' } }, poofAndGardenChair)).toBe(
      'A was the only person on a garden chair or a poof.',
    )
  })

  it('uses the noun of the one drawn kind when a scene has only that kind', () => {
    const park = withObjects([
      { id: 'gardenChair-1', type: 'chair', cells: [at(0, 0)] },
      { id: 'gardenChair-2', type: 'chair', cells: [at(2, 2)] },
    ])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, park)).toBe('A stood next to a garden chair.')
    const beanbags = withObjects([{ id: 'poof-1', type: 'chair', cells: [at(0, 0)] }])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, beanbags)).toBe('A stood next to a poof.')
  })

  it('uses the group noun when every member of the group is drawn alike', () => {
    // school chair and meeting chair both draw the plain chair: nothing on the board tells them apart
    const alike = withObjects([
      { id: 'schoolChair-1', type: 'chair', cells: [at(0, 0)] },
      { id: 'meetingChair-1', type: 'chair', cells: [at(1, 1)] },
    ])
    expect(objectNouns(alike.scene.objects, 'chair')).toEqual(['chair'])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, alike)).toBe('A stood next to a chair.')
    // ... and a poof beside them is named apart
    const mixed = withObjects([...alike.scene.objects, { id: 'poof-1', type: 'chair' as const, cells: [at(4, 4)] }])
    expect(objectNouns(mixed.scene.objects, 'chair')).toEqual(['chair', 'poof'])
  })

  it('names a kind after "in" for a car and after a direction', () => {
    const bus = { scene: { ...scene, objects: [{ id: 'schoolBus-1', type: 'car' as const, cells: [at(0, 0), at(1, 0)] }] }, people }
    expect(renderClue({ personId: 'A', type: 'onObject', args: { objectType: 'car' } }, bus)).toBe('A sat in a school bus.')
    const north = { personId: 'A', type: 'directionOfObject', args: { side: 'north', objectType: 'car' } } as const
    expect(renderClue(north, bus)).toBe('A stood further north than a school bus.')
    const next = { personId: 'A', type: 'directlyNextToObject', args: { side: 'east', objectType: 'car' } } as const
    expect(renderClue(next, bus)).toBe('A stood on the square directly right of a school bus.')
    const not = { personId: 'A', type: 'notBesideObject', args: { objectType: 'car' } } as const
    expect(renderClue(not, bus)).toBe('A did not stand next to a school bus.')
  })

  it('uses a singular noun for a plural theme name (lockers)', () => {
    const lockers = withObjects([{ id: 'lockers-1', type: 'wardrobe', cells: [at(0, 0), at(0, 1)] }])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'wardrobe' } }, lockers)).toBe('A stood next to a locker.')
  })

  it('puts "an" before a noun that starts with a vowel', () => {
    const chairs = withObjects([{ id: 'officeChair-1', type: 'chair', cells: [at(0, 0)] }])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, chairs)).toBe('A stood next to an office chair.')
  })

  it('falls back to the engine noun for objects that are not theme kinds and for a bare scene', () => {
    expect(objectNouns(scene.objects, 'chair')).toEqual(['chair'])
    expect(objectNouns(undefined, 'chair')).toEqual(['chair'])
    expect(objectNouns([], 'rug')).toEqual(['rug'])
  })

  it('does not take a theme kind whose engine type differs from the object', () => {
    // "car" is a home kind of type car; an id "car-1" on a chair is a plain chair
    expect(objectNouns([{ id: 'car-1', type: 'chair' }], 'chair')).toEqual(['chair'])
  })
})
