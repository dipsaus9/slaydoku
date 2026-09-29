// Verification driver for the statistics (SLAY-1.6). Drives headless Chrome over the DevTools protocol with touch emulation, on the
// dev-only date override (src/game/daily/clock.ts): it solves two consecutive scheduled days through the real UI and checks that the
// start screen shows `Streak 2 · Best 2`, that the Stats card shows the numbers and the times per difficulty and fits the screen, that a
// streak is still alive the morning after (one day later) and gone after a missed day (two days later) while the best streak stays, that
// the card closes with Escape, its Close button and a tap on the backdrop and gives the focus back, that Tab stays inside it, that Reset
// asks first and then forgets the results, and that nothing was requested from another origin.
//
// Usage (from the repo root; `bun run verify:phone` runs it with the other drivers):
//   bun run build && bunx vite preview --port 5197 &
//   bun docs/verification/stats.ts
// Env: VIEWPORTS (default 390x844,1024x768), BASE (default local preview), CDP_PORT (default 9355), CHROME, OUT (folder for screenshots/
// and stats-log.md; default docs/verification/, set it to a folder outside the repo to leave the committed files alone).
// Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { addDays } from '../../src/schedule/dates.ts'
import { DAYS, DATE_KEY, RESULTS_KEY, seedStorage } from './daily.ts'
import type { ScheduleDay } from '../../src/schedule/types.ts'

const HERE = import.meta.dir
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9355)
const BASE = process.env.BASE ?? 'http://localhost:5197/'
const OUT = process.env.OUT ?? HERE
const SHOTS = join(OUT, 'screenshots')
const VIEWPORTS = (process.env.VIEWPORTS ?? '390x844,1024x768')
  .split(',')
  .map((label) => [label, ...label.split('x').map(Number)] as [string, number, number])

/** Two consecutive scheduled days with the smallest boards (the solve goes through the real UI, one long press per person). */
function chooseDays(): [ScheduleDay, ScheduleDay] {
  let best: [ScheduleDay, ScheduleDay] | null = null
  for (const a of DAYS) {
    const b = DAYS.find((d) => d.date === addDays(a.date, 1))
    if (!b) continue
    if (!best || a.size + b.size < best[0].size + best[1].size) best = [a, b]
  }
  if (!best) throw new Error('no two consecutive scheduled days')
  return best
}
const [DAY1, DAY2] = chooseDays()
const DAY3 = addDays(DAY2.date, 1) // the morning after the last solved day
const DAY4 = addDays(DAY2.date, 2) // a day missed in between

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

async function setViewport(w: number, h: number) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
}
const touch = (type: string, x: number, y: number) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] })
async function tap(x: number, y: number) { await touch('touchStart', x, y); await sleep(60); await touch('touchEnd', x, y) }
async function hold(x: number, y: number, ms = 700) { await touch('touchStart', x, y); await sleep(ms); await touch('touchEnd', x, y) }
type Rect = { x: number; y: number; w: number; h: number }
const rectOf = (sel: string) =>
  evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } })()`) as Promise<Rect | null>
async function tapSel(sel: string) {
  const r = await rectOf(sel)
  if (!r) throw new Error('missing ' + sel)
  await tap(r.x, r.y)
  await sleep(300)
}
/** A tap inside the dialog: clicks in the first 350ms of a dialog are ignored (ghost-click guard). */
async function tapInCard(sel: string) {
  await sleep(450)
  await tapSel(sel)
}
const cellSel = (row: number, col: number) => `[data-cell=r${row + 1}c${col + 1}]`
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>
const textOf = (sel: string) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent?.trim() ?? ''`) as Promise<string>
const path = () => evaluate('location.pathname') as Promise<string>
const urlOf = (p: string) => new URL(p, BASE).href
async function load(p: string) {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(200)
  await send('Page.navigate', { url: urlOf(p) })
  await sleep(1800)
}
async function press(key: string, code: string, vk: number) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk })
  await sleep(300)
}
const setDate = (date: string) => evaluate(`localStorage.setItem(${JSON.stringify(DATE_KEY)}, ${JSON.stringify(date)})`)

// --- text contrast (SLAY-9.17): the actual rendered/computed color, not the CSS source -------
const styleOf = (sel: string) =>
  evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const cs = getComputedStyle(e); return { color: cs.color, background: cs.backgroundColor } })()`) as Promise<{ color: string; background: string } | null>
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const chan = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}
/** WCAG contrast ratio (1..21) between two `rgb(...)` strings, as the browser actually resolved them post-cascade. */
function contrastRatio(a: string, b: string): number {
  const parse = (s: string): [number, number, number] => {
    const m = /rgba?\((\d+), *(\d+), *(\d+)/.exec(s)
    if (!m) throw new Error(`not an rgb() color: ${s}`)
    return [Number(m[1]), Number(m[2]), Number(m[3])]
  }
  const [l1, l2] = [relativeLuminance(parse(a)), relativeLuminance(parse(b))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// --- logging ---------------------------------------------------------------------------------
interface Row { viewport: string; scenario: string; ok: boolean; detail: string; shots: string[] }
const rows: Row[] = []
let viewport = ''
let pendingShots: string[] = []
async function shot(name: string) {
  const file = `${viewport}-stats-${name}`
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 })
  await Bun.write(join(SHOTS, `${file}.jpg`), Buffer.from(r.data, 'base64'))
  pendingShots.push(`${file}.jpg`)
}
function check(scenario: string, ok: boolean, detail = '') {
  rows.push({ viewport, scenario, ok, detail, shots: pendingShots })
  pendingShots = []
  console.log(ok ? 'PASS' : 'FAIL', viewport, scenario, detail)
}

// --- playing a day through the UI ------------------------------------------------------------
interface PuzzleJson {
  people: { id: string; label: string; kind: string }[]
  solution: { personId: string; cell: { row: number; col: number } }[]
}
const selectedName = () =>
  evaluate(`(document.querySelector('.play-cards[data-victim-selected]') ? 'The victim' : document.querySelector('.polaroid[data-selected] .polaroid__name')?.textContent) ?? 'NONE'`) as Promise<string>
// A suspect's own card, scrolled into view first: used only to recover the selection (see
// placeAll below), since a normal placement follows whichever card the app already advanced to.
const cardRect = (label: string) =>
  evaluate(
    `(() => { const e = [...document.querySelectorAll('.polaroid')].find(b => b.querySelector('.polaroid__name')?.textContent.trim() === ${JSON.stringify(label)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`,
  ) as Promise<{ x: number; y: number } | null>

/** Long-press each suspect (as the card selection advances) onto its solution cell. The victim is
 * never itself selectable or click-placed (SLAY-9.5): its square fills in on its own once every
 * suspect has a placement. Solving navigates back to "/" on its own as soon as the board is
 * complete and correct (DailyFlow.tsx), so the caller's own "solved" check is what proves the
 * victim's square filled in right -- there is no board left here to assert against afterwards. */
async function placeAll(puzzle: PuzzleJson) {
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const idByName = new Map(suspects.map((p) => [p.label, p.id]))
  const cellOf = new Map(puzzle.solution.map((s) => [s.personId, s.cell]))
  const remaining = new Set(suspects.map((p) => p.id))
  for (let i = 0; i < suspects.length; i++) {
    const name = (await selectedName()).trim()
    let pid = idByName.get(name)
    if (!pid || !remaining.has(pid)) {
      // The advance order can point at the victim's own (never rendered as selected) slot before
      // every suspect is placed -- recover by tapping the card of whichever suspect is still unplaced.
      const next = suspects.find((p) => remaining.has(p.id))
      if (!next) return false
      const card = await cardRect(next.label)
      if (!card) return false
      await tap(card.x, card.y)
      await sleep(250)
      pid = next.id
    }
    const cell = cellOf.get(pid)!
    const r = await rectOf(cellSel(cell.row, cell.col))
    if (!r) return false
    await hold(r.x, r.y, 650)
    await sleep(200)
    remaining.delete(pid)
  }
  await sleep(900)
  return true
}

/** Opens the day on screen and solves it. The date override decides which day it is.
 * SLAY-9.13: solving no longer navigates away -- the finish popover (ResultOverlay) shows right on
 * /play. Dismiss it ("View the board") and leave the play screen (the back button) so the rest of
 * this scenario, which reads the day's status from the start screen, finds it there. */
async function solveDay(day: ScheduleDay): Promise<boolean> {
  await setDate(day.date)
  await load('play')
  if ((await count('.play-board')) !== 1) return false
  const ok = await placeAll(day.puzzle as unknown as PuzzleJson)
  await sleep(500)
  if (!ok || (await count('[data-result=solved]')) !== 1) return false
  await tapSel('.play-result--solved .play-btn:not(.play-btn--primary)')
  await evaluate(`document.querySelector('.daily-play__back').click()`)
  await sleep(500)
  return (await path()) === '/'
}

// --- the card --------------------------------------------------------------------------------
const summary = () => textOf('[data-stats-summary]')
const stat = (key: string) => textOf(`[data-stat=${key}] dd`)
const openCard = async () => {
  await tapSel('[data-stats-open]')
  await sleep(300)
}
const cardProbe = () =>
  evaluate(`(() => { const p = document.querySelector('.stats-panel'); if (!p) return null; const r = p.getBoundingClientRect(); const cards = [...p.querySelectorAll('button')].map((b) => { const q = b.getBoundingClientRect(); return { w: Math.round(q.width), h: Math.round(q.height) } }); return { l: r.left, t: r.top, r: r.right, b: r.bottom, iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, scrolls: p.scrollHeight > p.clientHeight, small: cards.filter((c) => c.w < 44 || c.h < 44).length, dialog: p.getAttribute('role'), modal: p.getAttribute('aria-modal'), labelled: !!p.getAttribute('aria-labelledby') } })()`) as Promise<{ l: number; t: number; r: number; b: number; iw: number; ih: number; sw: number; scrolls: boolean; small: number; dialog: string; modal: string; labelled: boolean } | null>
const fits = (p: NonNullable<Awaited<ReturnType<typeof cardProbe>>>) => p.l >= 0 && p.t >= 0 && p.r <= p.iw && p.b <= p.ih && p.sw <= p.iw
const focusInfo = () =>
  evaluate(`(() => { const a = document.activeElement; return { action: a?.getAttribute('data-action') ?? (a?.hasAttribute('data-stats-open') ? 'open-stats' : ''), inCard: !!a?.closest('.stats-panel') } })()`) as Promise<{ action: string; inCard: boolean }>

async function scenario(w: number, h: number) {
  await setViewport(w, h)
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/Amsterdam' })
  await send('Page.navigate', { url: BASE })
  await sleep(1800)
  // Locale pinned to 'en' (SLAY-3.6, the same fix drive.ts/zoom.ts/legend.ts/screens.ts already carry from
  // SLAY-3.2/SLAY-4.2): without it, a browser whose own language is Dutch would default the app to Dutch
  // (SLAY-3.1's locale toggle falls back to the browser's language) and break every English-text check here.
  await evaluate(`localStorage.clear(); ${seedStorage(DAY1.date, true, 'en')}`)
  await load('')

  // Empty history.
  check('start screen: the stats slot holds a streak line and a Stats button', (await count('[data-slot=stats] [data-stats-summary]')) === 1 && (await summary()) === 'Streak 0 · Best 0' && (await textOf('[data-stats-open]')) === 'Stats', await summary())
  const open = await rectOf('[data-stats-open]')
  check('start screen: the Stats button is a big touch target and the page does not scroll sideways', !!open && open.w >= 44 && open.h >= 44 && ((await evaluate('document.documentElement.scrollWidth <= innerWidth')) as boolean), JSON.stringify(open))
  await shot('00-start-empty')
  await openCard()
  const empty = await cardProbe()
  check('empty card: a labelled modal dialog that fits the screen, targets of 44px', !!empty && empty.dialog === 'dialog' && empty.modal === 'true' && empty.labelled && fits(empty) && empty.small === 0, JSON.stringify(empty))
  check('empty card: zeros, dashes for rate and average, and a hint instead of times', (await stat('played')) === '0' && (await stat('solved')) === '0' && (await stat('solve-rate')) === '–' && (await stat('current-streak')) === '0' && (await stat('best-streak')) === '0' && (await stat('total-hints')) === '0' && (await stat('average-hints')) === '–' && (await count('[data-empty]')) === 1)
  await shot('01-card-empty')

  // SLAY-9.17: the Close button used to render dark ink text on its red background here (the stats
  // popover opens from the start screen, outside .play, where the fix used to have no effect). The
  // computed style is read from the live cascade, not just matched against the CSS source.
  const closeStyle = await styleOf('[data-action=close]')
  check(
    'card: the Close button has readable (WCAG AA, >= 4.5:1) text contrast on its red background',
    !!closeStyle && contrastRatio(closeStyle.color, closeStyle.background) >= 4.5,
    JSON.stringify(closeStyle),
  )
  check('card: the device-only privacy line is gone (redundant with the About page)', (await count('.stats-note--device')) === 0)

  await press('Escape', 'Escape', 27)
  check('Escape closes the card and the focus returns to the Stats button', (await count('.stats-panel')) === 0 && (await focusInfo()).action === 'open-stats')

  // SLAY-9.17 AC #2: the same bug hit HelpPanel's primary buttons too, when "How it works" opens
  // from the start screen (also outside .play) rather than from inside PlayScreen.
  await tapSel('.daily__help')
  const helpStyle = await styleOf('.play-btn--primary')
  check(
    'start screen: "How it works" primary button also has readable text contrast (SLAY-9.17 AC #2)',
    !!helpStyle && contrastRatio(helpStyle.color, helpStyle.background) >= 4.5,
    JSON.stringify(helpStyle),
  )
  await press('Escape', 'Escape', 27)

  // Two consecutive days solved through the real UI.
  check(`day 1 (#${DAY1.n}, ${DAY1.date}, ${DAY1.size}x${DAY1.size}) is solved through the UI`, await solveDay(DAY1))
  check('after one solved day: Streak 1 · Best 1', (await summary()) === 'Streak 1 · Best 1', await summary())
  check(`day 2 (#${DAY2.n}, ${DAY2.date}, ${DAY2.size}x${DAY2.size}) is solved through the UI`, await solveDay(DAY2))
  check('after two consecutive days: the start screen shows Streak 2 · Best 2', (await summary()) === 'Streak 2 · Best 2', await summary())
  await shot('02-start-streak-2')

  await openCard()
  const card = await cardProbe()
  check('card: played 2, solved 2, solve rate 100%, current and best streak 2', (await stat('played')) === '2' && (await stat('solved')) === '2' && (await stat('solve-rate')) === '100%' && (await stat('current-streak')) === '2' && (await stat('best-streak')) === '2', ['played', 'solved', 'solve-rate', 'current-streak', 'best-streak'].map((k) => k).join(','))
  const tiers = [...new Set([DAY1.tier, DAY2.tier])]
  check(`card: a time bar for each tier played (${tiers.join(', ')}) with best and median in words`, (await count('.stats-times__row')) === tiers.length && (await Promise.all(tiers.map((t) => count(`.stats-times__row[data-tier=${t}]`)))).every((n) => n === 1) && (await evaluate(`[...document.querySelectorAll('.stats-times__bar')].every((b) => /best \\d+:\\d\\d, median \\d+:\\d\\d$/.test(b.getAttribute('aria-label') ?? ''))`)) === true)
  check('card: hints used and hints per puzzle are numbers', /^\d+$/.test(await stat('total-hints')) && /^(\d+(\.\d)?)$/.test(await stat('average-hints')), `${await stat('total-hints')} / ${await stat('average-hints')}`)
  check('card: fits the screen, its actions reachable by scrolling inside it, targets of 44px', !!card && fits(card) && card.small === 0, JSON.stringify(card))
  // SLAY-8.4: solving a day now fires one anonymous PostHog event (src/game/playCounters.ts) --
  // unrelated to this card, which is what this check actually guards: opening/reading your own
  // local stats never itself reaches another origin. Requests to PostHog are allowed; anything
  // else would be a real leak.
  check('card: nothing but the anonymous play counters was requested from another origin (own stats stay on the device)', ((await evaluate(`performance.getEntriesByType('resource').every((e) => new URL(e.name).origin === location.origin || new URL(e.name).hostname.endsWith('.posthog.com'))`)) as boolean) === true)
  await shot('03-card-two-days')

  // Keyboard: focus starts inside the card, Tab wraps at both ends.
  check('keyboard: the focus starts on the Close button inside the card', (await focusInfo()).action === 'close')
  const wrapped = (await evaluate(`(() => { const send = (shiftKey) => { const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }); document.activeElement.dispatchEvent(e); return e.defaultPrevented }; const first = send(false); const a = document.activeElement.getAttribute('data-action'); const second = send(true); const b = document.activeElement.getAttribute('data-action'); return { first, a, second, b } })()`)) as { first: boolean; a: string; second: boolean; b: string }
  check('keyboard: Tab from the last button goes to the first, Shift+Tab back to the last (no way out behind the card)', wrapped.first && wrapped.a === 'reset' && wrapped.second && wrapped.b === 'close', JSON.stringify(wrapped))

  // Closing: the Close button, then a tap on the backdrop.
  await tapSel('[data-action=close]')
  check('Close button closes the card and gives the focus back', (await count('.stats-panel')) === 0 && (await focusInfo()).action === 'open-stats')
  await openCard()
  await tap(4, 4)
  await sleep(300)
  check('a tap on the dimmed backdrop closes the card (no scroll or focus trap)', (await count('.stats-panel')) === 0 && ((await evaluate('document.documentElement.scrollWidth <= innerWidth')) as boolean))

  // The morning after: the streak is alive (last solved day is yesterday); after a missed day it is gone, the best stays.
  await setDate(DAY3)
  await load('')
  check(`the day after (${DAY3}, day 2 not yet followed): the streak of 2 is still alive`, (await summary()) === 'Streak 2 · Best 2', await summary())
  await setDate(DAY4)
  await load('')
  check(`a day missed (${DAY4}): current streak 0, best streak 2`, (await summary()) === 'Streak 0 · Best 2', await summary())
  await openCard()
  check('card after a missed day: current streak 0, best streak 2, played and solved unchanged', (await stat('current-streak')) === '0' && (await stat('best-streak')) === '2' && (await stat('solved')) === '2')
  await shot('04-card-after-missed-day')

  // Reset asks first.
  await tapInCard('[data-action=reset]')
  check('Reset stats asks for confirmation first, in words, nothing deleted yet', (await count('[data-view=confirm]')) === 1 && /cannot be undone/.test(await textOf('.stats-confirm__text')) && (await evaluate(`localStorage.getItem(${JSON.stringify(RESULTS_KEY)}) !== null`)) === true)
  await shot('05-confirm-reset')
  const safe = await focusInfo()
  check('the confirmation starts on the safe button (keep)', safe.action === 'cancel-reset' && safe.inCard, JSON.stringify(safe))
  await tapSel('[data-action=cancel-reset]')
  check('Keep my stats returns to the card with everything still stored', (await count('[data-view=stats]')) === 1 && (await stat('solved')) === '2')
  await tapSel('[data-action=reset]')
  await tapSel('[data-action=confirm-reset]')
  check('Delete my stats: the results are gone, the card shows zeros and says so', (await stat('solved')) === '0' && (await stat('played')) === '0' && (await stat('best-streak')) === '0' && /were reset/.test(await textOf('[data-message]')) && (await evaluate(`localStorage.getItem(${JSON.stringify(RESULTS_KEY)}) === null`)) === true)
  await shot('06-after-reset')
  await tapSel('[data-action=close]')
  check('after Reset: the streak line reads zero', (await summary()) === 'Streak 0 · Best 0', await summary())
  await setDate(DAY1.date)
  await load('')
  check('after Reset: the solved day is a new puzzle again (Play, no result)', (await count('[data-action=play]')) === 1 && (await count('[data-result=solved]')) === 0)
  check('Reset kept the other settings (how-it-works seen, date override)', (await evaluate(`localStorage.getItem('slaydoku:help-seen') !== null && localStorage.getItem(${JSON.stringify(DATE_KEY)}) !== null`)) === true)
}

for (const [label, w, h] of VIEWPORTS) {
  viewport = label
  await scenario(w, h)
}

const failed = rows.filter((r) => !r.ok)
const md = [
  '| Viewport | Scenario | Result | Detail | Screenshots |',
  '|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.viewport} | ${r.scenario} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/').replace(/`/g, "'")} | ${r.shots.map((s) => `screenshots/${s}`).join(', ')} |`),
].join('\n')
await Bun.write(join(OUT, 'stats-log.md'), md + '\n')
console.log(`${rows.length} checks, ${failed.length} failures`)
chrome.kill()
process.exit(failed.length ? 1 : 0)
