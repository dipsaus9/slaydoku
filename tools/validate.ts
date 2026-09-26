// Generation sweep: `bun run validate:generation [--seeds N] [--start 10000] [--sizes 6,7,9,12,16] [--tiers all] [--themes all]
//   [--jobs J] [--budget ms] [--min-success 25] [--strict] [--verbose] [--out dir]`.
// Builds N puzzles per (size, tier, theme) on FRESH seeds (start..start+N-1, never below 10000: the committed pack uses seeds under 700)
// and enforces, per puzzle: generation inside the budget, unique solution, human-solvable at its tier, hint and clue audit, noun audit,
// score v2 inside the tier band, the same bytes on a second run, and every card of every suspect on the rendered card grid.
// Writes report.json and report.md to --out (default reports/generation-sweep, git-ignored): success rate, seconds per puzzle, yield per hour
// and duplicate rate per cell, and flags cells under --min-success (a percentage, default 25; only enforced for cells of 10 seeds or more).
// A rejection by a quality filter (score band, clue count, variety, clue, hint and noun audit) only lowers the success rate; a defect (the
// generator hands over a puzzle that is not unique, not human-solvable or not of its tier), a run that differs, a card missing on the screen
// or a cell under the minimum fails the sweep.
// `--strict` also fails on any rejection. Exit code: 0 ok, 1 gate failure, 2 usage.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PACK_BUDGET_MS, PACK_SIZES, boardKey, packFile, parsePackFile, puzzleKey } from '../src/content/packs/index.ts'
import {
  DEFAULT_MIN_SUCCESS, MIN_SEEDS_FOR_RATE, SWEEP_SEED_START, buildReport, cellProblems, renderMarkdown, rowOf, sweepCell,
} from '../src/content/packs/sweep.ts'
import type { CellResult, KnownKeys } from '../src/content/packs/sweep.ts'
import { SCENE_THEMES } from '../src/content/themes/index.ts'
import type { ThemeId } from '../src/content/themes/index.ts'
import { TIERS } from '../src/engine/generator/tiers/index.ts'
import type { TierId } from '../src/engine/generator/tiers/index.ts'

const here = dirname(fileURLToPath(import.meta.url))
const USAGE =
  'Usage: bun run validate:generation [--seeds N] [--start 10000] [--sizes 6,7,9,12,16] [--tiers all|very-easy,...] [--themes all|home,...]\n' +
  '         [--jobs J] [--budget ms] [--min-success percent] [--strict] [--verbose] [--out dir]'

const values = new Map<string, string>()
const flags = new Set<string>()
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i] as string
  const bool = /^--(strict|verbose|worker)$/.exec(arg)
  if (bool) {
    flags.add(bool[1] as string)
    continue
  }
  const match = /^--(seeds|start|sizes|tiers|themes|jobs|budget|min-success|out)(?:=(.*))?$/.exec(arg)
  const value = match ? (match[2] ?? argv[++i]) : undefined
  if (!match || value === undefined) usage(`Bad argument "${arg}".`)
  values.set((match as RegExpExecArray)[1] as string, value as string)
}

function usage(message: string): never {
  console.error(`${message}\n${USAGE}`)
  process.exit(2)
}

const list = <T extends string>(name: string, all: readonly T[]): T[] => {
  const raw = values.get(name)
  if (raw === undefined || raw === 'all') return [...all]
  const picked = raw.split(',') as T[]
  for (const p of picked) if (!all.includes(p)) usage(`Unknown ${name} value "${p}" (known: ${all.join(', ')}).`)
  return picked
}
const int = (name: string, fallback: number, min = 1): number => {
  const raw = values.get(name)
  if (raw === undefined) return fallback
  const n = Number(raw)
  if (!Number.isInteger(n) || n < min) usage(`--${name} must be an integer of at least ${min}.`)
  return n
}

const sizes = list('sizes', PACK_SIZES.map(String)).map(Number)
const tiers = list('tiers', TIERS.map((t) => t.id)) as TierId[]
const themes = list('themes', SCENE_THEMES.map((t) => t.id)) as ThemeId[]
const seeds = int('seeds', 20)
const start = int('start', SWEEP_SEED_START, SWEEP_SEED_START)
const budgetMs = int('budget', PACK_BUDGET_MS)
const jobs = int('jobs', Math.max(1, availableParallelism() - 2))
const minSuccessPercent = Number(values.get('min-success') ?? DEFAULT_MIN_SUCCESS * 100)
if (!Number.isFinite(minSuccessPercent) || minSuccessPercent < 0 || minSuccessPercent > 100) usage('--min-success is a percentage from 0 to 100.')
const minSuccess = minSuccessPercent / 100
const strict = flags.has('strict')
const outDir = resolve(values.get('out') ?? join(here, '../reports/generation-sweep'))
const started = performance.now()
const stamp = () => `[${((performance.now() - started) / 1000).toFixed(0).padStart(5)}s]`

/** Board and puzzle keys of the committed pack for one (size, tier, theme). */
function packKeys(size: number, tier: TierId, theme: ThemeId): KnownKeys {
  const boards = new Set<string>()
  const puzzles = new Set<string>()
  const file = join(here, '../src/content/packs', packFile(size, tier))
  if (existsSync(file)) {
    for (const entry of parsePackFile(readFileSync(file, 'utf8'), file).puzzles) {
      if (entry.theme !== theme) continue
      boards.add(boardKey(entry.puzzle))
      puzzles.add(puzzleKey(entry.puzzle))
    }
  }
  return { boards, puzzles }
}

/** Worker: one cell in this process; prints `RESULT <json>` on stdout, progress on stderr. */
function worker(): void {
  const [size, tier, theme] = [sizes[0] as number, tiers[0] as TierId, themes[0] as ThemeId]
  const result = sweepCell(size, tier, theme, {
    start, seeds, budgetMs, known: packKeys(size, tier, theme), progress: flags.has('verbose') ? (line) => console.error(line) : undefined,
  })
  console.log(`RESULT ${JSON.stringify(result)}`)
}

/** Runs the cell in a child process; resolves to its result, or to a failure result when the child died. */
function child(size: number, tier: TierId, theme: ThemeId): Promise<CellResult> {
  return new Promise((done) => {
    const args = [
      join(here, 'validate.ts'), '--worker', '--sizes', String(size), '--tiers', tier, '--themes', theme, '--seeds', String(seeds),
      '--start', String(start), '--budget', String(budgetMs), ...(flags.has('verbose') ? ['--verbose'] : []),
    ]
    const proc = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    proc.stdout.on('data', (chunk: Buffer) => (out += chunk.toString()))
    proc.stderr.on('data', (chunk: Buffer) => {
      for (const line of chunk.toString().split('\n')) if (line.trim()) console.error(`${stamp()} ${line}`)
    })
    proc.on('close', (code) => {
      const line = out.split('\n').find((l) => l.startsWith('RESULT '))
      if (line) return done(JSON.parse(line.slice('RESULT '.length)) as CellResult)
      done({
        size, tier, theme, start, seeds, budgetMs, accepted: 0, usable: 0, rejected: {}, duplicateBoards: 0, duplicatePuzzles: 0, packBoardClashes: 0,
        packPuzzleClashes: 0, failures: [`${size}-${tier}-${theme}: the worker died with exit code ${code} and no result`], generationMs: 0, maxMs: 0, verifyMs: 0,
      })
    })
  })
}

async function main(): Promise<number> {
  const cells = sizes.flatMap((size) => tiers.flatMap((tier) => themes.map((theme) => ({ size, tier, theme }))))
  // Slowest first (big boards, hard tiers), so the long jobs do not start last.
  const weight = (c: { size: number; tier: TierId }) => c.size * (1 + TIERS.findIndex((t) => t.id === c.tier))
  const ordered = [...cells].sort((a, b) => weight(b) - weight(a))
  console.error(`${stamp()} ${cells.length} cells x ${seeds} seeds from ${start}, ${jobs} parallel jobs, budget ${budgetMs / 1000} s per puzzle`)
  const results: CellResult[] = []
  let next = 0
  const run = async () => {
    while (next < ordered.length) {
      const { size, tier, theme } = ordered[next++] as (typeof ordered)[number]
      const result = await child(size, tier, theme)
      results.push(result)
      const row = rowOf(result, minSuccess)
      console.error(
        `${stamp()} ${size}-${tier}-${theme}: ${row.accepted}/${row.seeds} ok (${(row.successRate * 100).toFixed(0)}%), ${row.secondsPerSeed} s per seed` +
          `${row.failures.length ? `, ${row.failures.length} FAILURES` : ''}${row.lowSuccess ? ', LOW' : ''} [${results.length}/${cells.length}]`,
      )
    }
  }
  await Promise.all(Array.from({ length: Math.min(jobs, ordered.length) }, run))

  const report = buildReport({ sizes, tiers, themes, seeds, start, budgetMs, minSuccess, strict }, results)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  writeFileSync(join(outDir, 'report.md'), renderMarkdown(report))
  const problems = report.cells.flatMap((c) => cellProblems(c, strict))
  const { summary } = report
  console.error(
    `${stamp()} ${summary.accepted}/${summary.seeds} seeds passed every gate (${(summary.successRate * 100).toFixed(0)}%), ${summary.usable} usable, ` +
      `${summary.lowCells} cells under ${minSuccessPercent}% (enforced from ${MIN_SEEDS_FOR_RATE} seeds), report in ${outDir}`,
  )
  for (const p of problems) console.error(`PROBLEM ${p}`)
  console.error(problems.length === 0 ? 'validate:generation: all gates passed' : `validate:generation: ${problems.length} gate failures`)
  return problems.length === 0 ? 0 : 1
}

if (flags.has('worker')) worker()
else process.exit(await main())
