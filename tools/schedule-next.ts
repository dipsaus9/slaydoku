// `bun run schedule:next [--today YYYY-MM-DD] [--dir folder] [--days N] [--force] [--github]`: says whether the schedule needs topping up (fewer than 60 days
// left after today, UTC), where the next run starts and the exact command. The top-up workflow (.github/workflows/schedule-top-up.yml) reads it with
// --github, which prints only `key=value` lines for $GITHUB_OUTPUT. Always exits 0 when it could work it out (the decision is in `needed`), 2 on usage.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDate } from '../src/schedule/dates.ts'
import { parseIndex } from '../src/schedule/format.ts'
import { LAUNCH_DATE } from '../src/schedule/launch.ts'
import { MIN_DAYS_LEFT, TOP_UP_BELOW, TOP_UP_DAYS, topUpPlan } from '../src/schedule/status.ts'

const here = dirname(fileURLToPath(import.meta.url))
const USAGE = 'Usage: bun run schedule:next [--today YYYY-MM-DD] [--dir folder] [--days N] [--force] [--github]\n  --force  report a top-up as due even with 60 or more days left (the workflow input of the same name)'
const argv = process.argv.slice(2)
const values = new Map<string, string>()
let github = false
let force = false
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i] as string
  if (arg === '--github' || arg === '--force') {
    if (arg === '--github') github = true
    else force = true
    continue
  }
  const match = /^--(today|dir|days)(?:=(.*))?$/.exec(arg)
  const value = match ? (match[2] ?? argv[++i]) : undefined
  if (!match || value === undefined) usage(`Bad argument "${arg}".`)
  values.set((match as RegExpExecArray)[1] as string, value as string)
}

function usage(message: string): never {
  console.error(`${message}\n${USAGE}`)
  process.exit(2)
}

const today = values.get('today') ?? new Date().toISOString().slice(0, 10)
if (!isDate(today)) usage(`--today "${today}" is not a date (YYYY-MM-DD).`)
const days = Number(values.get('days') ?? TOP_UP_DAYS)
if (!Number.isInteger(days) || days < 1 || days > 366) usage('--days must be a whole number from 1 to 366.')

const dir = resolve(values.get('dir') ?? join(here, '../src/content/schedule'))
const indexPath = join(dir, 'index.json')
const index = existsSync(indexPath) ? parseIndex(readFileSync(indexPath, 'utf8')) : null
const plan = { ...topUpPlan(index, today, index?.launch ?? LAUNCH_DATE, days) }
if (force) plan.needed = true

if (github) {
  console.log(`needed=${plan.needed}\ndays_left=${plan.daysLeft}\nstart=${plan.start}\ndays=${plan.days}\nend=${plan.end}`)
} else {
  console.log(`${plan.daysLeft} days left after ${plan.today}; a top-up is ${plan.needed ? (force ? 'forced' : 'due') : 'not due'} (due below ${TOP_UP_BELOW}; the floor is ${MIN_DAYS_LEFT}).`)
  console.log(`Next start: ${plan.start} (last day to be added: ${plan.end}).`)
  console.log(`Command: ${plan.command}`)
}
