import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { puzzleFingerprint } from '../game/fingerprint.ts'
import { castProblems, hasOwnCastPool, sharedNames } from '../content/cast/index.ts'
import { scheduleProblems } from './check.ts'
import { addDays } from './dates.ts'
import { monthFileName, orderedDay, parseIndex, serializeIndex, serializeMonth } from './format.ts'
import { castOfDay, dayProblems, packEntryOf } from './gates.ts'
import { LAUNCH_DATE } from './launch.ts'
import { ADVANCED_SIZES, planDay } from './pick.ts'
import { SCHEDULE_DIR, readSchedule } from './schedule.testing.ts'

/** The committed schedule (src/content/schedule), read as the app will read it. */
const { index, files, days } = readSchedule()

describe('committed schedule: layout', () => {
  it('holds at least the first 120 days from the launch date', () => {
    expect(index.launch).toBe(LAUNCH_DATE)
    expect(index.first).toBe(LAUNCH_DATE)
    expect(index.count).toBe(days.length)
    expect(days.length).toBeGreaterThanOrEqual(120)
    expect(days[0]!.n).toBe(1)
    expect(days[days.length - 1]!.date).toBe(index.last)
  })
  it('has one small self-contained file per UTC month, listed by the index', () => {
    expect(index.months.map((m) => m.file)).toEqual(files.map((f) => monthFileName(f.month)))
    for (const month of index.months) {
      const text = readFileSync(join(SCHEDULE_DIR, month.file), 'utf8')
      expect(text.length, month.file).toBeLessThan(400_000)
      const file = files.find((f) => f.month === month.month)!
      expect(file.days.length).toBe(month.count)
      for (const day of file.days) expect(day.date.startsWith(month.month)).toBe(true)
    }
  })
  it('is written byte for byte as the serializers write it', () => {
    for (const file of files) expect(readFileSync(join(SCHEDULE_DIR, monthFileName(file.month)), 'utf8'), file.month).toBe(serializeMonth(file))
    expect(readFileSync(join(SCHEDULE_DIR, 'index.json'), 'utf8')).toBe(serializeIndex(index.launch, files))
  })
  it('gives every day the fields the app needs, in the fixed order, and no separate solution file', () => {
    for (const day of days) {
      expect(Object.keys(day).slice(0, 7), day.date).toEqual(['n', 'date', 'size', 'tier', 'theme', 'seed', 'attempts'])
      expect(Object.keys(day).slice(-4), day.date).toEqual(['title', 'portraits', 'puzzle', 'fp'])
      expect(JSON.stringify(orderedDay(day))).toBe(JSON.stringify(day))
      expect(day.puzzle.solution.length, day.date).toBe(day.size)
      expect(day.puzzle.scene.width).toBe(day.size)
      expect(day.puzzle.clues.length).toBeGreaterThan(0)
      expect(day.title.length).toBeGreaterThan(0)
    }
  })
  it('has no separate solution file in the folder', async () => {
    const { readdirSync } = await import('node:fs')
    expect(readdirSync(SCHEDULE_DIR).filter((f) => /solution/i.test(f))).toEqual([])
  })
  it('parses the index it is given', () => {
    expect(() => parseIndex('{"format":99}')).toThrow()
  })
})

describe('committed schedule: what is in it', () => {
  it('counts the days from the launch date without a gap', () => {
    days.forEach((day, i) => {
      expect(day.n).toBe(i + 1)
      expect(day.date).toBe(addDays(LAUNCH_DATE, i))
    })
  })
  it('follows the picker (sizes, tiers, themes), except documented fallbacks', () => {
    for (const day of days) {
      const plan = planDay(day.date)
      expect(day.tier, day.date).toBe(plan.tier)
      expect(day.theme, day.date).toBe(plan.theme)
      expect(day.size, day.date).toBe(day.fallbackFrom === undefined ? plan.size : 9)
      expect(day.seed).toBeGreaterThanOrEqual(plan.seed)
      expect(day.seed).toBeLessThan(plan.seed + 50)
      expect(day.attempts).toBe(day.seed - plan.seed + 1)
    }
  })
  it('never has a 16x16, and hard and expert only on 9x9 and 12x12', () => {
    for (const day of days) {
      expect(day.size, day.date).not.toBe(16)
      if (day.tier === 'hard' || day.tier === 'expert') expect(ADVANCED_SIZES).toContain(day.size)
    }
  })
  it('has a fingerprint that matches the puzzle', () => {
    for (const day of days) expect(day.fp, day.date).toBe(puzzleFingerprint(day.puzzle))
  })
  it('bakes names and genders into the puzzle: valid cast, no name shared with the day before', () => {
    days.forEach((day, i) => {
      const suspects = day.puzzle.people.filter((p) => p.kind === 'suspect')
      expect(suspects.length, day.date).toBe(day.size - 1)
      expect(castProblems(castOfDay(day), suspects.map((p) => p.gender)), day.date).toEqual([])
      expect(day.portraits.length).toBe(suspects.length)
      const themed = i > 0 && (hasOwnCastPool(day.theme) || hasOwnCastPool(days[i - 1]!.theme))
      if (i > 0) expect(sharedNames(castOfDay(days[i - 1]!), castOfDay(day)).length, day.date).toBeLessThanOrEqual(themed ? 1 : 0)
    })
  })
  it('passes the cheap schedule checks (plan, expert per week, no repeated board)', () => {
    expect(scheduleProblems(index, files)).toEqual([])
    const complete = days.length >= 7
    expect(complete).toBe(true)
  })
  it('holds exactly one expert per whole UTC week', () => {
    for (let i = 0; i + 7 <= days.length; i += 7) {
      const week = days.slice(i, i + 7)
      if (new Date(`${week[0]!.date}T00:00:00Z`).getUTCDay() !== 1) continue
      expect(week.filter((d) => d.tier === 'expert').length, week[0]!.date).toBe(1)
    }
  })
  it('reports a problem when the schedule is tampered with', () => {
    const broken = files.map((f) => ({ ...f, days: f.days.map((d) => ({ ...d })) }))
    broken[0]!.days[0]!.fp = 'x'
    broken[0]!.days[1]!.tier = broken[0]!.days[1]!.tier === 'easy' ? 'medium' : 'easy'
    const problems = scheduleProblems(index, broken)
    expect(problems.some((p) => p.includes('fp does not match'))).toBe(true)
    expect(problems.some((p) => p.includes('the picker plans'))).toBe(true)
  })
})

describe('committed schedule: sample re-verified by the gates', () => {
  // Every gate of the pack from scratch (unique solution, human solve at the tier, band checks, hint / clue / noun audits, cast) plus the
  // rendered-screen check. Ten days spread over the schedule; `bun run test:slow` re-verifies all of them.
  const sample = Array.from({ length: 10 }, (_, k) => days[Math.floor((k * (days.length - 1)) / 9)]!)
  it('picks ten different days including the first and the last', () => {
    expect(new Set(sample.map((d) => d.date)).size).toBe(10)
    expect(sample[0]!.n).toBe(1)
    expect(sample[9]!.date).toBe(index.last)
  })
  for (const day of sample) {
    it(`${day.date} ${day.size}x${day.size} ${day.tier}: no problems`, { timeout: 120_000 }, () => {
      const previous = days.find((d) => d.n === day.n - 1)
      expect(dayProblems(day, previous)).toEqual([])
      expect(packEntryOf(day).cast).toEqual(castOfDay(day))
    })
  }
})
