// `bun run schedule:check [--today YYYY-MM-DD] [--dir folder]`: prints how many scheduled days are left after today (UTC) and exits 1 when
// fewer than 30 are (the topping-up job of SLAY-1.9 runs it). Exit code: 0 enough days left, 1 too few (or no schedule), 2 usage.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDate } from '../src/schedule/dates.ts'
import { parseIndex } from '../src/schedule/format.ts'
import { MIN_DAYS_LEFT, scheduleStatus } from '../src/schedule/status.ts'

const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const values = new Map<string, string>()
for (let i = 0; i < argv.length; i++) {
  const match = /^--(today|dir)(?:=(.*))?$/.exec(argv[i] as string)
  const value = match ? (match[2] ?? argv[++i]) : undefined
  if (!match || value === undefined) {
    console.error(`Bad argument "${argv[i]}".\nUsage: bun run schedule:check [--today YYYY-MM-DD] [--dir folder]`)
    process.exit(2)
  }
  values.set((match as RegExpExecArray)[1] as string, value as string)
}
const today = values.get('today') ?? new Date().toISOString().slice(0, 10)
if (!isDate(today)) {
  console.error(`--today "${today}" is not a date (YYYY-MM-DD).`)
  process.exit(2)
}
const indexPath = join(resolve(values.get('dir') ?? join(here, '../src/content/schedule')), 'index.json')
if (!existsSync(indexPath)) {
  console.log(`No schedule found (${indexPath}). Run: bun run schedule --start <launch date> --days 120`)
  process.exit(1)
}
const index = parseIndex(readFileSync(indexPath, 'utf8'))
const status = scheduleStatus(index, today)
console.log(`${status.daysLeft} days left after ${status.today} (last scheduled date ${status.last}, minimum ${MIN_DAYS_LEFT}).`)
if (!status.ok) {
  console.log(`Top up: bun run schedule --start ${status.nextStart} --days ${Math.max(MIN_DAYS_LEFT * 2, 60)}`)
  process.exit(1)
}
