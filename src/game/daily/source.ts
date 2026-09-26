import scheduleIndex from '../../content/schedule/index.json'
import { parseIndex, parseMonthFile } from '../../schedule/format.ts'
import type { MonthFile, ScheduleIndex } from '../../schedule/types.ts'

/**
 * Where the app reads the schedule from. The index is small and part of the app bundle. Every month file is its own lazily loaded chunk
 * (a dynamic import per month, chunked by Vite): only the month that holds the day being shown is fetched. Files are found by their
 * name, `src/content/schedule/<YYYY-MM>.json`, so a new month file added by the schedule tool needs no code change.
 */

const monthLoaders = import.meta.glob<MonthFile>('../../content/schedule/[0-9][0-9][0-9][0-9]-[0-9][0-9].json', { import: 'default' })

/** `index.json`, checked once at start-up (a broken file fails loudly here, never mid-game). */
export const SCHEDULE_INDEX: ScheduleIndex = parseIndex(JSON.stringify(scheduleIndex))

/** Loads (and validates the layout of) one month file, e.g. `2026-11`. Rejects when the file does not exist or cannot be fetched. */
export async function loadMonthFile(month: string): Promise<MonthFile> {
  const loader = monthLoaders[`../../content/schedule/${month}.json`]
  if (!loader) throw new Error(`no schedule file for ${month}`)
  const file = await loader()
  return parseMonthFile(JSON.stringify(file), `${month}.json`)
}
