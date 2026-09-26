// Generates the daily schedule: `bun run schedule --start YYYY-MM-DD --days N [--out dir] [--jobs n] [--launch YYYY-MM-DD] [--report dir] [--overwrite]`.
// One JSON file per UTC month plus index.json under src/content/schedule. Each day is planned by the pure picker (src/schedule/pick.ts), built with
// the ladder or advanced generator, and must pass every gate (src/schedule/gates.ts); a seed that fails is retried with the next seed of the day's
// window. Same arguments, same bytes, whatever --jobs is. The report (per day: attempts and the gate that rejected each seed) goes to --report.
// `--start` defaults to the day after the last scheduled day (or the launch date when nothing is scheduled). Days already in the folder that come
// out different are refused unless --overwrite: a published day must never change.
// Exit code: 0 ok, 1 generation or checks failed, 2 usage.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TIERS } from '../src/engine/generator/tiers/index.ts'
import { CAST_CHAIN_START, nominalCast } from '../src/schedule/cast.ts'
import { buildDay, withFallback } from '../src/schedule/build.ts'
import type { DayBuild } from '../src/schedule/build.ts'
import { scheduleProblems } from '../src/schedule/check.ts'
import { addDays, dayNumberOf, isDate } from '../src/schedule/dates.ts'
import { monthFileName, monthFilesOf, orderedDay, parseIndex, parseMonthFile, serializeIndex, serializeMonth } from '../src/schedule/format.ts'
import { LAUNCH_DATE } from '../src/schedule/launch.ts'
import { FALLBACK_SIZE, planDay } from '../src/schedule/pick.ts'
import type { DayPlan, ScheduleDay } from '../src/schedule/types.ts'
import { castOfDay } from '../src/schedule/gates.ts'

const here = dirname(fileURLToPath(import.meta.url))
const USAGE =
  'Usage: bun run schedule --start YYYY-MM-DD --days N [--out dir] [--jobs n] [--launch YYYY-MM-DD] [--report dir] [--overwrite]\n' +
  '  --start   first date to generate (default: the day after the last scheduled day, or the launch date)\n' +
  '  --days    how many consecutive days\n' +
  `  --out     schedule folder (default src/content/schedule)\n  --jobs    parallel worker processes (default cores minus 2)\n` +
  `  --launch  launch date, puzzle number 1 (default ${LAUNCH_DATE}, src/schedule/launch.ts)\n  --report  folder for report.md and report.json (default reports/schedule)\n` +
  '  --overwrite  allow days that already exist to come out different'

const values = new Map<string, string>()
const flags = new Set<string>()
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i] as string
  if (arg === '--overwrite' || arg === '--worker') {
    flags.add(arg.slice(2))
    continue
  }
  const match = /^--(start|days|out|jobs|launch|report|dates)(?:=(.*))?$/.exec(arg)
  const value = match ? (match[2] ?? argv[++i]) : undefined
  if (!match || value === undefined) usage(`Bad argument "${arg}".`)
  values.set((match as RegExpExecArray)[1] as string, value as string)
}

function usage(message: string): never {
  console.error(`${message}\n${USAGE}`)
  process.exit(2)
}

const launch = values.get('launch') ?? LAUNCH_DATE
if (!isDate(launch)) usage(`--launch "${launch}" is not a date.`)
if (dayNumberOf(launch) < dayNumberOf(CAST_CHAIN_START)) usage(`--launch must not be before ${CAST_CHAIN_START} (the start of the cast chain).`)

const started = performance.now()
const stamp = () => `[${((performance.now() - started) / 1000).toFixed(0).padStart(4)}s]`

/** Weight for ordering work: big boards and hard tiers first, so the long days do not start last. */
const weightOf = (plan: DayPlan): number => plan.size * (1 + TIERS.findIndex((t) => t.id === plan.tier))

/** The nominal build of one date: the planned size with the nominal cast. Pure of every other day. */
function buildNominal(date: string): DayBuild {
  const plan = planDay(date, launch)
  return buildDay(plan, plan.size, nominalCast(date))
}

// Worker mode (spawned by the parent): builds the given dates and prints one JSON line per date.
if (flags.has('worker')) {
  for (const date of (values.get('dates') ?? '').split(',').filter(Boolean)) {
    const plan = planDay(date, launch)
    console.error(`${date} ${plan.size}x${plan.size} ${plan.tier} ${plan.theme}`)
    console.log(JSON.stringify({ date, build: buildNominal(date) }))
  }
  process.exit(0)
}

const outDir = resolve(values.get('out') ?? join(here, '../src/content/schedule'))
const reportDir = resolve(values.get('report') ?? join(here, '../reports/schedule'))
const jobsRaw = Number(values.get('jobs') ?? Math.max(1, availableParallelism() - 2))
if (!Number.isInteger(jobsRaw) || jobsRaw < 1) usage('--jobs must be a positive integer.')
const jobs = jobsRaw

// What is already on disk.
const existing = new Map<string, ScheduleDay>()
let existingLaunch: string | null = null
if (existsSync(outDir)) {
  for (const name of readdirSync(outDir).filter((f) => /^\d{4}-\d{2}\.json$/.test(f)).sort()) {
    for (const day of parseMonthFile(readFileSync(join(outDir, name), 'utf8'), name).days) existing.set(day.date, day)
  }
  const indexPath = join(outDir, 'index.json')
  if (existsSync(indexPath)) existingLaunch = parseIndex(readFileSync(indexPath, 'utf8')).launch
}
const existingDates = [...existing.keys()].sort()
const lastExisting = existingDates[existingDates.length - 1]
if (existingLaunch !== null && existingLaunch !== launch) usage(`${outDir} was generated for the launch date ${existingLaunch}, not ${launch}.`)

const start = values.get('start') ?? (lastExisting ? addDays(lastExisting, 1) : launch)
if (!isDate(start)) usage(`--start "${start}" is not a date (YYYY-MM-DD).`)
const daysRaw = Number(values.get('days'))
if (!Number.isInteger(daysRaw) || daysRaw < 1) usage('--days N is required (a positive integer).')
const count = daysRaw
if (dayNumberOf(start) < dayNumberOf(launch)) usage(`--start ${start} is before the launch date ${launch}.`)
if (lastExisting ? dayNumberOf(start) > dayNumberOf(lastExisting) + 1 : start !== launch) {
  usage(lastExisting ? `--start ${start} would leave a gap after ${lastExisting}.` : `nothing is scheduled yet: --start must be the launch date ${launch}.`)
}

const dates = Array.from({ length: count }, (_, i) => addDays(start, i))
const plans = new Map(dates.map((d) => [d, planDay(d, launch)]))

/** Runs a worker process for a few dates; resolves to their builds. */
function child(batch: string[]): Promise<Map<string, DayBuild>> {
  return new Promise((done, fail) => {
    const proc = spawn(process.execPath, [join(here, 'schedule.ts'), '--worker', '--launch', launch, '--dates', batch.join(',')], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    proc.stdout.on('data', (chunk: Buffer) => (out += chunk.toString()))
    proc.stderr.on('data', (chunk: Buffer) => {
      for (const line of chunk.toString().split('\n')) if (line.trim()) console.error(`${stamp()} ${line}`)
    })
    proc.on('close', (code) => {
      if (code !== 0) return fail(new Error(`worker for ${batch.join(',')} exited with ${code}`))
      const built = new Map<string, DayBuild>()
      for (const line of out.split('\n').filter(Boolean)) {
        const { date, build } = JSON.parse(line) as { date: string; build: DayBuild }
        built.set(date, build)
      }
      done(built)
    })
  })
}

async function buildAll(): Promise<Map<string, DayBuild>> {
  const results = new Map<string, DayBuild>()
  if (jobs === 1) {
    for (const date of dates) {
      const plan = plans.get(date)!
      console.error(`${stamp()} ${date} ${plan.size}x${plan.size} ${plan.tier} ${plan.theme}`)
      results.set(date, buildNominal(date))
    }
    return results
  }
  const ordered = [...dates].sort((a, b) => weightOf(plans.get(b)!) - weightOf(plans.get(a)!) || a.localeCompare(b))
  const batches: string[][] = []
  for (let i = 0; i < ordered.length; i += 2) batches.push(ordered.slice(i, i + 2))
  let next = 0
  const worker = async () => {
    while (next < batches.length) {
      for (const [date, build] of await child(batches[next++]!)) results.set(date, build)
    }
  }
  console.error(`${stamp()} ${dates.length} days from ${start}, ${jobs} parallel jobs`)
  await Promise.all(Array.from({ length: Math.min(jobs, batches.length) }, worker))
  return results
}

async function main(): Promise<number> {
  const nominal = await buildAll()
  const finals = new Map<string, DayBuild>()
  const fallbacks: string[] = []
  const errors: string[] = []

  // Days whose planned board could not be produced: a planned 12x12 hard or expert day falls back to 9x9, one after the other in date order
  // (its cast keeps out the names of the day before as it really is). Anything else that ran dry is an error.
  const finalNames = (date: string): string[] => {
    const built = finals.get(date)
    if (built?.ok) return castOfDay(built.day)
    const old = existing.get(date)
    if (old) return castOfDay(old)
    return nominalCast(date).names
  }
  for (const date of dates) {
    const built = nominal.get(date)
    if (!built) {
      errors.push(`${date}: no build came back`)
      continue
    }
    const plan = plans.get(date)!
    const { build, fellBack } = withFallback(plan, built, finalNames(addDays(date, -1)))
    finals.set(date, build)
    if (fellBack) {
      console.error(`${stamp()} ${date}: planned ${plan.size}x${plan.size} ${plan.tier} not produced (${built.ok ? "" : built.reason}); fell back to ${FALLBACK_SIZE}x${FALLBACK_SIZE}`)
      fallbacks.push(date)
    }
    if (!build.ok) errors.push(`${date}: ${plan.size}x${plan.size} ${plan.tier}: ${build.reason}`)
  }

  writeReport(finals, fallbacks, errors)
  if (errors.length > 0) {
    for (const e of errors) console.error(`PROBLEM ${e}`)
    return 1
  }

  // Merge with what is on disk; a day that exists and comes out different is refused unless --overwrite.
  const days = new Map(existing)
  const changed: string[] = []
  for (const date of dates) {
    const day = (finals.get(date) as Extract<DayBuild, { ok: true }>).day
    const old = existing.get(date)
    if (old && JSON.stringify(orderedDay(old)) !== JSON.stringify(orderedDay(day))) changed.push(date)
    days.set(date, day)
  }
  if (changed.length > 0 && !flags.has('overwrite')) {
    console.error(`PROBLEM ${changed.length} existing days come out different (${changed.slice(0, 5).join(', ')}${changed.length > 5 ? ', ...' : ''}); a published day must not change. Nothing written. Use --overwrite to replace them.`)
    return 1
  }

  const all = [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
  const files = monthFilesOf(all)
  const indexText = serializeIndex(launch, files)
  const problems = scheduleProblems(parseIndex(indexText), files)
  if (problems.length > 0) {
    for (const p of problems) console.error(`PROBLEM ${p}`)
    return 1
  }
  mkdirSync(outDir, { recursive: true })
  const touched = new Set(dates.map((d) => d.slice(0, 7)))
  for (const file of files) {
    if (touched.has(file.month)) writeFileSync(join(outDir, monthFileName(file.month)), serializeMonth(file))
  }
  writeFileSync(join(outDir, 'index.json'), indexText)
  console.error(`${stamp()} wrote ${touched.size} month file(s) and index.json: ${all.length} days ${all[0]!.date} to ${all[all.length - 1]!.date}; ${fallbacks.length} fallback(s)`)
  return 0
}

/** report.json and report.md: per day the attempts and the gate that rejected each failed seed, plus totals. */
function writeReport(finals: Map<string, DayBuild>, fallbacks: string[], errors: string[]): void {
  const rows = dates.map((date) => {
    const plan = plans.get(date)!
    const built = finals.get(date)
    const day = built?.ok ? built.day : undefined
    return {
      date, n: plan.n, planned: `${plan.size}x${plan.size} ${plan.tier} ${plan.theme}`,
      made: day ? `${day.size}x${day.size}` : 'none', attempts: day?.attempts ?? null, fallback: fallbacks.includes(date),
      rejected: built?.rejected ?? [], seconds: built ? Math.round(built.ms / 100) / 10 : null,
    }
  })
  const gates = new Map<string, number>()
  for (const row of rows) for (const r of row.rejected) for (const g of r.gate.split(',')) gates.set(g, (gates.get(g) ?? 0) + 1)
  const summary = {
    start, days: dates.length, launch, fallbacks: fallbacks.length, daysWithRetries: rows.filter((r) => r.rejected.length > 0).length,
    rejectedSeeds: rows.reduce((n, r) => n + r.rejected.length, 0), rejectedByGate: Object.fromEntries([...gates].sort()), errors,
  }
  mkdirSync(reportDir, { recursive: true })
  writeFileSync(join(reportDir, 'report.json'), `${JSON.stringify({ summary, days: rows }, null, 1)}\n`)
  const lines = ['# Schedule report', '', `${summary.days} days from ${start} (launch ${launch}): ${summary.fallbacks} fallbacks, ${summary.daysWithRetries} days needed more than one seed, ${summary.rejectedSeeds} rejected seeds.`, '']
  lines.push(`Rejected by gate: ${[...gates].map(([g, n]) => `${g} ${n}`).join(', ') || 'none'}.`, '')
  if (errors.length > 0) lines.push('## Errors', '', ...errors.map((e) => `- ${e}`), '')
  lines.push('| n | date | planned | made | attempts | s | rejected seeds (gate) |', '|---:|---|---|---|---:|---:|---|')
  for (const r of rows) {
    lines.push(`| ${r.n} | ${r.date} | ${r.planned} | ${r.made}${r.fallback ? ' (fallback)' : ''} | ${r.attempts ?? '-'} | ${r.seconds ?? '-'} | ${r.rejected.map((x) => `${x.seed} (${x.gate})`).join(', ') || '-'} |`)
  }
  writeFileSync(join(reportDir, 'report.md'), `${lines.join('\n')}\n`)
}

process.exit(await main())
