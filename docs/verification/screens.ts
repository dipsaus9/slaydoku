// Rendered-screen check (SLAY-1.10): what is in the puzzle data is on the real page.
// Drives headless Chrome over the DevTools protocol (touch emulation, production build) and, for a sample of the scheduled daily
// puzzles (10 days spread over every board size and as many tiers as possible, each opened through the dev-only date override, see
// daily.ts), opens the real play screen and checks
//   1. cards: for every suspect, every card text of the puzzle data (all clues of that person, rendered with the same
//      engine function the game uses) is in the DOM of that person's polaroid, in puzzle order, and nothing else is;
//      the gift card is there, and no card line is cut off by its box. Regression for the bug where only the first card
//      of a person was shown (a person can hold several cards);
//   2. legend: every object kind drawn on the board (the icon in the board's objects layer) has a row in the Legend,
//      the Legend has no row for something that is not drawn, and the doors and windows drawn have their rows too;
//      the board draws every object of the scene.
//   3. Dutch cards (SLAY-3.2): for a smaller sample of the same days, on the first viewport only (card text does not
//      depend on viewport size), the locale toggle's stored choice (`LOCALE_KEY`) is seeded to 'nl' before the play
//      screen loads, and every suspect's card text on screen is checked against the Dutch render of the same clue.
// The sample (daily.ts, sampleDays): days dealt over the sizes 6, 7, 9 and 12 and walked evenly through the schedule, so different tiers
// and themes come up; SAMPLE=<n> changes the number of days, ALL=1 checks every scheduled day. SAMPLE_NL=<n> changes the (smaller)
// Dutch-cards sample, default 5.
//
// Usage (from the repo root):
//   bun run build && bunx vite preview --port 5217 &
//   BASE=http://localhost:5217/ CDP_PORT=9417 OUT=/tmp/screens-shots bun docs/verification/screens.ts
// Env: VIEWPORTS (default 390x844,844x390,768x1024,1024x768), BASE (default local preview), CDP_PORT (default 9354),
// CHROME, OUT (folder for screenshots and the log; default a folder under the system temp dir, never inside the repo),
// SAMPLE (number of scheduled days, default 10), SAMPLE_NL (Dutch-cards sample, default 5), ALL=1 (every scheduled day
// instead of the sample). Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Puzzle } from '../../src/engine/model/index.ts'
import type { CatalogClue } from '../../src/engine/clues/index.ts'
import { VICTIM_TEXT, renderClue } from '../../src/engine/clues/en.ts'
import { VICTIM_TEXT_NL } from '../../src/engine/clues/nl.ts'
import { renderClue as renderClueLocale } from '../../src/engine/clues/render.ts'
import { DAYS, sampleDays, seedStorage } from './daily.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9354)
const BASE = process.env.BASE ?? 'http://localhost:5197/'
const SHOTS = process.env.OUT ?? join(tmpdir(), 'slaydoku-screens-shots')
const VIEWPORTS = (process.env.VIEWPORTS ?? '390x844,844x390,768x1024,1024x768')
  .split(',')
  .map((label) => [label, ...label.split('x').map(Number)] as [string, number, number])

mkdirSync(SHOTS, { recursive: true })
const profile = mkdtempSync(join(tmpdir(), 'chrome-screens-'))
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
async function load(path: string) {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await send('Page.navigate', { url: new URL(path, BASE).href })
}
async function tapAt(x: number, y: number) {
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
  await sleep(60)
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await sleep(300)
}
/** Taps a toolbar control by its accessible name (SLAY-5.1: icon-only, so aria-label — or a
 * header/sheet item's visible label), like a finger would (scrolled into view first). */
async function tool(label: string) {
  const r = (await evaluate(`(() => { const e = [...document.querySelectorAll('.play-tool, .play-header__more')].find(b => (b.querySelector('.play-tool__label')?.textContent.trim() ?? b.getAttribute('aria-label')) === ${JSON.stringify(label)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)) as { x: number; y: number } | null
  if (!r) throw new Error('missing tool ' + label)
  await tapAt(r.x, r.y)
}
const shot = async (name: string) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 })
  await Bun.write(join(SHOTS, `${viewport}-${name}.jpg`), Buffer.from(r.data, 'base64'))
}

// --- logging ---------------------------------------------------------------------------------
interface Row { viewport: string; scenario: string; ok: boolean; detail: string }
const rows: Row[] = []
let viewport = ''
function check(scenario: string, ok: boolean, detail = '') {
  rows.push({ viewport, scenario, ok, detail })
  console.log(ok ? 'PASS' : 'FAIL', viewport, scenario, detail)
}

// --- the puzzles under test ------------------------------------------------------------------
interface Subject { name: string; date: string; puzzle: Puzzle; why: string }
const days = process.env.ALL ? DAYS : sampleDays(Number(process.env.SAMPLE ?? 10))
const subjects: Subject[] = days.map((day) => ({ name: `day${day.n}`, date: day.date, puzzle: day.puzzle, why: `${day.date} ${day.size}x${day.size} ${day.tier} ${day.theme}` }))
console.log(`${subjects.length} puzzles under test:`, subjects.map((s) => `${s.why}`).join(' '))
const maxCards = (p: Puzzle) => Math.max(0, ...p.people.map((person) => p.clues.filter((c) => c.personId === person.id).length))

// --- probes ----------------------------------------------------------------------------------
interface CardDom { name: string; gift: boolean; lines: string[]; clipped: number }
const cardsOnScreen = () =>
  evaluate(`JSON.stringify([...document.querySelectorAll('.play-cards li')].map(li => ({ name: li.querySelector('.polaroid__name')?.textContent ?? '', gift: !!li.querySelector('.polaroid--victim'), lines: [...li.querySelectorAll('.polaroid__line')].map(l => l.textContent), clipped: [...li.querySelectorAll('.polaroid__line')].filter(l => l.scrollHeight > l.clientHeight + 1 || l.scrollWidth > l.clientWidth + 1).length })))`).then((s: string) => JSON.parse(s) as CardDom[])
const boardDrawn = () =>
  evaluate(`JSON.stringify({ objects: [...document.querySelectorAll('.play-board [data-layer=objects] g[data-object]')].map(g => { const i = g.querySelector('[data-theme-icon], [data-icon]'); return i ? (i.dataset.themeIcon ?? i.dataset.icon) : null }), edges: [...new Set([...document.querySelectorAll('.play-board [data-layer=edge-features] [data-feature]')].map(g => g.dataset.feature))].sort() })`).then((s: string) => JSON.parse(s) as { objects: (string | null)[]; edges: string[] })
const legendOnScreen = () =>
  evaluate(`JSON.stringify({ objects: [...document.querySelectorAll('[data-legend-list=objects] .play-legend__icon')].map(s => s.dataset.icon), edges: [...document.querySelectorAll('[data-legend-list=edges] button')].map(b => b.dataset.legend).sort() })`).then((s: string) => JSON.parse(s) as { objects: string[]; edges: string[] })

async function subjectCheck(subject: Subject) {
  const { puzzle, name } = subject
  const label = name
  // Locale pinned to 'en' (SLAY-3.2): without it, a browser whose own language is Dutch would default the play
  // screen to Dutch (SLAY-3.1's locale toggle falls back to the browser's language) and break every assertion here.
  await evaluate(seedStorage(subject.date, true, 'en'))
  await load('play')
  const open = await until(`document.querySelectorAll('.play-board').length === 1 && document.querySelectorAll('.play-cards li').length > 0`, 15000)
  check(`${label}: the play screen opens (${subject.why})`, open && (await evaluate(`document.querySelectorAll('.play-modal').length`)) === 0)
  if (!open) return

  // 1. every card text of every person
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const context = { scene: puzzle.scene, people: puzzle.people }
  const expected = suspects.map((p) => ({ name: p.label, lines: puzzle.clues.filter((c) => c.personId === p.id).map((c) => renderClue(c as CatalogClue, context)) }))
  const cards = await cardsOnScreen()
  const suspectCards = cards.filter((c) => !c.gift)
  const nCards = puzzle.clues.length
  const giftCards = cards.filter((c) => c.gift)
  const victim = puzzle.people.find((p) => p.kind === 'victim')
  // The gift is a person of the puzzle too, and holds one clue, the rule that the murderer ends up alone with it: its card carries the fixed line of the gift (VICTIM_TEXT), not a generated sentence.
  const giftClues = victim ? puzzle.clues.filter((c) => c.personId === victim.id) : []
  const giftWant = giftClues.length === 1 && giftClues[0]!.type === 'aloneWithMurderer' ? [VICTIM_TEXT.clue] : giftClues.map((c) => renderClue(c as CatalogClue, context))
  const onScreenLines = cards.reduce((n, c) => n + c.lines.length, 0)
  check(`${label}: one polaroid per suspect (${suspects.length}) plus the gift card`, suspectCards.length === suspects.length && cards.filter((c) => c.gift).length === 1, `${suspectCards.length} suspect cards, ${cards.length - suspectCards.length} gift`)
  const mismatches = expected.filter((e, i) => JSON.stringify(e) !== JSON.stringify({ name: suspectCards[i]?.name, lines: suspectCards[i]?.lines }))
  check(`${label}: every card text of every person, gift included, is on the screen, in puzzle order (${nCards} cards, ${onScreenLines} on screen)`, mismatches.length === 0 && giftCards.length === 1 && JSON.stringify(giftCards[0]!.lines) === JSON.stringify(giftWant) && onScreenLines === nCards, mismatches.slice(0, 2).map((m) => `${m.name}: want ${JSON.stringify(m.lines)}`).join(' / ') + (giftCards[0] && JSON.stringify(giftCards[0].lines) !== JSON.stringify(giftWant) ? ` gift card: want ${JSON.stringify(giftWant)}, got ${JSON.stringify(giftCards[0].lines)}` : ''))
  const multi = expected.filter((e) => e.lines.length > 1)
  if (multi.length > 0) {
    const worst = multi.reduce((a, b) => (b.lines.length > a.lines.length ? b : a))
    check(`${label}: ${multi.length} person(s) hold several cards and show all of them (most: ${worst.name} with ${worst.lines.length})`, mismatches.length === 0)
  }
  check(`${label}: no card line is cut off by its box`, cards.every((c) => c.clipped === 0), cards.filter((c) => c.clipped > 0).map((c) => c.name).join(', '))
  if (subject === subjects[0] || maxCards(puzzle) >= 4) await shot(`${name}-cards`)

  // 2. every object drawn on the board has a legend row
  const board = await boardDrawn()
  check(`${label}: the board draws all ${puzzle.scene.objects.length} objects of the scene, each with an icon`, board.objects.length === puzzle.scene.objects.length && board.objects.every((o) => o !== null), `${board.objects.length} drawn`)
  await tool('More') // Legend sits behind the header's settings icon (SLAY-5.1)
  await tool('Legend')
  const opened = await until(`document.querySelector('.play-modal__title')?.textContent === 'Legend'`, 3000)
  check(`${label}: the Legend opens from the header's settings icon`, opened)
  if (!opened) return
  const legend = await legendOnScreen()
  const drawn = new Set(board.objects.filter((o): o is string => o !== null))
  const listed = new Set(legend.objects)
  const missing = [...drawn].filter((k) => !listed.has(k))
  const extra = [...listed].filter((k) => !drawn.has(k))
  check(`${label}: every object kind drawn on the board has a legend row (${drawn.size} kinds)`, missing.length === 0, missing.length ? `no row for ${missing.join(', ')}` : [...drawn].join(' '))
  check(`${label}: the Legend lists no kind that is not drawn, and no kind twice`, extra.length === 0 && legend.objects.length === listed.size, extra.length ? `not drawn: ${extra.join(', ')}` : `${legend.objects.length} rows`)
  check(`${label}: doors and windows drawn have exactly their legend rows`, JSON.stringify(board.edges) === JSON.stringify(legend.edges), `board ${board.edges.join('+') || 'none'}, legend ${legend.edges.join('+') || 'none'}`)
  if (subject === subjects[0]) await shot(`${name}-legend`)
  await tapAt(3, 3)
}

// --- Dutch cards (SLAY-3.2): a smaller sample, cards only, one viewport --------------------------------------------
const subjectsNl: Subject[] = (process.env.ALL ? DAYS : sampleDays(Number(process.env.SAMPLE_NL ?? 5))).map((day) => ({
  name: `day${day.n}`,
  date: day.date,
  puzzle: day.puzzle,
  why: `${day.date} ${day.size}x${day.size} ${day.tier} ${day.theme}`,
}))

async function subjectCheckNl(subject: Subject) {
  const { puzzle, name } = subject
  const label = `${name} (nl)`
  await evaluate(seedStorage(subject.date, true, 'nl'))
  await load('play')
  const open = await until(`document.querySelectorAll('.play-board').length === 1 && document.querySelectorAll('.play-cards li').length > 0`, 15000)
  check(`${label}: the play screen opens in Dutch (${subject.why})`, open && (await evaluate(`document.querySelectorAll('.play-modal').length`)) === 0)
  if (!open) return

  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const context = { scene: puzzle.scene, people: puzzle.people }
  const expected = suspects.map((p) => ({ name: p.label, lines: puzzle.clues.filter((c) => c.personId === p.id).map((c) => renderClueLocale(c as CatalogClue, context, 'nl')) }))
  const cards = await cardsOnScreen()
  const suspectCards = cards.filter((c) => !c.gift)
  const giftCards = cards.filter((c) => c.gift)
  const victim = puzzle.people.find((p) => p.kind === 'victim')
  const giftClues = victim ? puzzle.clues.filter((c) => c.personId === victim.id) : []
  const giftWant = giftClues.length === 1 && giftClues[0]!.type === 'aloneWithMurderer' ? [VICTIM_TEXT_NL.clue] : giftClues.map((c) => renderClueLocale(c as CatalogClue, context, 'nl'))
  const mismatches = expected.filter((e, i) => JSON.stringify(e) !== JSON.stringify({ name: suspectCards[i]?.name, lines: suspectCards[i]?.lines }))
  check(
    `${label}: every card's Dutch text of every person, gift included, is on the screen, in puzzle order (${puzzle.clues.length} cards)`,
    mismatches.length === 0 && giftCards.length === 1 && JSON.stringify(giftCards[0]!.lines) === JSON.stringify(giftWant),
    mismatches.slice(0, 2).map((m) => `${m.name}: want ${JSON.stringify(m.lines)}`).join(' / ') + (giftCards[0] && JSON.stringify(giftCards[0].lines) !== JSON.stringify(giftWant) ? ` gift card: want ${JSON.stringify(giftWant)}, got ${JSON.stringify(giftCards[0].lines)}` : ''),
  )
}

for (const [label, w, h] of VIEWPORTS) {
  viewport = label
  await setViewport(w, h)
  await send('Page.enable')
  await send('Runtime.enable')
  await load('')
  await sleep(1200)
  for (const subject of subjects) await subjectCheck(subject)
  if (label === VIEWPORTS[0]?.[0]) for (const subject of subjectsNl) await subjectCheckNl(subject)
  await evaluate('localStorage.clear()')
}

const failed = rows.filter((r) => !r.ok)
const md = ['| Viewport | Check | Result | Detail |', '|---|---|---|---|', ...rows.map((r) => `| ${r.viewport} | ${r.scenario} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/')} |`)].join('\n')
await Bun.write(join(SHOTS, 'screens-log.md'), md + '\n')
console.log(`${rows.length} checks, ${failed.length} failures`)
chrome.kill()
process.exit(failed.length ? 1 : 0)
