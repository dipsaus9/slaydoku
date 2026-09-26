import { SCHEDULE_FORMAT } from './types.ts'
import type { IndexMonth, MonthFile, ScheduleDay, ScheduleIndex } from './types.ts'
import { monthOf } from './dates.ts'

/** File of a month, relative to the schedule folder: `2026-11.json`. */
export const monthFileName = (month: string): string => `${month}.json`

/** A day with its keys in the fixed order of the file, so the same day always gives the same bytes. */
export function orderedDay(day: ScheduleDay): ScheduleDay {
  return {
    n: day.n,
    date: day.date,
    size: day.size,
    tier: day.tier,
    theme: day.theme,
    seed: day.seed,
    attempts: day.attempts,
    ...(day.fallbackFrom === undefined ? {} : { fallbackFrom: day.fallbackFrom }),
    title: day.title,
    portraits: day.portraits,
    puzzle: day.puzzle,
    fp: day.fp,
  }
}

/**
 * Month file text: a small header, then one day per line (compact JSON), so extending or regenerating a month diffs by day. Key order
 * is fixed, no timestamps: the same days always give the same bytes.
 */
export function serializeMonth(file: MonthFile): string {
  const lines = file.days.map((day) => JSON.stringify(orderedDay(day)))
  return `{"format":${file.format},"month":${JSON.stringify(file.month)},"days":[\n${lines.join(',\n')}\n]}\n`
}

/** The month entries of the index for a set of month files (in month order). */
export const indexMonthsOf = (files: readonly MonthFile[]): IndexMonth[] =>
  [...files]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((file) => ({ month: file.month, file: monthFileName(file.month), first: file.days[0]!.date, last: file.days[file.days.length - 1]!.date, count: file.days.length }))

/** `index.json` text: launch date, reach of the schedule and one line per month. */
export function serializeIndex(launch: string, files: readonly MonthFile[]): string {
  const months = indexMonthsOf(files)
  const count = months.reduce((n, m) => n + m.count, 0)
  const head = `{"format":${SCHEDULE_FORMAT},"launch":${JSON.stringify(launch)},"first":${JSON.stringify(months[0]?.first ?? launch)},"last":${JSON.stringify(months[months.length - 1]?.last ?? launch)},"count":${count},"months":[`
  return `${head}\n${months.map((m) => JSON.stringify(m)).join(',\n')}\n]}\n`
}

/** Parses the text of a month file; throws with the file name when the layout is wrong. */
export function parseMonthFile(text: string, name: string): MonthFile {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    throw new Error(`${name}: not JSON (${error instanceof Error ? error.message : String(error)})`)
  }
  const file = value as Partial<MonthFile> | null
  if (!file || file.format !== SCHEDULE_FORMAT || typeof file.month !== 'string' || !Array.isArray(file.days)) {
    throw new Error(`${name}: not a schedule month file of format ${SCHEDULE_FORMAT}`)
  }
  return file as MonthFile
}

/** Parses the text of index.json. */
export function parseIndex(text: string): ScheduleIndex {
  const index = JSON.parse(text) as Partial<ScheduleIndex>
  if (index.format !== SCHEDULE_FORMAT || typeof index.launch !== 'string' || !Array.isArray(index.months)) {
    throw new Error(`index.json: not a schedule index of format ${SCHEDULE_FORMAT}`)
  }
  return index as ScheduleIndex
}

/** Groups days into month files, in date order. */
export function monthFilesOf(days: readonly ScheduleDay[]): MonthFile[] {
  const byMonth = new Map<string, ScheduleDay[]>()
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    const month = monthOf(day.date)
    byMonth.set(month, [...(byMonth.get(month) ?? []), day])
  }
  return [...byMonth].map(([month, list]) => ({ format: SCHEDULE_FORMAT, month, days: list }))
}
