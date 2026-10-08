// Rendered check of the room labels (SLAY-17.5): the crowded days at 360, 390, 768 and 1024 wide in en and nl; screenshots of the board and a
// probe that counts objects under a label pill. Drives headless Chrome over the DevTools protocol.
// Usage (repo root): bun run build && bunx vite preview --port 5417 &
//   BASE=http://localhost:5417/ CDP_PORT=9477 OUT=/private/tmp/claude-501/w-17.5/after bun docs/verification/labelshots.ts
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { seedStorage } from './daily.ts'

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
const overlapProbe = `(() => {
  const labels = [...document.querySelectorAll('[data-room-label]')].map(e => { const r = e.querySelector('rect').getBoundingClientRect(); return { id: e.getAttribute('data-room-label'), l: r.left, t: r.top, r: r.right, b: r.bottom } })
  const objs = [...document.querySelectorAll('[data-layer=objects] [data-depth]')].map(e => { const r = e.firstElementChild.getBoundingClientRect(); return { k: e.firstElementChild.getAttribute('data-icon') || e.firstElementChild.getAttribute('data-theme-icon') || '?', l: r.left, t: r.top, r: r.right, b: r.bottom } })
  const hits = []
  for (const o of objs) for (const l of labels) { const w = Math.min(o.r, l.r) - Math.max(o.l, l.l), h = Math.min(o.b, l.b) - Math.max(o.t, l.t); if (w > 1 && h > 1) hits.push({ object: o.k, room: l.id, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 }) }
  return { labels: labels.length, objects: objs.length, hits }
})()`
for (const date of DATES) {
  for (const locale of LOCALES) {
    for (const [w, h] of VIEWPORTS) {
      await setViewport(w, h)
      await seed(date, locale)
      await load('play')
      await sleep(600)
      const probe = await json<{ labels: number; objects: number; hits: unknown[] }>(overlapProbe)
      const r = await json<{ x: number; y: number; width: number; height: number } | null>(`(() => { const e = document.querySelector('.play-board'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y)) } })()`)
      const name = `${date}-${locale}-${w}x${h}`
      console.log(probe.hits.length === 0 ? 'PASS' : 'FAIL', name, `${probe.labels} labels, ${probe.objects} objects, hits ${JSON.stringify(probe.hits)}`)
      if (probe.hits.length) failures.push(name)
      if (r) await shotPng(name, r)
    }
  }
}
chrome.kill()
process.exit(failures.length ? 1 : 0)
