// Legend verification driver.
// Drives headless Chrome over the DevTools protocol with touch emulation. On scheduled puzzles (one 6x6, one 9x9 and one 12x12 day, chosen through the date override, see daily.ts) it opens the Legend from the toolbar
// and from the how-it-works card, checks that the rows on screen are the rows the scene calls for (computed here
// from the puzzle files with the same pure function the unit tests use, then compared with the DOM), that the card
// scrolls inside and closes with its button and by a tap on the backdrop, that tapping a row flashes exactly the
// squares of that object (the flash squares are compared with the on-screen rect of each board square, at 1x and at
// 2x zoom), that the flash layer takes no touch, and that it clears after 2 seconds or on any tap.
//
// Usage (from the repo root):
//   bun run build && bunx vite preview --port 5216 &
//   BASE=http://localhost:5216/ CDP_PORT=9416 OUT=/tmp/legend-shots bun docs/verification/legend.ts
// Env: VIEWPORTS (default 390x844,844x390,768x1024,1024x768), BASE, CDP_PORT (default 9353), CHROME, OUT (folder
// for screenshots; default a folder under the system temp dir, never inside the repo).
// Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Puzzle } from '../../src/engine/model/index.ts'
import { legendOf } from '../../src/ui/help/legend.ts'
import { help } from '../../src/content/help/help.ts'
import { DAYS, seedStorage } from './daily.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9353)
const BASE = process.env.BASE ?? 'http://localhost:5197/'
const SHOTS = process.env.OUT ?? join(tmpdir(), 'slaydoku-legend-shots')
const VIEWPORTS = (process.env.VIEWPORTS ?? '390x844,844x390,768x1024,1024x768')
  .split(',')
  .map((label) => [label, ...label.split('x').map(Number)] as [string, number, number])

mkdirSync(SHOTS, { recursive: true })
const profile = mkdtempSync(join(tmpdir(), 'chrome-legend-'))
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
async function load(path: string) {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(200)
  await send('Page.navigate', { url: new URL(path, BASE).href })
  await sleep(1800)
}

interface P { x: number; y: number }
const touch = (type: string, p: P) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p.x, y: p.y, id: 1 }] })
async function tap(p: P) { await touch('touchStart', p); await sleep(60); await touch('touchEnd', p); await sleep(200) }

interface Rect { x: number; y: number; w: number; h: number; l: number; t: number; r: number; b: number }
const rectJs = (sel: string, scroll: boolean) =>
  `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; ${scroll ? `e.scrollIntoView({ block: ${sel.includes('data-legend') ? "'center'" : "'nearest'"}, inline: 'nearest' });` : ''} const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, l: r.left, t: r.top, r: r.right, b: r.bottom } })()`
const rectOf = (sel: string, scroll = true) => evaluate(rectJs(sel, scroll)) as Promise<Rect | null>
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>
async function tapSel(sel: string) {
  const r = await rectOf(sel)
  if (!r) throw new Error('missing ' + sel)
  await tap(r)
}
async function tool(label: string) {
  const sel = await evaluate(`(() => { const e = [...document.querySelectorAll('.play-tool')].find(b => b.querySelector('.play-tool__label')?.textContent.trim() === ${JSON.stringify(label)}); if (!e) return null; document.querySelectorAll('[data-drive]').forEach(x => x.removeAttribute('data-drive')); e.setAttribute('data-drive', '1'); return '[data-drive]' })()`)
  if (!sel) throw new Error('missing tool ' + label)
  await tapSel(sel as string)
}
const shot = async (name: string) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 })
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

// --- the puzzles under test ------------------------------------------------------------
interface Subject { name: string; date: string; puzzle: Puzzle }
/** The first scheduled day of each of three sizes: a small, a middle and the biggest board. */
const subjects: Subject[] = [6, 9, 12].map((size) => {
  const day = DAYS.find((d) => d.size === size)
  if (!day) throw new Error(`no ${size}x${size} day in the schedule`)
  return { name: `day${day.n}-${size}x${size}`, date: day.date, puzzle: day.puzzle }
})

// --- probes ----------------------------------------------------------------------------------
const near = (a: number, b: number, tol = 2) => Math.abs(a - b) <= tol
/** Rows on screen: the object list buttons with their key and flag. */
const rowsOnScreen = () =>
  evaluate(`JSON.stringify([...document.querySelectorAll('[data-legend-list=objects] button')].map(b => ({ key: b.dataset.legend, occ: b.dataset.occupiable, noun: b.querySelector('strong').textContent, flag: b.querySelector('.play-legend__flag').textContent })))`).then((s) => JSON.parse(s as string) as { key: string; occ: string; noun: string; flag: string }[])
const panelProbe = () =>
  evaluate(`(() => { const p = document.querySelector('.play-modal__panel'); if (!p) return null; const r = p.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, sh: p.scrollHeight, ch: p.clientHeight, iw: innerWidth, ih: innerHeight, docW: document.documentElement.scrollWidth, docY: scrollY } })()`) as Promise<{ top: number; bottom: number; left: number; right: number; sh: number; ch: number; iw: number; ih: number; docW: number; docY: number } | null>
/** Screen rect of each flash square, matched with the rect of the board square it should sit on. */
const flashProbe = () =>
  evaluate(`JSON.stringify([...document.querySelectorAll('.play-board__pane [data-flash]')].map(g => { const [row, col] = g.dataset.flash.split(',').map(Number); const a = g.getBoundingClientRect(); const c = document.querySelector('[data-cell=r' + (row + 1) + 'c' + (col + 1) + ']').getBoundingClientRect(); return { key: g.dataset.flash, dx: (a.left + a.width / 2) - (c.left + c.width / 2), dy: (a.top + a.height / 2) - (c.top + c.height / 2), w: a.width, cw: c.width, pe: getComputedStyle(g).pointerEvents } }))`).then((s) => JSON.parse(s as string) as { key: string; dx: number; dy: number; w: number; cw: number; pe: string }[])
const cellsOf = (cells: readonly { row: number; col: number }[]) => cells.map((c) => `${c.row},${c.col}`).sort()

async function scenario(subject: Subject, zoomed: boolean) {
  const label = `${subject.name}${zoomed ? ' (2x zoom)' : ''}`
  const legend = legendOf(subject.puzzle.scene)
  await evaluate(seedStorage(subject.date))
  await load('play')
  check(`${label}: the puzzle is open`, (await count('.play-board')) === 1 && (await count('.play-modal')) === 0)

  // toolbar: nine controls fit (eight tools plus More, SLAY-4.2), Legend sits behind More
  const tb = await evaluate(`JSON.stringify({ labels: [...document.querySelectorAll('.play-tool__label')].map(l => l.textContent), sizes: [...document.querySelectorAll('.play-tool')].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] }), iw: innerWidth, sw: document.documentElement.scrollWidth })`).then((s) => JSON.parse(s as string) as { labels: string[]; sizes: number[][]; iw: number; sw: number })
  if (!zoomed) {
    check(`${label}: nine toolbar buttons, More last`, tb.labels.length === 9 && tb.labels[tb.labels.length - 1] === 'More', tb.labels.join())
    check(`${label}: every toolbar button is a 44px+ target, no sideways scroll`, tb.sizes.every(([w, h]) => w >= 44 && h >= 44) && tb.sw <= tb.iw, `min ${Math.min(...tb.sizes.map(([w, h]) => Math.min(w, h)))}px, page ${tb.sw}/${tb.iw}`)
    await shot(`${subject.name}-0-toolbar`)
  }
  if (zoomed) {
    await tool('Zoom')
    check(`${label}: board zoomed to 2x`, near(Number(await evaluate(`document.querySelector('.play-board').dataset.zoom`)), 2, 0.01))
  }

  await tool('More')
  const moreLabels = await evaluate(`JSON.stringify([...document.querySelectorAll('.play-more .play-tool__label')].map(l => l.textContent))`).then((s) => JSON.parse(s as string) as string[])
  check(`${label}: More opens a sheet with Options, Help and Legend`, JSON.stringify(moreLabels) === JSON.stringify(['Options', 'Help', 'Legend']), moreLabels.join())
  await tool('Legend')
  check(`${label}: Legend opens from More`, (await count('.play-modal [role=dialog], .play-modal[role=dialog], .play-modal__panel--legend')) > 0 && (await evaluate(`document.querySelector('.play-modal__title')?.textContent`)) === 'Legend')
  const onScreen = await rowsOnScreen()
  const expected = legend.objects.map((r) => ({ key: r.key, occ: r.occupiable ? 'yes' : 'no', noun: r.noun, flag: r.occupiable ? help.legend.canOccupy : help.legend.blocked }))
  check(`${label}: one row per object kind of the scene, right noun and flag`, JSON.stringify(onScreen) === JSON.stringify(expected), onScreen.map((r) => `${r.noun}:${r.occ}`).join(' '))
  check(`${label}: door and window rows match the scene`, JSON.stringify(await evaluate(`JSON.stringify([...document.querySelectorAll('[data-legend-list=edges] button')].map(b => b.dataset.legend))`)) === JSON.stringify(JSON.stringify(legend.edges.map((e) => e.kind))))
  check(`${label}: room label, four marks and the gift rule are there`, (await count('[data-legend=room-label], [data-legend=mark-note], [data-legend=mark-cross], [data-legend=mark-person], [data-legend=mark-gift]')) === 5 && (await evaluate(`document.querySelector('.play-legend__rule')?.textContent`)) === help.legend.rule)
  const iconsOk = await evaluate(`[...document.querySelectorAll('[data-legend-list=objects] .play-legend__icon')].every(s => { const b = s.getBoundingClientRect(); return b.width > 20 && b.height > 20 && s.querySelector('g[data-icon], g[data-theme-icon]') })`)
  check(`${label}: every object row shows its drawn icon`, iconsOk === true)
  const p = await panelProbe()
  check(`${label}: card is inside the screen, no page scroll, no sideways scroll`, !!p && p.top >= 0 && p.bottom <= p.ih + 1 && p.left >= 0 && p.right <= p.iw + 1 && p.docW <= p.iw && p.docY === 0, JSON.stringify(p))
  await shot(`${subject.name}${zoomed ? '-zoom' : ''}-1-legend`)

  // scrolling inside: scroll the panel to the bottom, the close button stays reachable, the page does not move
  if (p && p.sh > p.ch + 2) {
    await evaluate(`document.querySelector('.play-modal__panel').scrollTop = 99999`)
    await sleep(150)
    const q = await panelProbe()
    const btn = await rectOf('.play-modal__actions .play-btn', false)
    check(`${label}: long card scrolls inside; the close button stays in view`, !!q && !!btn && btn.b <= q.ih + 1 && btn.t >= 0 && q.docY === 0, `scrollHeight ${p.sh} > ${p.ch}`)
    await shot(`${subject.name}${zoomed ? '-zoom' : ''}-2-legend-scrolled`)
    await evaluate(`document.querySelector('.play-modal__panel').scrollTop = 0`)
  }

  // tap a row: the card steps aside, the squares of that object flash, exactly on the board squares
  for (const [i, row] of legend.objects.entries()) {
    if (i > 0 && i !== legend.objects.length - 1 && !(row.type === 'chair' || row.themeIcon)) continue // every chair / themed row, plus first and last
    await tapSel(`[data-legend="${row.key}"]`)
    const flash = await flashProbe()
    const keys = flash.map((f) => f.key).sort()
    check(`${label}: tapping "${row.noun}" flashes exactly its ${row.cells.length} squares`, JSON.stringify(keys) === JSON.stringify(cellsOf(row.cells)), `${keys.length} flashing`)
    check(`${label}: "${row.noun}" flash sits on its board squares (zoom included)`, flash.length > 0 && flash.every((f) => Math.abs(f.dx) <= 1.5 && Math.abs(f.dy) <= 1.5 && Math.abs(f.w - f.cw) <= f.cw * 0.06), flash.slice(0, 2).map((f) => `${f.key} d(${f.dx.toFixed(1)},${f.dy.toFixed(1)}) w${f.w.toFixed(0)}/${f.cw.toFixed(0)}`).join(' '))
    check(`${label}: flash takes no touch; the card is hidden but kept`, flash.every((f) => f.pe === 'none') && (await count('.play-modal[data-peek]')) === 1 && (await count('.play-peek')) === 1)
    if (i === 0 || row.themeIcon || row.type === 'chair') await shot(`${subject.name}${zoomed ? '-zoom' : ''}-3-flash-${row.key.replace(':', '-')}`)
    // a tap anywhere clears it at once and brings the card back
    await tapSel('.play-peek')
    check(`${label}: a tap clears the flash and brings the card back`, (await count('[data-flash]')) === 0 && (await count('.play-modal[data-peek]')) === 0 && (await count('.play-peek')) === 0)
  }

  // 2 seconds
  const first = legend.objects[0]!
  await tapSel(`[data-legend="${first.key}"]`)
  await sleep(1000)
  const at1s = await count('[data-flash]')
  await sleep(1400)
  const at24s = await count('[data-flash]')
  check(`${label}: flash is still there after 1s and gone after 2.4s`, at1s === first.cells.length && at24s === 0 && (await count('.play-modal[data-peek]')) === 0, `${at1s} -> ${at24s}`)

  // an edge row flashes the squares beside it
  for (const edge of legend.edges) {
    await tapSel(`[data-legend=${edge.kind}]`)
    const keys = (await flashProbe()).map((f) => f.key).sort()
    check(`${label}: tapping "${edge.kind}" flashes the ${edge.cells.length} squares beside one`, JSON.stringify(keys) === JSON.stringify(cellsOf(edge.cells)))
    await tapSel('.play-peek')
  }

  // close by the button, then by the backdrop, then Help -> Legend (both behind More, SLAY-4.2)
  await tapSel('.play-modal__actions .play-btn')
  check(`${label}: the close button closes the card`, (await count('.play-modal')) === 0)
  if (!zoomed) {
    await tool('More')
    await tool('Legend')
    await tap({ x: 3, y: 3 })
    check(`${label}: a tap on the backdrop closes the card`, (await count('.play-modal')) === 0)
    await tool('More')
    await tool('Help')
    const hasBtn = await evaluate(`[...document.querySelectorAll('.play-modal .play-btn')].some(b => b.textContent.trim() === 'Legend')`)
    await shot(`${subject.name}-4-how-it-works`)
    await evaluate(`[...document.querySelectorAll('.play-modal .play-btn')].find(b => b.textContent.trim() === 'Legend')?.click()`)
    await sleep(250)
    check(`${label}: the how-it-works card has a Legend button that opens the legend`, hasBtn === true && (await evaluate(`document.querySelector('.play-modal__title')?.textContent`)) === 'Legend' && (await count('.play-modal')) === 1)
    await tapSel('.play-modal__actions .play-btn')
  }
}

for (const [label, w, h] of VIEWPORTS) {
  viewport = label
  await setViewport(w, h)
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: BASE })
  await sleep(1500)
  for (const subject of subjects) await scenario(subject, false)
  await scenario(subjects[0]!, true)
  await evaluate('localStorage.clear()')
}

const failed = rows.filter((r) => !r.ok)
const md = ['| Viewport | Check | Result | Detail |', '|---|---|---|---|', ...rows.map((r) => `| ${r.viewport} | ${r.scenario} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/')} |`)].join('\n')
await Bun.write(join(SHOTS, 'legend-log.md'), md + '\n')
console.log(`${rows.length} checks, ${failed.length} failures`)
chrome.kill()
process.exit(failed.length ? 1 : 0)
