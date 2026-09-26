import { describe, expect, it } from 'vitest'
import type { Person, Placement } from '../model/index.ts'
import { checkClue } from './check.ts'
import { evaluate } from './evaluate.ts'
import { bothFragments, bothPartsText, renderClue } from './nl.ts'
import { people, scene, stand } from './testing.fixture.ts'
import { bothParts, expandClue, isBothClue, STRUCTURAL_CLUE_TYPES } from './types.ts'
import type { BothClue, ClueBody } from './types.ts'

const puzzle = { scene, people }
const A = 'A'

const both = (a: ClueBody, b: ClueBody, personId = A): BothClue => ({ personId, type: 'both', args: { a, b } })

/** The fixture cast with Dutch first names, the way a real puzzle labels them. */
const cast: Person[] = [
  { id: 'A', kind: 'suspect', label: 'Henry', gender: 'man' },
  { id: 'B', kind: 'suspect', label: 'Chloe', gender: 'vrouw' },
  { id: 'C', kind: 'suspect', label: 'Dan', gender: 'man' },
  { id: 'V', kind: 'victim', label: 'het cadeau' },
]
const ctx = { scene, people: cast }
const say = (clue: BothClue) => renderClue(clue, ctx)

describe('both: the catalog entry', () => {
  it('is a structural kind', () => {
    expect(STRUCTURAL_CLUE_TYPES).toContain('both')
    expect(isBothClue(both({ type: 'inCorner', args: {} }, { type: 'alone', args: {} }))).toBe(true)
  })

  it('expands to its two parts as plain clues of the same holder', () => {
    const card = both({ type: 'besideObject', args: { objectType: 'table' } }, { type: 'alone', args: {} }, 'B')
    expect(bothParts(card)).toEqual([
      { personId: 'B', type: 'besideObject', args: { objectType: 'table' } },
      { personId: 'B', type: 'alone', args: {} },
    ])
    expect(expandClue(card)).toHaveLength(2)
    expect(expandClue({ personId: 'A', type: 'inCorner', args: {} })).toHaveLength(1)
  })
})

describe('both: evaluate is the conjunction', () => {
  // The table is at (1,1) in the kitchen; a chair at (0,1); a woman (B) and a man (C) can share the room.
  const card = both({ type: 'besideObject', args: { objectType: 'table' } }, { type: 'roomHasGender', args: { gender: 'vrouw' } })

  it('is true only when both parts are', () => {
    expect(evaluate(card, scene, stand(A, 1, 0, 'B', 2, 2), cast)).toBe(true) // beside the table, B in the kitchen
    expect(evaluate(card, scene, stand(A, 1, 0, 'B', 4, 4), cast)).toBe(false) // beside the table, B elsewhere
    expect(evaluate(card, scene, stand(A, 0, 2, 'B', 2, 2), cast)).toBe(false) // not beside the table, B in the room
    expect(evaluate(card, scene, stand(A, 0, 2, 'B', 4, 4), cast)).toBe(false) // neither
  })

  it('is false when the holder is not placed', () => {
    expect(evaluate(card, scene, stand('B', 2, 2), cast)).toBe(false)
  })

  it('needs the people for its gender part, like the gender card does', () => {
    expect(evaluate(card, scene, stand(A, 1, 0, 'B', 2, 2))).toBe(false)
  })
})

describe('both: checkClue', () => {
  const ok = both({ type: 'onObject', args: { objectType: 'car' } }, { type: 'inRoom', args: { roomId: 'living' } })

  it('accepts two different parts of the holder, gender parts included', () => {
    expect(checkClue(ok, puzzle)).toEqual([])
    const gendered = both({ type: 'besideObject', args: { objectType: 'table' } }, { type: 'roomHasGender', args: { gender: 'vrouw' } })
    expect(checkClue(gendered, puzzle)).toEqual([])
  })

  it('rejects two identical parts, whatever the order of the args', () => {
    const same = both({ type: 'besideObject', args: { objectType: 'table', exactlyOne: true } }, { type: 'besideObject', args: { exactlyOne: true, objectType: 'table' } })
    expect(checkClue(same, puzzle).join()).toContain('must differ')
    // Same kind with other args is two different facts.
    const other = both({ type: 'besideObject', args: { objectType: 'table' } }, { type: 'besideObject', args: { objectType: 'chair' } })
    expect(checkClue(other, puzzle)).toEqual([])
  })

  it('rejects a combined card inside a combined card (no nesting)', () => {
    const nested = { personId: A, type: 'both', args: { a: ok, b: { type: 'inCorner', args: {} } } }
    expect(checkClue(nested as never, puzzle).join()).toContain('cannot be a combined card')
    expect(checkClue({ personId: A, type: 'both', args: { a: { type: 'both', args: {} }, b: { type: 'inCorner', args: {} } } }, puzzle)).not.toEqual([])
  })

  it('rejects kinds that are no fact about the holder: the relational kinds, emptyRoom, the victim card', () => {
    const inCorner: ClueBody = { type: 'inCorner', args: {} }
    for (const type of ['sameRoom', 'directionOf', 'emptyRoom', 'aloneWithMurderer']) {
      const card = { personId: A, type: 'both', args: { a: inCorner, b: { type, args: { otherId: 'B', roomId: 'kitchen', side: 'north' } } } }
      expect(checkClue(card as never, puzzle).join()).toContain('cannot be part of a combined card')
    }
  })

  it('checks each part like a card of the same holder, and says which part is wrong', () => {
    expect(checkClue(both({ type: 'inRoom', args: { roomId: 'attic' } }, { type: 'inCorner', args: {} }), puzzle).join()).toContain('Part "a"')
    expect(checkClue(both({ type: 'inCorner', args: {} }, { type: 'withPerson', args: { otherId: 'A' } }), puzzle).join()).toContain('Part "b"')
    // Nobody else is a woman: the gender part is not satisfiable by anyone.
    const lonely = { scene, people: [people[0] as Person, people[2] as Person, people[3] as Person] }
    expect(checkClue(both({ type: 'inCorner', args: {} }, { type: 'roomHasGender', args: { gender: 'vrouw' } }), lonely).join()).toContain('Nobody else')
    // a gender part on the victim card
    expect(checkClue(both({ type: 'inCorner', args: {} }, { type: 'roomHasGender', args: { gender: 'man' } }, 'V'), puzzle).join()).toContain('victim')
  })

  it('rejects malformed parts', () => {
    const bad = (a: unknown, b: unknown) => checkClue({ personId: A, type: 'both', args: { a, b } } as never, puzzle)
    expect(bad(undefined, { type: 'inCorner', args: {} })).not.toEqual([])
    expect(bad({ type: 'inCorner' }, { type: 'alone', args: {} })).not.toEqual([])
    expect(bad('inCorner', 5)).toHaveLength(2)
  })

  it('rejects two parts that both leave the holder out of the sentence (use onObject for squareWithObject)', () => {
    const card = both({ type: 'roomHasGender', args: { gender: 'vrouw' } }, { type: 'squareWithObject', args: { objectType: 'table' } })
    expect(checkClue(card, puzzle).join()).toContain('onObject')
  })
})

describe('both: Dutch text, name once, "en" between the parts', () => {
  const pairs: [string, BothClue, string][] = [
    [
      'the example: beside a table and a woman in the room',
      both({ type: 'besideObject', args: { objectType: 'table' } }, { type: 'roomHasGender', args: { gender: 'vrouw' } }),
      'Henry stond naast een tafel en er was minstens één vrouw in dezelfde ruimte.',
    ],
    [
      'the part that names the holder comes first, whatever the stored order',
      both({ type: 'roomHasGender', args: { gender: 'vrouw' } }, { type: 'besideObject', args: { objectType: 'table' } }),
      'Henry stond naast een tafel en er was minstens één vrouw in dezelfde ruimte.',
    ],
    [
      'an object and a room',
      both({ type: 'onObject', args: { objectType: 'car' } }, { type: 'inRoom', args: { roomId: 'living' } }),
      'Henry zat in een auto en was in de Woonkamer.',
    ],
    [
      'a corner and alone',
      both({ type: 'inCorner', args: {} }, { type: 'alone', args: {} }),
      'Henry stond in de hoek en was alleen.',
    ],
    [
      'alone with a woman and beside a window',
      both({ type: 'aloneWithGender', args: { gender: 'vrouw' } }, { type: 'besideFeature', args: { feature: 'window' } }),
      'Henry was alleen met een vrouw en stond bij een raam.',
    ],
    [
      'with a named person and on the top line of the board',
      both({ type: 'withPerson', args: { otherId: 'B' } }, { type: 'onLine', args: { axis: 'row', position: 'first' } }),
      'Henry was samen met Chloe en stond in de bovenste rij.',
    ],
    [
      'a numbered row and the edge of a named room',
      both({ type: 'inRow', args: { index: 2 } }, { type: 'inRoomEdge', args: { roomId: 'study', edge: 'east' } }),
      'Henry stond in de 3e rij en stond in de meest rechtse kolom van het Kantoor.',
    ],
    [
      'the only one on an object, and in one of two rooms',
      both({ type: 'onlyOnObject', args: { objectType: 'chair' } }, { type: 'inRoomOr', args: { roomIds: ['kitchen', 'study'] } }),
      'Henry was de enige persoon op een stoel en was in de Keuken of in het Kantoor.',
    ],
    [
      'the holder is another person: the name is theirs',
      both({ type: 'besideObject', args: { objectType: 'bookshelf', exactlyOne: true } }, { type: 'inFrontOfDoor', args: {} }, 'C'),
      'Dan stond naast precies één boekenkast en stond voor een deur.',
    ],
  ]

  it('has at least 6 pairs', () => {
    expect(pairs.length).toBeGreaterThanOrEqual(6)
  })

  it.each(pairs)('%s', (_label, clue, sentence) => {
    expect(say(clue)).toBe(sentence)
    expect(checkClue(clue, { scene, people: cast })).toEqual([])
  })

  it('never says a pronoun, and names the holder exactly once', () => {
    for (const [, clue] of pairs) {
      const text = say(clue)
      expect(text).not.toMatch(/\b(hij|zij|ze|hem|haar|zijn|hun)\b/i)
      const holder = cast.find((p) => p.id === clue.personId)?.label as string
      expect(text.split(holder)).toHaveLength(2)
      expect(text.split(' en ')).toHaveLength(2)
      expect(text.endsWith('.')).toBe(true)
    }
  })

  it('still words the pair that checkClue rejects (no subject for the sentence) without a hij or zij', () => {
    const rejected = both({ type: 'roomHasGender', args: { gender: 'man' } }, { type: 'squareWithObject', args: { objectType: 'framedPainting' } })
    expect(say(rejected)).toBe('Er was minstens één man in de ruimte van Henry en er stond een ingelijst schilderij op hetzelfde vakje.')
  })

  it('explains the card as two parts, each a sentence of its own', () => {
    const card = pairs[0]?.[1] as BothClue
    expect(bothPartsText(card, ctx)).toBe(
      'Deze kaart heeft twee delen: "Henry stond naast een tafel" en "Er was minstens één vrouw in de ruimte van Henry". Beide delen moeten kloppen.',
    )
    expect(bothPartsText({ personId: A, type: 'inCorner', args: {} }, ctx)).toBeNull()
  })

  it('names the room of the holder ("de ruimte") when there is no room to name, and stays one sentence', () => {
    const text = say(both({ type: 'inRoomEdge', args: { edge: 'north' } }, { type: 'roomHasGender', args: { gender: 'vrouw' } }))
    expect(text).toBe('Henry stond in de bovenste rij van de ruimte en er was minstens één vrouw in dezelfde ruimte.')
  })
})

/** Deterministic pseudo-random numbers (mulberry32). */
function rng(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One part of every kind a combined card may hold (holder A on the fixture scene), several of the ones with parameters. */
const PARTS: ClueBody[] = [
  { type: 'onObject', args: { objectType: 'car' } },
  { type: 'onObject', args: { objectType: 'chair' } },
  { type: 'squareWithObject', args: { objectType: 'framedPainting' } },
  { type: 'besideObject', args: { objectType: 'table' } },
  { type: 'besideObject', args: { objectType: 'bookshelf', exactlyOne: true } },
  { type: 'onlyOnObject', args: { objectType: 'chair' } },
  { type: 'inRoom', args: { roomId: 'kitchen' } },
  { type: 'inRoom', args: { roomId: 'study' } },
  { type: 'inRoomOr', args: { roomIds: ['living', 'bedroom'] } },
  { type: 'inCorner', args: {} },
  { type: 'inCorner', args: { roomId: 'living' } },
  { type: 'besideFeature', args: { feature: 'window' } },
  { type: 'besideFeature', args: { feature: 'door' } },
  { type: 'inFrontOfDoor', args: {} },
  { type: 'alone', args: {} },
  { type: 'alone', args: { roomId: 'bedroom' } },
  { type: 'withPerson', args: { otherId: 'B' } },
  { type: 'aloneWith', args: { otherId: 'C', roomId: 'study' } },
  { type: 'roomHasGender', args: { gender: 'vrouw' } },
  { type: 'roomHasGender', args: { gender: 'man' } },
  { type: 'aloneWithGender', args: { gender: 'man' } },
  { type: 'inRow', args: { index: 2 } },
  { type: 'inColumn', args: { index: 4 } },
  { type: 'onLine', args: { axis: 'row', position: 'first' } },
  { type: 'onLine', args: { axis: 'column', position: 'last' } },
  { type: 'inRoomEdge', args: { edge: 'north' } },
  { type: 'inRoomEdge', args: { roomId: 'bedroom', edge: 'east' } },
]

describe('both: property test over generated combined cards', () => {
  const cards: BothClue[] = PARTS.flatMap((a, i) => PARTS.slice(i + 1).map((b) => both(a, b))).filter(
    (card) => checkClue(card, { scene, people: cast }).length === 0,
  )

  /** Everybody on a random square (distinctness does not matter to the evaluator). */
  const scatter = (random: () => number): Placement[] =>
    cast.map((p) => ({ personId: p.id, cell: { row: Math.floor(random() * scene.height), col: Math.floor(random() * scene.width) } }))

  it('covers every kind of part, in at least 200 pairs', () => {
    expect(cards.length).toBeGreaterThanOrEqual(200)
    const kinds = new Set(cards.flatMap((card) => [card.args.a.type, card.args.b.type]))
    expect(kinds.size).toBe(STRUCTURAL_CLUE_TYPES.filter((t) => t !== 'both' && t !== 'emptyRoom' && t !== 'aloneWithMurderer').length)
  })

  it('the conjunction is never weaker than either part alone (on random placements)', () => {
    const random = rng(2026)
    let bothTrue = 0
    for (const card of cards) {
      const [a, b] = bothParts(card)
      for (let round = 0; round < 40; round++) {
        const placements = scatter(random)
        const whole = evaluate(card, scene, placements, cast)
        const left = evaluate(a, scene, placements, cast)
        const right = evaluate(b, scene, placements, cast)
        expect(whole).toBe(left && right)
        if (whole) {
          bothTrue++
          expect(left).toBe(true)
          expect(right).toBe(true)
        }
      }
    }
    expect(bothTrue).toBeGreaterThan(0)
  })

  it('the squares of the whole card are the intersection of the squares of the parts', () => {
    const random = rng(7)
    for (const card of cards) {
      const [a, b] = bothParts(card)
      const others = scatter(random).filter((p) => p.personId !== A)
      const squares = (clue: Parameters<typeof evaluate>[0]) => {
        const out: string[] = []
        for (let row = 0; row < scene.height; row++) {
          for (let col = 0; col < scene.width; col++) {
            if (evaluate(clue, scene, [...others, { personId: A, cell: { row, col } }], cast)) out.push(`${row},${col}`)
          }
        }
        return out
      }
      const left = squares(a)
      const right = squares(b)
      const whole = squares(card)
      expect(whole).toEqual(left.filter((s) => right.includes(s)))
      expect(whole.length).toBeLessThanOrEqual(Math.min(left.length, right.length))
    }
  })

  it('the text contains both facts, the holder once, one "en", and reads like the parts alone', () => {
    for (const card of cards) {
      const text = renderClue(card, ctx)
      const { first, second } = bothFragments(card, ctx)
      expect(text).toContain(first)
      expect(text).toContain(second)
      expect(text).toMatch(/^\p{Lu}/u)
      expect(text.endsWith('.')).toBe(true)
      expect(text.split('Henry')).toHaveLength(2)
      expect(text).not.toMatch(/\b(hij|zij|ze|hem|haar|zijn|hun)\b/i)
      // Every part that is a predicate reads exactly as it does on a card of its own, minus the name.
      for (const part of bothParts(card)) {
        const alone = renderClue(part, ctx)
        const predicate = alone.startsWith('Henry ') ? alone.slice('Henry '.length, -1) : undefined
        if (predicate !== undefined) expect(text).toContain(predicate)
      }
    }
  })

  it('the solvers see the same facts: the card expands to exactly its parts', () => {
    for (const card of cards) expect(expandClue(card)).toEqual(bothParts(card))
  })
})
