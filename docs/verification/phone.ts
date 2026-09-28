// Phone and iPad verification, one entry point (SLAY-1.10): `bun run verify:phone`.
// Builds the production app, serves it with `vite preview` and runs every driver of this folder against it:
//   drive.ts    the daily flow on the dev-only date override (2026-11-21 = puzzle #4; daily.ts): the About page, the start screen in all its states
//               (new, continue, solved, before the launch, after the last day) with the live countdown and local time, the midnight
//               rollover notice with a shifted clock, clean URLs (/, /play, old /level/... and #/ links), the "How it works" card on the
//               first Play, and a full play-through (place, note, cross, hint, wrong board, solve, result, no replay)
//   zoom.ts     board zoom: button, two-finger pinch and pan, one-finger play on a zoomed board
//   legend.ts   the Legend card and the flash of the squares on the board
//   screens.ts  rendered-screen check: every card text of every person and every drawn object kind's legend row, on the
//               real page, for a sample of 10 scheduled days across the board sizes
//   stats.ts    statistics: two consecutive days solved through the UI on the date override, Streak 2 · Best 2, the Stats card (numbers,
//               times per difficulty, keyboard, closing), a streak alive the day after and gone after a missed day, Reset with confirmation
//   share.ts    the share card (SLAY-1.7): a scheduled day solved through the UI, the card and the emoji text on the start screen, Share with
//               files (PNG 1200x630 and 1080x1080 checked on a canvas, brand pixels present), with text only, a closed and a failing share
//               sheet, Copy text (clipboard API and textarea fallback) and Download image without a share sheet, the keyboard, offline
//   offline.ts  offline reload (the month chunk of today's puzzle comes from the precache), playing offline, coming back online and the
//               update notice after a new deploy
// at 360x640, 390x844, 430x932 and 844x390 (phone) and 1024x768 and 768x1024 (iPad), all with mobile and touch emulation in
// headless Chrome. Screenshots and logs go OUTSIDE the repo; the summary at the end lists every suite per viewport.
//
// Usage (from the repo root): bun run verify:phone
// Env: OUT (folder for screenshots, logs and summary; default <tmp>/slaydoku-phone-verification), VIEWPORTS (default the six
// above), SUITES (comma list of drive,zoom,legend,screens,stats,share,offline; default all), POOL (how many driver runs go at the same time,
// default 5, each with its own Chrome; 1 runs everything one after the other), SKIP_BUILD=1 (reuse dist/), CHROME (path to Chrome).
// Exits non-zero when a check fails or a driver crashes.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HERE = import.meta.dir
const ROOT = join(HERE, '../..')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = process.env.OUT ?? join(tmpdir(), 'slaydoku-phone-verification')
const VIEWPORTS = (process.env.VIEWPORTS ?? '360x640,390x844,430x932,844x390,1024x768,768x1024').split(',')
const ALL_SUITES = ['drive', 'zoom', 'legend', 'screens', 'stats', 'share', 'offline'] as const
type Suite = (typeof ALL_SUITES)[number]
const SUITES = (process.env.SUITES ?? ALL_SUITES.join(',')).split(',') as Suite[]
const POOL = Number(process.env.POOL ?? 5)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}; set CHROME to the path of a Chrome or Chromium binary.`)
  process.exit(2)
}
for (const s of SUITES) if (!ALL_SUITES.includes(s)) throw new Error(`unknown suite ${s}`)
mkdirSync(OUT, { recursive: true })
// Only the folders this script writes are cleared, never OUT itself.
for (const suite of ALL_SUITES) for (const v of VIEWPORTS) rmSync(join(OUT, `${suite}-${v}`), { recursive: true, force: true })

/** A port nobody listens on right now (a fixed port collides with other tools on a developer machine). */
async function freePort(): Promise<number> {
  const server = Bun.listen({ hostname: '127.0.0.1', port: 0, socket: { data() {} } })
  const port = server.port
  server.stop(true)
  return port
}

async function exec(cmd: string[], env: Record<string, string> = {}, logFile?: string): Promise<{ code: number; out: string }> {
  const proc = Bun.spawn(cmd, { cwd: ROOT, env: { ...process.env, ...env }, stdout: 'pipe', stderr: 'pipe' })
  const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  const code = await proc.exited
  if (logFile) writeFileSync(logFile, out + (err ? `\n--- stderr ---\n${err}` : ''))
  return { code, out: out + err }
}

// --- build and serve -------------------------------------------------------------------------
if (!process.env.SKIP_BUILD) {
  console.log('building the production app (bun run build) ...')
  const built = await exec(['bun', 'run', 'build'], {}, join(OUT, 'build.log'))
  if (built.code !== 0) {
    console.error(built.out.slice(-2000))
    process.exit(1)
  }
}
const previewPort = await freePort()
const BASE = `http://localhost:${previewPort}/`
const preview = spawn('bunx', ['vite', 'preview', '--port', String(previewPort), '--strictPort', '--host', 'localhost'], { cwd: ROOT, stdio: 'ignore' })
let up = false
for (let i = 0; i < 60 && !up; i++) {
  try {
    up = (await fetch(BASE)).ok
  } catch {}
  if (!up) await sleep(250)
}
if (!up) {
  preview.kill()
  console.error(`vite preview did not answer on ${BASE}`)
  process.exit(1)
}
console.log(`serving dist/ on ${BASE}; screenshots and logs in ${OUT}`)

// --- jobs ------------------------------------------------------------------------------------
// One job per suite and viewport, each with its own Chrome and its own folder under OUT (<suite>-<viewport>/).
interface Result { suite: Suite; viewport: string; checks: number; failures: number; crashed: boolean; log: string; dir: string; ms: number }
const results: Result[] = []

async function job(suite: Suite, viewport: string): Promise<void> {
  const cdp = await freePort()
  const dir = join(OUT, `${suite}-${viewport}`)
  mkdirSync(dir, { recursive: true })
  const log = join(dir, `${suite}.log`)
  const env: Record<string, string> = { BASE, CDP_PORT: String(cdp), OUT: dir, CHROME, VIEWPORTS: viewport, VIEWPORT: viewport }
  if (suite === 'offline') env.PORT = String(await freePort())
  const started = Date.now()
  const { code, out } = await exec(['bun', join(HERE, `${suite}.ts`)], env, log)
  if (code !== 0) await exec(['pkill', '-f', `remote-debugging-port=${cdp}`]) // a crashed driver leaves its Chrome behind
  const total = /(\d+) checks, (\d+) failures/.exec(out)
  const ms = Date.now() - started
  const failures = total ? Number(total[2]) : 0
  const crashed = !total || (code !== 0 && failures === 0)
  console.log(`${crashed || failures > 0 ? 'FAIL' : 'ok  '} ${suite} ${viewport} (${Math.round(ms / 1000)}s): ${total ? `${total[1]} checks, ${failures} failures` : 'no result line, driver crashed'}`)
  results.push({ suite, viewport, checks: total ? Number(total[1]) : 0, failures, crashed, log, dir, ms })
}

// The offline runs build the site twice, and the second build rewrites a source file for a moment: they go one after the other.
let offlineTurn: Promise<unknown> = Promise.resolve()
const queue: (() => Promise<void>)[] = []
// Longest first, so the pool ends together.
for (const suite of ['drive', 'legend', 'screens', 'stats', 'share', 'zoom'] as const)
  if (SUITES.includes(suite)) for (const v of VIEWPORTS) queue.push(() => job(suite, v))
if (SUITES.includes('offline'))
  for (const v of VIEWPORTS)
    queue.push(() => {
      const turn = offlineTurn.then(() => job('offline', v))
      offlineTurn = turn.catch(() => {})
      return turn
    })
try {
  await Promise.all(Array.from({ length: Math.max(1, POOL) }, async () => { for (let run = queue.shift(); run; run = queue.shift()) await run() }))
} finally {
  preview.kill()
}

// --- summary ---------------------------------------------------------------------------------
/** Counts the PASS and FAIL rows of a driver's markdown log. */
function rowsOf(file: string): { pass: number; fail: number } {
  const count = { pass: 0, fail: 0 }
  if (!existsSync(file)) return count
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const cells = line.split('|').map((c) => c.trim())
    if (cells.includes('PASS')) count.pass++
    else if (cells.includes('FAIL')) count.fail++
  }
  return count
}
const logOf: Record<string, string> = { drive: 'scenario-log.md', zoom: 'zoom-log.md', legend: 'legend-log.md', screens: 'screens-log.md', stats: 'stats-log.md', share: 'share-log.md' }
const fileOf = (r: Result) => join(r.dir, logOf[r.suite] ?? '')
/** Checks and failures of one job; offline has no markdown log, so its result line counts. */
const countOf = (r: Result) => (r.suite === 'offline' ? { pass: r.checks - r.failures, fail: r.failures } : rowsOf(fileOf(r)))

const lines = [`| Viewport | ${SUITES.join(' | ')} | Total | Failures |`, `|---|${SUITES.map(() => '---').join('|')}|---|---|`]
let grandChecks = 0
let grandFailures = 0
for (const v of VIEWPORTS) {
  const cols = SUITES.map((s) => {
    const r = results.find((x) => x.suite === s && x.viewport === v)
    return r ? countOf(r) : { pass: 0, fail: 0 }
  })
  const total = cols.reduce((n, c) => n + c.pass + c.fail, 0)
  const failed = cols.reduce((n, c) => n + c.fail, 0)
  grandChecks += total
  grandFailures += failed
  lines.push(`| ${v} | ${cols.map((c) => c.pass + c.fail).join(' | ')} | ${total} | ${failed} |`)
}
const crashed = results.filter((r) => r.crashed)
grandFailures += crashed.length
const summary = [
  `Phone verification of ${new Date().toISOString().slice(0, 10)} against ${BASE} (production build).`,
  '',
  ...lines,
  '',
  `${grandChecks} checks, ${grandFailures} failures${crashed.length ? ` (${crashed.length} driver run(s) crashed: ${crashed.map((r) => `${r.suite} ${r.viewport}`).join(', ')})` : ''}.`,
  `Logs and screenshots: ${OUT}`,
].join('\n')
writeFileSync(join(OUT, 'summary.md'), summary + '\n')
console.log('\n' + summary)
// The failing rows, so a red run says why without opening a log.
for (const r of results) {
  if (r.suite === 'offline') {
    if (r.failures > 0 || r.crashed) console.log(`FAIL [offline ${r.viewport}] see ${r.log}`)
    continue
  }
  const file = fileOf(r)
  if (!existsSync(file)) console.log(`FAIL [${r.suite} ${r.viewport}] no log, see ${r.log}`)
  else for (const line of readFileSync(file, 'utf8').split('\n')) if (line.includes('| FAIL |')) console.log(`FAIL [${r.suite}] ${line.slice(0, 300)}`)
}
process.exit(grandFailures > 0 ? 1 : 0)
