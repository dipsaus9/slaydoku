import { describe, expect, it } from 'vitest'
import { OBJECT_TYPES } from '../../engine/model/index.ts'
import { CAST_POOL, castFor, namesFor, poolEntry } from '../cast/index.ts'
import { entryProblems } from './gates.ts'
import { packId } from './ids.ts'
import { sampleEntry } from './sample.testing.ts'
import type { PackEntry } from './types.ts'

const veryEasy = sampleEntry(6, 'very-easy', 'home')
const easy = sampleEntry(6, 'easy', 'home')
const entry = (): PackEntry => structuredClone(veryEasy)
const easyEntry = (): PackEntry => structuredClone(easy)

/** The entry with the suspects renamed (and regendered as the pool has them), the way a broken schedule would carry them. */
function recast(bad: PackEntry, names: string[]): void {
  const suspects = bad.puzzle.people.filter((p) => p.kind === 'suspect')
  suspects.forEach((p, i) => {
    p.label = names[i]!
    p.gender = poolEntry(names[i]!)?.gender ?? 'woman'
  })
  bad.cast = names
}

describe('entryProblems checks the cast (SLAY-1.3)', () => {
  const size = veryEasy.size
  const good = () => castFor(size, 'gate').names

  it('accepts a cast from castFor', () => {
    const ok = entry()
    recast(ok, good())
    expect(entryProblems(ok).filter((p) => p.includes('cast:'))).toEqual([])
  })

  it('rejects two suspects with the same first letter', () => {
    const bad = entry()
    const names = good()
    const clash = poolEntry(names[0]!)!.gender === 'woman' ? namesFor(names[0]!.charAt(0), 'woman').find((n) => n !== names[0]) : namesFor(names[0]!.charAt(0), 'man').find((n) => n !== names[0])
    recast(bad, [names[0]!, clash!, ...names.slice(2)])
    expect(entryProblems(bad).some((p) => p.includes('cast:') && p.includes('share the first letter'))).toBe(true)
  })

  it('rejects unbalanced genders', () => {
    const bad = entry()
    const women = CAST_POOL.filter((n) => n.gender === 'woman')
    const letters = new Set<string>()
    const names = women.filter((n) => !letters.has(n.name.charAt(0)) && letters.add(n.name.charAt(0))).slice(0, size - 1).map((n) => n.name)
    recast(bad, names)
    expect(entryProblems(bad).some((p) => p.includes('cast:') && p.includes('not balanced'))).toBe(true)
  })

  it('rejects a name outside the pool', () => {
    const bad = entry()
    recast(bad, ['Zed', ...good().slice(1)])
    expect(entryProblems(bad).some((p) => p.includes('cast:') && p.includes('not in the cast pool: Zed'))).toBe(true)
  })

  it('rejects a gender that differs from the pool', () => {
    const bad = entry()
    recast(bad, good())
    const first = bad.puzzle.people.find((p) => p.kind === 'suspect')!
    first.gender = first.gender === 'woman' ? 'man' : 'woman'
    expect(entryProblems(bad).some((p) => p.includes('cast:') && p.includes('in the pool, not'))).toBe(true)
  })
})

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

  it('every suspect needs a gender (gender cards ask about them, CAD-9.4): it fails the entry when one has none', () => {
    const bad = entry()
    const [holder, other] = bad.puzzle.people.filter((p) => p.kind === 'suspect')
    holder!.gender = 'woman'
    other!.gender = 'man'
    delete bad.puzzle.people.filter((p) => p.kind === 'suspect')[2]!.gender
    bad.puzzle.clues.push({ personId: holder!.id, type: 'roomHasGender', args: { gender: 'man' } })
    bad.clueCount = bad.puzzle.clues.length
    expect(entryProblems(bad).some((p) => p.includes('not every suspect has a gender'))).toBe(true)
  })

  it('a card that names an object the board does not draw fails the noun audit', () => {
    const bad = entry()
    const missing = OBJECT_TYPES.find((type) => !bad.puzzle.scene.objects.some((o) => o.type === type))!
    const card = bad.puzzle.clues.find((c) => (c.args as { objectType?: string } | undefined)?.objectType !== undefined)!
    ;(card.args as { objectType: string }).objectType = missing
    // reported in both languages (SLAY-17.4: the Dutch nouns pass the same audit)
    expect(entryProblems(bad).some((p) => p.startsWith(`${bad.id}: clue noun: en: card `))).toBe(true)
    expect(entryProblems(bad).some((p) => p.startsWith(`${bad.id}: clue noun: nl: card `))).toBe(true)
  })
})
