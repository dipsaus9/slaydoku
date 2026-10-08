// Rendered check of the room labels (SLAY-17.5): a room the PLAYER has filled in -- people placed on its squares, X marks of the selected suspect
// and candidate notes everywhere -- at 360, 390, 768 and 1024 wide in en and nl. Screenshots of the whole board and a crop of the crowded room's
// label, plus a probe of the label's contrast against what is drawn under it. Drives headless Chrome over the DevTools protocol.
// Usage (repo root): bun run build && bunx vite preview --port 5417 &
//   BASE=http://localhost:5417/ CDP_PORT=9477 OUT=/private/tmp/claude-501/w-17.5/after bun docs/verification/labelshots.ts
// Env: DATES (comma list), BASE, CDP_PORT, OUT.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { cellKey, cellsInRoom, isOccupiable } from '../../src/engine/model/index.ts'
import { puzzleFingerprint } from '../../src/game/fingerprint.ts'
import { saveKey, SAVE_VERSION } from '../../src/game/persistence.ts'
import { dailyId } from '../../src/game/daily/ids.ts'
import { roomLabelLayout } from '../../src/render/scene/labels.ts'
import { dayOn, seedStorage } from './daily.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9477)
const BASE = process.env.BASE ?? 'http://localhost:5417/'
const OUT = process.env.OUT ?? '/private/tmp/claude-501/w-17.5/after'
const SHOTS = join(OUT, 'shots')
mkdirSync(SHOTS, { recursive: true })
const DATES = (process.env.DATES ?? '2026-11-30,2026-12-30,2027-01-22').split(',')
const VIEWPORTS: [number, number][] = [[360, 640], [390, 844], [768, 1024], [1024, 768]]
const LOCALES = ['en', 'nl'] as const

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(OUT, 'profile')}`, 'about:blank'],
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
const listeners: ((m: any) => void)[] = []
ws.onmessage = (m) => {
  const msg = JSON.parse(String(m.data))
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)!(msg)
  else for (const l of listeners) l(msg)
}
const send = (method: string, params: object = {}) =>
  new Promise<any>((resolve) => {
    const id = ++nextId
    pending.set(id, (m) => resolve(m.result ?? { error: m.error }))
    ws.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expression: string) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value
const json = async <T>(expression: string) => JSON.parse((await evaluate(`JSON.stringify(${expression})`)) as string) as T

async function setViewport(w: number, h: number, mobile = true) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile })
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 })
}
async function load(path: string) {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await send('Page.navigate', { url: new URL(path, BASE).href })
  await sleep(1800)
}
async function seed(date: string, locale: string) {
  await send('Page.navigate', { url: new URL('about', BASE).href })
  await sleep(500)
  await evaluate(seedStorage(date, true, locale as 'en' | 'nl'))
}
const shotPng = async (name: string, clip?: { x: number; y: number; width: number; height: number }) => {
  const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })
  await Bun.write(join(SHOTS, `${name}.png`), Buffer.from(r.data, 'base64'))
  return r.data as string
}
const failures: string[] = []

/** A board with one crowded room: three people placed on its squares nearest the label, the selected suspect crossed out and notes everywhere. */
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

const overlapProbe = (roomId: string) => `(() => {
  const g = document.querySelector('[data-room-label=${roomId}]'); if (!g) return null
  const r = g.getBoundingClientRect()
  return { x: Math.max(0, r.x - 14), y: Math.max(0, r.y - 14), width: r.width + 28, height: r.height + 28 }
})()`
for (const date of DATES) {
  const { key, save, roomId } = crowdedBoard(date)
  for (const locale of LOCALES) {
    for (const [w, h] of VIEWPORTS) {
      {
        await setViewport(w, h)
        await seed(date, locale)
        await evaluate(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(save))})`)
        await load('play')
        await sleep(600)
        const r = await json<{ x: number; y: number; width: number; height: number } | null>(`(() => { const e = document.querySelector('.play-board'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y)) } })()`)
        const name = `${date}-${locale}-${w}x${h}`
        const people = await json<number>(`document.querySelectorAll('[data-person]').length`)
        const marks = await json<number>(`document.querySelectorAll('[data-mark]').length`)
        const label = await json<{ x: number; y: number; width: number; height: number } | null>(overlapProbe(roomId))
        const ok = people === 3 && marks > 0 && !!label && !!r
        console.log(ok ? 'PASS' : 'FAIL', name, `room ${roomId}: ${people} people, ${marks} crosses`)
        if (!ok) failures.push(name)
        if (r) await shotPng(name, r)
        if (label) await shotPng(`${name}-label`, label)
      }
    }
  }
}
chrome.kill()
process.exit(failures.length ? 1 : 0)
