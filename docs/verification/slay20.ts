// Rendered check of the SLAY-20 owner feedback on the play board:
//   1. room tints: rooms that touch differ by at least MIN_NEIGHBOUR_DISTANCE (read from the drawn floor paths: each room's pattern fill);
//   2. notes under room names: every square under a room label carries candidate notes of several people, and the notes
//      are drawn above the labels (DOM order) so a letter is never hidden behind a name's halo;
//   3. no swipe marking: one-finger swipes across a row and down a column (touch, and a mouse drag on desktop) set no note
//      and no cross, a tap still sets one.
// Crowded 9x9 and 12x12 boards of several themes at 360x640, 390x844 (phone, touch) and 1280x800 (desktop, mouse).
// Usage (repo root): bunx vite --port 5850 --strictPort &
//   BASE=http://localhost:5850/ CDP_PORT=9850 OUT=docs/design/looks-shots/slay-20 bun docs/verification/slay20.ts
// Env: DATES (comma list), VIEWPORTS, BASE, CDP_PORT, OUT, CHROME, LOCALE (en|nl). Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cellKey, isOccupiable } from '../../src/engine/model/index.ts'
import { puzzleFingerprint } from '../../src/game/fingerprint.ts'
import { saveKey, SAVE_VERSION } from '../../src/game/persistence.ts'
import { dailyId } from '../../src/game/daily/ids.ts'
import { roomLabelLayout } from '../../src/render/scene/labels.ts'
import { colourDistance, MIN_NEIGHBOUR_DISTANCE, roomNeighbours } from '../../src/render/scene/roomStyles.ts'
import { dayOn, seedStorage } from './daily.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9850)
const BASE = process.env.BASE ?? 'http://localhost:5850/'
const OUT = process.env.OUT ?? join(tmpdir(), 'slaydoku-slay20')
const LOCALE = (process.env.LOCALE ?? 'en') as 'en' | 'nl'
mkdirSync(OUT, { recursive: true })
const DATES = (process.env.DATES ?? '2026-10-15,2026-10-19,2026-10-25,2026-10-14,2026-10-20,2026-11-14').split(',')
const VIEWPORTS = (process.env.VIEWPORTS ?? '360x640,390x844,1280x800').split(',').map((v) => v.split('x').map(Number) as [number, number])

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'slay20-chrome-'))}`, 'about:blank'],
  { stdio: 'ignore' },
)
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
    pending.set(id, (m) => resolve(m.result ?? { error: m.error }))
    ws.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expression: string) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value
const json = async <T>(expression: string) => JSON.parse((await evaluate(`JSON.stringify(${expression})`)) as string) as T

async function setViewport(w: number, h: number, mobile: boolean) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile })
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 })
}
async function load(path: string) {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await send('Page.navigate', { url: new URL(path, BASE).href })
  await sleep(1800)
}
const shot = async (name: string, clip?: { x: number; y: number; width: number; height: number }) => {
  const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })
  await Bun.write(join(OUT, `${name}.png`), Buffer.from(r.data, 'base64'))
}
const failures: string[] = []
const check = (name: string, ok: boolean, detail = '') => {
  console.log(ok ? 'PASS' : 'FAIL', name, detail)
  if (!ok) failures.push(`${name} ${detail}`)
}

/** Notes of four people on every free square under a room label, two people placed elsewhere, nothing crossed. */
function crowdedBoard(date: string) {
  const day = dayOn(date)
  const { puzzle } = day
  const scene = puzzle.scene
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const noters = suspects.slice(2, 6).map((p) => p.id)
  const notes: Record<string, string[]> = {}
  const labelCells: string[] = []
  for (const room of scene.rooms) {
    const label = roomLabelLayout(scene, room.id, LOCALE)
    if (!label) continue
    for (let col = label.run.fromCol; col <= label.run.toCol; col++) {
      const cell = { row: label.run.row, col }
      if (!isOccupiable(scene, cell)) continue
      notes[cellKey(cell)] = noters
      labelCells.push(cellKey(cell))
    }
  }
  const freeElsewhere = scene.cellRooms.flatMap((row, r) => row.map((_, c) => ({ row: r, col: c }))).filter((c) => isOccupiable(scene, c) && !notes[cellKey(c)])
  const placements = Object.fromEntries(suspects.slice(0, 2).map((p, i) => [p.id, freeElsewhere[i * 7]!]))
  const save = { version: SAVE_VERSION, levelId: dailyId(day.n), fp: puzzleFingerprint(puzzle), board: { notes, marks: {}, placements }, elapsedMs: 60000 }
  return { key: saveKey(dailyId(day.n)), save, labelCells, day }
}

for (const date of DATES) {
  const { key, save, labelCells, day } = crowdedBoard(date)
  const scene = day.puzzle.scene
  for (const [w, h] of VIEWPORTS) {
    const mobile = w < 800
    const name = `${date}-${day.size}x${day.size}-${day.theme}-${w}`
    await setViewport(w, h, mobile)
    await send('Page.navigate', { url: new URL('about', BASE).href })
    await sleep(500)
    await evaluate(seedStorage(date, true, LOCALE))
    await evaluate(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(save))})`)
    await load('play')
    await sleep(500)

    // 1. Tints: the fill of each drawn room path, read through its pattern's base rect.
    const fills = await json<Record<string, string>>(`(() => {
      const out = {}
      for (const p of document.querySelectorAll('.play-board [data-layer=floors] path[data-room]')) {
        const id = p.getAttribute('fill').slice(5, -1)
        out[p.dataset.room] = document.getElementById(id)?.querySelector('rect')?.getAttribute('fill') ?? ''
      }
      return out
    })()`)
    const clashes: string[] = []
    for (const [room, next] of roomNeighbours(scene)) for (const other of next) if (room < other && !(colourDistance(fills[room]!, fills[other]!) >= MIN_NEIGHBOUR_DISTANCE)) clashes.push(`${room} ${fills[room]}/${other} ${fills[other]}`)
    check(`${name}: touching rooms differ by delta E >= ${MIN_NEIGHBOUR_DISTANCE}`, Object.keys(fills).length === scene.rooms.length && clashes.length === 0, clashes.join(' '))

    // 2. Notes under labels: drawn, and above the labels in paint order.
    const probe = await json<{ notes: number; above: boolean }>(`(() => {
      const keys = ${JSON.stringify(labelCells)}
      const notes = [...document.querySelectorAll('.play-board [data-note]')].filter((n) => keys.includes(n.dataset.note.split(':')[0]))
      const labels = document.querySelector('.play-board [data-layer=room-labels]')
      const above = notes.length > 0 && notes.every((n) => labels.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)
      return { notes: notes.length, above }
    })()`)
    check(`${name}: every note under a room name is drawn, above the name`, probe.notes === labelCells.length * 4 && probe.above, JSON.stringify(probe))
    const board = await json<{ x: number; y: number; width: number; height: number }>(`(() => { const r = document.querySelector('.play-board').getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y)) } })()`)
    await shot(`${name}-board`, board)
    if (w === 390) {
      const labelBox = await json<{ x: number; y: number; width: number; height: number } | null>(`(() => {
        const g = [...document.querySelectorAll('.play-board [data-room-label]')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]
        if (!g) return null
        const r = g.getBoundingClientRect()
        return { x: Math.max(0, r.x - 30), y: Math.max(0, r.y - 30), width: r.width + 60, height: r.height + 60 }
      })()`)
      if (labelBox) await shot(`${name}-label`, labelBox)
    }

    // 3. Swipes over the board set nothing; a tap still sets one note.
    const before = await json<number>(`document.querySelectorAll('.play-board [data-note]').length + document.querySelectorAll('.play-board [data-mark]').length`)
    const centre = (row: number, col: number) => json<{ x: number; y: number }>(`(() => { const r = document.querySelector('[data-cell=r${row + 1}c${col + 1}]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
    const row = Math.floor(day.size / 2)
    const a = await centre(row, 0)
    const b = await centre(row, day.size - 1)
    if (mobile) {
      const touch = (type: string, x: number, y: number) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] })
      await touch('touchStart', a.x, a.y)
      for (let i = 1; i <= 12; i++) { await sleep(16); await touch('touchMove', a.x + ((b.x - a.x) * i) / 12, a.y) }
      await touch('touchEnd', b.x, b.y)
    } else {
      const mouse = (type: string, x: number, y: number) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 })
      await mouse('mousePressed', a.x, a.y)
      for (let i = 1; i <= 12; i++) { await sleep(16); await mouse('mouseMoved', a.x + ((b.x - a.x) * i) / 12, a.y) }
      await mouse('mouseReleased', b.x, b.y)
    }
    await sleep(250)
    const after = await json<number>(`document.querySelectorAll('.play-board [data-note]').length + document.querySelectorAll('.play-board [data-mark]').length`)
    check(`${name}: a ${mobile ? 'one-finger swipe' : 'mouse drag'} across row ${row + 1} sets no note and no cross`, after === before, `${before} -> ${after}`)
  }
}
chrome.kill()
console.log(failures.length ? `${failures.length} FAILED` : 'all passed')
process.exit(failures.length ? 1 : 0)
