// Visual check of the depth look (SLAY-16.9): board, legend, orientation sheets, shadow clipping, About wrap and a performance trace.
// Drives headless Chrome over the DevTools protocol. Real device widths come from Emulation.setDeviceMetricsOverride (headless Chrome has a
// minimum WINDOW width, so --window-size would clip a 360px phone); every shot is taken at deviceScaleFactor 2.
//
// Usage (from the repo root):
//   bun run build && bunx vite preview --port 5461 &
//   BASE=http://localhost:5461/ CDP_PORT=9471 OUT=/private/tmp/claude-501/w-16.9 bun docs/verification/depth.ts
// Env: PARTS (comma list of sheets,boards,legend,clip,about,perf; default all), BASE, CDP_PORT, OUT (screenshots, report.json and the Chrome
// profile go here, never inside the repo), CHROME.
// Writes $OUT/shots/*.png and $OUT/report.json. The checks that can fail print FAIL and the exit code is non-zero; the performance numbers are
// reported, not asserted.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { OBJECT_CATALOG } from '../../src/engine/model/index.ts'
import { IconDepthScope, ObjectIconGlyph } from '../../src/render/icons/ObjectIcon.tsx'
import { ORIENTATIONS, boundingSize, orientCells } from '../../src/render/icons/orientation.ts'
import { iconFootprints } from '../../src/render/icons/resolve.ts'
import { iconLegendGroups } from '../../src/render/icons/types.ts'
import type { IconObjectType } from '../../src/render/icons/types.ts'
import { ThemeIconSheet } from '../../src/render/icons/themes/ThemeIconSheet.tsx'
import { LOCALE_KEY } from '../../src/locale/storage.ts'
import type { ScheduleDay } from '../../src/schedule/types.ts'
import { DAYS, seedStorage } from './daily.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9471)
const BASE = process.env.BASE ?? 'http://localhost:5461/'
const OUT = process.env.OUT ?? '/private/tmp/claude-501/w-16.9'
const PARTS = new Set((process.env.PARTS ?? 'sheets,boards,legend,clip,about,perf').split(','))
const SHOTS = join(OUT, 'shots')
mkdirSync(SHOTS, { recursive: true })

const VIEWPORTS: [number, number][] = [
  [360, 640],
  [390, 844],
  [768, 1024],
  [1024, 768],
]
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
interface P { x: number; y: number }
const touch = (type: string, p: P) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p.x, y: p.y, id: 1 }] })
async function tap(p: P) { await touch('touchStart', p); await sleep(60); await touch('touchEnd', p); await sleep(250) }
const rectOf = (sel: string) => json<{ x: number; y: number; w: number; h: number } | null>(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } })()`)

const report: Record<string, unknown> = {}
const failures: string[] = []
function check(name: string, ok: boolean, detail = '') {
  console.log(ok ? 'PASS' : 'FAIL', name, detail)
  if (!ok) failures.push(`${name} ${detail}`)
}

// --- the days under test --------------------------------------------------------------------------------------
/** Objects that touch the last column / last row of the board: their shadow falls toward the viewBox edge. */
const edgeObjects = (d: ScheduleDay) => {
  const { width, height } = d.puzzle.scene
  const objs = d.puzzle.scene.objects
  const right = objs.filter((o) => o.cells.some((c) => c.col === width - 1)).length
  const bottom = objs.filter((o) => o.cells.some((c) => c.row === height - 1)).length
  return { right, bottom }
}
const pickDay = (size: number, minObjects = 0) => {
  const ranked = DAYS.filter((d) => d.size === size && d.puzzle.scene.objects.length >= minObjects)
    .map((d) => ({ d, e: edgeObjects(d) }))
    .sort((a, b) => Math.min(b.e.right, b.e.bottom) - Math.min(a.e.right, a.e.bottom) || b.d.puzzle.scene.objects.length - a.d.puzzle.scene.objects.length)
  return ranked[0]!.d
}
const subjects = [pickDay(6), pickDay(9), pickDay(12, 40)]
report.days = subjects.map((d) => ({ date: d.date, size: d.size, tier: d.tier, objects: d.puzzle.scene.objects.length, edges: edgeObjects(d) }))

// --- 1. orientation sheets: every object type, every footprint, all 8 orientations ----------------------------
if (PARTS.has('sheets')) {
  const CELL = 56
  const { occupiable, blocking } = iconLegendGroups()
  const tile = (type: IconObjectType, variantId: string, cols: number, rows: number, cellsOf: readonly { row: number; col: number }[], o: (typeof ORIENTATIONS)[number]) => {
    const cells = orientCells(cellsOf, cols, rows, o)
    const size = boundingSize(cells)
    const svg = renderToStaticMarkup(
      createElement(
        'svg',
        { xmlns: 'http://www.w3.org/2000/svg', width: size.cols * CELL, height: size.rows * CELL, viewBox: `-14 -14 ${size.cols * 100 + 28} ${size.rows * 100 + 28}`, overflow: 'visible' },
        ...cells.map((c) => createElement('rect', { key: `${c.row}-${c.col}`, x: c.col * 100, y: c.row * 100, width: 100, height: 100, fill: '#f3ecdc', stroke: '#b9b2a0', strokeWidth: 1.5, strokeDasharray: '6 5' })),
        createElement(IconDepthScope, null, createElement(ObjectIconGlyph, { type, cells, rotation: o.rotation, mirror: o.mirror })),
      ),
    )
    return `<figure data-orientation="${o.rotation}${o.mirror ? 'm' : ''}" data-type="${type}" data-variant="${variantId}">${svg}<figcaption>${o.rotation}${o.mirror ? ' mirror' : ''}</figcaption></figure>`
  }
  const sections: { name: string; types: IconObjectType[] }[] = []
  const all = [...occupiable, ...blocking]
  for (let i = 0; i < all.length; i += 8) sections.push({ name: `sheet-${String(sections.length + 1).padStart(2, '0')}`, types: all.slice(i, i + 8) })
  const missing: string[] = []
  for (const s of sections) {
    const cards = s.types.map((type) => {
      const rows = iconFootprints(type).map((v) => {
        const tiles = ORIENTATIONS.map((o) => tile(type, v.id, v.cols, v.rows, v.cells, o)).join('')
        return `<div class="variant"><b>${v.id}</b><div class="tiles">${tiles}</div></div>`
      })
      return `<section class="card"><h3>${type}</h3>${rows.join('')}</section>`
    })
    for (const t of s.types) {
      const html = cards.join('')
      for (const v of iconFootprints(t)) for (const o of ORIENTATIONS) if (!html.includes(`data-type="${t}" data-variant="${v.id}"`) || !html.includes(`data-orientation="${o.rotation}${o.mirror ? 'm' : ''}"`)) missing.push(`${t}/${v.id}/${o.rotation}${o.mirror}`)
    }
    const page = `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:16px;background:#f5f3ef;font:13px system-ui;color:#2a211c}.card{background:#fff;border:1px solid #ddd6c8;border-radius:10px;padding:10px 12px;margin-bottom:12px}h3{margin:0 0 6px}.variant{margin-bottom:8px}.tiles{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;margin-top:4px}figure{margin:0}svg{display:block}figcaption{text-align:center;color:#6b6259;font-size:11px}</style>${cards.join('')}`
    await Bun.write(join(OUT, `${s.name}.html`), page)
  }
  check('every object type, footprint and orientation (8) is on a sheet', missing.length === 0, missing.slice(0, 5).join(','))
  const counts = all.map((t) => iconFootprints(t).length * 8)
  report.sheets = { sections: sections.length, types: all.length, tiles: counts.reduce((a, b) => a + b, 0), objectCatalog: Object.keys(OBJECT_CATALOG).length }
  // The theme drawings (themes/art.tsx), flat sheet from the app's own component, shot with the same depth scope.
  await Bun.write(join(OUT, 'sheet-themes.html'), `<!doctype html><meta charset=utf-8><body style="margin:16px;background:#f5f3ef">${renderToStaticMarkup(createElement(ThemeIconSheet))}`)
  await setViewport(1100, 900, false)
  for (const name of [...sections.map((s) => s.name), 'sheet-themes']) {
    await send('Page.navigate', { url: `file://${join(OUT, name)}.html` })
    await sleep(700)
    const h = (await evaluate('document.documentElement.scrollHeight')) as number
    await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: h, deviceScaleFactor: 1.5, mobile: false })
    await sleep(300)
    await shotPng(name)
  }
}

// --- 2. boards (+ legend) at the four device sizes in en and nl ------------------------------------------------
async function openPlay(day: ScheduleDay, locale: string, w: number, h: number) {
  await setViewport(w, h)
  await seed(day.date, locale)
  await load('play')
  await sleep(600)
}
const overlapProbe = `(() => {
  const labels = [...document.querySelectorAll('[data-room-label]')].map(e => { const r = e.getBoundingClientRect(); return { id: e.getAttribute('data-room-label'), l: r.left, t: r.top, r: r.right, b: r.bottom } })
  const objs = [...document.querySelectorAll('[data-layer=objects] [data-depth]')].map(e => { const r = e.firstElementChild.getBoundingClientRect(); return { k: e.firstElementChild.getAttribute('data-icon') || e.firstElementChild.getAttribute('data-theme-icon') || '?', l: r.left, t: r.top, r: r.right, b: r.bottom } })
  const hits = []
  for (const o of objs) for (const l of labels) { const w = Math.min(o.r, l.r) - Math.max(o.l, l.l), h = Math.min(o.b, l.b) - Math.max(o.t, l.t); if (w > 1 && h > 1) hits.push({ object: o.k, room: l.id, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 }) }
  return { labels: labels.length, objects: objs.length, hits }
})()`

if (PARTS.has('boards')) {
  const labelReport: unknown[] = []
  for (const day of subjects) {
    for (const locale of LOCALES) {
      for (const [w, h] of VIEWPORTS) {
        await openPlay(day, locale, w, h)
        const probe = await json<{ labels: number; objects: number; hits: unknown[] }>(overlapProbe)
        const sw = await json<{ iw: number; sw: number }>(`({ iw: innerWidth, sw: document.documentElement.scrollWidth })`)
        check(`board ${day.size}x${day.size} ${locale} ${w}x${h}: no object over a wall label, no sideways scroll`, probe.hits.length === 0 && sw.sw <= sw.iw, `${probe.objects} objects, ${probe.labels} labels, hits ${JSON.stringify(probe.hits)}, page ${sw.sw}/${sw.iw}`)
        labelReport.push({ day: day.date, size: day.size, locale, w, h, ...probe })
        const r = await json<{ x: number; y: number; width: number; height: number } | null>(`(() => { const e = document.querySelector('.play-board'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y)) } })()`)
        await shotPng(`board-${day.size}x${day.size}-${locale}-${w}x${h}`)
        if (r) await shotPng(`boardclip-${day.size}x${day.size}-${locale}-${w}x${h}`, r)
      }
    }
  }
  report.labelOverlap = labelReport
}

if (PARTS.has('legend')) {
  for (const day of subjects) {
    for (const locale of LOCALES) {
      for (const [w, h] of VIEWPORTS) {
        await openPlay(day, locale, w, h)
        const btn = await rectOf('.play-header__legend')
        if (!btn) { check(`legend ${day.size} ${locale} ${w}x${h}: opens`, false, 'no legend button'); continue }
        await tap(btn)
        await sleep(500)
        const panel = await json<{ sh: number; ch: number } | null>(`(() => { const p = document.querySelector('.play-modal__panel'); return p ? { sh: p.scrollHeight, ch: p.clientHeight } : null })()`)
        check(`legend ${day.size} ${locale} ${w}x${h}: opens`, !!panel)
        if (!panel) continue
        const steps = Math.max(1, Math.ceil(panel.sh / Math.max(1, panel.ch - 80)))
        for (let i = 0; i < steps; i++) {
          await evaluate(`document.querySelector('.play-modal__panel').scrollTop = ${i} * (${panel.ch} - 80)`)
          await sleep(200)
          await shotPng(`legend-${day.size}x${day.size}-${locale}-${w}x${h}-${i + 1}of${steps}`)
        }
      }
    }
  }
}

// --- 3. shadow clipping at the board's viewBox edge and in the legend swatches ---------------------------------
// Boards only. Screenshot, then let every ancestor of the svg overflow (and the svg itself), screenshot again at the same layout, and compare the two
// in a canvas: any darker pixel the second shot has is shadow that the first one clipped.
const unclip = `(() => { const s = document.createElement('style'); s.id = 'unclip'; s.textContent = '.play-board svg, .play-legend svg { overflow: visible !important }'; document.head.appendChild(s) })()`
const regionsJs = (sel: string) => `[...document.querySelectorAll(${JSON.stringify(sel)})].map((e) => { const r = e.getBoundingClientRect(); return [r.left - 14, r.top - 14, r.right + 14, r.bottom + 14].map((v) => Math.round(v * 2)) })`
const diffInPage = (a: string, b: string, regions: string) => `(async () => {
  const regions = ${regions}
  const load = (d) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + d })
  const [ia, ib] = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(b)})])
  const mk = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height) }
  const A = mk(ia), B = mk(ib)
  let n = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
  for (let p = 0; p < A.data.length; p += 4) { const qx = (p / 4) % A.width, qy = Math.floor(p / 4 / A.width); if (!regions.some((g) => qx >= g[0] && qx <= g[2] && qy >= g[1] && qy <= g[3])) continue; const d = Math.max(Math.abs(A.data[p] - B.data[p]), Math.abs(A.data[p + 1] - B.data[p + 1]), Math.abs(A.data[p + 2] - B.data[p + 2])); if (d > 6) { n++; max = Math.max(max, d); const px = (p / 4) % A.width, py = Math.floor(p / 4 / A.width); x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py) } }
  return { n, max, box: n ? [x0, y0, x1, y1] : null, w: A.width, h: A.height }
})()`
if (PARTS.has('clip')) {
  const clipReport: unknown[] = []
  for (const day of subjects) {
    for (const [w, h] of [VIEWPORTS[1]!, VIEWPORTS[2]!] as [number, number][]) {
      await openPlay(day, 'en', w, h)
      const a = await shotPng(`clip-board-${day.size}x${day.size}-${w}x${h}-a`)
      await evaluate(unclip)
      await sleep(300)
      const b = await shotPng(`clip-board-${day.size}x${day.size}-${w}x${h}-b-unclipped`)
      const d = await evaluate(diffInPage(a, b, regionsJs('.play-board svg[data-columns]')))
      clipReport.push({ what: 'board', size: day.size, w, h, diff: d, edges: edgeObjects(day) })
      console.log('clip board', day.size, `${w}x${h}`, JSON.stringify(d))
    }
  }
  report.clipping = clipReport
}

// Zoomed look (4x) at the legend swatches as shipped. A swatch svg is exactly its footprint (Legend.tsx ObjectSwatch), so an object that
// reaches its footprint edge has its ground shadow cut flat there: judge it on swatch-clipped-4x.png. (Lifting the svg overflow is no valid
// comparison here: it changes the flex layout and the swatches grow.)
if (PARTS.has('swatch')) {
  const day = subjects[0]!
  await openPlay(day, 'en', 768, 1024)
  const btn = await rectOf('.play-header__legend')
  if (btn) {
    await tap(btn)
    await sleep(600)
    const region = await json<{ x: number; y: number; width: number; height: number }>('(() => { const r = document.querySelector(".play-legend__icon").getBoundingClientRect(); return { x: r.left - 10, y: r.top - 10, width: 70, height: 6 * 70 } })()')
    const rects = () => json<unknown>('[...document.querySelectorAll(".play-legend__icon")].map((s) => { const a = s.getBoundingClientRect(); const g = s.querySelector("g[data-depth]").getBoundingClientRect(); return { svg: [a.width, a.height].map(Math.round), art: [g.width, g.height].map((v) => Math.round(v * 10) / 10), vb: s.getAttribute("viewBox") } })')
    const before = await rects()
    await send('Page.captureScreenshot', { format: 'png', clip: { ...region, scale: 4 } }).then((r) => Bun.write(join(SHOTS, 'swatch-clipped-4x.png'), Buffer.from(r.data, 'base64')))
    report.swatch = { before }
    console.log(JSON.stringify(report.swatch))
  }
}

// --- 4. About page at a true 360px and 390px in en and nl -----------------------------------------------------
if (PARTS.has('about')) {
  const aboutReport: unknown[] = []
  for (const locale of LOCALES) {
    for (const [w, h] of [VIEWPORTS[0]!, VIEWPORTS[1]!]) {
      await setViewport(w, h)
      await send('Page.navigate', { url: new URL('about', BASE).href })
      await sleep(500)
      await evaluate(`localStorage.setItem(${JSON.stringify(LOCALE_KEY)}, ${JSON.stringify(locale)})`)
      await load('about')
      const m = await json<{ iw: number; sw: number; over: { tag: string; text: string; right: number; sw: number; cw: number }[]; reminder: { w: number; h: number; lines: number } | null }>(`(() => {
        const over = []
        for (const e of document.querySelectorAll('.about *')) { const r = e.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 0.5 || r.left < -0.5 || e.scrollWidth > e.clientWidth + 1)) over.push({ tag: e.tagName, text: (e.textContent || '').slice(0, 40), right: Math.round(r.right), sw: e.scrollWidth, cw: e.clientWidth }) }
        const rem = document.querySelector('[data-about-reminder] p'); const rr = rem && rem.getBoundingClientRect()
        const lh = rem ? parseFloat(getComputedStyle(rem).lineHeight) : 1
        return { iw: innerWidth, sw: document.documentElement.scrollWidth, over, reminder: rr ? { w: Math.round(rr.width), h: Math.round(rr.height), lines: Math.round(rr.height / (lh || 24)) } : null }
      })()`)
      check(`about ${locale} ${w}px: no element wider than the screen, no sideways scroll`, m.sw <= m.iw && m.over.length === 0, JSON.stringify(m))
      aboutReport.push({ locale, w, ...m })
      const full = (await evaluate('document.documentElement.scrollHeight')) as number
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: full, deviceScaleFactor: 2, mobile: true })
      await sleep(300)
      await shotPng(`about-${locale}-${w}`)
    }
  }
  report.about = aboutReport
}

// --- 5. performance: pinch zoom and pan on the 12x12 day with 40+ objects --------------------------------------
interface TraceEvent { name: string; ph: string; ts: number; dur?: number; tid: number; pid: number; args?: any; cat?: string }
async function trace(day: ScheduleDay, w: number, h: number, noFilter: boolean) {
  await openPlay(day, 'en', w, h)
  if (noFilter) await evaluate(`(() => { const s = document.createElement('style'); s.textContent = '[data-depth] { filter: none !important }'; document.head.appendChild(s) })()`)
  const f = await rectOf('.play-board')
  if (!f) throw new Error('no board')
  const events: TraceEvent[] = []
  let done: () => void
  const complete = new Promise<void>((r) => (done = r))
  const onMsg = (m: any) => {
    if (m.method === 'Tracing.dataCollected') events.push(...m.params.value)
    if (m.method === 'Tracing.tracingComplete') done()
  }
  listeners.push(onMsg)
  await send('Tracing.start', { traceConfig: { recordMode: 'recordAsMuchAsPossible', includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'cc', 'gpu', 'viz', 'toplevel', '__metadata'] }, transferMode: 'ReportEvents' })
  await sleep(300)
  const zoomPeaks: number[] = []
  const cx = f.x, cy = Math.min(f.y, h / 2)
  // Repeated zoom changes through the app's own ctrl+wheel and wheel handlers (useBoardZoom.ts: the same code path a trackpad pinch takes,
  // and deterministic, unlike synthesised two-finger touches): twice zoom in around the board centre, pan, zoom out, with a frame between steps.
  const wheel = (deltaX: number, deltaY: number, ctrl: boolean) => send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: cx, y: cy, deltaX, deltaY, modifiers: ctrl ? 2 : 0 })
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < 24; i++) { await wheel(0, -12, true); await sleep(16) }
    await sleep(200)
    zoomPeaks.push(Number(await evaluate(`document.querySelector('.play-board').dataset.zoom`)))
    for (let i = 0; i < 24; i++) { await wheel(-6, -3, false); await sleep(16) }
    for (let i = 0; i < 24; i++) { await wheel(6, 3, false); await sleep(16) }
    await sleep(200)
    for (let i = 0; i < 24; i++) { await wheel(0, 12, true); await sleep(16) }
    await sleep(300)
  }
  const zoom = await evaluate(`document.querySelector('.play-board').dataset.zoom`)
  await send('Tracing.end')
  await complete
  listeners.splice(listeners.indexOf(onMsg), 1)
  const threads = new Map<string, string>()
  for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') threads.set(`${e.pid}:${e.tid}`, e.args.name)
  const tasks = events.filter((e) => e.ph === 'X' && e.name === 'RunTask' && (e.dur ?? 0) > 0)
  const long = tasks.filter((t) => (t.dur ?? 0) > 100_000)
  const byName = (t: TraceEvent) => {
    const inside = events.filter((e) => e.ph === 'X' && e.pid === t.pid && e.tid === t.tid && e.name !== 'RunTask' && e.ts >= t.ts && e.ts + (e.dur ?? 0) <= t.ts + (t.dur ?? 0))
    const agg = new Map<string, number>()
    for (const e of inside) agg.set(e.name, Math.max(agg.get(e.name) ?? 0, (e.dur ?? 0) / 1000))
    return [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, ms]) => `${n} ${ms.toFixed(1)}ms`)
  }
  const raster = events.filter((e) => e.ph === 'X' && (e.name === 'RasterTask' || e.name === 'Paint' || e.name === 'PrePaint'))
  const sum = (n: string) => raster.filter((e) => e.name === n).reduce((a, e) => a + (e.dur ?? 0), 0) / 1000
  const top = [...tasks].sort((a, b) => (b.dur ?? 0) - (a.dur ?? 0)).slice(0, 5)
  return {
    viewport: `${w}x${h}`, noFilter, zoomPeaks, finalZoom: zoom, tasks: tasks.length,
    longTasksOver100ms: long.map((t) => ({ ms: Math.round((t.dur ?? 0) / 1000), thread: threads.get(`${t.pid}:${t.tid}`) ?? '?', inside: byName(t) })),
    top5ms: top.map((t) => ({ ms: Math.round((t.dur ?? 0) / 1000), thread: threads.get(`${t.pid}:${t.tid}`) ?? '?' })),
    rasterTaskMs: Math.round(sum('RasterTask')), paintMs: Math.round(sum('Paint')), rasterTasks: raster.filter((e) => e.name === 'RasterTask').length,
  }
}
if (PARTS.has('perf')) {
  const day = subjects[2]!
  const runs = []
  for (const [w, h] of [VIEWPORTS[1]!, VIEWPORTS[3]!] as [number, number][]) {
    for (const noFilter of [false, true]) {
      const r = await trace(day, w, h, noFilter)
      runs.push(r)
      console.log('perf', JSON.stringify(r))
    }
  }
  report.perf = { day: day.date, objects: day.puzzle.scene.objects.length, runs }
}

await Bun.write(join(OUT, 'report.json'), JSON.stringify(report, null, 2))
ws.close()
chrome.kill()
console.log(failures.length ? `\n${failures.length} FAILED` : '\nall checks passed')
process.exit(failures.length ? 1 : 0)
