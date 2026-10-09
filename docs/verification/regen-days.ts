// Rendered check of the regenerated schedule days (SLAY-17.6): room rules, rooms and the single chair look are on the real play screen.
// Drives headless Chrome over the DevTools protocol (production build, dev-only date override, see daily.ts). For SAMPLE days of each of the five
// registered themes (SLAY-24: the seasonal themes and Simpshouse too; THEMES narrows it), taken from the regenerated days (FIRST onward, default 2026-10-10), at 390x844 and
// 1024x768 it opens the play screen and checks
//   1. the board draws every object of the puzzle data (one [data-object] per object, in the objects layer);
//   2. no bed outside a sleeping room, no wet fixture (toilet, shower, bath, sink) outside a wet room, no vehicle in a room that is not a garage-type
//      room, read off the DOM: each drawn object's cells are looked up in the room map and the room's roomTypes come from the theme definition;
//   3. one chair look: every chair drawn is the plain engine chair (data-icon="chair", no themed chair art), with one variant.
// The room rules are also checked on the puzzle data of every regenerated day (all themes), not only on the sample.
//
// Usage (from the repo root):
//   bun run build && bunx vite preview --port 5471 &
//   BASE=http://localhost:5471/ CDP_PORT=9571 OUT=/private/tmp/regen-days bun docs/verification/regen-days.ts
// Env: THEMES, DATES (extra dates always shot), BASE, CDP_PORT, OUT (screenshots and a fresh Chrome profile per run, so no service worker cache of an older build is served; never inside the repo), CHROME, SAMPLE (days per theme, default 2), FIRST (first date, default 2026-10-10).
// Writes $OUT/shots/<date>-<theme>-<w>x<h>.png. Exits non-zero when a check fails. Stop the preview server and Chrome afterwards.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { SCENE_THEMES, getTheme } from '../../src/content/themes/index.ts'
import type { RoomType } from '../../src/content/themes/types.ts'
import type { ScheduleDay } from '../../src/schedule/types.ts'
import { DAYS, seedStorage } from './daily.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9571)
const BASE = process.env.BASE ?? 'http://localhost:5471/'
const OUT = process.env.OUT ?? '/private/tmp/regen-days'
const SAMPLE = Number(process.env.SAMPLE ?? 2)
const FIRST = process.env.FIRST ?? '2026-10-10'
const SHOTS = join(OUT, 'shots')
mkdirSync(SHOTS, { recursive: true })
/** Themes sampled: every registered theme, the seasonal ones and Simpshouse included (SLAY-24), or the comma list in THEMES. */
const THEMES: string[] = process.env.THEMES?.split(',') ?? SCENE_THEMES.map((t) => t.id)
/** Dates always in the sample (comma list in DATES), e.g. the Simpshouse test day 2026-10-10. */
const EXTRA_DATES: string[] = process.env.DATES?.split(',') ?? []
const VIEWPORTS: [number, number][] = [[390, 844], [1024, 768]]

const failures: string[] = []
function check(name: string, ok: boolean, detail = '') {
  console.log(ok ? 'PASS' : 'FAIL', name, detail)
  if (!ok) failures.push(`${name} ${detail}`)
}

// --- room rules on the puzzle data -----------------------------------------------------------------------------
const WET = new Set(['toilet', 'shower', 'bath', 'sink', 'washbasin'])
interface Placed { id: string; type: string; roomName: string; roomTypes: RoomType[]; kind: string }
/** Every object of a day with the room it stands in (by its first cell) and that room's types, from the theme definition. */
function placedObjects(day: ScheduleDay): Placed[] {
  const theme = getTheme(day.theme as never)
  const { scene } = day.puzzle
  const names = new Map(scene.rooms.map((r) => [r.id, r.name]))
  return scene.objects.map((o) => {
    const c = o.cells[0]!
    const roomName = names.get(scene.cellRooms[c.row]![c.col]!) ?? '?'
    return { id: o.id, type: o.type, roomName, kind: o.id.replace(/-\d+$/, ''), roomTypes: theme.rooms.find((r) => r.name === roomName)?.roomTypes ?? [] }
  })
}
function roomRuleProblems(day: ScheduleDay): string[] {
  const out: string[] = []
  for (const p of placedObjects(day)) {
    if (p.type === 'bed' && !p.roomTypes.includes('sleeping')) out.push(`bed ${p.id} in ${p.roomName}`)
    if (WET.has(p.type) && !p.roomTypes.includes('wet')) out.push(`${p.type} ${p.id} in ${p.roomName}`)
    if (p.type === 'car' && !p.roomTypes.includes('garage')) out.push(`vehicle ${p.id} in ${p.roomName}`)
  }
  return out
}

const regenerated = DAYS.filter((d) => d.date >= FIRST)
const dataBad = regenerated.flatMap((d) => roomRuleProblems(d).map((p) => `${d.date} ${d.theme}: ${p}`))
check(`room rules on the data of ${regenerated.length} regenerated days`, dataBad.length === 0, dataBad.slice(0, 5).join('; '))

// A sample per theme: the days with most beds, wet fixtures and chairs, so the rules have something to bite on.
const interest = (d: ScheduleDay) => d.puzzle.scene.objects.filter((o) => o.type === 'bed' || WET.has(o.type) || o.type === 'car' || o.type === 'chair').length
const sample: ScheduleDay[] = THEMES.flatMap((t) => {
  const own = regenerated.filter((d) => d.theme === t).sort((a, b) => interest(b) - interest(a) || a.date.localeCompare(b.date))
  const small = own.find((d) => d.size <= 7)
  const picked = [own[0], small && small !== own[0] ? small : own[1]].filter(Boolean) as ScheduleDay[]
  return picked.slice(0, SAMPLE)
})
for (const date of EXTRA_DATES) {
  const day = regenerated.find((d) => d.date === date)
  if (day && !sample.includes(day)) sample.push(day)
}
console.log('sample', sample.map((d) => `${d.date} ${d.theme} ${d.size}x${d.size} ${d.tier}`).join(', '))

// --- browser ---------------------------------------------------------------------------------------------------
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(OUT, `profile-${Date.now()}`)}`, 'about:blank'], { stdio: 'ignore' })
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
let ws: WebSocket
let nextId = 0
const pending = new Map<number, (v: any) => void>()
const send = (method: string, params: object = {}) =>
  new Promise<any>((resolve) => {
    const id = ++nextId
    pending.set(id, (m) => resolve(m.result ?? { error: m.error }))
    ws.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expression: string) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value
async function until(expr: string, ms: number) {
  for (let t = 0; t < ms; t += 200) {
    if (await evaluate(expr)) return true
    await sleep(200)
  }
  return false
}

try {
  ws = new WebSocket(await connect())
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (m) => {
    const msg = JSON.parse(String(m.data))
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)!(msg)
  }
  for (const [w, h] of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 800 })
    for (const day of sample) {
      const label = `${day.date} ${day.theme} ${day.size}x${day.size} ${day.tier} @${w}x${h}`
      await send('Page.navigate', { url: new URL('about', BASE).href })
      await sleep(400)
      await evaluate(seedStorage(day.date, true, 'en'))
      await send('Page.navigate', { url: new URL('play', BASE).href })
      const open = await until(`document.querySelectorAll('.play-board').length === 1 && document.querySelectorAll('.play-cards li').length > 0`, 15000)
      check(`${label}: the play screen opens`, open)
      if (!open) continue
      await sleep(600)
      const dom = JSON.parse((await evaluate(`JSON.stringify([...document.querySelectorAll('.play-board [data-layer=objects] g[data-object]')].map(g => { const i = g.querySelector('[data-theme-icon], [data-icon]'); return { id: g.dataset.object, icon: i ? (i.dataset.themeIcon ?? i.dataset.icon) : null, themed: !!(i && i.dataset.themeIcon), variant: i?.dataset.variant ?? null } }))`)) as string) as { id: string; icon: string | null; themed: boolean; variant: string | null }[]
      const placed = placedObjects(day)
      check(`${label}: every object of the puzzle is drawn`, dom.length === placed.length && placed.every((p) => dom.some((d) => d.id === p.id)), `${dom.length}/${placed.length}`)
      const drawn = new Map(dom.map((d) => [d.id, d]))
      const bad: string[] = []
      for (const p of placed) {
        const icon = drawn.get(p.id)?.icon ?? ''
        if ((p.type === 'bed' || icon.toLowerCase().includes('bed')) && !p.roomTypes.includes('sleeping')) bad.push(`bed ${p.id} in ${p.roomName}`)
        if ((WET.has(p.type) || /toilet|shower|bath|sink|washbasin/i.test(icon)) && !p.roomTypes.includes('wet')) bad.push(`wet ${p.id} in ${p.roomName}`)
        if (p.type === 'car' && !p.roomTypes.includes('garage')) bad.push(`vehicle ${p.id} in ${p.roomName}`)
      }
      check(`${label}: no bed outside a sleeping room, no wet fixture outside a wet room, no vehicle in a room`, bad.length === 0, bad.join('; '))
      const chairs = placed.filter((p) => p.type === 'chair').map((p) => drawn.get(p.id)!)
      const looks = new Set(chairs.map((c) => `${c.icon}/${c.themed}/${c.variant}`))
      check(`${label}: one chair look (${chairs.length} chairs)`, chairs.every((c) => c.icon === 'chair' && !c.themed) && looks.size <= 1, [...looks].join(', '))
      const shot = await send('Page.captureScreenshot', { format: 'png' })
      await Bun.write(join(SHOTS, `${day.date}-${day.theme}-${w}x${h}.png`), Buffer.from(shot.data, 'base64'))
    }
  }
} finally {
  chrome.kill()
  try { ws!.close() } catch {}
}
console.log(failures.length ? `\n${failures.length} FAILED` : '\nall checks passed')
process.exit(failures.length ? 1 : 0)
