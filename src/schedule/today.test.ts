import { describe, expect, it } from 'vitest'
import { addDays, monthOf } from './dates.ts'
import { findDay, lookupDay, monthsToTry, msUntilDate, msUntilNextUtcMidnight, nextUtcMidnight, phaseOf, puzzleNumberOf, startOfUtcDay, utcDateOf } from './today.ts'
import type { MonthFile, ScheduleDay, ScheduleIndex } from './types.ts'
import { readSchedule } from './schedule.testing.ts'

/** A stand-in day: today.ts only reads the date and the number. */
const dayOf = (date: string, launch: string): ScheduleDay => ({ n: puzzleNumberOf(date, launch), date }) as ScheduleDay

/** A schedule of consecutive days from `first` to `last` grouped into month files, with the matching index. */
function makeSchedule(launch: string, first: string, last: string) {
  const days: ScheduleDay[] = []
  for (let date = first; date <= last; date = addDays(date, 1)) days.push(dayOf(date, launch))
  const files = new Map<string, MonthFile>()
  for (const day of days) {
    const month = monthOf(day.date)
    files.set(month, { format: 1, month, days: [...(files.get(month)?.days ?? []), day] })
  }
  const months = [...files.values()].map((f) => ({ month: f.month, file: `${f.month}.json`, first: f.days[0]!.date, last: f.days[f.days.length - 1]!.date, count: f.days.length }))
  const index: ScheduleIndex = { format: 1, launch, first, last, count: days.length, months }
  const opened: string[] = []
  const loadMonth = async (month: string): Promise<MonthFile> => {
    opened.push(month)
    const file = files.get(month)
    if (!file) throw new Error(`no file ${month}`)
    return file
  }
  return { index, files, opened, loadMonth }
}

describe('UTC date and time to midnight', () => {
  it('reads the UTC date of a clock reading, whatever the local zone', () => {
    expect(utcDateOf(Date.parse('2026-10-12T00:00:00Z'))).toBe('2026-10-12')
    expect(utcDateOf(Date.parse('2026-10-12T23:59:59.999Z'))).toBe('2026-10-12')
    expect(utcDateOf(Date.parse('2026-10-13T00:00:00Z'))).toBe('2026-10-13')
  })

  it('counts the ms to the next 00:00 UTC, and a whole day exactly at midnight', () => {
    expect(msUntilNextUtcMidnight(Date.parse('2026-10-12T23:59:59Z'))).toBe(1000)
    expect(msUntilNextUtcMidnight(Date.parse('2026-10-12T23:59:59.999Z'))).toBe(1)
    expect(msUntilNextUtcMidnight(Date.parse('2026-10-12T12:00:00Z'))).toBe(12 * 3_600_000)
    expect(msUntilNextUtcMidnight(Date.parse('2026-10-12T00:00:00Z'))).toBe(86_400_000)
    expect(nextUtcMidnight(Date.parse('2026-10-12T18:30:00Z'))).toBe(Date.parse('2026-10-13T00:00:00Z'))
  })

  it('crosses a month end, a year end and a leap day', () => {
    expect(nextUtcMidnight(Date.parse('2026-10-31T22:00:00Z'))).toBe(Date.parse('2026-11-01T00:00:00Z'))
    expect(nextUtcMidnight(Date.parse('2026-12-31T22:00:00Z'))).toBe(Date.parse('2027-01-01T00:00:00Z'))
    expect(nextUtcMidnight(Date.parse('2028-02-28T22:00:00Z'))).toBe(Date.parse('2028-02-29T00:00:00Z'))
    expect(nextUtcMidnight(Date.parse('2028-02-29T22:00:00Z'))).toBe(Date.parse('2028-03-01T00:00:00Z'))
    expect(utcDateOf(nextUtcMidnight(Date.parse('2027-02-28T12:00:00Z')))).toBe('2027-03-01')
  })

  it('knows when a date starts and how long until then', () => {
    expect(startOfUtcDay('2026-10-12')).toBe(Date.parse('2026-10-12T00:00:00Z'))
    expect(msUntilDate('2026-10-12', Date.parse('2026-10-11T12:00:00Z'))).toBe(12 * 3_600_000)
    expect(msUntilDate('2026-10-12', Date.parse('2026-10-12T00:00:01Z'))).toBe(-1000)
  })

  it('numbers puzzles from the launch date', () => {
    expect(puzzleNumberOf('2026-10-12', '2026-10-12')).toBe(1)
    expect(puzzleNumberOf('2026-10-13', '2026-10-12')).toBe(2)
    expect(puzzleNumberOf('2027-02-08', '2026-10-12')).toBe(120)
  })
})

describe('phaseOf', () => {
  const { index } = makeSchedule('2026-10-12', '2026-10-12', '2026-11-05')

  it('is before-launch, scheduled or after-schedule', () => {
    expect(phaseOf('2026-10-01', index)).toBe('before-launch')
    expect(phaseOf('2026-10-11', index)).toBe('before-launch')
    expect(phaseOf('2026-10-12', index)).toBe('scheduled')
    expect(phaseOf('2026-11-05', index)).toBe('scheduled')
    expect(phaseOf('2026-11-06', index)).toBe('after-schedule')
  })

  it('reads an empty schedule as nothing scheduled', () => {
    expect(phaseOf('2026-10-12', { first: '2026-10-12', last: '2026-10-12', count: 0 })).toBe('after-schedule')
  })
})

describe('which month files are tried', () => {
  const { index } = makeSchedule('2026-10-12', '2026-10-12', '2027-01-20')

  it('starts with the file that holds the date', () => {
    expect(monthsToTry('2026-11-15', index).map((m) => m.month)).toEqual(['2026-11'])
  })

  it('adds the neighbour across a month boundary', () => {
    expect(monthsToTry('2026-11-30', index).map((m) => m.month)).toEqual(['2026-11', '2026-12'])
    expect(monthsToTry('2026-12-01', index).map((m) => m.month)).toEqual(['2026-12', '2026-11'])
    expect(monthsToTry('2026-12-31', index).map((m) => m.month)).toEqual(['2026-12', '2027-01'])
  })

  it('only lists months the index has, each once', () => {
    expect(monthsToTry('2026-10-12', index).map((m) => m.month)).toEqual(['2026-10'])
    expect(monthsToTry('2026-10-31', index).map((m) => m.month)).toEqual(['2026-10', '2026-11'])
    expect(monthsToTry('2027-01-31', index).map((m) => m.month)).toEqual(['2027-01']) // no February file in the index
  })
})

describe('lookupDay', () => {
  it('finds the day and opens only the month file that holds it', async () => {
    const s = makeSchedule('2026-10-12', '2026-10-12', '2027-02-08')
    const result = await lookupDay('2026-11-15', s.index, s.loadMonth)
    expect(result).toMatchObject({ kind: 'day', day: { date: '2026-11-15', n: 35 } })
    expect(s.opened).toEqual(['2026-11'])
  })

  it('finds the first day, the last day of a month and the first of the next', async () => {
    const s = makeSchedule('2026-10-12', '2026-10-12', '2027-02-08')
    for (const [date, n] of [['2026-10-12', 1], ['2026-10-31', 20], ['2026-11-01', 21], ['2027-02-08', 120]] as const) {
      const result = await lookupDay(date, s.index, s.loadMonth)
      expect(result, date).toMatchObject({ kind: 'day', day: { date, n } })
    }
  })

  it('finds a leap day (2028-02-29) in injected data, and 2028-03-01 after it', async () => {
    const s = makeSchedule('2028-01-01', '2028-01-01', '2028-03-10')
    expect(s.index.months.find((m) => m.month === '2028-02')).toMatchObject({ first: '2028-02-01', last: '2028-02-29', count: 29 })
    expect(await lookupDay('2028-02-29', s.index, s.loadMonth)).toMatchObject({ kind: 'day', day: { date: '2028-02-29', n: 60 } })
    expect(await lookupDay('2028-03-01', s.index, s.loadMonth)).toMatchObject({ kind: 'day', day: { date: '2028-03-01', n: 61 } })
    // The day before a non-leap March: February 2027 ends on the 28th.
    const plain = makeSchedule('2027-01-01', '2027-01-01', '2027-03-10')
    expect(plain.index.months.find((m) => m.month === '2027-02')?.last).toBe('2027-02-28')
    expect(await lookupDay('2027-03-01', plain.index, plain.loadMonth)).toMatchObject({ kind: 'day', day: { date: '2027-03-01' } })
  })

  it('answers before the launch and after the last day from the index, without opening a file', async () => {
    const s = makeSchedule('2026-10-12', '2026-10-12', '2026-11-05')
    expect(await lookupDay('2026-10-01', s.index, s.loadMonth)).toEqual({ kind: 'before-launch', first: '2026-10-12' })
    expect(await lookupDay('2026-11-06', s.index, s.loadMonth)).toEqual({ kind: 'after-schedule', last: '2026-11-05' })
    expect(s.opened).toEqual([])
  })

  it('falls back to the neighbouring month when the date is not in the file the index names', async () => {
    // The index claims the 30th of November lives in the November file, but that file stops at the 29th; the day is in December's file.
    const s = makeSchedule('2026-11-01', '2026-11-01', '2026-12-31')
    const november = s.files.get('2026-11')!
    const december = s.files.get('2026-12')!
    const moved = november.days.pop()!
    december.days.unshift(moved)
    const result = await lookupDay('2026-11-30', s.index, s.loadMonth)
    expect(result).toMatchObject({ kind: 'day', day: { date: '2026-11-30' } })
    expect(s.opened).toEqual(['2026-11', '2026-12'])
  })

  it('skips a month file that fails to load and uses the neighbour that has the day', async () => {
    const s = makeSchedule('2026-11-01', '2026-11-01', '2026-12-31')
    s.files.get('2026-12')!.days.unshift(s.files.get('2026-11')!.days.pop()!)
    const failing = async (month: string) => {
      if (month === '2026-11') throw new Error('offline')
      return s.loadMonth(month)
    }
    expect(await lookupDay('2026-11-30', s.index, failing)).toMatchObject({ kind: 'day' })
  })

  it('throws when every candidate fails to load, and says missing when files load but hold no such day', async () => {
    const s = makeSchedule('2026-10-12', '2026-10-12', '2026-11-05')
    await expect(lookupDay('2026-10-20', s.index, async () => Promise.reject(new Error('offline')))).rejects.toThrow('offline')
    s.files.get('2026-10')!.days = []
    expect(await lookupDay('2026-10-20', s.index, s.loadMonth)).toEqual({ kind: 'missing', date: '2026-10-20' })
  })
})

describe('findDay', () => {
  it('finds a day by its date in loaded files', () => {
    const s = makeSchedule('2026-10-12', '2026-10-12', '2026-11-05')
    expect(findDay([...s.files.values()], '2026-11-02')?.n).toBe(22)
    expect(findDay([...s.files.values()], '2026-12-02')).toBeNull()
  })
})

describe('with the committed schedule', () => {
  const { index, files, days } = readSchedule()

  it('finds every scheduled date in the file named after its month, and no other date', async () => {
    const loadMonth = async (month: string) => files.find((f) => f.month === month)!
    for (const day of days) {
      const result = await lookupDay(day.date, index, loadMonth)
      expect(result.kind).toBe('day')
      if (result.kind === 'day') expect(result.day).toBe(day)
    }
    expect((await lookupDay(addDays(index.last, 1), index, loadMonth)).kind).toBe('after-schedule')
    expect((await lookupDay(addDays(index.first, -1), index, loadMonth)).kind).toBe('before-launch')
  })
})
