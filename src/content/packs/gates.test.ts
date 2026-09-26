import { describe, expect, it } from 'vitest'
import { OBJECT_TYPES } from '../../engine/model/index.ts'
import { entryProblems } from './gates.ts'
import { packId } from './ids.ts'
import { sampleEntry } from './sample.testing.ts'
import type { PackEntry } from './types.ts'

const veryEasy = sampleEntry(6, 'very-easy', 'home')
const easy = sampleEntry(6, 'easy', 'home')
const entry = (): PackEntry => structuredClone(veryEasy)
const easyEntry = (): PackEntry => structuredClone(easy)

describe('entryProblems runs the hint and clue audit', () => {
  it('a freshly built entry has no problems', () => {
    expect(entryProblems(entry())).toEqual([])
  })

  it('a hint that shows code fails the entry with a "hints:" problem', () => {
    const bad = entry()
    const suspect = bad.puzzle.people.find((p) => p.kind === 'suspect')!
    suspect.label = `${suspect.label}_1`
    bad.cast = bad.puzzle.people.filter((p) => p.kind === 'suspect').map((p) => p.label)
    expect(entryProblems(bad).filter((p) => p.startsWith(`${bad.id}: hints:`))).not.toEqual([])
  })

  it('a card that says the same twice fails the entry with a "clues:" problem', () => {
    const bad = entry()
    const first = bad.puzzle.clues.find((c) => c.type !== 'aloneWithMurderer')!
    bad.puzzle.clues.push(structuredClone(first))
    bad.clueCount = bad.puzzle.clues.length
    expect(entryProblems(bad).some((p) => p.startsWith(`${bad.id}: clues: card `) && p.includes('says the same'))).toBe(true)
  })

  it('too few plain cards for the tier fails the entry', () => {
    const bad = entry()
    bad.puzzle.clues = bad.puzzle.clues.map((c) => (c.type === 'aloneWithMurderer' ? c : { personId: c.personId, type: 'notWith', args: { otherId: bad.puzzle.people.find((p) => p.id !== c.personId)!.id } }))
    expect(entryProblems(bad).some((p) => p.includes('clues:') && p.includes('0% direct clues, very-easy needs at least 20%'))).toBe(true)
  })
})

describe('entryProblems: the ladder gates of the tiers very easy to medium (CAD-8.5)', () => {
  const claim = (base: PackEntry, tier: PackEntry['tier']): PackEntry => ({ ...base, tier, id: packId(base.size, tier, base.theme, base.seed) })

  it('a very easy entry that needs two cards for somebody fails ladderCheck and tierFor', () => {
    const problems = entryProblems(claim(easyEntry(), 'very-easy'))
    expect(problems.some((p) => p.includes('ladderCheck: not solvable on the very-easy ladder'))).toBe(true)
    expect(problems.some((p) => p.includes('tierFor gives easy, not very-easy'))).toBe(true)
  })

  it('an entry passing an easier tier does not carry a harder one: tierFor is exact', () => {
    const problems = entryProblems(claim(entry(), 'easy'))
    expect(problems.filter((p) => p.includes('ladderCheck'))).toEqual([])
    expect(problems.some((p) => p.includes('tierFor gives very-easy, not easy'))).toBe(true)
  })

  it('no score band applies to the ladder tiers: the stored score is only compared with the measured one', () => {
    const problems = entryProblems(entry())
    expect(problems.filter((p) => p.includes('band') || p.includes('technique level'))).toEqual([])
  })

  it('a gender card needs a cast with genders: it fails the entry when a suspect has none (CAD-9.4)', () => {
    const bad = entry()
    const [holder, other] = bad.puzzle.people.filter((p) => p.kind === 'suspect')
    holder!.gender = 'vrouw'
    other!.gender = 'man'
    delete bad.puzzle.people.filter((p) => p.kind === 'suspect')[2]!.gender
    bad.puzzle.clues.push({ personId: holder!.id, type: 'roomHasGender', args: { gender: 'man' } })
    bad.clueCount = bad.puzzle.clues.length
    expect(entryProblems(bad).some((p) => p.includes('a gender card, but not every suspect has a gender'))).toBe(true)
  })

  it('a card that names an object the board does not draw fails the noun audit', () => {
    const bad = entry()
    const missing = OBJECT_TYPES.find((type) => !bad.puzzle.scene.objects.some((o) => o.type === type))!
    const card = bad.puzzle.clues.find((c) => (c.args as { objectType?: string } | undefined)?.objectType !== undefined)!
    ;(card.args as { objectType: string }).objectType = missing
    expect(entryProblems(bad).some((p) => p.startsWith(`${bad.id}: clue noun: card `))).toBe(true)
  })
})
