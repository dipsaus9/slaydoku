import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parseIndex, parseMonthFile } from './format.ts'
import type { MonthFile, ScheduleDay, ScheduleIndex } from './types.ts'

/** The committed schedule folder. */
export const SCHEDULE_DIR = new URL('../content/schedule/', import.meta.url).pathname

/** The committed index, month files and all days in date order. */
export function readSchedule(dir: string = SCHEDULE_DIR): { index: ScheduleIndex; files: MonthFile[]; days: ScheduleDay[] } {
  const index = parseIndex(readFileSync(join(dir, 'index.json'), 'utf8'))
  const files = readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .sort()
    .map((f) => parseMonthFile(readFileSync(join(dir, f), 'utf8'), f))
  return { index, files, days: files.flatMap((f) => f.days) }
}
