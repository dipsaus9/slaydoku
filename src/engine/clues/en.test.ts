import { describe, expect, it } from 'vitest'
import { OBJECT_TYPES } from '../model/index.ts'
import { checkClue } from './check.ts'
import { OBJECT_WORDS, VICTIM_TEXT, capitalizeLabel, countWord, objectNouns, objectOn, renderClue, roomName, upperFirst, withArticle } from './en.ts'
import { OBJECT_WORDS_NL, objectNounsNl, objectOnNl } from './nl.ts'
import type { RenderContext } from './en.ts'
import { SCENE_THEMES } from '../../content/themes/index.ts'
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
 * The Dutch counterpart of `samples`, same clues in the same order (SLAY-3.2): the object nouns
 * are real Dutch (SLAY-6.2, see `nl.ts`'s header), room nouns stay the English words `samples`
 * uses too, only the grammar around them is Dutch.
 */
const samplesNl: [StructuralClue, string][] = [
  [{ personId: 'A', type: 'onObject', args: { objectType: 'car' } }, 'A zat in een auto.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'chair' } }, 'A zat op een stoel.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'rug' } }, 'A stond op een kleed.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'bed' } }, 'A lag op een bed.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'easel' } }, 'A stond op een schildersezel.'],
  [
    { personId: 'A', type: 'squareWithObject', args: { objectType: 'framedPainting' } },
    "Er lag een ingelijst schilderij op A's vakje.",
  ],
  [
    { personId: 'B', type: 'besideObject', args: { objectType: 'bookshelf' } },
    'B stond naast een boekenkast.',
  ],
  [{ personId: 'A', type: 'besideObject', args: { objectType: 'table' } }, 'A stond naast een tafel.'],
  [
    { personId: 'B', type: 'besideObject', args: { objectType: 'bookshelf', exactlyOne: true } },
    'B stond naast precies één boekenkast.',
  ],
  [
    { personId: 'C', type: 'onlyOnObject', args: { objectType: 'chair' } },
    'C was de enige persoon op een stoel.',
  ],
  [
    { personId: 'C', type: 'onlyOnObject', args: { objectType: 'car' } },
    'C was de enige persoon in een auto.',
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
    'A stond naast een tafel en er was minstens één vrouw in dezelfde kamer.',
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

  it('renders every object type for onObject and besideObject, in Dutch', () => {
    for (const objectType of OBJECT_TYPES) {
      expect(sayNl({ personId: 'A', type: 'onObject', args: { objectType } })).toMatch(/^A (stond|zat|lag) (op|in) een /)
      expect(sayNl({ personId: 'A', type: 'besideObject', args: { objectType } })).toMatch(/^A stond naast een /)
    }
  })

  it('gives every object type a real Dutch noun (SLAY-6.2), not the unchanged English word', () => {
    expect(Object.keys(OBJECT_WORDS_NL).sort()).toEqual([...OBJECT_TYPES].sort())
    // A handful of these happen to spell the same in both languages ("bed", "plant", "tv"); every other
    // type must actually have changed from the English noun it used to just repeat (SLAY-3.2's own choice).
    const coincidentallyTheSame = new Set(['bed', 'plant', 'tv'])
    for (const type of OBJECT_TYPES) {
      const nl = OBJECT_WORDS_NL[type]
      expect(nl.noun.length, type).toBeGreaterThan(0)
      expect(['de', 'het'], type).toContain(nl.gender)
      if (!coincidentallyTheSame.has(type)) expect(nl.noun.toLowerCase(), type).not.toBe(OBJECT_WORDS[type].noun.toLowerCase())
    }
    // Pinned samples across genders and prepositions, so a future edit cannot silently drift the words.
    expect(objectOnNl('chair')).toBe('op een stoel')
    expect(objectOnNl('car')).toBe('in een auto')
    expect(objectOnNl('desk')).toBe('op een bureau')
    expect(objectOnNl('bookshelf')).toBe('op een boekenkast')
    expect(objectOnNl('shower')).toBe('in een douche')
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
  const withObjects = (objects: { id: string; type: 'chair' | 'rug' | 'wardrobe' | 'desk' | 'bed'; cells: { row: number; col: number }[] }[]) => ({
    scene: { ...scene, objects },
    people,
  })
  // Every chair kind draws the plain chair since SLAY-17.2, so kinds that are drawn differently are tested on rugs.
  const rugAndMat = withObjects([
    { id: 'readingRug-1', type: 'rug', cells: [at(0, 0)] },
    { id: 'gymMat-1', type: 'rug', cells: [at(3, 3)] },
  ])

  it('names both rugs, each by its own noun, when a gym mat and a reading rug are both engine type rug', () => {
    expect(objectNouns(rugAndMat.scene.objects, 'rug')).toEqual(['reading rug', 'gym mat'])
    const beside = { personId: 'A', type: 'besideObject', args: { objectType: 'rug' } } as const
    expect(renderClue(beside, rugAndMat)).toBe('A stood next to a reading rug or a gym mat.')
    expect(renderClue({ ...beside, args: { objectType: 'rug', exactlyOne: true } }, rugAndMat)).toBe(
      'A stood next to exactly one reading rug or gym mat.',
    )
    expect(renderClue({ personId: 'A', type: 'onObject', args: { objectType: 'rug' } }, rugAndMat)).toBe(
      'A stood on a reading rug or a gym mat.',
    )
    expect(renderClue({ personId: 'A', type: 'squareWithObject', args: { objectType: 'rug' } }, rugAndMat)).toBe(
      "There was a reading rug or a gym mat on A's square.",
    )
    expect(renderClue({ personId: 'A', type: 'onlyOnObject', args: { objectType: 'rug' } }, rugAndMat)).toBe(
      'A was the only person on a reading rug or a gym mat.',
    )
  })

  it('uses the noun of the one drawn kind when a scene has only that kind', () => {
    const park = withObjects([
      { id: 'gardenChair-1', type: 'chair', cells: [at(0, 0)] },
      { id: 'gardenChair-2', type: 'chair', cells: [at(2, 2)] },
    ])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, park)).toBe('A stood next to a garden chair.')
    const mats = withObjects([{ id: 'gymMat-1', type: 'rug', cells: [at(0, 0)] }])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'rug' } }, mats)).toBe('A stood next to a gym mat.')
  })

  it('uses the group noun when every member of the group is drawn alike', () => {
    // every chair kind draws the plain chair: nothing on the board tells them apart
    const alike = withObjects([
      { id: 'schoolChair-1', type: 'chair', cells: [at(0, 0)] },
      { id: 'meetingChair-1', type: 'chair', cells: [at(1, 1)] },
    ])
    expect(objectNouns(alike.scene.objects, 'chair')).toEqual(['chair'])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, alike)).toBe('A stood next to a chair.')
    // ... a chair kind that no longer exists (a poof in an old committed day) is drawn as the plain chair too
    const old = withObjects([...alike.scene.objects, { id: 'poof-1', type: 'chair' as const, cells: [at(4, 4)] }])
    expect(objectNouns(old.scene.objects, 'chair')).toEqual(['chair'])
    // ... while a rug that looks different is named apart
    const mixed = withObjects([{ id: 'readingRug-1', type: 'rug', cells: [at(0, 0)] }, { id: 'gymMat-1', type: 'rug', cells: [at(1, 1)] }])
    expect(objectNouns(mixed.scene.objects, 'rug')).toEqual(['reading rug', 'gym mat'])
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
    const beds = withObjects([{ id: 'infirmaryBed-1', type: 'bed', cells: [at(0, 0), at(1, 0)] }])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'bed' } }, beds)).toBe('A stood next to an infirmary bed.')
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

  describe('in Dutch (SLAY-17.4: every theme kind has its own Dutch noun, so Dutch draws the same distinction)', () => {
    const nl = (clue: CatalogClue, c: RenderContext) => renderClueLocale(clue, c, 'nl')

    it('names both rugs, each by its own Dutch noun', () => {
      expect(objectNounsNl(rugAndMat.scene.objects, 'rug')).toEqual(['leeskleed', 'sportmat'])
      const beside = { personId: 'A', type: 'besideObject', args: { objectType: 'rug' } } as const
      expect(nl(beside, rugAndMat)).toBe('A stond naast een leeskleed of een sportmat.')
      expect(nl({ ...beside, args: { objectType: 'rug', exactlyOne: true } }, rugAndMat)).toBe('A stond naast precies één leeskleed of sportmat.')
      expect(nl({ personId: 'A', type: 'onObject', args: { objectType: 'rug' } }, rugAndMat)).toBe('A stond op een leeskleed of een sportmat.')
      expect(nl({ personId: 'A', type: 'squareWithObject', args: { objectType: 'rug' } }, rugAndMat)).toBe(
        "Er lag een leeskleed of een sportmat op A's vakje.",
      )
    })

    it('names a kind with its own art by what is drawn, never by the generic noun of its type (owner report: a lava lamp read as "plant", a filing cabinet as "kast")', () => {
      const glam = {
        scene: {
          ...scene,
          objects: [
            { id: 'lavaLamp-1', type: 'plant' as const, cells: [at(0, 0)] },
            { id: 'filingCabinet-1', type: 'cabinet' as const, cells: [at(2, 2)] },
          ],
        },
        people,
      }
      expect(nl({ personId: 'A', type: 'besideObject', args: { objectType: 'plant' } }, glam)).toBe('A stond naast een lavalamp.')
      expect(nl({ personId: 'A', type: 'notBesideObject', args: { objectType: 'cabinet' } }, glam)).toBe('A stond niet naast een archiefkast.')
      expect(nl({ personId: 'A', type: 'directlyNextToObject', args: { side: 'east', objectType: 'cabinet' } }, glam)).toBe(
        'A stond op het vakje direct rechts van een archiefkast.',
      )
      expect(nl({ personId: 'A', type: 'directionOfObject', args: { side: 'north', objectType: 'plant' } }, glam)).toBe(
        'A stond verder naar het noorden dan een lavalamp.',
      )
    })

    it('uses the generic Dutch noun when every member of the group is drawn alike, and for a bare scene', () => {
      const alike = withObjects([
        { id: 'schoolChair-1', type: 'chair', cells: [at(0, 0)] },
        { id: 'meetingChair-1', type: 'chair', cells: [at(1, 1)] },
      ])
      expect(objectNounsNl(alike.scene.objects, 'chair')).toEqual(['stoel'])
      expect(nl({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, alike)).toBe('A stond naast een stoel.')
      const park = withObjects([{ id: 'gardenChair-1', type: 'chair', cells: [at(0, 0)] }])
      expect(nl({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, park)).toBe('A stond naast een tuinstoel.')
      expect(objectNounsNl(scene.objects, 'chair')).toEqual(['stoel'])
      expect(objectNounsNl(undefined, 'rug')).toEqual(['kleed'])
      expect(objectNounsNl([{ id: 'car-1', type: 'chair' }], 'chair')).toEqual(['stoel'])
    })

    it('uses the singular Dutch noun for a plural theme name (lockers), and "in" for a vehicle', () => {
      const lockers = withObjects([{ id: 'lockers-1', type: 'wardrobe', cells: [at(0, 0), at(0, 1)] }])
      expect(nl({ personId: 'A', type: 'besideObject', args: { objectType: 'wardrobe' } }, lockers)).toBe('A stond naast een kluisje.')
      const bus = { scene: { ...scene, objects: [{ id: 'schoolBus-1', type: 'car' as const, cells: [at(0, 0), at(1, 0)] }] }, people }
      expect(nl({ personId: 'A', type: 'onObject', args: { objectType: 'car' } }, bus)).toBe('A zat in een schoolbus.')
    })

    it('gives every kind of every theme a Dutch noun a Dutch sentence can say (no English leaks through)', () => {
      for (const theme of SCENE_THEMES) {
        for (const o of theme.objects) {
          const one = { scene: { ...scene, objects: [{ id: `${o.kind}-1`, type: o.engineType, cells: o.footprints[0]!.cells }] }, people }
          const text = nl({ personId: 'A', type: 'besideObject', args: { objectType: o.engineType } }, one)
          expect(text, o.kind).toBe(`A stond naast een ${o.nameNl}.`)
        }
      }
    })
  })
})
