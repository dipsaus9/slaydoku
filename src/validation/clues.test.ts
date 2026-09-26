import { describe, expect, it } from 'vitest'
import { OBJECT_WORDS, renderClue } from '../engine/clues/index.ts'
import type { CatalogClue } from '../engine/clues/index.ts'
import { TIERS } from '../engine/generator/tiers/index.ts'
import type { Puzzle } from '../engine/model/index.ts'
import { puzzle } from '../game/fixture.ts'
import { auditClues, clueAllowedIn, DIRECT_CLUE_KINDS, directClueShare, isDirectClue, kindAllowedIn, MAX_COMBINED_TEXT, MIN_DIRECT_CLUE_SHARE } from './clues.ts'

/** The tutorial with its cards replaced. */
const withClues = (clues: CatalogClue[]): Puzzle => ({ ...puzzle, clues })
const victim: CatalogClue = { personId: 'V', type: 'aloneWithMurderer', args: {} }
const table: CatalogClue = { personId: 'A', type: 'onObject', args: { objectType: 'table' } }
const bed: CatalogClue = { personId: 'B', type: 'onObject', args: { objectType: 'bed' } }

describe('the direct-clue table', () => {
  it('has a minimum for every tier, never rising with the difficulty', () => {
    const shares = TIERS.map((t) => MIN_DIRECT_CLUE_SHARE[t.id])
    expect(shares.every((s) => s > 0 && s <= 1)).toBe(true)
    expect([...shares].sort((a, b) => b - a)).toEqual(shares)
  })

  it('counts a card that needs another person or a comparison as indirect', () => {
    for (const kind of ['withPerson', 'aloneWith', 'sameRoom', 'differentRoom', 'notWith', 'directionOf', 'exactDistance', 'diagonal', 'quadrant', 'emptyRoom', 'notBesideObject']) {
      expect(DIRECT_CLUE_KINDS.has(kind)).toBe(false)
    }
    expect(DIRECT_CLUE_KINDS.has('aloneWithMurderer')).toBe(false)
  })

  it('measures the share without the victim card', () => {
    const together: CatalogClue = { personId: 'A', type: 'withPerson', args: { otherId: 'B' } }
    expect(directClueShare(withClues([victim, table, bed, together]))).toBeCloseTo(2 / 3)
    expect(directClueShare(withClues([victim]))).toBe(1)
  })
})

describe('auditClues on a good puzzle', () => {
  it('finds nothing on the tutorial cards', () => {
    expect(auditClues(puzzle, 'easy')).toEqual([])
  })
})

describe('auditClues: direct share per tier', () => {
  const together = (person: string, other: string): CatalogClue => ({ personId: person, type: 'withPerson', args: { otherId: other } })
  const pairs = [['B', 'A'], ['C', 'A'], ['A', 'B'], ['C', 'B'], ['A', 'C'], ['B', 'C']] as const
  /** One direct card and `n` cards that lean on another person. */
  const oneDirect = (n: number) => withClues([victim, table, ...pairs.slice(0, n).map(([p, o]) => together(p, o))])

  it('flags a puzzle that leans on other people where the tier wants plain cards', () => {
    expect(auditClues(oneDirect(6), 'medium').join()).toContain('14% direct clues, medium needs at least 15%')
  })

  it('applies the table of the tier: the same cards pass where it asks less', () => {
    expect(auditClues(oneDirect(3), 'medium')).toEqual([])
    expect(auditClues(oneDirect(5), 'hard')).toEqual([])
    expect(auditClues(oneDirect(6), 'hard').join()).toContain('14% direct clues, hard needs at least 15%')
    expect(auditClues(oneDirect(3), 'expert')).toEqual([])
  })

  it('very easy to easy-medium ask for a fifth of plain cards, and take no card that names another person', () => {
    const noPerson = withClues([victim, { personId: 'A', type: 'directionOfObject', args: { objectType: 'table', side: 'north' } }, { personId: 'B', type: 'directionOfObject', args: { objectType: 'bed', side: 'north' } }, { personId: 'C', type: 'directionOfObject', args: { objectType: 'table', side: 'west' } }, { personId: 'C', type: 'directionOfObject', args: { objectType: 'bed', side: 'east' } }, { personId: 'B', type: 'directionOfObject', args: { objectType: 'table', side: 'south' } }])
    expect(auditClues(noPerson, 'easy').join()).toContain('0% direct clues, easy needs at least 20%')
    expect(auditClues(oneDirect(3), 'easy-medium').join()).toContain('kind withPerson is not used in easy-medium puzzles')
  })

  it('the ladder tiers use the kinds of the ladder generator: comparisons from very easy, negatives from easy-medium', () => {
    expect(kindAllowedIn('very-easy', 'directionOfObject')).toBe(true)
    expect(kindAllowedIn('very-easy', 'notBesideObject')).toBe(false)
    expect(kindAllowedIn('easy', 'notBesideObject')).toBe(false)
    expect(kindAllowedIn('easy-medium', 'notBesideObject')).toBe(true)
    expect(kindAllowedIn('easy-medium', 'notWith')).toBe(false)
    expect(kindAllowedIn('medium', 'notWith')).toBe(true)
    expect(kindAllowedIn('hard', 'exactDistance')).toBe(true)
  })

  it('flags a hard or expert puzzle without one plain card', () => {
    const none = withClues([victim, ...pairs.slice(0, 3).map(([p, o]) => together(p, o))])
    expect(auditClues(none, 'expert').join()).toContain('0% direct clues, expert needs at least 15%')
    expect(auditClues(none, 'hard').join()).toContain('0% direct clues, hard needs at least 15%')
  })
})

describe('auditClues: every card is one clear English sentence', () => {
  it('flags a card that names an area, person or object the board does not have', () => {
    expect(auditClues(withClues([victim, { personId: 'A', type: 'inRoom', args: { roomId: 'attic' } }]), 'easy').join()).toContain('names area attic, which does not exist')
    expect(auditClues(withClues([victim, { personId: 'A', type: 'withPerson', args: { otherId: 'Z' } }]), 'easy-medium').join()).toContain('names Z, who does not exist')
    expect(auditClues(withClues([victim, { personId: 'Z', type: 'onObject', args: { objectType: 'table' } }]), 'easy').join()).toContain('holder Z does not exist')
    expect(auditClues(withClues([victim, { personId: 'A', type: 'onObject', args: { objectType: 'car' } }]), 'easy').join()).toContain('names a car, but the board has none')
  })

  it('flags a row or column off the board', () => {
    expect(auditClues(withClues([victim, { personId: 'A', type: 'inRow', args: { index: 9 } }]), 'easy').join()).toContain('is off the board')
  })

  it('flags a kind the tier does not allow', () => {
    const far: CatalogClue = { personId: 'A', type: 'exactDistance', args: { otherId: 'B', side: 'east', count: 1 } }
    expect(auditClues(withClues([victim, table, bed, far]), 'easy').join()).toContain('kind exactDistance is not used in easy puzzles')
  })

  it('flags two cards that say the same', () => {
    expect(auditClues(withClues([victim, table, table]), 'easy').join()).toMatch(/card 3: says the same as card 2/)
  })

  it('flags text that would show code: an area named with an id, a label with braces', () => {
    const coded: Puzzle = { ...puzzle, clues: [victim, table], people: puzzle.people.map((p) => (p.id === 'A' ? { ...p, label: 'A_{1}' } : p)) }
    expect(auditClues(coded, 'easy').join()).toContain('shows code or stray characters')
  })
})

describe('auditClues: ambiguous wording', () => {
  it('flags two people with one label', () => {
    const same: Puzzle = { ...puzzle, people: puzzle.people.map((p) => (p.id === 'B' ? { ...p, label: 'A' } : p)) }
    expect(auditClues(same, 'easy').join()).toContain('two people share a label')
  })

  it('flags two areas with one name', () => {
    const same: Puzzle = { ...puzzle, scene: { ...puzzle.scene, rooms: puzzle.scene.rooms.map((r) => ({ ...r, name: 'Chamber' })) } }
    expect(auditClues(same, 'easy').join()).toContain('two areas are called "chamber"')
  })

  it('no two object types share a noun, so "a table" names one kind of object', () => {
    const nouns = Object.values(OBJECT_WORDS).map((o) => o.noun)
    expect(new Set(nouns).size).toBe(nouns.length)
  })
})

describe('auditClues: combined cards (two facts on one card)', () => {
  const combined = (a: object, b: object, personId = 'A'): CatalogClue => ({ personId, type: 'both', args: { a, b } }) as CatalogClue
  const nextToTable = { type: 'besideObject', args: { objectType: 'table' } }
  const inLiving = { type: 'inRoom', args: { roomId: 'living' } }
  const cornerPart = { type: 'inCorner', args: {} }

  it('accepts a natural combined card: the holder once, "and" between the parts', () => {
    const card = combined(nextToTable, inLiving)
    expect(renderClue(card, { scene: puzzle.scene, people: puzzle.people })).toBe('A stood next to a table and was in the Living Room.')
    expect(auditClues(withClues([victim, card, bed]), 'hard')).toEqual([])
    expect(auditClues(withClues([victim, card, bed]), 'easy-medium')).toEqual([])
    expect(auditClues(withClues([victim, card, bed]), 'easy').join()).toContain('kind both is not used in easy puzzles')
  })

  it('counts as direct only when both parts are direct', () => {
    expect(directClueShare(withClues([victim, combined(nextToTable, inLiving), bed]))).toBe(1)
    const indirect = combined(nextToTable, { type: 'withPerson', args: { otherId: 'B' } })
    expect(isDirectClue(indirect)).toBe(false)
    expect(directClueShare(withClues([victim, indirect, bed]))).toBe(0.5)
  })

  it('is allowed in a tier only when both parts are: a part that names a person waits for medium', () => {
    const card = combined(nextToTable, { type: 'withPerson', args: { otherId: 'B' } })
    expect(auditClues(withClues([victim, card, bed]), 'easy').join()).toContain('kind both is not used in easy puzzles')
    expect(auditClues(withClues([victim, card, bed]), 'medium')).toEqual([])
    expect(clueAllowedIn('hard', card)).toBe(true)
    // CAD-9.4: two facts on one card are drawn from easy-medium up; each part then has to pass the tier by itself.
    expect(kindAllowedIn('hard', 'both')).toBe(true)
    expect(kindAllowedIn('expert', 'both')).toBe(true)
    expect(kindAllowedIn('medium', 'both')).toBe(true)
    expect(kindAllowedIn('easy-medium', 'both')).toBe(true)
    expect(kindAllowedIn('easy', 'both')).toBe(false)
    expect(kindAllowedIn('very-easy', 'both')).toBe(false)
    expect(clueAllowedIn('easy-medium', combined(nextToTable, inLiving))).toBe(true)
    expect(clueAllowedIn('easy', combined(nextToTable, inLiving))).toBe(false)
    expect(clueAllowedIn('easy-medium', combined(nextToTable, { type: 'withPerson', args: { otherId: 'B' } }))).toBe(false)
  })

  it('flags a card whose parts are not sound: identical parts, nesting, a part the card cannot hold', () => {
    expect(auditClues(withClues([victim, combined(nextToTable, nextToTable)]), 'hard').join()).toContain('must differ')
    expect(auditClues(withClues([victim, combined(combined(nextToTable, inLiving), cornerPart)]), 'hard').join()).toContain('cannot be a combined card')
    expect(auditClues(withClues([victim, combined(cornerPart, { type: 'sameRoom', args: { otherId: 'B' } })]), 'hard').join()).toContain('cannot be part of a combined card')
    // The tutorial cast has no genders: nobody else is a woman.
    expect(auditClues(withClues([victim, combined(nextToTable, { type: 'roomHasGender', args: { gender: 'woman' } })]), 'hard').join()).toContain('Nobody else')
  })

  it('flags a card whose text names the holder twice', () => {
    // B is labelled like the holder: "A was with A and stood in a corner."
    const twin: Puzzle = { ...puzzle, people: puzzle.people.map((p) => (p.id === 'B' ? { ...p, label: 'A' } : p)) }
    const problems = auditClues({ ...twin, clues: [victim, combined({ type: 'withPerson', args: { otherId: 'B' } }, cornerPart)] }, 'medium').join()
    expect(problems).toContain('names the holder 2 times')
  })

  it('flags a pronoun in the text', () => {
    const named: Puzzle = { ...puzzle, scene: { ...puzzle.scene, rooms: puzzle.scene.rooms.map((r) => (r.id === 'living' ? { ...r, name: 'her room' } : r)) } }
    expect(auditClues({ ...named, clues: [victim, combined(cornerPart, inLiving)] }, 'hard').join()).toContain('uses a pronoun')
  })

  it('flags a sentence too long for a card', () => {
    const wordy = 'very '.repeat(45).trim()
    const long: Puzzle = { ...puzzle, scene: { ...puzzle.scene, rooms: puzzle.scene.rooms.map((r) => (r.id === 'living' ? { ...r, name: `the ${wordy} room` } : r)) } }
    expect(auditClues({ ...long, clues: [victim, combined(cornerPart, inLiving)] }, 'hard').join()).toContain(`a combined card takes at most ${MAX_COMBINED_TEXT}`)
  })

  it('flags two combined cards that say the same', () => {
    const card = combined(nextToTable, inLiving)
    expect(auditClues(withClues([victim, card, card]), 'hard').join()).toMatch(/card 3: says the same as card 2/)
  })
})
