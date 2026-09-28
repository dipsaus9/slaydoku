// Offline / service worker verification driver.
// Builds the production site into $OUT/site, serves it with `vite preview`, and drives headless Chrome over the DevTools
// protocol through the whole offline story:
//   1. first visit: the worker installs, precaches the build and takes control of the page (no second load needed);
//   2. Network.emulateNetworkConditions offline (and a fetch that must fail, so the offline mode is real), then reload on
//      /, /play and /about: the start screen opens, today's puzzle (date override 2026-11-21; its month file is a lazily loaded
//      chunk, and every month chunk of the schedule is in the precache) plays and the About page shows (from the precache);
//   3. a new deploy (the start screen subtitle gets " (v2)" for one build, restored afterwards): back online, the next visit
//      keeps showing the cached build, the notice "New version available" + "Reload" appears, the reload
//      activates the new build, the old cache is gone, and localStorage (progress, board saves, a marker) is untouched.
//
// Usage (from the repo root): bun docs/verification/offline.ts
// Env: VIEWPORT (WxH of the emulated phone or iPad, default 1024x768), OUT (folder for screenshots, the built site and the log; default a temp folder outside the repo), PORT (preview
// port, default 5198), CDP_PORT (Chrome debugging port, default 9353), CHROME. Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { help } from '../../src/content/help/help.ts'
import { LOCALE_KEY } from '../../src/locale/storage.ts'
import { DATE_KEY, INDEX, PLAY_DATE, RESULTS_KEY, dayOn } from './daily.ts'

const HERE = import.meta.dir
const ROOT = join(HERE, '../..')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CDP = Number(process.env.CDP_PORT ?? 9353)
const PORT = Number(process.env.PORT ?? 5198)
const OUT = process.env.OUT ?? mkdtempSync(join(tmpdir(), 'slaydoku-offline-'))
const SITE = join(OUT, 'site')
const BASE = `http://localhost:${PORT}`
const STRINGS = join(ROOT, 'src/ui/daily/strings.ts')
const SUBTITLE = 'A new murder mystery every day'
const DAY = dayOn(PLAY_DATE)
const START = `document.querySelectorAll('.daily-card').length === 1`
mkdirSync(OUT, { recursive: true })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const failures: string[] = []
let checks = 0
const [VW, VH] = (process.env.VIEWPORT ?? '1024x768').split('x').map(Number) as [number, number]
function check(name: string, ok: boolean, detail = '') {
  checks++
  console.log(ok ? 'PASS' : 'FAIL', `${VW}x${VH}`, name, detail)
  if (!ok) failures.push(name)
}

async function run(cmd: string[], env: Record<string, string> = {}) {
  const proc = Bun.spawn(cmd, { cwd: ROOT, env: { ...process.env, ...env }, stdout: 'pipe', stderr: 'pipe' })
  const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  if ((await proc.exited) !== 0) throw new Error(`${cmd.join(' ')} failed:\n${out}\n${err}`)
  return out
}
const buildSite = () => run(['bunx', 'vite', 'build', '--outDir', SITE, '--emptyOutDir'], { VERCEL_PROJECT_PRODUCTION_URL: BASE })

// --- serve ------------------------------------------------------------------------------------
console.log('building v1 ...')
await buildSite()
const preview = spawn('bunx', ['vite', 'preview', '--outDir', SITE, '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(BASE)).ok) break
  } catch {}
  await sleep(200)
}

// --- chrome -----------------------------------------------------------------------------------
const profile = mkdtempSync(join(tmpdir(), 'chrome-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = (await (await fetch(`http://localhost:${CDP}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[]
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {}
    await sleep(200)
  }
  throw new Error('no chrome')
}
const ws = new WebSocket(await connect())
await new Promise((r) => (ws.onopen = r))
let nextId = 0
const pending = new Map<number, (v: unknown) => void>()
ws.onmessage = (m) => {
  const msg = JSON.parse(String(m.data))
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)!(msg)
}
const send = (method: string, params: object = {}) =>
  new Promise<any>((resolve) => {
    const id = ++nextId
    pending.set(id, (msg: any) => resolve(msg.result ?? msg.error))
    ws.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expression: string) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value
async function until(expression: string, ms = 10000) {
  for (let t = 0; t < ms; t += 150) {
    if (await evaluate(expression)) return true
    await sleep(150)
  }
  return false
}
async function shot(name: string) {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 })
  writeFileSync(join(OUT, `${name}.jpg`), Buffer.from(r.data, 'base64'))
}
const goto = async (path: string) => {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await send('Page.navigate', { url: `${BASE}${path}` })
}
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>
const text = (sel: string) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? ''`) as Promise<string>
const setOffline = (offline: boolean) =>
  send('Network.emulateNetworkConditions', { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
const controlled = () => evaluate('navigator.serviceWorker.controller !== null')
const cacheNames = () => evaluate('caches.keys().then(k => JSON.stringify(k))') as Promise<string>
const storageDump = () =>
  evaluate(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])))`) as Promise<string>

await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')
await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: true })
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
// Locale pinned to 'en' on every document load, before the app's own script runs (SLAY-3.6, the same fix
// drive.ts/zoom.ts/legend.ts/screens.ts/stats.ts/share.ts carry from SLAY-3.2/SLAY-4.2): without it, a browser
// whose own language is Dutch would default the app to Dutch (SLAY-3.1's locale toggle falls back to the
// browser's language) and break the English-text checks below, across every reload this file makes.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem(${JSON.stringify(LOCALE_KEY)}, 'en') } catch {}` })

try {
  // ---- 1. first visit ------------------------------------------------------------------------
  await goto(`/?date=${PLAY_DATE}`) // the dev-only date override (localhost only), copied into localStorage
  check('first visit: the start screen shows today\'s puzzle', (await until(START)) && (await text('[data-puzzle-number]')) === `Puzzle #${DAY.n}`)
  const chunks = (await evaluate(`performance.getEntriesByType('resource').map(e => new URL(e.name).pathname).filter(p => /\\/assets\\/\\d{4}-\\d{2}-/.test(p)).join(',')`)) as string
  check('first visit: the page itself fetched only the month file that holds today (lazy chunk)', chunks.split(',').filter(Boolean).length === 1 && chunks.includes('/assets/2026-09-'), chunks || 'none')
  check('first visit: no update notice on a fresh install', (await count('[data-update-notice]')) === 0)
  check('the worker takes control of the page without a second load', await until('navigator.serviceWorker.controller !== null', 15000))
  const sw = (await evaluate(`fetch('/sw.js').then(r => r.text().then(t => JSON.stringify({ status: r.status, type: r.headers.get('content-type'), size: t.length })))`)) as string
  check('/sw.js is served as JavaScript', /"status":200/.test(sw) && /javascript/.test(sw), sw)
  const cachesV1 = JSON.parse(await cacheNames()) as string[]
  check('exactly one slaydoku cache holds the build', cachesV1.length === 1 && cachesV1[0]!.startsWith('slaydoku-precache-'), cachesV1.join(','))
  const cached = (await evaluate(`caches.open(${JSON.stringify(cachesV1[0])}).then(c => c.keys()).then(k => k.map(r => new URL(r.url).pathname))`)) as string[]
  check('the precache holds index.html and the manifest', cached.includes('/index.html') && cached.includes('/manifest.webmanifest'), `${cached.length} files`)
  const missingMonths = INDEX.months.filter((m) => !cached.some((p) => p.startsWith(`/assets/${m.month}-`) && p.endsWith('.js')))
  check(`the precache holds the chunk of every scheduled month (${INDEX.months.length}), so any day works offline`, missingMonths.length === 0, missingMonths.map((m) => m.month).join(',') || INDEX.months.map((m) => m.month).join(' '))
  check('the subtitle is the v1 one', (await text('.level-subtitle, [class*=subtitle]')).includes(SUBTITLE) || (await evaluate(`document.body.textContent.includes(${JSON.stringify(SUBTITLE)})`)) === true)

  // Saves the update must not touch: the result of an earlier day, the how-it-works card marked as seen (or it covers the puzzle), and a marker.
  const earlier = dayOn('2026-11-20')
  const results = { version: 1, results: { [earlier.n]: { n: earlier.n, date: earlier.date, fp: earlier.fp, elapsedMs: 60000, hints: 0, wrongChecks: 0, murdererId: 'x' } } }
  await evaluate(`localStorage.setItem(${JSON.stringify(RESULTS_KEY)}, ${JSON.stringify(JSON.stringify(results))}); localStorage.setItem('slaydoku:help-seen', '{"version":${help.version}}'); localStorage.setItem('slaydoku:offline-test-marker', 'keep me')`)
  check('the date override sits in localStorage for the later page loads', (await evaluate(`localStorage.getItem(${JSON.stringify(DATE_KEY)})`)) === PLAY_DATE)

  // ---- 2. offline ----------------------------------------------------------------------------
  await setOffline(true)
  const outside = (await evaluate(`fetch('/robots.txt', { cache: 'no-store' }).then(() => 'reachable', () => 'blocked')`)) as string
  check('offline mode is real: a file outside the build cannot be fetched', outside === 'blocked', outside)

  await goto('/')
  check('offline reload on /: the start screen opens with today\'s puzzle', (await until(START)) && (await text('[data-puzzle-number]')) === `Puzzle #${DAY.n}` && (await count('[data-action]')) === 1, await text('[data-puzzle-number]'))
  check('offline / has a live countdown', (await until(`/^\\d\\d:\\d\\d:\\d\\d$/.test(document.querySelector('[data-countdown] time')?.textContent ?? '')`)) === true)
  await evaluate("document.querySelector('[data-stats-open]')?.click()")
  check('offline: the streak line shows and the Stats button opens the card (no network needed)', /^Streak \d+ · Best \d+$/.test(await text('[data-stats-summary]')) && (await until("document.querySelector('.stats-panel [data-stat=played]') !== null")) === true, await text('[data-stats-summary]'))
  await evaluate("document.querySelector('.stats-panel [data-action=close]')?.click()")
  await sleep(500)
  await shot('offline-01-start')

  await goto('/play')
  check('offline reload on /play: the puzzle opens (its month chunk comes from the precache)', await until(`document.querySelectorAll('.play-board').length === 1`))
  const key = `slaydoku:game:daily-${DAY.n}`
  const before = (await evaluate(`localStorage.getItem(${JSON.stringify(key)})`)) as string | null
  const cellCount = await count('[data-cell]')
  check('offline puzzle draws its board with cells', cellCount > 0, `${cellCount} cells`)
  // Play: place the selected person on a cell with a long press (touch), like drive.ts.
  const rect = (await evaluate(`(() => { const e = document.querySelector('[data-cell=r6c6]'); e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)) as { x: number; y: number }
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rect.x, y: rect.y, id: 1 }] })
  await sleep(700)
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await sleep(500)
  const after = (await evaluate(`localStorage.getItem(${JSON.stringify(key)})`)) as string | null
  check('offline puzzle is playable: a placement is saved', after !== null && after !== before, `${(after ?? '').length} bytes saved`)
  await shot('offline-02-play')

  await goto('/nonsense/path')
  check('offline unknown path falls back to the app (start screen at /)', (await until(START)) && (await evaluate('location.pathname')) === '/')
  await goto('/level/demo')
  check('offline old /level/demo path goes to / too', (await until(START)) && (await evaluate('location.pathname')) === '/')

  // The About page is a clean URL like any other: the cached shell answers it, and the link on the list opens it offline.
  await goto('/about')
  check('offline reload on /about: the About page opens', await until(`document.querySelector('.about') !== null`))
  check('offline /about has the credit and the privacy line', (await evaluate(`document.body.textContent.includes('Inspired by Murdoku by Manuel Garand') && document.body.textContent.includes('no accounts, no tracking')`)) === true)
  await shot('offline-03-about')
  await goto('/')
  await until(START)
  await evaluate(`document.querySelector('a.daily__about').click()`)
  check('offline: the About link on the start screen opens the About page', (await until(`document.querySelector('.about') !== null`)) && (await evaluate('location.pathname')) === '/about')

  // ---- 3. a new deploy ------------------------------------------------------------------------
  await setOffline(false)
  await goto('/play')
  check('back online: the board played offline is still there', (await until(`document.querySelectorAll('.play-board').length === 1`)) && (await until(`document.querySelectorAll('[data-person]').length >= 1`)), `${await count('[data-person]')} placed`)
  await goto('/')
  await until(START)
  const storageBefore = await storageDump()
  const original = readFileSync(STRINGS, 'utf8')
  console.log('building v2 (subtitle changed) ...')
  try {
    if (!original.includes(SUBTITLE)) throw new Error('subtitle not found in strings.ts')
    writeFileSync(STRINGS, original.replace(SUBTITLE, `${SUBTITLE} (v2)`))
    await buildSite()
  } finally {
    writeFileSync(STRINGS, original)
  }

  // "The next visit": a page load. The controlled page still shows the cached v1 while the browser checks sw.js.
  await goto('/')
  check('the next visit still shows the cached v1 (no silent swap)', (await until(START)) && (await evaluate(`document.body.textContent.includes(${JSON.stringify(SUBTITLE)}) && !document.body.textContent.includes('(v2)')`)) === true)
  check('the update notice appears in English', await until(`document.querySelector('[data-update-notice]') !== null`, 15000), await text('[data-update-notice]'))
  check('notice text and button', (await text('.update-notice__text')) === 'New version available' && (await text('.update-notice__button')) === 'Reload')
  const notice = (await evaluate(`(() => { const r = document.querySelector('[data-update-notice]').getBoundingClientRect(); return { top: r.top, height: r.height, fits: r.left >= 0 && r.right <= innerWidth } })()`)) as { top: number; height: number; fits: boolean }
  check('the notice is on screen and small', notice.top >= 0 && notice.height < 80 && notice.fits, JSON.stringify(notice))
  await shot('update-01-notice')
  const waitingCaches = JSON.parse(await cacheNames()) as string[]
  check('the new build waits in its own cache next to the old one', waitingCaches.length === 2, waitingCaches.join(','))
  check('localStorage is untouched while the update waits', (await storageDump()) === storageBefore)

  await evaluate(`document.querySelector('.update-notice__button').click()`)
  check('"Reload" activates the new build: the page reloads into v2', await until(`document.body.textContent.includes('(v2)')`, 15000))
  check('the notice is gone after the reload', await until(`document.querySelector('[data-update-notice]') === null`) )
  await shot('update-02-after-reload')
  const cachesV2 = JSON.parse(await cacheNames()) as string[]
  check('the old cache is deleted, one cache is left and it is new', cachesV2.length === 1 && cachesV2[0] !== cachesV1[0], cachesV2.join(','))
  check('the reloaded page is controlled by the new worker', (await controlled()) === true)
  check('localStorage (results, board saves, date override, marker) is identical after the update', (await storageDump()) === storageBefore)

  await setOffline(true)
  await goto('/play')
  check('the new build works offline too', (await until(`document.querySelectorAll('.play-board').length === 1`)) && (await evaluate(`localStorage.getItem('slaydoku:offline-test-marker')`)) === 'keep me')
  await setOffline(false)
} catch (error) {
  failures.push(`crashed: ${error instanceof Error ? error.message : String(error)}`)
  console.error(error)
} finally {
  chrome.kill()
  preview.kill()
}

const log = failures.length === 0 ? 'all checks passed' : `FAILED: ${failures.join('; ')}`
console.log(log, `\nscreenshots and site in ${OUT}`)
console.log(`${checks} checks, ${failures.length} failures`)
process.exit(failures.length === 0 ? 0 : 1)
