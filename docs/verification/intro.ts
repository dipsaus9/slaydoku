// Records the start screen's gameplay example (SLAY-9.18): a short loop captured from the real, running app, not a mockup.
// Drives headless Chrome over the DevTools protocol on the dev-only date override, on day #1 (2026-09-27, already played and
// over, so the loop spoils no puzzle anyone can still play): read a clue, jot two notes, hold to place a suspect, place a second,
// ask for a hint. Every step is a screenshot of the actual play screen; a small ring marks where the finger lands (an overlay
// injected only into the recording page, never part of the app).
//
// Usage (from the repo root):
//   bunx vite --port 5231 &
//   bun docs/verification/intro.ts
// Env: BASE (default http://localhost:5231/), CDP_PORT (default 9352), CHROME, LOCALES (default en,nl), KEEP=1 (keep the PNG frames).
// Writes src/ui/daily/intro/gameplay-<locale>.webp (animated, looping) and gameplay-<locale>-still.webp (the first placed
// suspect, shown instead of the loop under prefers-reduced-motion). Needs img2webp (libwebp) on the PATH.
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Locale } from '../../src/locale/index.ts'
import { dayOn, seedStorage } from './daily.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9352)
const BASE = process.env.BASE ?? 'http://localhost:5231/'
const LOCALES = (process.env.LOCALES ?? 'en,nl').split(',') as Locale[]
const DATE = '2026-09-27'
const DEST = join(import.meta.dir, '../../src/ui/daily/intro')
// A landscape tablet-ish page: the board on the left, the toolbar and the first two suspect cards on the right.
const VIEW = { w: 800, h: 560 }
// Below the play header (title, timer, menu): only the board, the tools and the cards.
const CLIP = { x: 0, y: 92, width: 800, height: 468 }
const SCALE = 0.75 // 600 x 351 frames

interface PuzzleJson {
  people: { id: string; label: string; kind: string }[]
  solution: { personId: string; cell: { row: number; col: number } }[]
}
const puzzle = dayOn(DATE).puzzle as unknown as PuzzleJson

mkdirSync(DEST, { recursive: true })
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

const touch = (type: string, x: number, y: number) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] })
async function tap(x: number, y: number) {
  await touch('touchStart', x, y)
  await sleep(60)
  await touch('touchEnd', x, y)
}
async function hold(x: number, y: number) {
  await touch('touchStart', x, y)
  await sleep(700)
  await touch('touchEnd', x, y)
}
type Point = { x: number; y: number }
const centerOf = (sel: string) =>
  evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`) as Promise<Point | null>
const boxOf = (sel: string) =>
  evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })()`) as Promise<{ x: number; y: number; w: number; h: number } | null>
const toolCenter = (label: string) =>
  evaluate(
    `(() => { const e = [...document.querySelectorAll('.play-tool')].find(b => b.offsetParent !== null && (b.querySelector('.play-tool__label')?.textContent.trim() ?? b.getAttribute('aria-label')) === ${JSON.stringify(label)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`,
  ) as Promise<Point | null>
const cellSel = (row: number, col: number) => `[data-cell=r${row + 1}c${col + 1}]`
const selectedName = () => evaluate(`document.querySelector('.polaroid[data-selected] .polaroid__name')?.textContent.trim() ?? ''`) as Promise<string>

/** The finger ring (and an optional outline round a clue being read), drawn over the page only while recording. */
async function marker(at: Point | null, box: { x: number; y: number; w: number; h: number } | null = null) {
  await evaluate(`(() => {
    document.querySelectorAll('[data-rec]').forEach(e => e.remove())
    const add = (css) => { const d = document.createElement('div'); d.dataset.rec = ''; d.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;box-sizing:border-box;' + css; document.body.append(d) }
    ${at ? `add('left:${at.x - 22}px;top:${at.y - 22}px;width:44px;height:44px;border-radius:50%;border:4px solid rgba(179,65,62,0.9);background:rgba(179,65,62,0.22)')` : ''}
    ${box ? `add('left:${box.x - 4}px;top:${box.y - 4}px;width:${box.w + 8}px;height:${box.h + 8}px;border-radius:18px;border:4px solid rgba(179,65,62,0.95);background:rgba(255,205,60,0.3);box-shadow:0 0 0 4px rgba(255,205,60,0.45)')` : ''}
  })()`)
}

const frames: { file: string; ms: number }[] = []
let frameDir = ''
async function frame(ms: number) {
  await sleep(250)
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { ...CLIP, scale: SCALE } })
  const file = join(frameDir, `${String(frames.length).padStart(2, '0')}.png`)
  await Bun.write(file, Buffer.from(shot.data, 'base64'))
  frames.push({ file, ms })
  return file
}

async function record(locale: Locale) {
  frames.length = 0
  frameDir = mkdtempSync(join(tmpdir(), `intro-${locale}-`))
  await send('Emulation.setDeviceMetricsOverride', { width: VIEW.w, height: VIEW.h, deviceScaleFactor: 1, mobile: true })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await send('Page.navigate', { url: BASE })
  await sleep(1200)
  await evaluate(`localStorage.clear(); ${seedStorage(DATE, true, locale)}`)
  await send('Page.navigate', { url: `${new URL('/play', BASE).href}?date=${DATE}` })
  await sleep(2500)
  // The timer ticks in the header, which is clipped away; nothing else moves on its own.

  const idOf = new Map(puzzle.people.map((p) => [p.label, p.id]))
  const cellOf = new Map(puzzle.solution.map((s) => [s.personId, s.cell]))
  const cellFor = async () => cellOf.get(idOf.get(await selectedName())!)!

  // 1. The board, the first suspect selected.
  await marker(null)
  await frame(1400)
  // 2. Read the selected suspect's clue.
  const clue = (await boxOf('.polaroid[data-selected] .polaroid__clue'))!
  // The card runs past the bottom of the frame: outline only the part that is on screen.
  await marker(null, { ...clue, h: Math.min(clue.h, CLIP.y + CLIP.height - clue.y - 8) })
  await frame(2600)
  // 3. Tap two squares: a note on each (this suspect could stand here). The first is a nearby square that takes a note (a square
  // under furniture nobody can stand on does not), the second the suspect's own square.
  const first = await cellFor()
  const notes = () => evaluate(`document.querySelectorAll('[data-note]').length`) as Promise<number>
  const size = Math.max(...puzzle.solution.map((s) => Math.max(s.cell.row, s.cell.col))) + 1
  const nearby = Array.from({ length: size }, (_, col) => ({ row: first.row, col }))
    .filter((c) => c.col !== first.col)
    .sort((a, b) => Math.abs(a.col - first.col) - Math.abs(b.col - first.col))
  let noted = false
  for (const cell of [...nearby, first]) {
    if (noted && cell !== first) continue
    const at = (await centerOf(cellSel(cell.row, cell.col)))!
    const before = await notes()
    await marker(at)
    await frame(700)
    await tap(at.x, at.y)
    await sleep(150)
    if ((await notes()) <= before) {
      frames.pop() // no note there: drop the ring frame, try the next square
      continue
    }
    await marker(null)
    await frame(1100)
    noted = true
  }
  // 4. Hold the right square: placed.
  const placeAt = (await centerOf(cellSel(first.row, first.col)))!
  await marker(placeAt)
  await frame(900)
  await hold(placeAt.x, placeAt.y)
  await sleep(300)
  await marker(null)
  const still = await frame(1600)
  // 5. The next suspect is selected: hold their square too.
  const second = await cellFor()
  const secondAt = (await centerOf(cellSel(second.row, second.col)))!
  await marker(secondAt)
  await frame(900)
  await hold(secondAt.x, secondAt.y)
  await sleep(300)
  await marker(null)
  await frame(1400)
  // 6. Stuck? A hint.
  const hintAt = (await toolCenter('Hint'))! // the same word in both languages
  await marker(hintAt)
  await frame(800)
  await tap(hintAt.x, hintAt.y)
  await sleep(400)
  await marker(null)
  await frame(3000)

  const out = join(DEST, `gameplay-${locale}.webp`)
  const args = ['-loop', '0', '-lossy', '-q', '72', '-m', '6']
  for (const f of frames) args.push('-d', String(f.ms), f.file)
  args.push('-o', out)
  const run = spawnSync('img2webp', args, { stdio: 'inherit' })
  if (run.status !== 0) throw new Error('img2webp failed')
  const stillOut = join(DEST, `gameplay-${locale}-still.webp`)
  if (spawnSync('cwebp', ['-q', '80', '-quiet', still, '-o', stillOut], { stdio: 'inherit' }).status !== 0) throw new Error('cwebp failed')
  console.log(`${out} ${Math.round(statSync(out).size / 1024)} KB, ${frames.length} frames; ${stillOut} ${Math.round(statSync(stillOut).size / 1024)} KB`)
  if (process.env.KEEP) console.log('frames in', frameDir)
  else rmSync(frameDir, { recursive: true, force: true })
}

try {
  for (const locale of LOCALES) await record(locale)
} finally {
  ws.close()
  chrome.kill()
  rmSync(profile, { recursive: true, force: true })
}
