import { describe, expect, it } from 'vitest'
import { dayProblems } from './gates.ts'
import { readSchedule } from './schedule.testing.ts'

/** `bun run test:slow`: every committed day from scratch through every gate (about a minute). */
describe('committed schedule: full re-verification', () => {
  const { days } = readSchedule()
  it('every day passes every gate', { timeout: 20 * 60_000 }, () => {
    const problems = days.flatMap((day, i) => dayProblems(day, days[i - 1]))
    expect(problems).toEqual([])
  })
})
