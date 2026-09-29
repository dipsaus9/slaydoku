// Board-zoom verification driver.
// Drives headless Chrome over the DevTools protocol with touch emulation and checks the board zoom of the play
// screen on the puzzle of 2026-11-21 (date override, see daily.ts; a 9x9 board): two-finger pinch and pan (two real
// touch points via Input.dispatchTouchEvent; the toolbar had a Zoom button once, but it's gone since SLAY-9.8 —
// pinch/ctrl+wheel already covered it), clamping, one-finger notes / long-press placement / drag-notes on a zoomed board landing
// on the right square, a pinch cancelling a running one-finger gesture, hints coming into view, and the reset on
// restart, on leaving the puzzle and on reload. The "right square" is computed independently of the app: from where the
// board's svg is drawn on screen (its transformed bounding box) and the cell rects of the svg.
//
// Usage (from the repo root):
//   bun run build && bunx vite preview --port 5214 &
//   BASE=http://localhost:5214/ CDP_PORT=9412 bun docs/verification/zoom.ts
// Env: VIEWPORTS (default 390x844,844x390,1024x768), BASE (default local preview), CDP_PORT (Chrome debugging port,
// default 9352), CHROME, OUT (folder for screenshots; default docs/verification/screenshots-zoom, set it to a folder
// outside the repo to keep the repo clean). Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isBlocked } from '../../src/game/board.ts'
import { PLAY_DATE, dayOn, seedStorage } from './daily.ts'

const HERE = import.meta.dir
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9352)
const BASE = process.env.BASE ?? 'http://localhost:5197/'
const SHOTS = process.env.OUT ?? join(HERE, 'screenshots-zoom')
const DAY = dayOn(PLAY_DATE)
const VIEWPORTS = (process.env.VIEWPORTS ?? '390x844,844x390,1024x768')
  .split(',')
  .map((label) => [label, ...label.split('x').map(Number)] as [string, number, number])

mkdirSync(SHOTS, { recursive: true })
const profile = mkdtempSync(join(tmpdir(), 'chrome-zoom-'))
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

// --- touch -----------------------------------------------------------------------------------
interface P { x: number; y: number }
type Points = P[]
const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', points: Points) =>
  send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : points.map((p, i) => ({ x: p.x, y: p.y, id: i + 1 })) })
async function tap(p: P) { await touch('touchStart', [p]); await sleep(60); await touch('touchEnd', [p]) }
async function hold(p: P, ms = 700) { await touch('touchStart', [p]); await sleep(ms); await touch('touchEnd', [p]) }
/** One finger drag from a to b in steps. */
async function drag(a: P, b: P, steps = 10) {
  await touch('touchStart', [a])
  for (let i = 1; i <= steps; i++) {
    await sleep(25)
    await touch('touchMove', [{ x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps }])
  }
  await sleep(40)
  await touch('touchEnd', [b])
}
/** Two fingers: `a` and `b` are the start pairs, `c` and `d` where they end. The first finger lands alone, then the second. */
async function twoFingers(a: P, b: P, c: P, d: P, steps = 12, holdAfterSecond = 0) {
  await touch('touchStart', [a])
  await sleep(50)
  await touch('touchStart', [a, b])
  if (holdAfterSecond) await sleep(holdAfterSecond)
  for (let i = 1; i <= steps; i++) {
    await sleep(25)
    const t = i / steps
    await touch('touchMove', [
      { x: a.x + (c.x - a.x) * t, y: a.y + (c.y - a.y) * t },
      { x: b.x + (d.x - b.x) * t, y: b.y + (d.y - b.y) * t },
    ])
  }
  await sleep(50)
  await touch('touchEnd', [c, d])
  await sleep(150)
}

// --- page probes -----------------------------------------------------------------------------
interface Rect { x: number; y: number; w: number; h: number; l: number; t: number; r: number; b: number }
const rectJs = (sel: string, scroll: boolean) =>
  `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; ${scroll ? "e.scrollIntoView({ block: 'nearest', inline: 'nearest' });" : ''} const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, l: r.left, t: r.top, r: r.right, b: r.bottom } })()`
const rectOf = (sel: string, scroll = true) => evaluate(rectJs(sel, scroll)) as Promise<Rect | null>
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
  await tap(r)
  // 400ms, not 250: a tool can sit inside a dialog that just opened (Options/Help/Legend behind
  // the header's settings icon, SLAY-5.1), and a click within the first 350ms of a dialog opening
  // is ignored (ghost-click guard, modalGuard.ts).
  await sleep(400)
}
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>
const path = () => evaluate('location.pathname') as Promise<string>
const zoomOf = () => evaluate(`Number(document.querySelector('.play-board')?.dataset.zoom)`) as Promise<number>
/** The frame: the fixed box of the board on screen (scrolled into view). */
const frame = () => rectOf('.play-board') as Promise<Rect>
/** The drawn board (the svg inside the scaled pane) on screen. */
const drawn = () => rectOf('.play-board svg', false) as Promise<Rect>
const dataOf = () => evaluate(`JSON.stringify([...document.querySelectorAll('[data-note]')].map(n => n.getAttribute('data-note')))`).then((s) => JSON.parse(s as string) as string[])
// minTool only counts .play-tool elements actually on screen: Options/Help now render twice
// (SLAY-9.2, a direct header copy plus the More sheet's copy) and CSS, not the DOM, decides which
// pair is visible at a given width -- the hidden pair sits at 0x0 and must not drag the minimum down.
const layoutProbe = () =>
  evaluate(`JSON.stringify({ iw: innerWidth, sw: document.documentElement.scrollWidth, minTool: Math.round(Math.min(...[...document.querySelectorAll('.play-tool')].filter(b => b.offsetParent !== null).map(b => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height)))) })`).then((s) => JSON.parse(s as string) as { iw: number; sw: number; minTool: number })

/**
 * Which cell is drawn under a screen point, computed from the svg's own transformed box and the hit rects' user-unit
 * geometry (never from elementFromPoint, which is what the app uses).
 */
const oracle = (p: P) =>
  evaluate(`(() => {
    const svg = document.querySelector('.play-board svg'); const r = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal;
    const first = svg.querySelector('[data-cell=r1c1]'); const ox = Number(first.getAttribute('x')), oy = Number(first.getAttribute('y')), size = Number(first.getAttribute('width'));
    const bx = (${p.x} - r.left) / r.width * vb.width, by = (${p.y} - r.top) / r.height * vb.height;
    return { row: Math.floor((by - oy) / size), col: Math.floor((bx - ox) / size) };
  })()`) as Promise<{ row: number; col: number }>
/** The cell a point would resolve to on the unzoomed board: the point's place in the frame, mapped without the view. */
const naive = async (p: P) => {
  const f = await frame()
  const d = await drawn()
  const zoom = await zoomOf()
  // frame origin equals the svg origin at 1x
  return evaluate(`(() => {
    const svg = document.querySelector('.play-board svg'); const vb = svg.viewBox.baseVal;
    const first = svg.querySelector('[data-cell=r1c1]'); const ox = Number(first.getAttribute('x')), oy = Number(first.getAttribute('y')), size = Number(first.getAttribute('width'));
    const bx = (${p.x} - ${f.l}) / ${f.w} * vb.width, by = (${p.y} - ${f.t}) / ${f.h} * vb.height;
    return { row: Math.floor((by - oy) / size), col: Math.floor((bx - ox) / size), zoom: ${zoom}, drawnW: ${d.w} };
  })()`) as Promise<{ row: number; col: number }>
}
const centerOfCell = async (row: number, col: number) => (await rectOf(`[data-cell=r${row + 1}c${col + 1}]`, false))!

// --- logging ---------------------------------------------------------------------------------
interface Row { viewport: string; scenario: string; ok: boolean; detail: string }
const rows: Row[] = []
let viewport = ''
function check(scenario: string, ok: boolean, detail = '') {
  rows.push({ viewport, scenario, ok, detail })
  console.log(ok ? 'PASS' : 'FAIL', viewport, scenario, detail)
}
async function shot(name: string) {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 })
  await Bun.write(join(SHOTS, `${viewport}-${name}.jpg`), Buffer.from(r.data, 'base64'))
}
const near = (a: number, b: number, tol = 0.02) => Math.abs(a - b) <= tol
const same = (a: { row: number; col: number }, b: { row: number; col: number }) => a.row === b.row && a.col === b.col

interface PuzzleJson { people: { id: string; label: string; kind: string }[]; solution: { personId: string; cell: { row: number; col: number } }[] }
const puzzle = DAY.puzzle as unknown as PuzzleJson

const selectedName = () =>
  evaluate(`(document.querySelector('.play-cards[data-victim-selected]') ? 'The victim' : document.querySelector('.polaroid[data-selected] .polaroid__name')?.textContent) ?? 'NONE'`) as Promise<string>

/** The pane must always cover the frame: pan is clamped to the board edges. */
async function covers() {
  const f = await frame()
  const d = await drawn()
  const eps = 1.5
  return d.l <= f.l + eps && d.t <= f.t + eps && d.r >= f.r - eps && d.b >= f.b - eps
}

// The toolbar's Zoom button is gone (SLAY-9.8: pinch/ctrl+wheel already covered it), so every place
// this driver used to click it now pinches instead, from the frame's centre.
/** Pinch out enough that, starting from 1x, the board lands close to 2x. */
async function pinchZoomIn() {
  const f = await frame()
  const cx = f.l + f.w / 2
  const cy = f.t + f.h / 2
  await twoFingers({ x: cx - 30, y: cy }, { x: cx + 30, y: cy }, { x: cx - 60, y: cy }, { x: cx + 60, y: cy })
}
/** Pinch in hard enough, from any starting zoom, that the scale clamps down to 1x. */
async function pinchZoomReset() {
  const f = await frame()
  const cx = f.l + f.w / 2
  const cy = f.t + f.h / 2
  await twoFingers({ x: cx - 100, y: cy }, { x: cx + 100, y: cy }, { x: cx - 10, y: cy }, { x: cx + 10, y: cy })
}

async function openLevel() {
  await evaluate(`document.querySelector('[data-action]').click()`)
  await sleep(1200)
  // The first Play opens the "How it works" card: dismiss it to get to the board.
  await evaluate(`[...document.querySelectorAll('.play-modal button')].find(b => b.innerText.trim() === 'Start playing')?.click()`)
  await sleep(300)
}
async function leaveLevel() {
  await evaluate(`document.querySelector('.daily-play__back').click()`)
  await sleep(600)
}

async function run(w: number, h: number) {
  await open(w, h)
  // Locale pinned to 'en' (SLAY-4.2, the same fix screens.ts already carried from SLAY-3.2): a Dutch browser language
  // would otherwise default the play screen to Dutch and break the English-text checks below (e.g. "Start playing").
  await evaluate(`localStorage.clear(); ${seedStorage(PLAY_DATE, false, 'en')}`)
  await reload()
  await openLevel()
  check('the puzzle opens at /play', (await path()) === '/play', await path())

  // ---- pinch zoom -------------------------------------------------------------------------
  const lay = await layoutProbe()
  check('all toolbar targets >= 44px, no horizontal scroll', lay.minTool >= 44 && lay.sw <= lay.iw, JSON.stringify(lay))
  const f1 = await frame()
  const d1 = await drawn()
  check('at 1x the drawn board fills the frame exactly', near(d1.w, f1.w, 0.5) && near(d1.h, f1.h, 0.5) && near(d1.l, f1.l, 0.5) && near(d1.t, f1.t, 0.5), `frame ${Math.round(f1.w)}x${Math.round(f1.h)} drawn ${Math.round(d1.w)}x${Math.round(d1.h)}`)
  await shot('01-1x')

  await pinchZoomIn()
  const f2 = await frame()
  const d2 = await drawn()
  check('pinch out zooms to 2x', near(await zoomOf(), 2, 0.1), `zoom ${await zoomOf()}`)
  check('pinch zoom: drawn board is 2x the frame and covers it', near(d2.w, f2.w * 2, 1) && near(d2.h, f2.h * 2, 1) && (await covers()), `drawn ${Math.round(d2.w)}x${Math.round(d2.h)} in frame ${Math.round(f2.w)}x${Math.round(f2.h)}`)
  check('the frame itself did not move or resize when zooming', near(f2.w, f1.w, 0.5) && near(f2.h, f1.h, 0.5) && near(f2.l, f1.l, 0.5), `${Math.round(f1.l)},${Math.round(f1.t)} -> ${Math.round(f2.l)},${Math.round(f2.t)}`)
  const cellSize1 = (await centerOfCell(4, 4)).w
  check('a cell is at least 60px at 2x (touch target)', cellSize1 >= 60, `cell ${Math.round(cellSize1)}px`)
  check('no horizontal scroll while zoomed', (await layoutProbe()).sw <= w)
  await shot('02-2x-pinch')

  // ---- one finger on a zoomed board -----------------------------------------------------
  // taps at spots of the frame: the note must land on the cell drawn under the finger, not the 1x cell of that spot
  const f = await frame()
  let differs = 0
  let tested = 0
  // A blocked square (a table, a plant) takes no note while "no X on blocked squares" is on: those spots are skipped, the next candidate is used.
  for (const [fx, fy] of [[0.2, 0.25], [0.75, 0.3], [0.35, 0.8], [0.8, 0.85], [0.5, 0.5], [0.6, 0.65], [0.3, 0.45], [0.9, 0.2], [0.15, 0.7], [0.65, 0.15], [0.45, 0.9], [0.85, 0.55]] as const) {
    if (tested === 5) break
    const before = await dataOf()
    const p = { x: f.l + f.w * fx, y: f.t + f.h * fy }
    const want = await oracle(p)
    if (isBlocked(DAY.puzzle, want)) continue
    tested++
    const naiveCell = await naive(p)
    if (!same(want, naiveCell)) differs++
    await tap(p)
    await sleep(200)
    const after = await dataOf()
    const added = after.filter((n) => !before.includes(n)).map((n) => n.split(':')[0])
    check(`tap at (${fx},${fy}) of the frame notes the drawn cell r${want.row + 1}c${want.col + 1}`, added.length === 1 && added[0] === `${want.row},${want.col}`, `added ${JSON.stringify(added)} (1x cell there: r${naiveCell.row + 1}c${naiveCell.col + 1})`)
  }
  check('the zoom mattered: at least 3 of the 5 taps land on another cell than at 1x', differs >= 3, `${differs} of 5`)
  await tool('Undo') // notes are removed again one by one
  for (let i = 0; i < 4; i++) await tool('Undo')
  check('undo removes those notes', (await count('[data-note]')) === 0)

  // drag-notes across cells on the zoomed board
  const a = { x: f.l + f.w * 0.2, y: f.t + f.h * 0.5 }
  const b = { x: f.l + f.w * 0.8, y: f.t + f.h * 0.5 }
  const wantA = await oracle(a)
  const wantB = await oracle(b)
  await drag(a, b, 14)
  await sleep(200)
  const painted = (await dataOf()).map((n) => n.split(':')[0]!)
  const expectedCells = new Set<string>()
  // A blocked square (a table, a plant) takes no note while "no X on blocked squares" is on, so a drag over it skips it.
  for (let col = Math.min(wantA.col, wantB.col); col <= Math.max(wantA.col, wantB.col); col++) {
    if (!isBlocked(DAY.puzzle, { row: wantA.row, col })) expectedCells.add(`${wantA.row},${col}`)
  }
  check('drag-notes on the zoomed board fills the cells from the start cell to the end cell', [...expectedCells].every((k) => painted.includes(k)) && painted.every((k) => k.startsWith(`${wantA.row},`)), `wanted ${[...expectedCells].join(' ')} got ${[...new Set(painted)].join(' ')}`)
  check('the drag did not pan the board', near(await zoomOf(), 2) && (await covers()))
  for (let i = 0; i < 8 && (await count('[data-note]')) > 0; i++) await tool('Undo')
  check('undo clears the stroke again', (await count('[data-note]')) === 0)

  // long-press placement on the zoomed board: pan the solution cell of the selected suspect into view first, if needed
  const name = ((await selectedName()) ?? '').trim()
  const suspect = puzzle.people.find((p) => p.label === name)!
  const target = puzzle.solution.find((s) => s.personId === suspect.id)!.cell
  for (let attempt = 0; attempt < 4; attempt++) {
    const ff = await frame()
    const c = await centerOfCell(target.row, target.col)
    const inside = c.x > ff.l + 8 && c.x < ff.r - 8 && c.y > ff.t + 8 && c.y < ff.b - 8
    if (inside) break
    // two fingers drag the board so the cell comes towards the middle
    const dx = (ff.l + ff.w / 2 - c.x) / 2
    const dy = (ff.t + ff.h / 2 - c.y) / 2
    const mx = ff.l + ff.w / 2
    const my = ff.t + ff.h / 2
    await twoFingers({ x: mx - 25, y: my }, { x: mx + 25, y: my }, { x: mx - 25 + dx, y: my + dy }, { x: mx + 25 + dx, y: my + dy })
  }
  const ff = await frame()
  const cc = await centerOfCell(target.row, target.col)
  const visible = cc.x > ff.l && cc.x < ff.r && cc.y > ff.t && cc.y < ff.b
  check(`two-finger pan brings ${name}'s solution cell r${target.row + 1}c${target.col + 1} into view`, visible && (await covers()), `cell at ${Math.round(cc.x)},${Math.round(cc.y)} in frame ${Math.round(ff.l)}..${Math.round(ff.r)} x ${Math.round(ff.t)}..${Math.round(ff.b)}`)
  await shot('03-panned')
  // press slightly off the centre so a wrong mapping would show
  const press = { x: cc.x + cc.w * 0.2, y: cc.y - cc.h * 0.2 }
  const drawnCell = await oracle(press)
  await hold(press, 700)
  await sleep(300)
  const placedKey = (await evaluate(`document.querySelector('[data-person=${suspect.id}]')?.getAttribute('data-cell-key') ?? null`)) as string | null
  check(`long-press on the zoomed board places ${name} on the drawn square r${target.row + 1}c${target.col + 1}`, same(drawnCell, target) && placedKey === `${target.row},${target.col}`, `oracle r${drawnCell.row + 1}c${drawnCell.col + 1}, placed at ${placedKey}`)
  const pr = await rectOf(`[data-person=${suspect.id}]`, false)
  const cr = await centerOfCell(target.row, target.col)
  check('the placed portrait is drawn inside that square', !!pr && pr.x > cr.l && pr.x < cr.r && pr.y > cr.t && pr.y < cr.b, JSON.stringify(pr && { x: Math.round(pr.x), y: Math.round(pr.y) }))
  check('no stray note from the long-press', (await count('[data-note]')) === 0)
  await shot('04-placed-zoomed')

  // ---- pan clamping ---------------------------------------------------------------------
  const fm = await frame()
  const mid = { x: fm.l + fm.w / 2, y: fm.t + fm.h / 2 }
  const far = Math.min(fm.w, fm.h) * 0.45
  await twoFingers({ x: mid.x - 20, y: mid.y }, { x: mid.x + 20, y: mid.y }, { x: mid.x - 20 - far, y: mid.y - far }, { x: mid.x + 20 - far, y: mid.y - far }, 10)
  await twoFingers({ x: mid.x - 20, y: mid.y }, { x: mid.x + 20, y: mid.y }, { x: mid.x - 20 - far, y: mid.y - far }, { x: mid.x + 20 - far, y: mid.y - far }, 10)
  check('panning far past the edge (down-right end) keeps the board covering the frame', (await covers()) && near(await zoomOf(), 2), `zoom ${await zoomOf()}`)
  const dEdge = await drawn()
  const fEdge = await frame()
  check('at the edge the drawn board ends exactly at the frame', near(dEdge.r, fEdge.r, 1.5) && near(dEdge.b, fEdge.b, 1.5), `right ${Math.round(dEdge.r)} vs ${Math.round(fEdge.r)}, bottom ${Math.round(dEdge.b)} vs ${Math.round(fEdge.b)}`)
  const back = far * 0.7
  for (let i = 0; i < 3; i++) await twoFingers({ x: mid.x - back - 20, y: mid.y - back }, { x: mid.x - back + 20, y: mid.y - back }, { x: mid.x + back - 20, y: mid.y + back }, { x: mid.x + back + 20, y: mid.y + back }, 10)
  const dTop = await drawn()
  const fTop = await frame()
  check('panning the other way stops at the top-left edge', near(dTop.l, fTop.l, 1.5) && near(dTop.t, fTop.t, 1.5) && (await covers()), `left ${Math.round(dTop.l)} vs ${Math.round(fTop.l)}, top ${Math.round(dTop.t)} vs ${Math.round(fTop.t)}`)
  await shot('05-pan-topleft')

  // ---- pinch ----------------------------------------------------------------------------
  await pinchZoomReset() // back to 1x
  check('pinch reset lands back at 1x', near(await zoomOf(), 1))
  const fp = await frame()
  const c0 = { x: fp.l + fp.w / 2, y: fp.t + fp.h / 2 }
  const before = [await count('[data-person]'), await count('[data-note]'), await count('[data-mark]')]
  await twoFingers({ x: c0.x - 30, y: c0.y }, { x: c0.x + 30, y: c0.y }, { x: c0.x - 60, y: c0.y }, { x: c0.x + 60, y: c0.y })
  const z1 = await zoomOf()
  check('pinch out (distance x2) zooms to about 2x', near(z1, 2, 0.08), `zoom ${z1}`)
  check('pinch changed no notes, marks or people', JSON.stringify([await count('[data-person]'), await count('[data-note]'), await count('[data-mark]')]) === JSON.stringify(before))
  await shot('06-pinched')
  await twoFingers({ x: c0.x - 30, y: c0.y }, { x: c0.x + 30, y: c0.y }, { x: c0.x - 150, y: c0.y }, { x: c0.x + 150, y: c0.y })
  check('pinching further stops at 3x', near(await zoomOf(), 3, 0.001), `zoom ${await zoomOf()}`)
  check('the board covers the frame at 3x', await covers())
  await twoFingers({ x: c0.x - 100, y: c0.y }, { x: c0.x + 100, y: c0.y }, { x: c0.x - 10, y: c0.y }, { x: c0.x + 10, y: c0.y })
  check('pinching in goes back to 1x and never below', near(await zoomOf(), 1, 0.001) && (await covers()), `zoom ${await zoomOf()}`)
  // the point between the fingers stays between them: pinch out around an off-centre point
  const focus = { x: fp.l + fp.w * 0.3, y: fp.t + fp.h * 0.3 }
  const cellBefore = await oracle(focus)
  await twoFingers({ x: focus.x - 15, y: focus.y }, { x: focus.x + 15, y: focus.y }, { x: focus.x - 35, y: focus.y }, { x: focus.x + 35, y: focus.y })
  const cellAfter = await oracle(focus)
  check('pinching around a point keeps the square under it', same(cellBefore, cellAfter) && (await zoomOf()) > 1.5, `r${cellBefore.row + 1}c${cellBefore.col + 1} -> r${cellAfter.row + 1}c${cellAfter.col + 1} at ${await zoomOf()}x`)
  await pinchZoomReset() // 1x

  // ---- a second finger cancels the one-finger gesture ------------------------------------
  const nPeople = await count('[data-person]')
  await touch('touchStart', [{ x: c0.x, y: c0.y }]) // finger 1 on a cell, a long press is pending
  await sleep(200)
  await touch('touchStart', [{ x: c0.x, y: c0.y }, { x: c0.x + 80, y: c0.y }]) // finger 2 lands
  await sleep(750) // longer than the long-press time
  await touch('touchEnd', [])
  await sleep(300)
  check('a second finger cancels a pending long press (nothing placed)', (await count('[data-person]')) === nPeople && (await count('[data-note]')) === 0, `people ${await count('[data-person]')}, notes ${await count('[data-note]')}`)
  // a drag that began as a one-finger paint ends when the second finger lands. Step sizes scale with the actual on-screen
  // cell size (not a fixed pixel count): on large viewports the board is bigger, and a fixed 72px total move can land
  // inside the starting cell without ever crossing into the next one.
  const g0 = { x: fp.l + fp.w * 0.3, y: fp.t + fp.h * 0.4 }
  const cellW = (await centerOfCell((await oracle(g0)).row, (await oracle(g0)).col)).w
  const step1 = Math.max(12, cellW / 3)
  const step2 = Math.max(20, cellW / 2)
  await touch('touchStart', [g0])
  for (let i = 1; i <= 6; i++) { await sleep(25); await touch('touchMove', [{ x: g0.x + i * step1, y: g0.y }]) }
  await sleep(200)
  const painting = await count('[data-note]')
  const gx = g0.x + 6 * step1
  await touch('touchStart', [{ x: gx, y: g0.y }, { x: gx + 128, y: g0.y + 40 }])
  for (let i = 1; i <= 6; i++) { await sleep(25); await touch('touchMove', [{ x: gx + i * step2, y: g0.y }, { x: gx + 128 + i * 10, y: g0.y + 40 }]) }
  await touch('touchEnd', [])
  await sleep(300)
  check('a second finger stops a drag: no more notes painted after it landed', (await count('[data-note]')) === painting && painting >= 1, `notes at 2nd finger ${painting}, after ${await count('[data-note]')}`)
  for (let i = 0; i < painting; i++) await tool('Undo')
  check('the fingers left over after the pinch painted nothing extra (undoing the stroke clears every note)', (await count('[data-note]')) === 0, `notes left ${await count('[data-note]')}`)
  await pinchZoomIn() // 2x again

  // ---- hints on a zoomed board ----------------------------------------------------------
  await tool('Hint')
  await evaluate(`document.querySelector('.play-hint .play-btn--primary')?.click()`)
  await sleep(300)
  await evaluate(`document.querySelector('.play-hint .play-btn--primary')?.click()`)
  await sleep(400)
  const fh = await frame()
  const ringsInside = (await evaluate(`(() => { const rs = [...document.querySelectorAll('.play-hint-ring rect:last-child')].map(r => r.getBoundingClientRect()); return JSON.stringify(rs.map(r => ({ l: r.left, t: r.top, r: r.right, b: r.bottom }))) })()`).then((s) => JSON.parse(s as string))) as { l: number; t: number; r: number; b: number }[]
  const allIn = ringsInside.length > 0 && ringsInside.every((r) => r.l >= fh.l - 2 && r.r <= fh.r + 2 && r.t >= fh.t - 2 && r.b <= fh.b + 2)
  const someIn = ringsInside.some((r) => r.r > fh.l && r.l < fh.r && r.b > fh.t && r.t < fh.b)
  check('hint level 3 on a zoomed board: the ringed squares are on screen', ringsInside.length > 0 && (allIn || someIn), `${ringsInside.length} rings, all inside: ${allIn}, zoom ${await zoomOf()}`)
  check('the hint bar is open, the board still zoomed', (await count('.play-hint')) === 1 && near(await zoomOf(), 2))
  await shot('07-hint-zoomed')
  await evaluate(`document.querySelector('.play-hint__actions .play-btn:not(.play-btn--primary)')?.click()`)
  await sleep(200)

  // ---- resets ---------------------------------------------------------------------------
  check('nothing about zoom in localStorage', !(await evaluate(`Object.keys(localStorage).some(k => /zoom/i.test(k)) || Object.values(localStorage).some(v => /zoom/i.test(v))`)))
  // restart (Options sits behind the header's settings icon, SLAY-5.1)
  await tool('More')
  await tool('Options')
  await evaluate(`[...document.querySelectorAll('.play-modal .play-btn')].find(b => /Start over/.test(b.innerText))?.click()`)
  await sleep(300)
  await evaluate(`[...document.querySelectorAll('.play-modal .play-btn')].find(b => /Sure[?]/.test(b.innerText))?.click()`)
  await sleep(400)
  const zAfterRestart = await zoomOf()
  check('restart resets the zoom to 1x', near(zAfterRestart, 1, 0.001), `zoom ${zAfterRestart}, modals ${await count('.play-modal')}`)
  await evaluate(`document.querySelector('.play-modal .play-modal__close, .play-modal .play-btn')?.click()`)
  await sleep(200)
  // leaving the puzzle
  await pinchZoomIn()
  check('zoomed again before leaving', near(await zoomOf(), 2))
  await leaveLevel()
  await openLevel()
  check('leaving and re-entering the puzzle: 1x', near(await zoomOf(), 1, 0.001), `zoom ${await zoomOf()}`)
  // reload
  await pinchZoomIn()
  await reload()
  check('reload: 1x', near(await zoomOf(), 1, 0.001), `zoom ${await zoomOf()}`)
  await shot('08-after-reload')
  await evaluate(`localStorage.clear()`)
  await reload()
}

for (const [label, w, h] of VIEWPORTS) {
  viewport = label
  await run(w, h)
}

const failed = rows.filter((r) => !r.ok)
const md = ['| Viewport | Check | Result | Detail |', '|---|---|---|---|', ...rows.map((r) => `| ${r.viewport} | ${r.scenario} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/')} |`)].join('\n')
await Bun.write(join(SHOTS, 'zoom-log.md'), md + '\n')
console.log(`${rows.length} checks, ${failed.length} failures`)
chrome.kill()
process.exit(failed.length ? 1 : 0)
