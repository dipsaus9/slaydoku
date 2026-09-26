import { describe, expect, it } from 'vitest'
import { OBJECT_TYPES } from '../model/index.ts'
import { checkClue } from './check.ts'
import { GIFT_NL, capitalizeLabel, countNl, objectNouns, ordinalNl, renderClue, roomName, upperFirst } from './nl.ts'
import { people, scene } from './testing.fixture.ts'
import { STRUCTURAL_CLUE_TYPES } from './types.ts'
import type { CatalogClue, StructuralClue } from './types.ts'

const ctx = { scene, people }
const say = (clue: StructuralClue) => renderClue(clue, ctx)

const samples: [StructuralClue, string][] = [
  [{ personId: 'A', type: 'onObject', args: { objectType: 'car' } }, 'A zat in een auto.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'chair' } }, 'A zat op een stoel.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'rug' } }, 'A stond op een tapijt.'],
  [{ personId: 'A', type: 'onObject', args: { objectType: 'bed' } }, 'A lag op een bed.'],
  [
    { personId: 'A', type: 'squareWithObject', args: { objectType: 'framedPainting' } },
    'Er stond een ingelijst schilderij op het vakje van A.',
  ],
  [
    { personId: 'B', type: 'besideObject', args: { objectType: 'bookshelf' } },
    'B stond naast een boekenkast.',
  ],
  [
    { personId: 'B', type: 'besideObject', args: { objectType: 'bookshelf', exactlyOne: true } },
    'B stond naast precies één boekenkast.',
  ],
  [
    { personId: 'C', type: 'onlyOnObject', args: { objectType: 'chair' } },
    'C was de enige persoon op een stoel.',
  ],
  [{ personId: 'A', type: 'inRoom', args: { roomId: 'kitchen' } }, 'A was in de Keuken.'],
  [
    { personId: 'A', type: 'inRoomOr', args: { roomIds: ['kitchen', 'study'] } },
    'A was in de Keuken of in het Kantoor.',
  ],
  [{ personId: 'A', type: 'inCorner', args: {} }, 'A stond in de hoek.'],
  [
    { personId: 'A', type: 'inCorner', args: { roomId: 'living' } },
    'A stond in de hoek van de Woonkamer.',
  ],
  [{ personId: 'A', type: 'besideFeature', args: { feature: 'window' } }, 'A stond bij een raam.'],
  [{ personId: 'A', type: 'besideFeature', args: { feature: 'door' } }, 'A stond bij een deur.'],
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
    'A was alleen met B in het Kantoor.',
  ],
  [{ personId: 'A', type: 'emptyRoom', args: { roomId: 'living' } }, 'Er was niemand in de Woonkamer.'],
  [{ personId: 'A', type: 'roomHasGender', args: { gender: 'vrouw' } }, 'Er was minstens één vrouw in de ruimte van A.'],
  [{ personId: 'A', type: 'roomHasGender', args: { gender: 'man' } }, 'Er was minstens één man in de ruimte van A.'],
  [{ personId: 'B', type: 'aloneWithGender', args: { gender: 'man' } }, 'B was alleen met een man.'],
  [{ personId: 'A', type: 'aloneWithGender', args: { gender: 'vrouw' } }, 'A was alleen met een vrouw.'],
  [{ personId: 'A', type: 'inRow', args: { index: 2 } }, 'A stond in de 3e rij.'],
  [{ personId: 'A', type: 'inColumn', args: { index: 1 } }, 'A stond in de 2e kolom.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'row', position: 'first' } }, 'A stond in de bovenste rij.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'row', position: 'last' } }, 'A stond in de onderste rij.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'row', position: 'middle' } }, 'A stond in de middelste rij.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'column', position: 'first' } }, 'A stond in de meest linkse kolom.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'column', position: 'last' } }, 'A stond in de meest rechtse kolom.'],
  [{ personId: 'A', type: 'onLine', args: { axis: 'column', position: 'middle' } }, 'A stond in de middelste kolom.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'north' } }, 'A stond in de bovenste rij van de ruimte.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'south' } }, 'A stond in de onderste rij van de ruimte.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'west' } }, 'A stond in de meest linkse kolom van de ruimte.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { edge: 'east' } }, 'A stond in de meest rechtse kolom van de ruimte.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { roomId: 'kitchen', edge: 'north' } }, 'A stond in de bovenste rij van de Keuken.'],
  [{ personId: 'A', type: 'inRoomEdge', args: { roomId: 'study', edge: 'east' } }, 'A stond in de meest rechtse kolom van het Kantoor.'],
  [
    {
      personId: 'A',
      type: 'both',
      args: { a: { type: 'besideObject', args: { objectType: 'table' } }, b: { type: 'roomHasGender', args: { gender: 'vrouw' } } },
    },
    'A stond naast een tafel en er was minstens één vrouw in dezelfde ruimte.',
  ],
  [{ personId: 'V', type: 'aloneWithMurderer', args: {} }, 'Het cadeau was alleen met de dader.'],
]

describe('Dutch clue text', () => {
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

  it('the gender sentences name the person by label and use neutral nouns, never hij or zij', () => {
    const named = {
      scene,
      people: [
        { id: 'A', kind: 'suspect' as const, label: 'Henry', gender: 'man' as const },
        { id: 'B', kind: 'suspect' as const, label: 'Chloe', gender: 'vrouw' as const },
      ],
    }
    expect(renderClue({ personId: 'A', type: 'roomHasGender', args: { gender: 'vrouw' } }, named)).toBe(
      'Er was minstens één vrouw in de ruimte van Henry.',
    )
    expect(renderClue({ personId: 'B', type: 'aloneWithGender', args: { gender: 'man' } }, named)).toBe(
      'Chloe was alleen met een man.',
    )
    for (const [clue] of samples.filter(([c]) => c.type === 'roomHasGender' || c.type === 'aloneWithGender')) {
      expect(say(clue)).not.toMatch(/\b(hij|zij|haar|hem|zijn)\b/i)
    }
  })

  it('names the person, so a name change shows up in the text', () => {
    const named = { scene, people: [{ id: 'A', kind: 'suspect' as const, label: 'Alice' }] }
    expect(renderClue({ personId: 'A', type: 'alone', args: {} }, named)).toBe('Alice was alleen.')
  })

  it('a room name that carries its article keeps it, others get "de"', () => {
    const rooms = { rooms: [{ id: 'x', name: 'Balkon' }, { id: 'y', name: 'het Balkon' }] }
    const c = { scene: rooms, people }
    expect(renderClue({ personId: 'A', type: 'inRoom', args: { roomId: 'x' } }, c)).toBe(
      'A was in de Balkon.',
    )
    expect(renderClue({ personId: 'A', type: 'inRoom', args: { roomId: 'y' } }, c)).toBe(
      'A was in het Balkon.',
    )
  })

  it('renders every object type for onObject and besideObject', () => {
    for (const objectType of OBJECT_TYPES) {
      expect(say({ personId: 'A', type: 'onObject', args: { objectType } })).toMatch(/^A \w+ (op|in) een /)
      expect(say({ personId: 'A', type: 'besideObject', args: { objectType } })).toMatch(/^A stond naast een /)
    }
  })

  it('ordinals', () => {
    expect(ordinalNl(1)).toBe('1e')
    expect(ordinalNl(12)).toBe('12e')
  })
})

describe('room articles', () => {
  const rooms = {
    rooms: [
      { id: 'wash', name: 'het Fietsenhok' },
      { id: 'attic', name: 'de Speelkamer' },
      { id: 'bare', name: 'Gang' },
      { id: 'short', name: "'t Hoekje" },
    ],
  }
  const c = { scene: rooms, people }
  const inRoom = (roomId: string) => renderClue({ personId: 'A', type: 'inRoom', args: { roomId } }, c)

  it('neuter rooms are stored with het and read with het, never de', () => {
    expect(roomName(c, 'wash')).toBe('het Fietsenhok')
    expect(inRoom('wash')).toBe('A was in het Fietsenhok.')
    expect(inRoom('attic')).toBe('A was in de Speelkamer.')
  })

  it('a bare name still falls back to de, a stored article is never doubled', () => {
    expect(inRoom('bare')).toBe('A was in de Gang.')
    expect(inRoom('short')).toBe("A was in 't Hoekje.")
    for (const id of ['wash', 'attic', 'short']) expect(inRoom(id)).not.toMatch(/\b(de|het) (de|het)\b/)
  })

  it('reads right in every room position of a sentence', () => {
    const say2 = (clue: CatalogClue) => renderClue(clue, c)
    expect(say2({ personId: 'A', type: 'inCorner', args: { roomId: 'wash' } })).toBe('A stond in de hoek van het Fietsenhok.')
    expect(say2({ personId: 'A', type: 'alone', args: { roomId: 'wash' } })).toBe('A was alleen in het Fietsenhok.')
    expect(say2({ personId: 'A', type: 'emptyRoom', args: { roomId: 'wash' } })).toBe('Er was niemand in het Fietsenhok.')
    expect(say2({ personId: 'A', type: 'inRoomOr', args: { roomIds: ['wash', 'attic'] } })).toBe(
      'A was in het Fietsenhok of in de Speelkamer.',
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
    expect(say2(next('north'))).toBe('A stond op het vakje direct boven een kast.')
    expect(say2(next('south'))).toBe('A stond op het vakje direct onder een kast.')
    expect(say2(next('east'))).toBe('A stond op het vakje direct rechts van een kast.')
    expect(say2(next('west'))).toBe('A stond op het vakje direct links van een kast.')
  })

  it('exact distances read as rows above or below and columns left or right', () => {
    expect(say2(dist('west', 3))).toBe('A stond precies drie kolommen links van B.')
    expect(say2(dist('east', 1))).toBe('A stond precies één kolom rechts van B.')
    expect(say2(dist('north', 2))).toBe('A stond precies twee rijen boven B.')
    expect(say2(dist('south', 1))).toBe('A stond precies één rij onder B.')
  })

  it('qualified forms keep the room and alone first', () => {
    const clue: CatalogClue = {
      personId: 'A',
      type: 'exactDistance',
      args: { side: 'north', count: 1, otherId: 'B', roomId: 'kitchen', alone: true },
    }
    expect(say2(clue)).toBe('A was alleen in de Keuken, precies één rij boven B.')
  })

  it('never uses the stiff "ten noorden/zuiden/oosten/westen van" for these two kinds', () => {
    for (const side of ['north', 'south', 'east', 'west'] as const) {
      expect(say2(next(side))).not.toMatch(/ten (noorden|zuiden|oosten|westen)/)
      expect(say2(dist(side, 2))).not.toMatch(/ten (noorden|zuiden|oosten|westen)/)
    }
  })

  it('keeps compass words where they are the precise reading', () => {
    expect(say2({ personId: 'A', type: 'directionOf', args: { side: 'west', otherId: 'B' } })).toBe(
      'A stond westelijker dan B.',
    )
    expect(say2({ personId: 'A', type: 'quadrant', args: { direction: 'northwest', otherId: 'V' } })).toBe(
      'A stond ergens ten noordwesten van V.',
    )
  })

  it('writes small counts as words, big ones as digits', () => {
    expect(countNl(1)).toBe('één')
    expect(countNl(3)).toBe('drie')
    expect(countNl(12)).toBe('twaalf')
    expect(countNl(13)).toBe('13')
    expect(say2({ personId: 'A', type: 'diagonal', args: { otherId: 'B', steps: 2 } })).toBe(
      'A stond precies twee vakjes diagonaal van B.',
    )
  })
})

describe('the gift label at the start of a sentence', () => {
  const gift = { scene, people: [{ id: 'A', kind: 'suspect' as const, label: 'Alice' }, { id: 'V', kind: 'victim' as const, label: 'het cadeau' }] }

  it('a clue held by the gift starts with a capital', () => {
    expect(renderClue({ personId: 'V', type: 'onObject', args: { objectType: 'bed' } }, gift)).toBe('Het cadeau lag op een bed.')
    expect(renderClue({ personId: 'V', type: 'inRoom', args: { roomId: 'kitchen' } }, gift)).toBe('Het cadeau was in de Keuken.')
  })

  it('mid-sentence the gift stays lower case', () => {
    expect(renderClue({ personId: 'A', type: 'aloneWith', args: { otherId: 'V' } }, gift)).toBe('Alice was alleen met het cadeau.')
    expect(renderClue({ personId: 'A', type: 'quadrant', args: { direction: 'northwest', otherId: 'V' } }, gift)).toBe(
      'Alice stond ergens ten noordwesten van het cadeau.',
    )
  })

  it('upperFirst and capitalizeLabel only touch sentence starts', () => {
    expect(upperFirst('het cadeau')).toBe('Het cadeau')
    expect(upperFirst('')).toBe('')
    expect(capitalizeLabel('het cadeau staat op r1k2. Alice staat naast het cadeau. het cadeau kan niet.', 'het cadeau')).toBe(
      'Het cadeau staat op r1k2. Alice staat naast het cadeau. Het cadeau kan niet.',
    )
    expect(capitalizeLabel('Alice: "het cadeau? nee"', 'het cadeau')).toBe('Alice: "het cadeau? nee"')
    expect(capitalizeLabel('het cadeautje staat er', 'het cadeau')).toBe('het cadeautje staat er')
    expect(capitalizeLabel('niets', '')).toBe('niets')
  })

  it('the gift noun is the label the puzzles carry', () => {
    expect(GIFT_NL.noun).toBe('het cadeau')
    expect(GIFT_NL.title).toBe(upperFirst(GIFT_NL.noun))
  })
})

describe('neutral wording, one translation file', () => {
  const sources = import.meta.glob('./**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >
  const production = Object.entries(sources).filter(([path]) => !/\.(test|fixture)\.ts$/.test(path))
  const gendered = /\b(hij|zij|hem|haar|ze|zijn eigen)\b/i

  it('no gendered pronoun in any rendered sentence', () => {
    for (const [clue] of samples) expect(say(clue)).not.toMatch(gendered)
  })

  it('no gendered pronoun in the source of any clue file', () => {
    expect(production.length).toBeGreaterThan(4)
    for (const [path, source] of production) {
      expect(source, path).not.toMatch(gendered)
    }
  })

  it('the gift sentence is its title plus its clue', () => {
    const clue = GIFT_NL.clue.charAt(0).toLowerCase() + GIFT_NL.clue.slice(1)
    expect(GIFT_NL.sentence).toBe(`${GIFT_NL.title} ${clue}`)
  })

  it('the victim is the gift: no murder wording in nl.ts', () => {
    const nl = production.find(([path]) => path.endsWith('/nl.ts'))?.[1] ?? ''
    expect(nl).toContain('Het cadeau')
    expect(nl.replace(/aloneWithMurderer/g, '')).not.toMatch(/moord|vermoord|slachtoffer|murder/i)
  })

  it('Dutch text lives in nl.ts only', () => {
    const dutch = /\b(naast|alleen|samen met|niemand|hoek|kolom|rij|dader|stond|zat)\b/i
    for (const [path, source] of production) {
      if (path.endsWith('/nl.ts')) continue
      expect(source, path).not.toMatch(dutch)
    }
  })
})

describe('object nouns follow what the board draws', () => {
  const at = (row: number, col: number) => ({ row, col })
  /** A 6x6 scene with only the given objects; ids are `<kind>-<n>` like the generated scenes. */
  const withObjects = (objects: { id: string; type: 'chair' | 'rug' | 'wardrobe' | 'desk'; cells: { row: number; col: number }[] }[]) => ({
    scene: { ...scene, objects },
    people,
  })
  const poefAndTuinstoel = withObjects([
    { id: 'tuinstoel-1', type: 'chair', cells: [at(0, 0)] },
    { id: 'poef-1', type: 'chair', cells: [at(3, 3)] },
  ])

  it('names both chairs, each by its own noun, when a poef and a tuinstoel are both engine type chair', () => {
    expect(objectNouns(poefAndTuinstoel.scene.objects, 'chair')).toEqual(['tuinstoel', 'poef'])
    const beside = { personId: 'A', type: 'besideObject', args: { objectType: 'chair' } } as const
    expect(renderClue(beside, poefAndTuinstoel)).toBe('A stond naast een tuinstoel of poef.')
    expect(renderClue({ ...beside, args: { objectType: 'chair', exactlyOne: true } }, poefAndTuinstoel)).toBe(
      'A stond naast precies één tuinstoel of poef.',
    )
    expect(renderClue({ personId: 'A', type: 'onObject', args: { objectType: 'chair' } }, poefAndTuinstoel)).toBe(
      'A zat op een tuinstoel of poef.',
    )
    expect(renderClue({ personId: 'A', type: 'squareWithObject', args: { objectType: 'chair' } }, poefAndTuinstoel)).toBe(
      'Er stond een tuinstoel of poef op het vakje van A.',
    )
    expect(renderClue({ personId: 'A', type: 'onlyOnObject', args: { objectType: 'chair' } }, poefAndTuinstoel)).toBe(
      'A was de enige persoon op een tuinstoel of poef.',
    )
  })

  it('uses the noun of the one drawn kind when a scene has only that kind', () => {
    const park = withObjects([
      { id: 'tuinstoel-1', type: 'chair', cells: [at(0, 0)] },
      { id: 'tuinstoel-2', type: 'chair', cells: [at(2, 2)] },
    ])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, park)).toBe('A stond naast een tuinstoel.')
    const beanbags = withObjects([{ id: 'poef-1', type: 'chair', cells: [at(0, 0)] }])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, beanbags)).toBe('A stond naast een poef.')
  })

  it('uses the group noun when every member of the group is drawn alike', () => {
    // schoolstoel and vergaderstoel both draw the plain chair: nothing on the board tells them apart
    const alike = withObjects([
      { id: 'schoolstoel-1', type: 'chair', cells: [at(0, 0)] },
      { id: 'vergaderstoel-1', type: 'chair', cells: [at(1, 1)] },
    ])
    expect(objectNouns(alike.scene.objects, 'chair')).toEqual(['stoel'])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'chair' } }, alike)).toBe('A stond naast een stoel.')
    // ... and a poef beside them is named apart
    const mixed = withObjects([...alike.scene.objects, { id: 'poef-1', type: 'chair' as const, cells: [at(4, 4)] }])
    expect(objectNouns(mixed.scene.objects, 'chair')).toEqual(['stoel', 'poef'])
  })

  it('names a kind after "in" for a car and after a direction', () => {
    const bus = { scene: { ...scene, objects: [{ id: 'schoolbus-1', type: 'car' as const, cells: [at(0, 0), at(1, 0)] }] }, people }
    expect(renderClue({ personId: 'A', type: 'onObject', args: { objectType: 'car' } }, bus)).toBe('A zat in een schoolbus.')
    const north = { personId: 'A', type: 'directionOfObject', args: { side: 'north', objectType: 'car' } } as const
    expect(renderClue(north, bus)).toBe('A stond noordelijker dan een schoolbus.')
    const next = { personId: 'A', type: 'directlyNextToObject', args: { side: 'east', objectType: 'car' } } as const
    expect(renderClue(next, bus)).toBe('A stond op het vakje direct rechts van een schoolbus.')
    const not = { personId: 'A', type: 'notBesideObject', args: { objectType: 'car' } } as const
    expect(renderClue(not, bus)).toBe('A stond niet naast een schoolbus.')
  })

  it('uses a singular noun for a plural theme name (kluisjes)', () => {
    const lockers = withObjects([{ id: 'kluisjes-1', type: 'wardrobe', cells: [at(0, 0), at(0, 1)] }])
    expect(renderClue({ personId: 'A', type: 'besideObject', args: { objectType: 'wardrobe' } }, lockers)).toBe('A stond naast een kluisje.')
  })

  it('falls back to the engine noun for objects that are not theme kinds and for a bare scene', () => {
    expect(objectNouns(scene.objects, 'chair')).toEqual(['stoel'])
    expect(objectNouns(undefined, 'chair')).toEqual(['stoel'])
    expect(objectNouns([], 'rug')).toEqual(['tapijt'])
  })

  it('does not take a theme kind whose engine type differs from the object', () => {
    // "auto" is a home kind of type car; an id "auto-1" on a chair is a plain chair
    expect(objectNouns([{ id: 'auto-1', type: 'chair' }], 'chair')).toEqual(['stoel'])
  })
})
