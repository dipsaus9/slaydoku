// Rendered check of the one object look (SLAY-17.4): oblique 3D blocks on the square grid (owner pick A2, docs/design/looks.md), at 360, 390,
// 768 and 1024 wide. Per width:
//   - layout: no sideways overflow, the board inside the viewport, every object drawn as blocks;
//   - hit test: for EVERY cell of a 9x9 and a 12x12 board, the centre, points just inside each corner and each edge midpoint resolve
//     (document.elementFromPoint) to that same cell (the tall blocks never take a tap);
//   - tap target sizes (screen px of the middle cell);
//   - painter order: floors, walls (with doors and windows), objects, marks, people, room labels in that order in the page, and the objects flat first, then by front row and column, nothing clipped (the walls are always at the bottom, an object may rise over the wall behind it);
//   - the Options panel has no Look entry any more, and no look is stored or read;
//   - the Legend swatches show every object whole (no block, no shadow clipped at the svg edge);
//   - the play loop through real touch events: a note, undo, an X, a placement, hints 1-3, a complete-but-wrong board, the solved board and
//     the finish overlay;
//   - desktop windows (1280x720, 1366x768, 1440x900, 1920x1080, 1280x600) with 6x6, 9x9 and 12x12 boards, row and column numbers on and off: the whole board
//     (headroom and bottom numbers included) lies inside the window, no page scroll (ONLY=desktop runs just these);
//   - the room labels draw above people and crosses, the notes above the labels (DOM order, SLAY-20) on a crowded board; screenshots of it.
// Usage (repo root):
//   bun run build && bunx vite preview --port 5461 &
//   BASE=http://localhost:5461/ CDP_PORT=9561 OUT=/private/tmp/claude-501/w-17.4 bun docs/verification/looks.ts
// Env: VIEWPORTS (default 360x640,390x844,768x1024,1024x768), BASE, CDP_PORT, OUT, CHROME.
// Writes screenshots to $OUT/shots and a table of tap sizes to $OUT/tap-sizes.md. Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cellKey, cellsInRoom, isOccupiable } from '../../src/engine/model/index.ts'
import { puzzleFingerprint } from '../../src/game/fingerprint.ts'
import { saveKey, SAVE_VERSION } from '../../src/game/persistence.ts'
import { dailyId } from '../../src/game/daily/ids.ts'
import { roomLabelLayout } from '../../src/render/scene/labels.ts'
import { DAYS, PLAY_DATE, dayOn, seedStorage } from './daily.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9561)
const BASE = process.env.BASE ?? 'http://localhost:5461/'
const OUT = process.env.OUT ?? join(tmpdir(), 'slaydoku-looks')
const SHOTS = join(OUT, 'shots')
mkdirSync(SHOTS, { recursive: true })
const VIEWPORTS = (process.env.VIEWPORTS ?? '360x640,390x844,768x1024,1024x768').split(',').map((v) => v.split('x').map(Number) as [number, number])
const LOOK = 'a2'
const BIG_DATE = '2026-10-08' // a 12x12 day with chairs, sofas, beds, bookshelves, tables, rugs and plants
const SMALL_DATE = PLAY_DATE // a 9x9 day, played end to end

const profile = mkdtempSync(join(tmpdir(), 'chrome-looks-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function connect() {
  for (let i = 0; i < 60; i++) {
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
const pending = new Map<number, (v: any) => void>()
ws.onmessage = (m) => {
  const msg = JSON.parse(String(m.data))
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)!(msg)
}
const send = (method: string, params: object = {}) =>
  new Promise<any>((resolve) => {
    const id = ++nextId
    pending.set(id, (m) => resolve(m.result ?? m.error))
    ws.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expression: string) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>

const touch = (type: string, x: number, y: number) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] })
async function tap(x: number, y: number) {
  await touch('touchStart', x, y)
  await sleep(60)
  await touch('touchEnd', x, y)
}
async function hold(x: number, y: number, ms = 700) {
  await touch('touchStart', x, y)
  await sleep(ms)
  await touch('touchEnd', x, y)
}
type Box = { x: number; y: number; w: number; h: number }
const rectOf = (sel: string) =>
  evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } })()`) as Promise<Box | null>
const toolRect = (label: string) =>
  evaluate(`(() => { const matches = [...document.querySelectorAll('.play-tool, .play-header__more, .play-header__legend')].filter(b => (b.querySelector('.play-tool__label')?.textContent.trim() ?? b.getAttribute('aria-label')) === ${JSON.stringify(label)}); const e = matches.find(b => b.offsetParent !== null) ?? matches[0]; if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } })()`) as Promise<Box | null>
async function tool(label: string) {
  const r = await toolRect(label)
  if (!r) throw new Error('missing tool ' + label)
  await tap(r.x, r.y)
  await sleep(450)
}
async function tapSel(sel: string) {
  const r = await rectOf(sel)
  if (!r) throw new Error('missing ' + sel)
  await tap(r.x, r.y)
  await sleep(250)
}
const cellSel = (row: number, col: number) => `[data-cell=r${row + 1}c${col + 1}]`

async function setViewport(w: number, h: number) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
}
async function load(path: string) {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await send('Page.navigate', { url: new URL(path, BASE).href })
  await sleep(1800)
}
/** Fresh storage for a visitor on `date`. */
async function seed(date: string, extra = '') {
  await send('Page.navigate', { url: new URL('about', BASE).href })
  await sleep(500)
  await evaluate(`localStorage.clear(); ${seedStorage(date, true, 'en')}; ${extra}`)
}
let nShot = 0
const shotBoard = async (name: string, whole = false) => {
  const clip = whole
    ? undefined
    : ((await evaluate(`(() => { const e = document.querySelector('.play-board'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y)) } })()`)) as Box | null)
  const r = await send('Page.captureScreenshot', { format: 'png', ...(clip && 'width' in (clip as object) ? { clip: { ...(clip as object), scale: 1 } } : {}) })
  await Bun.write(join(SHOTS, `${String(++nShot).padStart(3, '0')}-${name}.png`), Buffer.from(r.data, 'base64'))
}

let ctx = ''
const failures: string[] = []
function check(scenario: string, ok: boolean, detail = '') {
  console.log(ok ? 'PASS' : 'FAIL', ctx, scenario, detail)
  if (!ok) failures.push(`${ctx} ${scenario}`)
}

/** Probes every cell: centre, 12% inside each corner, 6% inside each edge midpoint; each must resolve to that cell. Plus size of the middle cell. */
const hitProbe = () =>
  evaluate(`(() => {
    const rects = [...document.querySelectorAll('rect[data-row][data-col]')]
    if (!rects.length) return null
    let probes = 0, skipped = 0
    const bad = []
    let mid = null
    const midRow = Math.floor(Math.max(...rects.map((r) => +r.dataset.row)) / 2), midCol = Math.floor(Math.max(...rects.map((r) => +r.dataset.col)) / 2)
    for (const r of rects) {
      const m = r.getScreenCTM()
      const x = +r.getAttribute('x'), y = +r.getAttribute('y'), w = +r.getAttribute('width'), h = +r.getAttribute('height')
      const P = (px, py) => { const p = new DOMPoint(px, py).matrixTransform(m); return [p.x, p.y] }
      const corners = [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)]
      const c = P(x + w / 2, y + h / 2)
      const pts = [c]
      corners.forEach((k, i) => {
        pts.push([k[0] + (c[0] - k[0]) * 0.12, k[1] + (c[1] - k[1]) * 0.12])
        const n = corners[(i + 1) % 4]
        const mx = (k[0] + n[0]) / 2, my = (k[1] + n[1]) / 2
        pts.push([mx + (c[0] - mx) * 0.06, my + (c[1] - my) * 0.06])
      })
      for (const [px, py] of pts) {
        if (px < 0 || py < 0 || px > innerWidth || py > innerHeight) { skipped++; continue }
        probes++
        const hit = document.elementFromPoint(px, py)?.closest('[data-row][data-col]')
        if (!hit || hit.dataset.row !== r.dataset.row || hit.dataset.col !== r.dataset.col) bad.push(r.dataset.cell + '@' + Math.round(px) + ',' + Math.round(py) + '->' + (hit?.dataset.cell ?? 'none'))
      }
      if (+r.dataset.row === midRow && +r.dataset.col === midCol) {
        const xs = corners.map((k) => k[0]), ys = corners.map((k) => k[1])
        let inscribed = Infinity
        for (let i = 0; i < 4; i++) {
          const a = corners[i], b = corners[(i + 1) % 4]
          const len = Math.hypot(b[0] - a[0], b[1] - a[1])
          inscribed = Math.min(inscribed, Math.abs((b[0] - a[0]) * (a[1] - c[1]) - (a[0] - c[0]) * (b[1] - a[1])) / len)
        }
        mid = { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), circle: 2 * inscribed }
      }
    }
    const board = document.querySelector('.play-board')?.getBoundingClientRect()
    return { cells: rects.length, probes, skipped, bad: bad.slice(0, 6), badCount: bad.length, mid, sw: document.documentElement.scrollWidth, iw: innerWidth, board: board ? { l: board.left, r: board.right, w: board.width, h: board.height } : null,
      layers: { objects: document.querySelectorAll('[data-layer=objects] [data-object]').length, clips: document.querySelectorAll('[data-layer=objects] [clip-path]').length } }
  })()`) as Promise<{ cells: number; probes: number; skipped: number; bad: string[]; badCount: number; mid: { w: number; h: number; circle: number } | null; sw: number; iw: number; board: { l: number; r: number; w: number; h: number } | null; layers: { objects: number; clips: number } } | null>

/**
 * Painter's order (owner, SLAY-17.4): in the page the floors come first, then the walls, doors and windows, then the objects, then marks, people
 * and the room labels; the objects are painted flat things first, then by the row of their front edge and by column (what is lower on the screen
 * is drawn later and sits on top), with the same front rows as the puzzle's own objects. Nothing is clipped.
 */
async function paintOrder(date: string) {
  const day = dayOn(date)
  const sc = day.puzzle.scene
  const r = (await evaluate(`(() => {
    const idx = (sel) => { const e = document.querySelector('.play-board svg ' + sel); return e ? [...e.ownerSVGElement.querySelectorAll('*')].indexOf(e) : -1 }
    const layers = ['[data-layer=floors]', '[data-layer=walls]', '[data-layer=edge-features]', '[data-layer=objects]', '[data-layer=marks]', '[data-layer=people]', '[data-layer=room-labels]'].map(idx)
    const objects = [...document.querySelectorAll('[data-layer=objects] [data-object]')].map((g) => ({ id: g.dataset.object, row: +g.dataset.frontRow, flat: !g.querySelector('filter, [filter]') }))
    const clipped = document.querySelectorAll('[data-layer=objects] [clip-path]').length
    return { layers, objects, clipped }
  })()`)) as { layers: number[]; objects: { id: string; row: number; flat: boolean }[]; clipped: number }
  check(`${day.size}x${day.size}: floors, walls, doors and windows, objects, marks, people, room labels are painted in that order`, r.layers.every((i) => i >= 0) && r.layers.every((v, i) => i === 0 || v > r.layers[i - 1]!), JSON.stringify(r.layers))
  check(`${day.size}x${day.size}: nothing of an object is clipped`, r.clipped === 0, String(r.clipped))
  const bad: string[] = []
  const keyOf = (id: string) => {
    const o = sc.objects.find((x) => x.id === id)!
    return { row: Math.max(...o.cells.map((c) => c.row)), col: Math.min(...o.cells.map((c) => c.col)) }
  }
  r.objects.forEach((o, i) => {
    const k = keyOf(o.id)
    if (k.row !== o.row) bad.push(`${o.id} front row ${o.row} != ${k.row}`)
    const p = r.objects[i - 1]
    if (!p) return
    const pk = keyOf(p.id)
    const ok = p.flat !== o.flat ? p.flat : pk.row !== k.row ? pk.row < k.row : pk.col !== k.col ? pk.col < k.col : p.id < o.id
    if (!ok) bad.push(`${p.id} before ${o.id}`)
  })
  check(`${day.size}x${day.size}: ${r.objects.length} objects are painted flat first, then by front row and column`, r.objects.length === sc.objects.length && bad.length === 0, bad.slice(0, 4).join('; '))
}

/** Desktop windows (mouse, no touch): the whole board, headroom and bottom axis labels included, must lie inside the window without page scroll. */
const DESKTOPS: [number, number][] = [[1280, 720], [1366, 768], [1440, 900], [1920, 1080], [1280, 600]]
const desktopRows: string[] = []
async function desktopFit(w: number, h: number) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setTouchEmulationEnabled', { enabled: false })
  for (const size of [6, 9, 12]) {
    const day = DAYS.find((d) => d.size === size && d.date > '2026-11-01')!
    for (const axis of [true, false]) {
      await seed(day.date, `localStorage.setItem('slaydoku:play-axis-labels', '${axis}')`)
      await load('play')
      await sleep(400)
      const r = (await evaluate(`(() => { const b = document.querySelector('.play-board svg').getBoundingClientRect(); const de = document.documentElement; return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height, iw: innerWidth, ih: innerHeight, sh: de.scrollHeight, sw: de.scrollWidth } })()`)) as { top: number; bottom: number; left: number; right: number; w: number; h: number; iw: number; ih: number; sh: number; sw: number }
      const ok = r.top >= -0.5 && r.bottom <= r.ih + 0.5 && r.left >= -0.5 && r.right <= r.iw + 0.5 && r.sh <= r.ih + 1 && r.sw <= r.iw + 1
      check(`desktop ${w}x${h} ${size}x${size} axis ${axis ? 'on' : 'off'}: the whole board is inside the window, no page scroll`, ok, JSON.stringify({ top: Math.round(r.top), bottom: Math.round(r.bottom), ih: r.ih, boardW: Math.round(r.w), boardH: Math.round(r.h), sh: r.sh }))
      desktopRows.push(`| ${w}x${h} | ${size}x${size} | ${axis ? 'on' : 'off'} | ${Math.round(r.w)} x ${Math.round(r.h)} | ${Math.round(r.bottom)} / ${r.ih} | ${ok ? 'fits' : 'CUT'} |`)
      if (axis && (size === 12 || size === 9) && (w === 1280 && (h === 720 || h === 600))) await shotBoard(`desktop-${w}x${h}-${size}x${size}`, true)
    }
  }
}

const sizes: string[] = []

async function hitAndSize(date: string, w: number, h: number) {
  await seed(date)
  await load('play')
  await sleep(500)
  const day = dayOn(date)
  const p = await hitProbe()
  if (!p) return check(`${day.size}x${day.size} board renders`, false)
  check(`${day.size}x${day.size}: no sideways overflow, board inside the viewport`, p.sw <= p.iw && !!p.board && p.board.l >= -0.5 && p.board.r <= p.iw + 0.5, JSON.stringify({ sw: p.sw, iw: p.iw, board: p.board }))
  check(`${day.size}x${day.size}: every object is drawn as blocks, none clipped`, p.layers.objects > 0 && p.layers.clips === 0, JSON.stringify(p.layers))
  check(`${day.size}x${day.size}: every cell resolves from its centre, corners and edges (${p.probes} probes, ${p.skipped} off screen)`, p.badCount === 0 && p.probes > p.cells * 7 * 0.5, JSON.stringify(p.bad))
  if (p.mid) sizes.push(`| ${w}x${h} | ${day.size}x${day.size} | ${Math.round(p.mid.w)} x ${Math.round(p.mid.h)} | ${Math.round(p.mid.circle)} |`)
  await shotBoard(`${LOOK}-${w}x${h}-${day.size}x${day.size}`)
}

/** A board with a crowded room (people, crosses, notes) as labelshots.ts builds it. */
function crowdedBoard(date: string) {
  const day = dayOn(date)
  const { puzzle } = day
  const scene = puzzle.scene
  const room = [...scene.rooms].sort((a, b) => cellsInRoom(scene, b.id).length - cellsInRoom(scene, a.id).length)[0]!
  const label = roomLabelLayout(scene, room.id)!
  const cells = cellsInRoom(scene, room.id).filter((c) => isOccupiable(scene, c))
  cells.sort((a, b) => Math.hypot(a.col + 0.5 - label.center.x, a.row + 0.5 - label.center.y) - Math.hypot(b.col + 0.5 - label.center.x, b.row + 0.5 - label.center.y))
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const placed = suspects.slice(0, 3)
  const placements = Object.fromEntries(placed.map((p, i) => [p.id, { row: cells[i]!.row, col: cells[i]!.col }]))
  const free = cells.slice(placed.length)
  const selected = suspects[3]!
  const marks = Object.fromEntries(free.map((c) => [cellKey(c), [selected.id]]))
  const noters = suspects.slice(3, 8)
  const notes = Object.fromEntries(free.map((c) => [cellKey(c), noters.map((p) => p.id)]))
  const save = { version: SAVE_VERSION, levelId: dailyId(day.n), fp: puzzleFingerprint(puzzle), board: { notes, marks, placements }, elapsedMs: 60000 }
  return { key: saveKey(dailyId(day.n)), save, roomId: room.id }
}

async function labels(date: string, w: number, h: number) {
  const { key, save, roomId } = crowdedBoard(date)
  await seed(date, `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(save))})`)
  await load('play')
  await sleep(600)
  // Room labels are later in the document than people and crosses, so they paint on top (SLAY-17.5); notes come after the labels (SLAY-20).
  const order = (await evaluate(`(() => { const all = [...document.querySelectorAll('[data-person], [data-mark], [data-room-label]')]; const lastMark = Math.max(...all.map((e, i) => (e.hasAttribute('data-room-label') ? -1 : i))); const firstLabel = all.findIndex((e) => e.hasAttribute('data-room-label')); return { lastMark, firstLabel, people: document.querySelectorAll('[data-person]').length, marks: document.querySelectorAll('[data-mark]').length, notes: document.querySelectorAll('[data-note]').length } })()`)) as { lastMark: number; firstLabel: number; people: number; marks: number; notes: number }
  check(`crowded room ${roomId}: labels paint above ${order.people} people and ${order.marks} crosses`, order.people === 3 && order.firstLabel > order.lastMark, JSON.stringify(order))
  const notesAbove = (await evaluate(`(() => { const labels = document.querySelector('.play-board [data-layer=room-labels]'); const notes = [...document.querySelectorAll('.play-board [data-note]')]; return notes.length > 0 && notes.every((n) => labels.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING) })()`)) as boolean
  check(`crowded room ${roomId}: ${order.notes} notes paint above the labels (SLAY-20)`, notesAbove)
  await shotBoard(`${LOOK}-${w}x${h}-crowded`)
}

/** Opens the Legend and checks that every object swatch draws whole: the glyph's box lies inside the svg's viewBox, so nothing is cut at the edge. */
async function legendWhole(w: number, h: number) {
  await seed(BIG_DATE)
  await load('play')
  await sleep(400)
  const wide = (await evaluate(`[...document.querySelectorAll('.play-tool, .play-header__legend')].some(b => (b.querySelector('.play-tool__label')?.textContent.trim() ?? b.getAttribute('aria-label')) === 'Legend' && b.offsetParent !== null)`)) as boolean
  if (!wide) await tool('More')
  await tool('Legend')
  const r = (await evaluate(`(() => {
    const out = { swatches: 0, clipped: [], tiny: [] }
    for (const svg of document.querySelectorAll('[data-legend-list=objects] .play-legend__icon')) {
      out.swatches++
      const g = svg.querySelector('g[data-solid]')
      const vb = svg.viewBox.baseVal
      const b = g.getBBox()
      const pad = 1.5
      if (b.x < vb.x - pad || b.y < vb.y - pad || b.x + b.width > vb.x + vb.width + pad || b.y + b.height > vb.y + vb.height + pad) out.clipped.push(svg.dataset.icon)
      const s = svg.getBoundingClientRect()
      if (s.width < 20 || s.height < 20) out.tiny.push(svg.dataset.icon)
    }
    return out
  })()`)) as { swatches: number; clipped: string[]; tiny: string[] }
  check(`Legend: ${r.swatches} object swatches, none clipped, none tiny`, r.swatches > 0 && r.clipped.length === 0 && r.tiny.length === 0, JSON.stringify(r))
  await shotBoard(`${LOOK}-${w}x${h}-legend`, true)
}

interface PuzzleJson {
  people: { id: string; label: string; kind: string }[]
  solution: { personId: string; cell: { row: number; col: number } }[]
}
/** Taps each person's card, then long-presses the square (the victim is placed by hand too, since SLAY-9.x). `swap` puts the first two suspects on each other's square. */
async function placeAll(puzzle: PuzzleJson, swap = false) {
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const cellOf = new Map(puzzle.solution.map((s) => [s.personId, s.cell]))
  const swapped = swap ? [suspects[0]!.id, suspects[1]!.id] : []
  for (const person of [...suspects, ...puzzle.people.filter((p) => p.kind === 'victim')]) {
    const sel = person.kind === 'victim' ? '.polaroid--victim' : `.polaroid:not(.polaroid--victim) .polaroid__name`
    const card =
      person.kind === 'victim'
        ? await rectOf(sel)
        : ((await evaluate(`(() => { const e = [...document.querySelectorAll('.polaroid')].find(b => b.querySelector('.polaroid__name')?.textContent.trim() === ${JSON.stringify(person.label)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)) as Box | null)
    if (!card) return false
    await tap(card.x, card.y)
    await sleep(250)
    const target = swapped.includes(person.id) ? swapped.find((id) => id !== person.id)! : person.id
    const cell = cellOf.get(target)!
    const r = await rectOf(cellSel(cell.row, cell.col))
    if (!r) return false
    await hold(r.x, r.y, 650)
    await sleep(200)
  }
  await sleep(700)
  return true
}

type P = { x: number; y: number }
const touches = (type: string, points: P[]) => send('Input.dispatchTouchEvent', { type, touchPoints: points.map((q, i) => ({ x: q.x, y: q.y, id: i + 1 })) })
/** Pinch out around (cx, cy) to about 2x, as zoom.ts does. */
async function pinchOut(cx: number, cy: number) {
  const a = { x: cx - 30, y: cy }
  const b = { x: cx + 30, y: cy }
  await touches('touchStart', [a])
  await sleep(50)
  await touches('touchStart', [a, b])
  for (let i = 1; i <= 12; i++) {
    await sleep(25)
    const t = i / 12
    await touches('touchMove', [{ x: a.x - 30 * t, y: a.y }, { x: b.x + 30 * t, y: b.y }])
  }
  await sleep(50)
  await touches('touchEnd', [{ x: a.x - 30, y: a.y }, { x: b.x + 30, y: b.y }])
  await sleep(200)
}

/** On a pinched 12x12 board a tap still lands on the square drawn under the finger (the hit squares are zoomed with the board). */
async function zoomPlay() {
  await seed(BIG_DATE)
  await load('play')
  await sleep(400)
  const f = (await evaluate(`(() => { const r = document.querySelector('.play-board').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)) as P
  await pinchOut(f.x, f.y)
  const zoom = Number(await evaluate(`document.querySelector('.play-board').dataset.zoom`))
  check('pinch zooms the board to about 2x', zoom > 1.7 && zoom < 2.3, String(zoom))
  // Aim at three spots; the square under each (document.elementFromPoint) must be the one that gets the note.
  for (const [dx, dy] of [[0, 0], [60, 25], [-70, -30]] as const) {
    await send('Page.bringToFront')
    const target = { x: f.x + dx, y: f.y + dy }
    const under = (await evaluate(`document.elementFromPoint(${target.x}, ${target.y})?.closest('[data-row][data-col]')?.dataset.cell ?? null`)) as string | null
    const before = await count('[data-note]')
    await tap(target.x, target.y)
    await sleep(250)
    const key = (await evaluate(`[...document.querySelectorAll('[data-note]')].map((e) => e.getAttribute('data-note')).sort().join('|')`)) as string
    const r = under ? Number(under.match(/r(\d+)c/)![1]) - 1 : -1
    const c = under ? Number(under.match(/c(\d+)$/)![1]) - 1 : -1
    // A blocked square (table, plant) takes no note (option 'No X on blocked squares'): then nothing is written anywhere.
    const added = (await count('[data-note]')) - before
    check(`zoomed tap at (${dx},${dy}) hits ${under}: the note lands there${added === 0 ? ' (blocked square, none written)' : ''}`, !!under && (added === 0 || (added === 1 && key.includes(`${r},${c}:`))), key)
  }
  await shotBoard(`${LOOK}-zoomed`, true)
}

async function playLoop(w: number, h: number) {
  const day = dayOn(SMALL_DATE)
  const puzzle = day.puzzle as unknown as PuzzleJson
  await seed(SMALL_DATE)
  await load('play')
  await sleep(400)
  const spot = puzzle.solution[2]!.cell
  await tapSel(cellSel(spot.row, spot.col))
  check('tap writes a note', (await count('[data-note]')) === 1, `notes=${await count('[data-note]')}`)
  await shotBoard(`${LOOK}-${w}x${h}-note`)
  await tool('Undo')
  check('undo removes the note', (await count('[data-note]')) === 0)
  await tool('X')
  await tapSel(cellSel(spot.row, spot.col))
  check('X mode tap draws an X', (await count('[data-mark]')) >= 1)
  await tool('Undo')
  await tool('Note')
  // Place the first suspect on its solution square.
  const first = puzzle.people.find((p) => p.kind === 'suspect')!
  const cardRect = (await evaluate(`(() => { const e = [...document.querySelectorAll('.polaroid')].find(b => b.querySelector('.polaroid__name')?.textContent.trim() === ${JSON.stringify(first.label)}); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)) as Box
  await tap(cardRect.x, cardRect.y)
  await sleep(250)
  const cell0 = puzzle.solution.find((s) => s.personId === first.id)!.cell
  const rc = (await rectOf(cellSel(cell0.row, cell0.col)))!
  await hold(rc.x, rc.y, 650)
  await sleep(300)
  check('long-press places the selected suspect', (await count('[data-person]')) >= 1)
  check('no stray note from the long-press', (await count('[data-note]')) === 0)
  await shotBoard(`${LOOK}-${w}x${h}-placed`)
  await tool('Undo')
  // Hints 1..3.
  await tool('Hint')
  const h1 = await evaluate(`document.querySelector('.play-hint')?.dataset.level`)
  await tapSel('.play-hint .play-btn--primary')
  await tapSel('.play-hint .play-btn--primary')
  const h3 = await evaluate(`document.querySelector('.play-hint')?.dataset.level`)
  check('hint opens at level 1 and steps to 3', h1 === '1' && h3 === '3', `${h1} -> ${h3}`)
  check('hint level 3 rings squares on the board', (await count('.play-hint-ring')) >= 1)
  await shotBoard(`${LOOK}-${w}x${h}-hint3`, true)
  await tapSel('.play-hint__actions .play-btn:not(.play-btn--primary)')
  // Options: there is no Look entry any more and nothing is stored under the old key.
  const wide = (await toolRect('Options')) !== null && (await evaluate(`[...document.querySelectorAll('.play-tool')].some(b => b.getAttribute('aria-label') === 'Options' && b.offsetParent !== null)`))
  if (!wide) await tool('More')
  await tool('Options')
  check('Options has no Look entry and nothing is stored under slaydoku:look', (await count('[data-look-entry]')) === 0 && (await evaluate("localStorage.getItem('slaydoku:look')")) === null)
  await shotBoard(`${LOOK}-${w}x${h}-options`, true)
  await tap(3, 3)
  await sleep(400)
  // Wrong board, then the solved board.
  const clearAll = async () => {
    const er = (await rectOf('.play-tool--erase'))!
    await hold(er.x, er.y, 800)
    await sleep(250)
    await tapSel('.play-modal .play-btn--danger')
  }
  await clearAll()
  check('clear-all empties the board', (await count('[data-person]')) + (await count('[data-note]')) + (await count('[data-mark]')) === 0)
  await placeAll(puzzle, true)
  await sleep(400)
  check('complete-but-wrong board shows "Not right yet"', (await count('[data-result=wrong]')) === 1, JSON.stringify({ people: await count('[data-person]'), result: await evaluate("document.querySelector('[data-result]')?.dataset.result ?? document.querySelector('.play-result')?.innerText ?? null") }))
  await shotBoard(`${LOOK}-${w}x${h}-wrong`, true)
  await tapSel('.play-result .play-btn--primary')
  await clearAll()
  check('board reset after the wrong attempt', (await count('[data-person]')) === 0)
  const ok = await placeAll(puzzle)
  await sleep(900)
  check('solving pops the finish overlay', ok && (await count('[data-result=solved]')) === 1)
  await shotBoard(`${LOOK}-${w}x${h}-solved`, true)
}

if (process.env.ONLY === 'desktop') {
  for (const [w, h] of DESKTOPS) {
    ctx = `${w}x${h}`
    await send('Page.enable')
    await send('Runtime.enable')
    await desktopFit(w, h)
  }
  await Bun.write(join(OUT, 'desktop-fit.md'), ['| window | board | numbers | board size px | board bottom / window height | |', '|---|---|---|---|---|---|', ...desktopRows, ''].join('\n'))
  console.log(`\n${failures.length ? 'FAILURES:\n' + failures.join('\n') : 'all checks passed'}`)
  chrome.kill()
  process.exit(failures.length ? 1 : 0)
}
for (const [w, h] of VIEWPORTS) {
  ctx = `${w}x${h}`
  await setViewport(w, h)
  await send('Page.enable')
  await send('Runtime.enable')
  await hitAndSize(SMALL_DATE, w, h)
  await paintOrder(SMALL_DATE)
  await hitAndSize(BIG_DATE, w, h)
  await paintOrder(BIG_DATE)
  await labels(BIG_DATE, w, h)
  await legendWhole(w, h)
  await playLoop(w, h)
  if (w <= 390) await zoomPlay()
}
for (const [w, h] of DESKTOPS) {
  ctx = `${w}x${h}`
  await desktopFit(w, h)
}
await Bun.write(join(OUT, 'desktop-fit.md'), ['| window | board | numbers | board size px | board bottom / window height | |', '|---|---|---|---|---|---|', ...desktopRows, ''].join('\n'))
await Bun.write(join(OUT, 'tap-sizes.md'), ['| viewport | board | middle cell, screen px (w x h) | biggest circle in it, px |', '|---|---|---|---|', ...sizes, ''].join('\n'))
console.log(`\n${failures.length ? 'FAILURES:\n' + failures.join('\n') : 'all checks passed'}`)
chrome.kill()
process.exit(failures.length ? 1 : 0)
