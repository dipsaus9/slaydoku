// Rendered-screen check (CAD-10.7): what is in the puzzle data is on the real page.
// Drives headless Chrome over the DevTools protocol (touch emulation, production build) and, for the demo level and, when pack files are
// on disk, for a sample of pack cases, opens the real play screen and checks
//   1. cards: for every suspect, every card text of the puzzle data (all clues of that person, rendered with the same
//      engine function the game uses) is in the DOM of that person's polaroid, in puzzle order, and nothing else is;
//      the gift card is there, and no card line is cut off by its box. Regression for the bug where only the first card
//      of a person was shown (a person can hold several cards);
//   2. legend: every object kind drawn on the board (the icon in the board's objects layer) has a row in the Legenda,
//      the Legenda has no row for something that is not drawn, and the doors and windows drawn have their rows too;
//      the board draws every object of the scene.
// The sample: per board size the first very-easy case, the last expert case and the case where one person holds the most
// cards, plus every case whose scene has a kind of object the other samples do not show. The demo level is always in.
//
// Usage (from the repo root):
//   bun run build && bunx vite preview --port 5217 &
//   BASE=http://localhost:5217/ CDP_PORT=9417 OUT=/tmp/screens-shots bun docs/verification/screens.ts
// Env: VIEWPORTS (default 390x844,844x390,768x1024,1024x768), BASE (default local preview), CDP_PORT (default 9354),
// CHROME, OUT (folder for screenshots and the log; default a folder under the system temp dir, never inside the repo),
// ALL=1 (check every case of every pack file instead of the sample). Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parsePuzzle } from '../../src/engine/model/index.ts'
import type { Puzzle } from '../../src/engine/model/index.ts'
import type { CatalogClue } from '../../src/engine/clues/index.ts'
import { GIFT_NL, renderClue } from '../../src/engine/clues/nl.ts'
import { parsePackFile } from '../../src/content/packs/read.ts'
import { puzzleFingerprint } from '../../src/game/fingerprint.ts'
import { help } from '../../src/content/help/help.ts'

const HERE = import.meta.dir
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9354)
const BASE = process.env.BASE ?? 'http://localhost:5197/'
const SHOTS = process.env.OUT ?? join(tmpdir(), 'slaydoku-screens-shots')
const HOUSES = ['demo'] as const
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
/** Taps a toolbar button by its label, like a finger would (scrolled into view first). */
async function tool(label: string) {
  const r = (await evaluate(`(() => { const e = [...document.querySelectorAll('.play-tool')].find(b => b.querySelector('.play-tool__label')?.textContent.trim() === ${JSON.stringify(label)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)) as { x: number; y: number } | null
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
interface Subject { name: string; url: string; puzzle: Puzzle; why: string }
const puzzleFile = (id: string) => {
  const parsed = parsePuzzle(readFileSync(join(HERE, `../../src/content/${id}/puzzle.json`), 'utf8'))
  if (!parsed.ok) throw new Error(id)
  return parsed.value
}
const PACK_DIR = join(HERE, '../../src/content/packs')
const entries = readdirSync(PACK_DIR)
  .filter((f) => /^\d+-[a-z-]+\.json$/.test(f))
  .flatMap((f) => parsePackFile(readFileSync(join(PACK_DIR, f), 'utf8'), f).puzzles)
const maxCards = (p: Puzzle) => Math.max(0, ...p.people.map((person) => p.clues.filter((c) => c.personId === person.id).length))
/** The drawn kinds of the scene, by engine type: what the legend must list. Used to spot cases that add a new kind to the sample. */
const kindsOf = (p: Puzzle) => new Set(p.scene.objects.map((o) => `${o.type}:${o.id.replace(/-\d+$/, '')}`))

function sample(): Subject[] {
  const picked = new Map<string, Subject>()
  const add = (id: string, why: string) => {
    const e = entries.find((x) => x.id === id)!
    if (!picked.has(id)) picked.set(id, { name: id, url: `extras/${id}`, puzzle: e.puzzle, why })
  }
  if (process.env.ALL) {
    for (const e of entries) add(e.id, 'all')
    return [...picked.values()]
  }
  const sizes = [...new Set(entries.map((e) => e.size))].sort((a, b) => a - b)
  for (const size of sizes) {
    const own = entries.filter((e) => e.size === size)
    const first = own.find((e) => e.tier === 'very-easy')
    const last = [...own].reverse().find((e) => e.tier === 'expert')
    const most = [...own].sort((a, b) => maxCards(b.puzzle) - maxCards(a.puzzle))[0]
    if (first) add(first.id, `${size}x${size} first very-easy`)
    if (last) add(last.id, `${size}x${size} last expert`)
    if (most) add(most.id, `${size}x${size} most cards on one person (${maxCards(most.puzzle)})`)
  }
  // Kinds of objects (theme art) that none of the cases above show: one more case each, so every theme kind is drawn once.
  const seen = new Set([...picked.values()].flatMap((s) => [...kindsOf(s.puzzle)]))
  for (const e of entries) {
    const fresh = [...kindsOf(e.puzzle)].filter((k) => !seen.has(k))
    if (fresh.length === 0) continue
    add(e.id, `adds kinds ${fresh.join(', ')}`)
    for (const k of kindsOf(e.puzzle)) seen.add(k)
  }
  return [...picked.values()]
}
const subjects: Subject[] = [
  ...HOUSES.map((id) => ({ name: id, url: `level/${id}`, puzzle: puzzleFile(id), why: 'demo level' })),
  ...sample(),
]
console.log(`${subjects.length} puzzles under test:`, subjects.map((s) => s.name).join(' '))
// Every level solved and the how-it-works card already seen: written straight into localStorage.
const progress = JSON.stringify({ version: 2, solved: Object.fromEntries(HOUSES.map((id) => [id, { murdererId: 'x', elapsedMs: 1000, fp: puzzleFingerprint(puzzleFile(id)) }])) })
const seeded = `localStorage.setItem('slaydoku:progress', ${JSON.stringify(progress)}); localStorage.setItem('slaydoku:help-seen', '{"version":${help.version}}')`

// --- probes ----------------------------------------------------------------------------------
interface CardDom { name: string; gift: boolean; lines: string[]; clipped: number }
const cardsOnScreen = () =>
  evaluate(`JSON.stringify([...document.querySelectorAll('.play-cards li')].map(li => ({ name: li.querySelector('.polaroid__name')?.textContent ?? '', gift: !!li.querySelector('.polaroid--gift'), lines: [...li.querySelectorAll('.polaroid__line')].map(l => l.textContent), clipped: [...li.querySelectorAll('.polaroid__line')].filter(l => l.scrollHeight > l.clientHeight + 1 || l.scrollWidth > l.clientWidth + 1).length })))`).then((s: string) => JSON.parse(s) as CardDom[])
const boardDrawn = () =>
  evaluate(`JSON.stringify({ objects: [...document.querySelectorAll('.play-board [data-layer=objects] g[data-object]')].map(g => { const i = g.querySelector('[data-theme-icon], [data-icon]'); return i ? (i.dataset.themeIcon ?? i.dataset.icon) : null }), edges: [...new Set([...document.querySelectorAll('.play-board [data-layer=edge-features] [data-feature]')].map(g => g.dataset.feature))].sort() })`).then((s: string) => JSON.parse(s) as { objects: (string | null)[]; edges: string[] })
const legendOnScreen = () =>
  evaluate(`JSON.stringify({ objects: [...document.querySelectorAll('[data-legend-list=objects] .play-legend__icon')].map(s => s.dataset.icon), edges: [...document.querySelectorAll('[data-legend-list=edges] button')].map(b => b.dataset.legend).sort() })`).then((s: string) => JSON.parse(s) as { objects: string[]; edges: string[] })

async function subjectCheck(subject: Subject) {
  const { puzzle, name } = subject
  const label = name
  await load(subject.url)
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
  // The gift is a person of the puzzle too, and holds one clue, the rule that the murderer ends up alone with it: its card carries the fixed line of the gift (GIFT_NL), not a generated sentence.
  const giftClues = victim ? puzzle.clues.filter((c) => c.personId === victim.id) : []
  const giftWant = giftClues.length === 1 && giftClues[0]!.type === 'aloneWithMurderer' ? [GIFT_NL.clue] : giftClues.map((c) => renderClue(c as CatalogClue, context))
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
  if (subject.why === 'demo level' || /most cards/.test(subject.why)) await shot(`${name}-cards`)

  // 2. every object drawn on the board has a legend row
  const board = await boardDrawn()
  check(`${label}: the board draws all ${puzzle.scene.objects.length} objects of the scene, each with an icon`, board.objects.length === puzzle.scene.objects.length && board.objects.every((o) => o !== null), `${board.objects.length} drawn`)
  await tool('Legenda')
  const opened = await until(`document.querySelector('.play-modal__title')?.textContent === 'Legenda'`, 3000)
  check(`${label}: the Legenda opens from the toolbar`, opened)
  if (!opened) return
  const legend = await legendOnScreen()
  const drawn = new Set(board.objects.filter((o): o is string => o !== null))
  const listed = new Set(legend.objects)
  const missing = [...drawn].filter((k) => !listed.has(k))
  const extra = [...listed].filter((k) => !drawn.has(k))
  check(`${label}: every object kind drawn on the board has a legend row (${drawn.size} kinds)`, missing.length === 0, missing.length ? `no row for ${missing.join(', ')}` : [...drawn].join(' '))
  check(`${label}: the Legenda lists no kind that is not drawn, and no kind twice`, extra.length === 0 && legend.objects.length === listed.size, extra.length ? `not drawn: ${extra.join(', ')}` : `${legend.objects.length} rows`)
  check(`${label}: doors and windows drawn have exactly their legend rows`, JSON.stringify(board.edges) === JSON.stringify(legend.edges), `board ${board.edges.join('+') || 'none'}, legend ${legend.edges.join('+') || 'none'}`)
  if (subject.why === 'demo level') await shot(`${name}-legend`)
  await tapAt(3, 3)
}

for (const [label, w, h] of VIEWPORTS) {
  viewport = label
  await setViewport(w, h)
  await send('Page.enable')
  await send('Runtime.enable')
  await load('')
  await sleep(1200)
  await evaluate(seeded)
  for (const subject of subjects) await subjectCheck(subject)
  await evaluate('localStorage.clear()')
}

const failed = rows.filter((r) => !r.ok)
const md = ['| Viewport | Check | Result | Detail |', '|---|---|---|---|', ...rows.map((r) => `| ${r.viewport} | ${r.scenario} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/')} |`)].join('\n')
await Bun.write(join(SHOTS, 'screens-log.md'), md + '\n')
console.log(`${rows.length} checks, ${failed.length} failures`)
chrome.kill()
process.exit(failed.length ? 1 : 0)
