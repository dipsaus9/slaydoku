// Generates the committed puzzle packs: `bun run pack [--sizes 6,7,9,12,16] [--tiers all] [--themes all] [--count N] [--jobs J] [--out dir]`.
// One file per (size, tier) under src/content/packs plus index.json (rebuilt from every pack file on disk).
// `--count` is the number of puzzles per (size, tier, theme). Same arguments, same bytes.
// `bun run pack --verify [--jobs J]` re-verifies every committed puzzle (solver, human solver, gates) and the index (including each puzzle's fp); exit 1 on any problem.
// `bun run pack --index` only rewrites index.json from the pack files on disk (no puzzle is generated or changed).
// Exit code: 0 ok, 1 generation or verification failed, 2 usage.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TIERS } from '../src/engine/generator/tiers/index.ts'
import type { TierId } from '../src/engine/generator/tiers/index.ts'
import {
  PACK_FORMAT, PACK_SIZES, buildCell, entryProblems, packFile, packSetProblems, parseIndex, parsePackFile, serializeIndex, serializePack, sortPackFiles,
} from '../src/content/packs/index.ts'
import type { PackEntry, PackFile } from '../src/content/packs/index.ts'
import { SCENE_THEMES } from '../src/content/themes/index.ts'
import type { ThemeId } from '../src/content/themes/index.ts'

const here = dirname(fileURLToPath(import.meta.url))
const USAGE =
  'Usage: bun run pack [--sizes 6,7,9,12,16] [--tiers all|very-easy,easy,...] [--themes all|home,office,...] [--count N] [--jobs J] [--out dir]\n' +
  '       bun run pack --verify [--jobs J] [--out dir]' +
  '\n       bun run pack --index [--out dir]'

const values = new Map<string, string>()
const flags = new Set<string>()
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i] as string
  const bool = /^--(verify|no-index|index)$/.exec(arg)
  if (bool) {
    flags.add(bool[1] as string)
    continue
  }
  const match = /^--(sizes|tiers|themes|count|jobs|out)(?:=(.*))?$/.exec(arg)
  const value = match ? (match[2] ?? argv[++i]) : undefined
  if (!match || value === undefined) usage(`Bad argument "${arg}".`)
  values.set((match as RegExpExecArray)[1] as string, value as string)
}

function usage(message: string): never {
  console.error(`${message}\n${USAGE}`)
  process.exit(2)
}

const list = <T extends string>(name: string, all: readonly T[], fallback: readonly T[] = all): T[] => {
  const raw = values.get(name)
  if (raw === undefined) return [...fallback]
  if (raw === 'all') return [...all]
  const picked = raw.split(',') as T[]
  for (const p of picked) if (!all.includes(p)) usage(`Unknown ${name} value "${p}" (known: ${all.join(', ')}).`)
  return picked
}
const int = (name: string, fallback: number): number => {
  const raw = values.get(name)
  if (raw === undefined) return fallback
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1) usage(`--${name} must be a positive integer.`)
  return n
}

const outDir = resolve(values.get('out') ?? join(here, '../src/content/packs'))
const jobs = int('jobs', Math.max(1, availableParallelism() - 2))
const sizes = list('sizes', PACK_SIZES.map(String)).map(Number)
for (const s of sizes) if (!(PACK_SIZES as readonly number[]).includes(s)) usage(`Unknown size ${s} (known: ${PACK_SIZES.join(', ')}).`)
const tiers = list('tiers', TIERS.map((t) => t.id)) as TierId[]
const themes = list('themes', SCENE_THEMES.map((t) => t.id)) as ThemeId[]
const count = int('count', 1)
const started = performance.now()
const stamp = () => `[${((performance.now() - started) / 1000).toFixed(0).padStart(4)}s]`

/** Runs `tasks` with at most `limit` in flight; resolves to the exit codes. */
async function pool<T>(items: readonly T[], limit: number, run: (item: T) => Promise<number>): Promise<number[]> {
  const codes: number[] = []
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++] as T
      codes.push(await run(item))
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return codes
}

/** Re-runs this script in a child process for one job, prefixing its output; resolves to its exit code. */
function child(label: string, args: string[]): Promise<number> {
  return new Promise((done) => {
    const proc = spawn(process.execPath, [join(here, 'pack.ts'), ...args, '--out', outDir], { stdio: ['ignore', 'pipe', 'pipe'] })
    const prefix = (chunk: Buffer) => {
      for (const line of chunk.toString().split('\n')) if (line.trim()) console.error(`${stamp()} ${label} ${line}`)
    }
    proc.stdout.on('data', prefix)
    proc.stderr.on('data', prefix)
    proc.on('close', (code) => done(code ?? 1))
  })
}

const packFiles = (): string[] =>
  readdirSync(outDir).filter((f) => /^\d+-[a-z-]+\.json$/.test(f)).sort()

function loadAll(): { files: PackFile[]; index: ReturnType<typeof parseIndex> | null } {
  const files = sortPackFiles(packFiles().map((f) => parsePackFile(readFileSync(join(outDir, f), 'utf8'), f)))
  const indexPath = join(outDir, 'index.json')
  return { files, index: existsSync(indexPath) ? parseIndex(readFileSync(indexPath, 'utf8')) : null }
}

function writeIndex(): number {
  const { files } = loadAll()
  const entries = files.flatMap((f) => f.puzzles)
  const text = serializeIndex(entries)
  writeFileSync(join(outDir, 'index.json'), text)
  const problems = packSetProblems(files, parseIndex(text))
  for (const p of problems) console.error(`PROBLEM ${p}`)
  const bytes = files.reduce((sum, f) => sum + statSync(join(outDir, packFile(f.size, f.tier))).size, 0) + Buffer.byteLength(text)
  console.error(`${stamp()} index.json: ${entries.length} puzzles in ${files.length} files, ${(bytes / 1024).toFixed(0)} KiB total`)
  return problems.length === 0 ? 0 : 1
}

async function generate(): Promise<number> {
  mkdirSync(outDir, { recursive: true })
  const cells = sizes.flatMap((size) => tiers.map((tier) => ({ size, tier })))
  if (jobs > 1 && cells.length > 1) {
    // Slowest first (big boards, hard tiers), so the long jobs do not start last.
    const weight = (c: { size: number; tier: TierId }) => c.size * (1 + TIERS.findIndex((t) => t.id === c.tier))
    const ordered = [...cells].sort((a, b) => weight(b) - weight(a))
    console.error(`${stamp()} ${cells.length} pack files, ${jobs} parallel jobs, ${count} per theme (${themes.join(',')})`)
    const codes = await pool(ordered, jobs, ({ size, tier }) =>
      child(`${size}-${tier}`, ['--sizes', String(size), '--tiers', tier, '--themes', themes.join(','), '--count', String(count), '--no-index']),
    )
    if (codes.some((c) => c !== 0)) return 1
  } else {
    for (const { size, tier } of cells) {
      const seen = { boards: new Set<string>(), puzzles: new Set<string>() }
      const puzzles: PackEntry[] = []
      for (const theme of themes) puzzles.push(...buildCell(size, tier, theme, count, seen, (line) => console.error(line)))
      writeFileSync(join(outDir, packFile(size, tier)), serializePack({ format: PACK_FORMAT, size, tier, puzzles }))
      console.error(`wrote ${packFile(size, tier)} (${puzzles.length} puzzles)`)
    }
  }
  return flags.has('no-index') ? 0 : writeIndex()
}

async function verify(): Promise<number> {
  const names = packFiles()
  if (jobs > 1 && names.length > 1 && !flags.has('no-index')) {
    const codes = await pool(names, jobs, (name) => child(name, ['--verify', '--no-index', '--sizes', name.split('-')[0] as string, '--tiers', name.replace(/^\d+-|\.json$/g, '')]))
    if (codes.some((c) => c !== 0)) return 1
    const { files, index } = loadAll()
    if (!index) return console.error('index.json missing'), 1
    const problems = packSetProblems(files, index)
    for (const p of problems) console.error(`PROBLEM ${p}`)
    console.error(`${stamp()} verified ${files.reduce((n, f) => n + f.puzzles.length, 0)} puzzles in ${files.length} files: ${problems.length === 0 ? 'all good' : `${problems.length} problems`}`)
    return problems.length === 0 ? 0 : 1
  }
  let bad = 0
  for (const name of names) {
    const file = parsePackFile(readFileSync(join(outDir, name), 'utf8'), name)
    if (!sizes.includes(file.size) || !tiers.includes(file.tier)) continue
    for (const entry of file.puzzles) {
      const problems = entryProblems(entry)
      for (const p of problems) console.error(`PROBLEM ${p}`)
      bad += problems.length
    }
    console.error(`${name}: ${file.puzzles.length} puzzles${bad ? `, ${bad} problems so far` : ' ok'}`)
  }
  return bad === 0 ? 0 : 1
}

process.exit(flags.has('verify') ? await verify() : flags.has('index') ? writeIndex() : await generate())
