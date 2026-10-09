import { describe, expect, it } from 'vitest'
import { pairProblems } from './gates.ts'
import type { ScheduleDay } from './types.ts'

/** A day with only what `pairProblems` reads: date, size, tier, theme, the suspect names and the room names. */
const day = (date: string, theme: string, tier: string, names: string[], rooms: string[] = ['Hall']): ScheduleDay =>
  ({ date, size: 6, tier, theme, puzzle: { people: names.map((label) => ({ kind: 'suspect', label })), scene: { rooms: rooms.map((name, id) => ({ id, name })) } } }) as unknown as ScheduleDay

describe('pairProblems: names shared with the day before', () => {
  it('rejects a shared name between two plain days', () => {
    const problems = pairProblems(day('2026-10-12', 'home', 'easy', ['Iris', 'Tom']), day('2026-10-13', 'park', 'medium', ['Iris', 'Bo']))
    expect(problems).toEqual(['2026-10-13: shares the names Iris with 2026-10-12'])
  })

  it('allows one shared name when either day has a cast pool of its own (Simpshouse, owner decision 2026-10-08)', () => {
    const plain = day('2026-10-13', 'park', 'easy', ['Iris', 'Tom'])
    const themed = day('2026-10-14', 'simpshouse', 'medium', ['Iris', 'Bo'])
    expect(pairProblems(plain, themed)).toEqual([])
    expect(pairProblems(themed, day('2026-10-15', 'home', 'hard', ['Iris', 'Cy']))).toEqual([])
  })

  it('still rejects two shared names around a themed-pool day', () => {
    const problems = pairProblems(day('2026-10-13', 'park', 'easy', ['Iris', 'Tom']), day('2026-10-14', 'simpshouse', 'medium', ['Iris', 'Tom']))
    expect(problems).toHaveLength(1)
  })
})

describe('pairProblems: same size, tier and theme (SLAY-24)', () => {
  it('rejects it on two plain days, whatever the rooms', () => {
    expect(pairProblems(day('2026-09-28', 'home', 'easy', ['Ann'], ['Hall']), day('2026-09-29', 'home', 'easy', ['Bo'], ['Kitchen']))).toEqual(['2026-09-29: same size, tier and theme as 2026-09-28'])
  })

  it('allows it inside a seasonal window when the sets of rooms differ, and rejects it when they are the same', () => {
    expect(pairProblems(day('2026-12-12', 'christmas', 'easy', ['Ann'], ['Elf Workshop', 'Hall']), day('2026-12-13', 'christmas', 'easy', ['Bo'], ['Elf Workshop', 'Stable']))).toEqual([])
    expect(pairProblems(day('2026-12-12', 'christmas', 'easy', ['Ann'], ['Stable', 'Hall']), day('2026-12-13', 'christmas', 'easy', ['Bo'], ['Hall', 'Stable']))).toHaveLength(1)
  })
})
