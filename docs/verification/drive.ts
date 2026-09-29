// Verification driver for the daily flow (SLAY-1.5; About page checks added in SLAY-1.10).
// Drives headless Chrome over the DevTools protocol with touch emulation. The app runs on the dev-only date override (2026-11-21 = puzzle
// #4, see daily.ts): it checks the start screen in its states (new day, continue, solved, before the launch, after the last day, the
// override refused on another host), the clean URLs (/, /play, /play/<n>, old /level/... paths, unknown paths, old #/ links), the
// first-visit help card on the first Play, and plays that day end to end through the real UI (notes, undo, X, placement, hints, help,
// options, reload, rotation, clear-all, a wrong board, the solve), then checks the result written for the day and that a solved day
// cannot be replayed.
//
// Usage (from the repo root):
//   bun run build && bunx vite preview --port 5197 &
//   bun docs/verification/drive.ts
// Env: VIEWPORTS (e.g. 360x640,844x390; default the two iPad sizes; phone sizes drive the phone layouts), BASE (default local preview), CDP_PORT (Chrome debugging port, default 9351: set another when two runs share a machine), TAG (file prefix, e.g. prod-), CHROME, OUT (folder for screenshots/ and the scenario log; default docs/verification/,
// set it to a folder outside the repo to leave the committed files alone).
// Writes screenshots to $OUT/screenshots/ and the scenario log to $OUT/scenario-log.md. Exits non-zero when a scenario fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deriveMurderer } from '../../src/engine/model/index.ts'
import { DAILY_STRINGS } from '../../src/ui/daily/strings.ts'
import { AFTER_DATE, DATE_KEY, PLAY_DATE, PRELAUNCH_DATE, RESULTS_KEY, dayOn, seedStorage } from './daily.ts'

const HERE = import.meta.dir
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9351)
const BASE = process.env.BASE ?? 'http://localhost:5197/'
// TAG=prod-: run against another BASE (production) without overwriting the local run's files.
const TAG = process.env.TAG ?? ''
const OUT = process.env.OUT ?? HERE
const SHOTS = join(OUT, 'screenshots')
const DAY = dayOn(PLAY_DATE)
const VIEWPORTS = (process.env.VIEWPORTS ?? '1024x768,768x1024')
  .split(',')
  .map((label) => [label, ...label.split('x').map(Number)] as [string, number, number])

mkdirSync(SHOTS, { recursive: true })
const profile = mkdtempSync(join(tmpdir(), 'chrome-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = (await (await fetch(`http://localhost:${PORT}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[]
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

async function setViewport(w: number, h: number) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
}
async function open(w: number, h: number) {
  await setViewport(w, h)
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: BASE })
  await sleep(1800)
}
async function reload() {
  await send('Page.reload')
  await sleep(1500)
}

const touch = (type: string, x: number, y: number) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] })
async function tap(x: number, y: number) { await touch('touchStart', x, y); await sleep(60); await touch('touchEnd', x, y) }
async function hold(x: number, y: number, ms = 700) { await touch('touchStart', x, y); await sleep(ms); await touch('touchEnd', x, y) }
// Scrolls the element into view first when needed (a phone page is taller than the screen); on an iPad nothing scrolls.
const rectOf = (sel: string) =>
  evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } })()`) as Promise<{ x: number; y: number; w: number; h: number } | null>
// A toolbar control (SLAY-5.1: icon-only, found by its accessible name — aria-label — since it
// has no visible text) or a header/sheet item that still shows a visible label (the header's
// settings icon and Options/Help behind it, the header's own Legend icon): whichever the element has.
// Options/Help now match twice (SLAY-9.2: a direct header copy plus the More sheet's copy, CSS
// deciding which is visible at a given width) -- prefer whichever match is actually on screen
// (offsetParent is null anywhere in a display:none subtree), falling back to the first match so a
// truly-missing tool still throws below.
const toolRect = (label: string) =>
  evaluate(`(() => { const matches = [...document.querySelectorAll('.play-tool, .play-header__more, .play-header__legend')].filter(b => (b.querySelector('.play-tool__label')?.textContent.trim() ?? b.getAttribute('aria-label')) === ${JSON.stringify(label)}); const e = matches.find(b => b.offsetParent !== null) ?? matches[0]; if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } })()`) as Promise<{ x: number; y: number; w: number; h: number } | null>
async function tool(label: string) {
  const r = await toolRect(label)
  if (!r) throw new Error('missing tool ' + label)
  await tap(r.x, r.y)
  // 400ms, not 250: a tool can sit inside a dialog that just opened (Options/Help/Legend behind
  // the header's settings icon, SLAY-5.1), and a click within the first 350ms of a dialog opening
  // is ignored (ghost-click guard, modalGuard.ts).
  await sleep(400)
}
// Redo has no button of its own (SLAY-5.1): a long press on Undo reaches it, the same gesture the
// eraser's tap-selects/long-press-clears-all pattern already uses.
async function toolHold(label: string, ms = 650) {
  const r = await toolRect(label)
  if (!r) throw new Error('missing tool ' + label)
  await hold(r.x, r.y, ms)
  await sleep(300)
}
async function tapSel(sel: string) {
  const r = await rectOf(sel)
  if (!r) throw new Error('missing ' + sel)
  await tap(r.x, r.y)
  await sleep(250)
}
const cellSel = (row: number, col: number) => `[data-cell=r${row + 1}c${col + 1}]`
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>
const path = () => evaluate('location.pathname + location.search + location.hash') as Promise<string>
const urlOf = (p: string) => new URL(p, BASE).href
// A real page load of a path (deep link), from a blank page so nothing of the app is kept.
async function load(p: string) {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(200)
  await send('Page.navigate', { url: urlOf(p) })
  await sleep(1800)
}

// --- logging ---------------------------------------------------------------------------------
interface Row { viewport: string; level: string; scenario: string; ok: boolean; detail: string; shots: string[] }
const rows: Row[] = []
let ctx = { viewport: '', level: '-' }
let pendingShots: string[] = []
async function shot(name: string) {
  if (TAG && !/^(00|01|09|10)/.test(name)) return // production run keeps only the key screenshots
  const file = `${TAG}${ctx.viewport}-${ctx.level}-${name}`
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 })
  await Bun.write(join(SHOTS, `${file}.jpg`), Buffer.from(r.data, 'base64'))
  pendingShots.push(`${file}.jpg`)
}
function check(scenario: string, ok: boolean, detail = '') {
  rows.push({ viewport: ctx.viewport, level: ctx.level, scenario, ok, detail, shots: pendingShots })
  pendingShots = []
  console.log(ok ? 'PASS' : 'FAIL', ctx.viewport, ctx.level, scenario, detail)
}

// --- puzzle data -----------------------------------------------------------------------------
interface PuzzleJson {
  people: { id: string; label: string; kind: string }[]
  solution: { personId: string; cell: { row: number; col: number } }[]
}
// The puzzle of the day under test, from the committed schedule (names are baked into the day: the screens show the same names).
const puzzle = DAY.puzzle as unknown as PuzzleJson

const selectedName = () =>
  evaluate(`(document.querySelector('.play-cards[data-victim-selected]') ? 'The victim' : document.querySelector('.polaroid[data-selected] .polaroid__name')?.textContent) ?? 'NONE'`) as Promise<string>
// A suspect's own card, scrolled into view first (the cards column can be a small touch-scrolled
// area): used only to recover the selection (see placeAll below), since a normal placement follows
// whichever card the app already auto-advanced to.
const cardRect = (label: string) =>
  evaluate(
    `(() => { const e = [...document.querySelectorAll('.polaroid')].find(b => b.querySelector('.polaroid__name')?.textContent.trim() === ${JSON.stringify(label)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`,
  ) as Promise<{ x: number; y: number } | null>

/** Long-press each suspect (as the card selection advances) onto its solution cell. The victim is
 * never itself selectable or click-placed (SLAY-9.5): its square fills in on its own once every
 * suspect has a placement (`withAutoVictim` in board.ts). That is asserted directly for a wrong
 * (swapped) board, which stays on screen; a correctly solved board navigates back to "/" on its
 * own (DailyFlow.tsx) as soon as it is solved, so the caller's own "the result shows" check is
 * what proves the victim's square filled in right there -- there is no board left here to assert
 * against by the time this function returns. */
async function placeAll(puzzle: PuzzleJson, swap = false, limit = Infinity) {
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const idByName = new Map(suspects.map((p) => [p.label, p.id]))
  const cellOf = new Map(puzzle.solution.map((s) => [s.personId, s.cell]))
  // Two swapped suspects (never the victim, which is no longer placed by this loop at all):
  // puzzle.solution[0] is the victim's own entry, so pick from the suspects' solution entries.
  const suspectIds = new Set(suspects.map((p) => p.id))
  const suspectSolution = puzzle.solution.filter((s) => suspectIds.has(s.personId))
  const swapped = swap ? [suspectSolution[0]!.personId, suspectSolution[1]!.personId] : []
  const remaining = new Set(suspects.map((p) => p.id))
  let placed = 0
  for (let i = 0; i < suspects.length && placed < limit; i++) {
    const name = (await selectedName()).trim()
    let pid = idByName.get(name)
    if (!pid || !remaining.has(pid)) {
      // The advance order still walks through the victim's own slot (order.ts keeps it last), and
      // can land there before every suspect is placed -- e.g. a suspect left unplaced by an earlier
      // undo/redo/clear-all. The victim is never itself rendered as selected, so nothing shows as
      // selected then. Recover by tapping the card of whichever suspect is still unplaced.
      const next = suspects.find((p) => remaining.has(p.id))
      if (!next) return false
      const card = await cardRect(next.label)
      if (!card) return false
      await tap(card.x, card.y)
      await sleep(250)
      pid = next.id
    }
    const target = swapped.includes(pid) ? swapped.find((s) => s !== pid)! : pid
    const cell = cellOf.get(target)!
    const r = await rectOf(cellSel(cell.row, cell.col))
    if (!r) return false
    await hold(r.x, r.y, 650)
    await sleep(200)
    remaining.delete(pid)
    placed++
  }
  await sleep(700)
  if (swap && placed === suspects.length && (await count('.play-cards[data-victim-placed]')) !== 1) return false
  return true
}

// minTool only counts .play-tool elements actually on screen: Options/Help now render twice
// (SLAY-9.2, a direct header copy plus the More sheet's copy) and CSS, not the DOM, decides which
// pair is visible at a given width -- the hidden pair sits at 0x0 and must not drag the minimum down.
const layoutProbe = () =>
  evaluate(`JSON.stringify({ iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, board: (() => { const r = document.querySelector('.play-board')?.getBoundingClientRect(); return r ? { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) } : null })(), cell: (() => { const r = document.querySelector('[data-cell]')?.getBoundingClientRect(); return r ? Math.round(Math.min(r.width, r.height)) : 0 })(), minTool: Math.round(Math.min(...[...document.querySelectorAll('.play-tool')].filter(b => b.offsetParent !== null).map(b => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height)))) })`).then((s: string) => JSON.parse(s) as { iw: number; ih: number; sw: number; sh: number; board: { l: number; r: number; t: number; b: number } | null; cell: number; minTool: number })

// --- scenarios -------------------------------------------------------------------------------
const startText = () => evaluate(`document.querySelector('.daily')?.innerText ?? ''`) as Promise<string>
const textOf = (sel: string) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent?.trim() ?? ''`) as Promise<string>
/** Storage of a fresh visitor on the given date (override key set, help card not yet seen unless asked). Locale pinned to
 * 'en' (SLAY-4.2, the same fix screens.ts already carried from SLAY-3.2): without it, a browser whose own language is
 * Dutch would default the play screen to Dutch (SLAY-3.1's locale toggle falls back to the browser's language) and
 * break every English-text assertion in this driver. */
async function resetStorage(date = PLAY_DATE, helpSeen = false) {
  await evaluate(`localStorage.clear(); ${seedStorage(date, helpSeen, 'en')}`)
}
/** Seconds on the countdown of a block, from its text "HH:MM:SS" or "Nd HH:MM:SS". */
const countdownSeconds = async (kind: string) => {
  const text = await textOf(`[data-countdown=${kind}] time`)
  const m = /^(?:(\d+)d )?(\d\d):(\d\d):(\d\d)$/.exec(text)
  return m ? Number(m[1] ?? 0) * 86400 + Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4]) : null
}

// The start screen (SLAY-1.5): number, UTC date, difficulty, size, Play, the live countdown with the local equivalent.
async function startScreen() {
  ctx.level = 'start'
  await resetStorage(PLAY_DATE, false)
  await load('')
  check('start screen: puzzle label, UTC date, difficulty and grid size', (await textOf('[data-puzzle-number]')) === DAILY_STRINGS.en.puzzleLabel(DAY.date) && (await textOf('[data-date]')) === 'Saturday 21 November 2026' && /^Difficulty: Hard$/.test(await textOf('[data-tier]')) && (await textOf('[data-size]')) === `${DAY.size} \u00d7 ${DAY.size} grid`, `${await textOf('[data-puzzle-number]')} | ${await textOf('[data-date]')} | ${await textOf('[data-tier]')} | ${await textOf('[data-size]')}`)
  const play = await rectOf('[data-action=play]')
  check('start screen: one Play button, a big touch target', (await count('[data-action]')) === 1 && (await textOf('[data-action]')) === 'Play' && !!play && play.h >= 44 && play.w >= 44, JSON.stringify(play))
  check('start screen: no puzzle board and no how-it-works card before Play', (await count('.play-board')) === 0 && (await count('.play-modal')) === 0)
  const t0 = await countdownSeconds('ends')
  check('start screen: countdown to 00:00 UTC (date override at noon UTC: about 12 hours)', t0 !== null && t0 > 11 * 3600 + 3000 && t0 <= 12 * 3600, String(t0))
  await sleep(2300)
  const t1 = await countdownSeconds('ends')
  check('start screen: the countdown ticks every second', t0 !== null && t1 !== null && t0 - t1 >= 2 && t0 - t1 <= 4, `${t0} -> ${t1}`)
  const timer = (await evaluate(`(() => { const t = document.querySelector('[data-countdown=ends] time'); return { role: t.getAttribute('role'), label: t.getAttribute('aria-label'), live: t.getAttribute('aria-live') } })()`)) as { role: string; label: string; live: string }
  check('start screen: the countdown is a timer with a spoken label, not announced every second', timer.role === 'timer' && /^11 hours.* left$/.test(timer.label) && timer.live === 'off', JSON.stringify(timer))
  const untilText = await textOf('[data-until]')
  // Reference instant: one day after PLAY_DATE at midnight UTC, same as the page's own dayEnd — must stay in the same DST season as PLAY_DATE.
  const localWant = (await evaluate(`new Date(Date.UTC(2026, 10, 22, 0, 0)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })`)) as string
  check('start screen: "Ends at 00:00 UTC (HH:MM Amsterdam time)", the same for every visitor', untilText === (localWant === '00:00' ? 'Ends at 00:00 UTC' : `Ends at 00:00 UTC (${localWant} Amsterdam time)`), `${untilText} (Amsterdam says ${localWant})`)
  const lay = await layoutProbe()
  check('start screen fits the viewport, no sideways scroll', lay.sw <= lay.iw, `scrollWidth=${lay.sw} innerWidth=${lay.iw}`)
  check('start screen keeps the About link and the Help link', (await evaluate(`document.querySelector('.daily__about')?.getAttribute('href')`)) === '/about' && (await count('.daily__help')) === 1)
  await shot('00-start-new')
  // Every other state of the start screen.
  await resetStorage(PRELAUNCH_DATE)
  await load('')
  const before = await startText()
  const launchLeft = await countdownSeconds('starts')
  check('before the launch: "Slaydoku starts on 27 September" and a countdown to launch, no Play', /Slaydoku starts on 27 September/.test(before) && (await count('[data-action]')) === 0 && launchLeft !== null && launchLeft > 10 * 86400 && launchLeft < 11 * 86400, `${JSON.stringify(before.replace(/\n+/g, ' / '))} left=${launchLeft}`)
  check('before the launch: the launch time with the Amsterdam equivalent', /^Starts at 00:00 UTC(?: \(.*Amsterdam time\))?$/.test(await textOf('[data-until]')), await textOf('[data-until]'))
  await shot('00-start-before-launch')
  await load('play')
  check('before the launch: /play goes back to /', (await path()) === '/' && (await count('.play-board')) === 0, await path())
  await resetStorage(AFTER_DATE)
  await load('')
  const after = await startText()
  check('after the last scheduled day: "New puzzles are coming soon", no Play, no countdown', /New puzzles are coming soon/.test(after) && (await count('[data-action]')) === 0 && (await count('[role=timer]')) === 0, JSON.stringify(after.replace(/\n+/g, ' / ')))
  await shot('00-start-after-schedule')
  // The override never works on another host: the same URL on ::1 (a different host name than localhost) shows the real day.
  const other = BASE.replace('localhost', '[::1]')
  let reachable = false
  try {
    reachable = (await fetch(other)).ok
  } catch {}
  if (reachable) {
    await send('Page.navigate', { url: 'about:blank' })
    await sleep(150)
    await send('Page.navigate', { url: `${other}?date=${PLAY_DATE}` })
    await sleep(1800)
    await evaluate(`localStorage.setItem(${JSON.stringify(DATE_KEY)}, ${JSON.stringify(PLAY_DATE)})`)
    await reload()
    const text = await startText()
    check('the date override is ignored on another host name (URL parameter and stored key)', !/30 September 2026/.test(text) && (await evaluate('location.hostname')) !== 'localhost', `host ${await evaluate('location.hostname')}: ${JSON.stringify(text.replace(/\n+/g, ' / ').slice(0, 160))}`)
    await evaluate('localStorage.clear()')
    await load('') // back on the real host: the next scenarios seed its storage
  } else {
    check('the date override is ignored on another host name (not reachable here: covered by clock.test.ts)', true, `${other} does not answer`)
  }
}

// Clean URLs: links, deep links, back and forward, old level and hash links, unknown paths.
async function routing() {
  ctx.level = 'routing'
  await resetStorage(PLAY_DATE, true)
  await load('')
  const playHref = await evaluate(`document.querySelector('[data-action]') !== null`)
  check('start screen has the Play button', playHref === true)
  await evaluate(`document.querySelector('[data-action]').click()`)
  await sleep(800)
  check('Play opens /play with the puzzle', (await path()) === '/play' && (await count('.play-board')) === 1, await path())
  check('the tab title names the puzzle', (await evaluate('document.title')) === `${DAILY_STRINGS.en.puzzleLabel(DAY.date)} \u2013 Slaydoku`, String(await evaluate('document.title')))
  await shot('02-clean-url-play')
  await reload()
  check('reload on /play shows the puzzle', (await path()) === '/play' && (await count('.play-board')) === 1, await path())
  await evaluate('history.back()')
  await sleep(600)
  check('back returns to the start screen', (await path()) === '/' && (await count('.daily-card')) === 1, await path())
  await evaluate('history.forward()')
  await sleep(600)
  check('forward returns to the puzzle', (await path()) === '/play' && (await count('.play-board')) === 1, await path())
  await load('play')
  check('deep link /play loads the puzzle', (await path()) === '/play' && (await count('.play-board')) === 1, await path())
  await load(`play/${DAY.n}`)
  check(`deep link /play/${DAY.n} loads the puzzle with that number`, (await path()) === `/play/${DAY.n}` && (await count('.play-board')) === 1, await path())
  await load(`play/${DAY.n + 1}`)
  check('/play/<another number> is refused (no archive): back to /', (await path()) === '/' && (await count('.play-board')) === 0, await path())
  await load('#/play')
  check('old #/play link is rewritten to /play', (await path()) === '/play' && (await count('.play-board')) === 1, await path())
  await evaluate("location.hash = '#/'")
  await sleep(600)
  check('old #/ typed on a running page is rewritten to /', (await path()) === '/' && (await count('.daily-card')) === 1, await path())
  await load('nonsense/path')
  check('unknown path shows the start screen and is replaced by /', (await path()) === '/' && (await count('.daily-card')) === 1, await path())
  for (const old of ['level/demo', 'level/demo/solved', 'level/nergens']) {
    await load(old)
    check(`old /${old} path redirects to /`, (await path()) === '/' && (await count('.daily-card')) === 1 && (await count('.play-board')) === 0, await path())
  }
  await load('lab')
  check('/lab is not served in the production build: start screen at /', (await path()) === '/' && (await count('.lab')) === 0, await path())
  await load('')
  const link = (await evaluate(`(() => { const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true }); document.querySelector('.daily__about').dispatchEvent(e); return e.defaultPrevented })()`)) as boolean
  check('ctrl+click on a link is left to the browser (new tab): the router does not cancel it', link === false, String(link))
  await evaluate(`document.querySelector('.daily__about').click()`)
  await sleep(500)
  check('the About link opens /about and its back link returns to /', (await path()) === '/about' && (await count('.about')) === 1)
  // The About page (SLAY-1.10): its four sections, the credit, the privacy line, the licence, and it fits the screen.
  const aboutText = (await evaluate(`document.querySelector('.about').innerText`)) as string
  check(
    'About page: title, tagline and the sections How it works, Credit, Privacy and Open source',
    ['About Slaydoku', 'A new murder mystery puzzle every day', 'How it works', 'Credit', 'Privacy', 'Open source'].every((t) => aboutText.includes(t)) &&
      (await count('.about__section')) === 4,
  )
  check(
    'About page: credits Murdoku by Manuel Garand, states the anonymous-counting privacy line, names the MIT license',
    aboutText.includes('Inspired by Murdoku by Manuel Garand.') && aboutText.includes('No accounts, no per-player identifier, no cookie.') && aboutText.includes('MIT license'),
  )
  const aboutBox = (await evaluate(
    `(() => { const b = document.querySelector('.about__back').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, iw: innerWidth, backH: b.height } })()`,
  )) as { sw: number; iw: number; backH: number }
  check('About page fits the viewport: no sideways scroll, the back link is a 44px target', aboutBox.sw <= aboutBox.iw && aboutBox.backH >= 44, JSON.stringify(aboutBox))
  await evaluate(`document.querySelector('.about__back').click()`)
  await sleep(500)
  check('back from About shows the start screen', (await path()) === '/' && (await count('.daily-card')) === 1)
  await load('about')
  check('deep link /about loads the About page', (await path()) === '/about' && (await count('.about')) === 1 && (await count('.daily-card')) === 0)
}

// The "How it works" card: the first Play shows it, dismissing starts play, a second visit does not, the start-screen link and the Help button reopen it, and the glossary stays behind Keywords.
const modalBtn = (label: string) =>
  evaluate(`(() => { const e = [...document.querySelectorAll('.play-modal button')].find(b => b.innerText.trim() === ${JSON.stringify(label)}); if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } })()`) as Promise<{ x: number; y: number; w: number; h: number } | null>
async function tapModalBtn(label: string) {
  await sleep(400) // clicks in the first 350ms of a dialog are ignored (ghost-click guard)
  const r = await modalBtn(label)
  if (!r) throw new Error('missing modal button ' + label)
  await tap(r.x, r.y)
  await sleep(300)
}
const panelProbe = () =>
  evaluate(`(() => { const p = document.querySelector('.play-modal__panel'); if (!p) return null; const r = p.getBoundingClientRect(); const a = document.querySelector('.play-help__actions')?.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, scrolls: p.scrollHeight > p.clientHeight, actionsInside: !!a && a.top >= r.top && a.bottom <= r.bottom + 1, title: p.querySelector('.play-modal__title')?.textContent, goal: p.querySelectorAll('.play-help__goal p').length, steps: p.querySelectorAll('.play-help__steps li').length, glossary: p.querySelectorAll('.play-help__glossary').length } })()`) as Promise<{ l: number; t: number; r: number; b: number; iw: number; ih: number; sw: number; scrolls: boolean; actionsInside: boolean; title: string; goal: number; steps: number; glossary: number } | null>
const fits = (p: NonNullable<Awaited<ReturnType<typeof panelProbe>>>) => p.l >= 0 && p.t >= 0 && p.r <= p.iw && p.b <= p.ih && p.sw <= p.iw
async function pressEscape() {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await sleep(300)
}
async function firstVisit() {
  ctx.level = 'how-it-works'
  await resetStorage(PLAY_DATE, false)
  await load('')
  check('start screen has a Help link and no card before pressing Play', (await count('.daily__help')) === 1 && (await count('.play-modal')) === 0)
  await evaluate(`document.querySelector('[data-action]').click()`)
  await sleep(1200)
  const first = await panelProbe()
  check('the first Play shows the card: goal, 4 steps, glossary hidden', !!first && first.title === 'How it works' && first.goal >= 1 && first.goal <= 5 && first.steps >= 3 && first.steps <= 4 && first.glossary === 0, JSON.stringify(first))
  check('card fits the viewport, buttons reachable' + (first?.scrolls ? ' (panel scrolls inside)' : ''), !!first && fits(first) && first.actionsInside, JSON.stringify(first))
  const kw = await modalBtn('Keywords')
  check('Keywords button is a 44px target', !!kw && kw.h >= 44 && kw.w >= 44, JSON.stringify(kw))
  await shot('06-first-visit')
  await tapModalBtn('Keywords')
  const glossary = await panelProbe()
  check('Keywords reveals the glossary', !!glossary && glossary.glossary === 1 && glossary.goal === 0 && fits(glossary), JSON.stringify(glossary))
  await shot('07-keywords')
  await tapModalBtn('Back to the guide')
  check('back returns to the goal and steps', (await panelProbe())?.glossary === 0 && ((await panelProbe())?.goal ?? 0) >= 1)
  await tapModalBtn('Start playing')
  check('dismissing the card starts the puzzle (no dialog, board there)', (await count('.play-modal')) === 0 && (await count('.play-board')) === 1)
  // A solution cell (never the victim's, index 0): always open floor in every generated puzzle, unlike a fixed board coordinate,
  // which can land on a piece of furniture in a puzzle whose floor plan differs from the one this scenario was first written against.
  const noteSpot = puzzle.solution[1]!.cell
  const cell = await rectOf(cellSel(noteSpot.row, noteSpot.col))
  await tap(cell!.x, cell!.y)
  check('play is not blocked afterwards: a tap writes a note', (await count('[data-note]')) === 1)
  await tool('Undo')
  check('help-seen is remembered in localStorage, versioned', /"version":\d+/.test(String(await evaluate(`localStorage.getItem('slaydoku:help-seen')`))), String(await evaluate(`localStorage.getItem('slaydoku:help-seen')`)))
  await evaluate(`document.querySelector('.daily-play__back').click()`)
  await sleep(500)
  check('the start screen offers Continue now that a board is saved', (await textOf('[data-action]')) === 'Continue' && (await evaluate(`document.querySelector('.daily-card').dataset.status`)) === 'inProgress', await textOf('[data-action]'))
  await shot('05-start-continue')
  await evaluate(`document.querySelector('[data-action]').click()`)
  await sleep(1000)
  check('second visit does not show the card', (await count('.play-modal')) === 0 && (await count('.play-board')) === 1)
  await reload()
  check('reload does not show the card either', (await count('.play-modal')) === 0 && (await count('.play-board')) === 1)
  // Help sits behind the header's settings icon (SLAY-5.1).
  await tool('More')
  await tool('Help')
  check('Help button reopens the card, glossary hidden', (await panelProbe())?.title === 'How it works' && (await panelProbe())?.glossary === 0)
  await tapModalBtn('Keywords')
  await tapModalBtn('Back to the guide')
  await pressEscape()
  check('Escape closes the card (keyboard)', (await count('.play-modal')) === 0)
  await tool('More')
  await tool('Help')
  check('glossary is closed again on every open', (await panelProbe())?.glossary === 0)
  await tapModalBtn('Keywords')
  await tap(3, 3)
  await sleep(300)
  await tool('More')
  await tool('Help')
  check('a reopen after leaving on the glossary starts on the goal', (await panelProbe())?.title === 'How it works' && (await panelProbe())?.glossary === 0)
  await tapModalBtn('Start playing')
  await evaluate(`document.querySelector('.daily-play__back').click()`)
  await sleep(500)
  await tapSel('.daily__help')
  const link = await panelProbe()
  check('the Help link on the start screen opens the card', !!link && link.title === 'How it works' && link.goal >= 1 && fits(link), JSON.stringify(link))
  await shot('08-start-help')
  await tap(3, 3)
  await sleep(300)
  check('tapping outside closes it, start screen intact', (await count('.play-modal')) === 0 && (await count('.daily-card')) === 1)
}

async function playDay(first: boolean, w: number, h: number) {
  ctx.level = 'day'
  const [vw, vh] = [w, h]

  await resetStorage(PLAY_DATE, true)
  await load('')
  await evaluate(`document.querySelector('[data-action]').click()`)
  await sleep(1200)
  check('Play opens the puzzle at /play', (await path()) === '/play' && (await count('.play-modal')) === 0, await path())
  const lay = await layoutProbe()
  check('layout: no horizontal overflow, board inside viewport', lay.sw <= lay.iw && !!lay.board && lay.board.l >= 0 && lay.board.r <= lay.iw, JSON.stringify(lay))
  const minCell = vw <= 640 && vh > vw ? 34 : 30 // portrait phone: 34px
  check(`layout: touch targets (cell >= ${minCell}px, toolbar >= 44px)`, lay.cell >= minCell && lay.minTool >= 44, `cell=${lay.cell}px minTool=${lay.minTool}px`)
  check('layout: page height vs viewport (info)', true, `scrollHeight=${lay.sh} innerHeight=${lay.ih}${lay.sh > lay.ih ? ' (page scrolls vertically)' : ' (fits)'}`)
  await shot('01-fresh')
  check('screenshot fresh board', true)

  // Note: tap a cell.
  const spot = puzzle.solution[2]!.cell // arbitrary cell
  await tapSel(cellSel(spot.row, spot.col))
  check('tap writes a note', (await count('[data-note]')) === 1, `notes=${await count('[data-note]')}`)
  await shot('02-note')
  check('screenshot note', true)

  // Undo / redo: redo has no button of its own (SLAY-5.1), a long press on Undo reaches it.
  await tool('Undo')
  check('undo removes the note', (await count('[data-note]')) === 0)
  await toolHold('Undo')
  check('a long press on Undo redoes: the note comes back', (await count('[data-note]')) === 1)
  await tool('Undo')

  // X mode.
  await tool('X')
  await tapSel(cellSel(spot.row, spot.col))
  check('X mode tap draws an X', (await count('[data-mark]')) >= 1, `marks=${await count('[data-mark]')}`)
  await tool('Undo')
  check('undo removes the X', (await count('[data-mark]')) === 0)
  await tool('Note')

  // Long-press placement: first suspect, then the selection moves on.
  const before = await selectedName()
  const p0 = puzzle.solution[0]!
  const idOf = new Map(puzzle.people.map((p) => [p.label, p.id]))
  const cell0 = puzzle.solution.find((s) => s.personId === idOf.get(before.trim()))?.cell ?? p0.cell
  const rc = (await rectOf(cellSel(cell0.row, cell0.col)))!
  await hold(rc.x, rc.y, 650)
  await sleep(300)
  check('long-press places the selected suspect', (await count('[data-person]')) >= 1, `placed=${await count('[data-person]')} (was selected: ${before})`)
  check('no stray note from the long-press', (await count('[data-note]')) === 0)
  const after = await selectedName()
  check('selection advances to the next suspect', after !== before, `${before} -> ${after}`)
  await tool('Undo')
  check('undo removes the placement', (await count('[data-person]')) === 0)
  await toolHold('Undo')
  check('a long press on Undo redoes: the placement is restored', (await count('[data-person]')) >= 1)

  // Hints 1..3.
  await tool('Hint')
  const h1 = await evaluate(`document.querySelector('.play-hint')?.dataset.level`)
  await tapSel('.play-hint .play-btn--primary')
  await tapSel('.play-hint .play-btn--primary')
  const h3 = await evaluate(`document.querySelector('.play-hint')?.dataset.level`)
  const hintText = await evaluate(`document.querySelector('.play-hint__text')?.innerText`)
  check('hint opens at level 1 and steps to 3', h1 === '1' && h3 === '3', `levels ${h1} -> ${h3}; text: ${JSON.stringify(hintText)}`)
  await shot('03-hint3')
  check('screenshot hint 3', true)
  await tapSel('.play-hint__actions .play-btn:not(.play-btn--primary)')
  check('hint closes', (await count('.play-hint')) === 0)

  // Card panel scrolls by touch: reach the gift card (last). It is informational only, never
  // tappable (SLAY-9.5: the victim is never itself selectable), so this only checks the scroll.
  const portrait = vh > vw
  const inView = () =>
    evaluate(`(() => { const e = document.querySelector('.polaroid--victim .polaroid__photo'); if (!e) return false; const r = e.getBoundingClientRect(); const side = e.closest('.play-side'); const c = side && getComputedStyle(side).overflowY !== 'visible' ? side.getBoundingClientRect() : { left: 0, right: innerWidth, top: 0, bottom: innerHeight }; const x = r.left + r.width / 2, y = r.top + r.height / 2; return r.width > 0 && x >= Math.max(0, c.left) && x <= Math.min(innerWidth, c.right) && y >= Math.max(0, c.top) && y <= Math.min(innerHeight, c.bottom) })()`) as Promise<boolean>
  async function swipe(reverse: boolean) {
    const p = (await rectOf('.play-cards'))!
    const reach = Math.min(250, vw * 0.35)
    // Short landscape (phone): the cards column is a small scroll area; drag inside it.
    const side = vh < 500 ? await rectOf('.play-side') : null
    const a: [number, number] = portrait ? [vw / 2 + reach, p.y - p.h / 2 + 100] : side ? [side.x, side.y + side.h / 3] : [p.x, vh / 2 + 200]
    const b: [number, number] = portrait ? [vw / 2 - reach, p.y - p.h / 2 + 100] : side ? [side.x, side.y - side.h / 3] : [p.x, vh / 2 - 200]
    const [from, to] = reverse ? [b, a] : [a, b]
    await touch('touchStart', ...from)
    for (let i = 1; i <= 8; i++) {
      await sleep(30)
      await touch('touchMove', from[0] + ((to[0] - from[0]) * i) / 8, from[1] + ((to[1] - from[1]) * i) / 8)
    }
    await sleep(60)
    await touch('touchEnd', ...to)
    await sleep(500)
  }
  for (let i = 0; i < 10 && !(await inView()); i++) await swipe(false)
  const giftVisible = await inView()
  check('card panel scrolls by touch to reveal the gift card', giftVisible, `gift in view=${giftVisible}`)
  await shot('03b-gift-card')
  for (let i = 0; i < 10; i++) await swipe(true)
  const firstCard = await rectOf('.play-cards li:nth-child(2) .polaroid')
  if (firstCard) {
    await tap(firstCard.x, firstCard.y)
    await sleep(250)
  }

  // Help and options, both behind the header's settings icon (SLAY-5.1) (first viewport run only: same component on every day).
  if (first) {
    await tool('More')
    await tool('Help')
    check('help opens', (await count('.play-modal')) === 1)
    await shot('04-help')
    await tap(3, 3)
    await sleep(300)
    check('tapping the dimmed backdrop closes the help', (await count('.play-modal')) === 0)
    await tool('More')
    await tool('Options')
    check('options open', (await count('.play-modal')) === 1)
    await shot('05-options')
    await tap(3, 3)
    await sleep(300)
    check('tapping the dimmed backdrop closes the options', (await count('.play-modal')) === 0)
  }

  // Add a note + X for the reload test, then reload and expect the same board.
  await tapSel(cellSel(spot.row, spot.col))
  const snap = JSON.stringify([await count('[data-person]'), await count('[data-note]'), await count('[data-mark]')])
  await reload()
  const snap2 = JSON.stringify([await count('[data-person]'), await count('[data-note]'), await count('[data-mark]')])
  check('reload resumes the board (placed, notes, marks)', snap === snap2 && (await path()) === '/play', `${snap} -> ${snap2}, ${await path()}`)

  // Orientation change mid-puzzle: rotate and back.
  if (first) {
    await setViewport(vh, vw)
    await sleep(700)
    const rot = await layoutProbe()
    const snap3 = JSON.stringify([await count('[data-person]'), await count('[data-note]'), await count('[data-mark]')])
    check('orientation change keeps state and layout fits', snap3 === snap2 && rot.sw <= rot.iw && !!rot.board && rot.board.r <= rot.iw, `${vw}x${vh} -> ${vh}x${vw}: state ${snap3}, ${JSON.stringify(rot)}`)
    await shot('06-rotated')
    await setViewport(vw, vh)
    await sleep(700)
    const back = await layoutProbe()
    check('rotating back restores the layout', back.sw <= back.iw && !!back.board && back.board.r <= back.iw, JSON.stringify(back))
  }

  // Clear-all dialog: long-press the eraser, cancel, then confirm.
  // Measured again on every use: on a phone the page may have scrolled since.
  const holdEraser = async () => {
    const er = (await rectOf('.play-tool--erase'))!
    await hold(er.x, er.y, 800)
  }
  await holdEraser()
  await sleep(250)
  check('holding the eraser opens the clear-all dialog', (await count('.play-modal .play-btn--danger')) === 1)
  await shot('07-clear-dialog')
  await tapSel('.play-modal .play-btn:not(.play-btn--danger)')
  check('cancel keeps the board', (await count('[data-person]')) + (await count('[data-note]')) > 0)
  await holdEraser()
  await sleep(250)
  await tapSel('.play-modal .play-btn--danger')
  check('confirm clears everything', (await count('[data-person]')) + (await count('[data-note]')) + (await count('[data-mark]')) === 0)
  await tool('Undo')
  check('undo brings the cleared board back', (await count('[data-person]')) + (await count('[data-note]')) > 0)
  await tool('Undo')
  await holdEraser()
  await sleep(250)
  await tapSel('.play-modal .play-btn--danger')

  // Wrong solution: everybody placed with two swapped.
  const okWrong = await placeAll(puzzle, true)
  await sleep(400)
  check('complete-but-wrong board shows "Not right yet"', okWrong && (await count('[data-result=wrong]')) === 1, `wrong overlay: ${await count('[data-result=wrong]')}`)
  await shot('08-wrong')
  await tapSel('.play-result .play-btn--primary')
  // Reset the board, then solve properly.
  await holdEraser()
  await sleep(250)
  await tapSel('.play-modal .play-btn--danger')
  check('board reset after the wrong attempt', (await count('[data-person]')) === 0)

  const solvedOk = await placeAll(puzzle)
  await sleep(900)
  check('solving goes back to the start screen (/), which shows the result', solvedOk && (await path()) === '/' && (await count('[data-result=solved]')) === 1 && (await count('.play-board')) === 0, await path())
  // The murderer is the suspect alone with the victim in the stored solution; the screens show the name of the cast.
  const murdererId = deriveMurderer(DAY.puzzle, DAY.puzzle.solution)
  const murderer = DAY.puzzle.people.find((p) => p.id === murdererId)?.label ?? String(murdererId)
  const text = await startText()
  check(`the result names ${murderer} alone with the victim, with time and hints`, text.includes(murderer) && /alone with the victim/.test(text) && /Time: \d+:\d\d/.test(text) && /1 hint/.test(text), JSON.stringify(text.replace(/\n/g, ' / ')))
  check('a solved day has no Play button, and shows the countdown to the next puzzle', (await count('.daily-card [data-action]')) === 0 && (await count('[data-countdown=next]')) === 1 && /^New puzzle at 00:00 UTC/.test(await textOf('[data-until]')), await textOf('[data-until]'))
  check('the share slot holds the share card (preview and text, checked in depth by share.ts) and the statistics slot holds the streak line and the Stats button', (await count('[data-slot=share] [data-share] [data-share-preview]')) === 1 && /^Slaydoku #\d+ · /.test(await textOf('[data-slot=share] [data-share-text]')) && (await count('[data-slot=stats] [data-stats-summary]')) === 1 && (await count('[data-slot=stats] [data-stats-open]')) === 1)
  await shot('09-solved')
  const stored = JSON.parse(String(await evaluate(`localStorage.getItem(${JSON.stringify(RESULTS_KEY)})`))) as { version: number; results: Record<string, { n: number; date: string; fp: string; elapsedMs: number; hints: number; wrongChecks: number; murdererId: string }> }
  const result = stored.results[String(DAY.n)]
  check('the result is stored per day, versioned: time, hints, wrong checks, murderer, fingerprint', stored.version === 1 && !!result && result.n === DAY.n && result.date === DAY.date && result.fp === DAY.fp && result.murdererId === murdererId && result.elapsedMs > 0 && result.hints === 1 && result.wrongChecks === 1, JSON.stringify(result))
  await reload()
  check('reload on the start screen stays solved', (await path()) === '/' && (await count('[data-result=solved]')) === 1, await path())
  await load('play')
  check('a solved day cannot be played again: /play goes back to the result', (await path()) === '/' && (await count('.play-board')) === 0 && (await count('[data-result=solved]')) === 1, await path())
  const again = JSON.parse(String(await evaluate(`localStorage.getItem(${JSON.stringify(RESULTS_KEY)})`))).results[String(DAY.n)]
  check('the stored result did not change', JSON.stringify(again) === JSON.stringify(result))

  // The next day: a new puzzle, the result of the day before stays.
  const next = dayOn('2026-11-22')
  await evaluate(`localStorage.setItem(${JSON.stringify(DATE_KEY)}, '2026-11-22')`)
  await load('')
  check(`the next day shows a new puzzle (${next.date}), not solved`, (await textOf('[data-puzzle-number]')) === DAILY_STRINGS.en.puzzleLabel(next.date) && (await count('[data-action]')) === 1 && (await count('[data-result=solved]')) === 0, await textOf('[data-puzzle-number]'))
  const kept = JSON.parse(String(await evaluate(`localStorage.getItem(${JSON.stringify(RESULTS_KEY)})`))).results[String(DAY.n)]
  check('the result of the day before is still stored', JSON.stringify(kept) === JSON.stringify(result))
  await shot('10-next-day')
}

// Midnight rollover (SLAY-1.5): the clock starts 5 seconds before 00:00 UTC of the next day (date override with a time) and passes it while the page is open.
async function rollover() {
  ctx.level = 'rollover'
  const next = dayOn('2026-11-22')
  const key = `slaydoku:game:daily-${DAY.n}`
  // (1) In the middle of a puzzle: the player keeps the puzzle, the notice offers the new one.
  await resetStorage('2026-11-21T23:59:55', true)
  await load('play')
  const spot = puzzle.solution[2]!.cell
  await tapSel(cellSel(spot.row, spot.col))
  check('before midnight: a note is on the board and there is no notice yet', (await count('[data-note]')) === 1 && (await count('[data-banner]')) === 0)
  const noticed = await until(`document.querySelector('[data-banner=new-puzzle]') !== null`, 15000)
  check('the clock passes 00:00 UTC while the puzzle is open: "New puzzle available" appears', noticed, await textOf('[data-banner]'))
  const spot2 = puzzle.solution[3]!.cell
  check('the player is not switched away: still /play, same board, same title', (await path()) === '/play' && (await count('.play-board')) === 1 && (await count('[data-note]')) === 1 && (await textOf('[data-play-title]')) === DAILY_STRINGS.en.puzzleLabel(DAY.date), `${await path()} ${await textOf('[data-play-title]')}`)
  check('the notice names the new puzzle and its button is a big target', (await textOf('[data-banner] button')) === `Show puzzle #${next.n}` && ((await rectOf('[data-banner] button'))?.h ?? 0) >= 44, await textOf('[data-banner]'))
  await shot('11-rollover-mid-puzzle')
  await tapSel(cellSel(spot2.row, spot2.col))
  check('they can keep playing the old puzzle after midnight', (await count('[data-note]')) === 2)
  check('the notice can be hidden while playing (it sits over the bottom of the screen), the puzzle stays', (await rectOf('.daily-banner__dismiss'))!.w >= 44 && (await (async () => { await tapSel('.daily-banner__dismiss'); return (await count('[data-banner]')) === 0 && (await count('.play-board')) === 1 && (await path()) === '/play' })()))
  const saved = await evaluate(`localStorage.getItem(${JSON.stringify(key)})`)
  await evaluate(`document.querySelector('.daily-play__back').click()`)
  await sleep(600)
  check('leaving the puzzle shows the ended day with the notice, no Play and no countdown', (await path()) === '/' && (await count('[data-ended]')) === 1 && (await count('[data-banner=new-puzzle]')) === 1 && (await count('[data-action]')) === 0 && (await count('[role=timer]')) === 0, JSON.stringify((await startText()).replace(/\n+/g, ' / ')))
  await shot('12-rollover-ended-day')
  await evaluate(`document.querySelector('[data-banner] button').click()`)
  await sleep(500)
  check(`the notice button loads the new day: ${next.date}, Sunday 22 November 2026, Play`, (await textOf('[data-puzzle-number]')) === DAILY_STRINGS.en.puzzleLabel(next.date) && (await textOf('[data-date]')) === 'Sunday 22 November 2026' && (await count('[data-action]')) === 1 && (await count('[data-banner]')) === 0, `${await textOf('[data-puzzle-number]')} | ${await textOf('[data-date]')}`)
  check('the saved board of the day before is untouched', (await evaluate(`localStorage.getItem(${JSON.stringify(key)})`)) === saved)
  await shot('13-rollover-new-day')
  await evaluate(`document.querySelector('[data-action]').click()`)
  await sleep(800)
  check('Play now opens the new puzzle', (await path()) === '/play' && (await textOf('[data-play-title]')) === DAILY_STRINGS.en.puzzleLabel(next.date) && (await count('[data-note]')) === 0)

  // (2) On the start screen with a solved day: the result stays, the notice loads the new day.
  await resetStorage('2026-11-21T23:59:55', true)
  await evaluate(`localStorage.setItem(${JSON.stringify(RESULTS_KEY)}, JSON.stringify({ version: 1, results: { ${DAY.n}: { n: ${DAY.n}, date: ${JSON.stringify(DAY.date)}, fp: ${JSON.stringify(DAY.fp)}, elapsedMs: 754000, hints: 2, wrongChecks: 1, murdererId: ${JSON.stringify(deriveMurderer(DAY.puzzle, DAY.puzzle.solution))} } } }))`)
  await load('')
  check('start screen of a solved day before midnight: the result shows', (await count('[data-result=solved]')) === 1 && /Time: 12:34/.test(await startText()) && /2 hints/.test(await startText()))
  const noticed2 = await until(`document.querySelector('[data-banner=new-puzzle]') !== null`, 15000)
  check('past midnight the notice appears on the start screen too, the result of the day stays visible', noticed2 && (await count('[data-result=solved]')) === 1 && (await count('[role=timer]')) === 0)
  await evaluate(`document.querySelector('[data-banner] button').click()`)
  await sleep(500)
  const results = JSON.parse(String(await evaluate(`localStorage.getItem(${JSON.stringify(RESULTS_KEY)})`))).results
  check('the new day loads without losing the result of the day before', (await textOf('[data-puzzle-number]')) === DAILY_STRINGS.en.puzzleLabel(next.date) && !!results[String(DAY.n)] && results[String(DAY.n)].elapsedMs === 754000, JSON.stringify(Object.keys(results)))
}

const failedRows = () => rows.filter((r) => !r.ok)

for (const [label, w, h] of VIEWPORTS) {
  ctx = { viewport: label, level: 'start' }
  await open(w, h)
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/Amsterdam' })
  await startScreen()
  await firstVisit()
  await routing()
  await rollover()
  await playDay(label === VIEWPORTS[0]![0], w, h)
}

const failed = failedRows()
const md = [
  '| Viewport | Level | Scenario | Result | Detail | Screenshots |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.viewport} | ${r.level} | ${r.scenario} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/').replace(/`/g, "'")} | ${r.shots.map((s) => `screenshots/${s}`).join(', ')} |`),
].join('\n')
await Bun.write(join(OUT, TAG ? `scenario-log-${TAG.replace(/-$/, '')}.md` : 'scenario-log.md'), md + '\n')
console.log(`${rows.length} checks, ${failed.length} failures`)
chrome.kill()
process.exit(failed.length ? 1 : 0)
