// Verification driver for the share card (SLAY-1.7). Drives headless Chrome over the DevTools protocol with touch emulation, on the dev-only
// date override (src/game/daily/clock.ts): it solves a scheduled day through the real UI, opens the share card on the start screen and
// checks it in every way a browser can differ:
//   - the preview, the emoji text (exact, from src/share), the two shapes, targets of 44px, nothing sideways;
//   - Share with a share sheet that takes files: the PNG that arrives is 1200x630 (wide) and 1080x1080 (square), really drawn (pixels of
//     the brand blue), named slaydoku-<n>[-square].png, and comes with the text;
//   - Share with a share sheet that takes text only; closing the sheet (no error); a sheet that fails (message and the fallback buttons);
//   - no share sheet: Copy text (clipboard API, and the textarea fallback without one) and Download image (both PNG sizes);
//   - the keyboard (Tab to Share, Enter), a result with hints and wrong checks, nothing requested from another origin, and offline.
// The share sheet, the clipboard and the download are replaced by recorders (a headless Chrome has none), chosen per page load through
// localStorage `verify-share-mode`. The card PNGs of the run are saved to OUT/cards (outside the repo) to look at.
//
// Usage (from the repo root; `bun run verify:phone` runs it with the other drivers):
//   bun run build && bunx vite preview --port 5197 &
//   bun docs/verification/share.ts
// Env: VIEWPORTS (default 390x844,1024x768), BASE (default local preview), CDP_PORT (default 9356), CHROME, OUT (folder for screenshots/,
// cards/ and share-log.md; default docs/verification/, set it to a folder outside the repo to leave the committed files alone).
// Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { emojiText, shareMetaOf } from '../../src/share/index.ts'
import { DAYS, DATE_KEY, RESULTS_KEY, seedStorage } from './daily.ts'
import type { ScheduleDay } from '../../src/schedule/types.ts'

const HERE = import.meta.dir
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9356)
const BASE = process.env.BASE ?? 'http://localhost:5197/'
const OUT = process.env.OUT ?? HERE
const SHOTS = join(OUT, 'screenshots')
const CARDS = join(OUT, 'cards')
const VIEWPORTS = (process.env.VIEWPORTS ?? '390x844,1024x768')
  .split(',')
  .map((label) => [label, ...label.split('x').map(Number)] as [string, number, number])

/** The day that is solved through the UI (the smallest board, so the solve is quick) and a second one whose result is written directly. */
const bySize = [...DAYS].sort((a, b) => a.size - b.size || a.n - b.n)
const DAY: ScheduleDay = bySize[0]!
const SEEDED: ScheduleDay = bySize.find((d) => d.n !== DAY.n && d.size >= 9) ?? bySize[1]!

mkdirSync(SHOTS, { recursive: true })
mkdirSync(CARDS, { recursive: true })
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

async function setViewport(w: number, h: number) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
}
const touch = (type: string, x: number, y: number) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] })
async function tap(x: number, y: number) { await touch('touchStart', x, y); await sleep(60); await touch('touchEnd', x, y) }
async function hold(x: number, y: number, ms = 700) { await touch('touchStart', x, y); await sleep(ms); await touch('touchEnd', x, y) }
type Rect = { x: number; y: number; w: number; h: number }
const rectOf = (sel: string) =>
  evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height } })()`) as Promise<Rect | null>
async function tapSel(sel: string, wait = 400) {
  const r = await rectOf(sel)
  if (!r) throw new Error('missing ' + sel)
  await tap(r.x, r.y)
  await sleep(wait)
}
const cellSel = (row: number, col: number) => `[data-cell=r${row + 1}c${col + 1}]`
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>
const textOf = (sel: string) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent?.trim() ?? ''`) as Promise<string>
const path = () => evaluate('location.pathname') as Promise<string>
const urlOf = (p: string) => new URL(p, BASE).href
async function load(p: string) {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(200)
  await send('Page.navigate', { url: urlOf(p) })
  await sleep(1800)
}
async function press(key: string, code: string, vk: number, text?: string) {
  await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, ...(text ? { text } : {}) })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk })
  await sleep(300)
}
const setDate = (date: string) => evaluate(`localStorage.setItem(${JSON.stringify(DATE_KEY)}, ${JSON.stringify(date)})`)
const setMode = (mode: string) => evaluate(`localStorage.setItem('verify-share-mode', ${JSON.stringify(mode)})`)

// --- logging ---------------------------------------------------------------------------------
interface Row { viewport: string; scenario: string; ok: boolean; detail: string; shots: string[] }
const rows: Row[] = []
let viewport = ''
let pendingShots: string[] = []
async function shot(name: string) {
  const file = `${viewport}-share-${name}`
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72, captureBeyondViewport: true })
  await Bun.write(join(SHOTS, `${file}.jpg`), Buffer.from(r.data, 'base64'))
  pendingShots.push(`${file}.jpg`)
}
function check(scenario: string, ok: boolean, detail = '') {
  rows.push({ viewport, scenario, ok, detail, shots: pendingShots })
  pendingShots = []
  console.log(ok ? 'PASS' : 'FAIL', viewport, scenario, detail)
}

// --- the recorders that stand in for the share sheet, the clipboard and the download ----------
/** Runs before every page script. The mode comes from localStorage `verify-share-mode`: real | files | text | abort | fail | none | noclip. */
const RECORDERS = `(() => {
  const mode = localStorage.getItem('verify-share-mode') || 'real'
  const log = (window.__log = { shared: [], copied: [], execCopied: [], downloads: [] })
  const define = (obj, key, value) => Object.defineProperty(obj, key, { configurable: true, value })
  const orig = URL.createObjectURL.bind(URL)
  const blobs = {}
  URL.createObjectURL = (blob) => { const u = orig(blob); blobs[u] = blob; return u }
  HTMLAnchorElement.prototype.click = function () { if (this.download) log.downloads.push({ name: this.download, blob: blobs[this.href] }) }
  if (['files', 'text', 'abort', 'fail'].includes(mode)) {
    define(navigator, 'canShare', (d) => mode === 'files' && !!(d && d.files && d.files.length))
    define(navigator, 'share', async (d) => {
      if (mode === 'abort') throw Object.assign(new Error('closed'), { name: 'AbortError' })
      if (mode === 'fail') throw new Error('not allowed')
      log.shared.push({ title: d.title, text: d.text, files: d.files || [] })
    })
  }
  if (mode === 'none' || mode === 'noclip') {
    define(navigator, 'share', undefined)
    define(navigator, 'canShare', undefined)
  }
  if (mode === 'noclip') {
    define(navigator, 'clipboard', undefined)
    document.execCommand = (cmd) => { log.execCopied.push({ cmd, value: document.activeElement && document.activeElement.value }); return true }
  } else if (mode !== 'real') {
    define(navigator, 'clipboard', { writeText: async (t) => { log.copied.push(t) } })
  }
})()`
await send('Page.enable')
await send('Page.addScriptToEvaluateOnNewDocument', { source: RECORDERS })

// --- playing a day through the UI ------------------------------------------------------------
interface PuzzleJson {
  people: { id: string; label: string; kind: string }[]
  solution: { personId: string; cell: { row: number; col: number } }[]
}
const selectedName = () =>
  evaluate(`(document.querySelector('.play-cards[data-gift-selected]') ? 'The victim' : document.querySelector('.polaroid[data-selected] .polaroid__name')?.textContent) ?? 'NONE'`) as Promise<string>

/** Long-press each person (as the card selection advances) onto its solution cell. */
async function placeAll(puzzle: PuzzleJson) {
  const idByName = new Map(puzzle.people.filter((p) => p.kind === 'suspect').map((p) => [p.label, p.id]))
  const victimId = puzzle.people.find((p) => p.kind === 'victim')!.id
  const cellOf = new Map(puzzle.solution.map((s) => [s.personId, s.cell]))
  for (let i = 0; i < puzzle.people.length; i++) {
    const name = (await selectedName()).trim()
    const pid = idByName.get(name) ?? (/victim/i.test(name) ? victimId : undefined)
    if (!pid) return false
    const cell = cellOf.get(pid)!
    const r = await rectOf(cellSel(cell.row, cell.col))
    if (!r) return false
    await hold(r.x, r.y, 650)
    await sleep(200)
  }
  await sleep(900)
  return true
}

/** Opens the day on screen and solves it. The date override decides which day it is. */
async function solveDay(day: ScheduleDay): Promise<boolean> {
  await setDate(day.date)
  await load('play')
  if ((await count('.play-board')) !== 1) return false
  const ok = await placeAll(day.puzzle as unknown as PuzzleJson)
  return ok && (await path()) === '/' && (await count('[data-result=solved]')) === 1
}

// --- what the page recorded ------------------------------------------------------------------
/** Width, height, size and how many pixels are the brand blue, of a PNG blob the page recorded (`window.__log.<what>[i]`). */
const probeBlob = (expr: string) =>
  evaluate(`(async () => { const blob = ${expr}; if (!blob) return null; const bmp = await createImageBitmap(blob); const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; const x = c.getContext('2d'); x.drawImage(bmp, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let blue = 0; let white = 0; for (let i = 0; i < d.length; i += 4) { if (Math.abs(d[i] - 43) < 6 && Math.abs(d[i + 1] - 125) < 6 && Math.abs(d[i + 2] - 233) < 6) blue++; if (d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250) white++ } return { w: bmp.width, h: bmp.height, type: blob.type, bytes: blob.size, blue, white } })()`) as Promise<{ w: number; h: number; type: string; bytes: number; blue: number; white: number } | null>
const blobBase64 = (expr: string) =>
  evaluate(`(async () => { const blob = ${expr}; const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (const b of buf) s += String.fromCharCode(b); return btoa(s) })()`) as Promise<string>
const logOf = (key: string) => evaluate(`window.__log.${key}.length`) as Promise<number>
const sharedInfo = (i: number) => evaluate(`(() => { const s = window.__log.shared[${i}]; return s ? { title: s.title, text: s.text, files: s.files.map((f) => ({ name: f.name, type: f.type })) } : null })()`) as Promise<{ title: string; text: string; files: { name: string; type: string }[] } | null>
const status = () => textOf('[data-share-status]')
const shareText = () => evaluate(`document.querySelector('[data-share-text]')?.textContent ?? ''`) as Promise<string>
const panelProbe = () =>
  evaluate(`(() => { const p = document.querySelector('[data-share]'); if (!p) return null; const r = p.getBoundingClientRect(); const img = p.querySelector('[data-share-preview]'); const ir = img.getBoundingClientRect(); const small = [...p.querySelectorAll('button')].filter((b) => { const q = b.getBoundingClientRect(); return q.width < 44 || q.height < 48 }).length; return { l: r.left, r: r.right, iw: innerWidth, sw: document.documentElement.scrollWidth, imgW: Math.round(ir.width), imgH: Math.round(ir.height), natural: img.naturalWidth, complete: img.complete, small, buttons: [...p.querySelectorAll('button')].map((b) => b.getAttribute('data-action') || b.getAttribute('data-format')) } })()`) as Promise<{ l: number; r: number; iw: number; sw: number; imgW: number; imgH: number; natural: number; complete: boolean; small: number; buttons: string[] } | null>
const expectedLines = (day: ScheduleDay, result: { n: number; date: string; elapsedMs: number; hints: number; wrongChecks: number }) => emojiText({ ...result, fp: day.fp, tier: day.tier, murdererId: 'x' }, shareMetaOf(day)).split('\n')
/** The text is the expected one, whatever host the build was made for (the last line is the site). */
const textMatches = (text: string, expected: string[]) => {
  const lines = text.split('\n')
  return lines.length === 4 && lines.slice(0, 3).join('\n') === expected.slice(0, 3).join('\n') && /^[\w.-]+(:\d+)?$/.test(lines[3]!)
}

async function scenario(w: number, h: number) {
  await setViewport(w, h)
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/Amsterdam' })
  await send('Page.navigate', { url: BASE })
  await sleep(1800)
  await evaluate(`localStorage.clear(); ${seedStorage(DAY.date, true)}`)
  await setMode('real')
  await load('')

  check('before solving: the share slot is empty', (await count('[data-slot=share] [data-share]')) === 0)
  check(`day #${DAY.n} (${DAY.date}, ${DAY.size}x${DAY.size}, ${DAY.tier}) is solved through the UI`, await solveDay(DAY))

  // The card on the start screen.
  const solved = (await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(RESULTS_KEY)})).results[${DAY.n}]`)) as { n: number; date: string; elapsedMs: number; hints: number; wrongChecks: number }
  const expected = expectedLines(DAY, solved)
  const p = await panelProbe()
  check('solved: the share slot holds the card with its preview, sized to the screen, nothing sideways', !!p && p.complete && p.natural === 1200 && p.l >= 0 && p.r <= p.iw && p.sw <= p.iw && p.imgW >= 250 && p.imgW <= p.iw, JSON.stringify(p))
  check('solved: the text is number, difficulty and size; time and hints; the strip; the site', textMatches(await shareText(), expected), JSON.stringify(await shareText()))
  check('solved: the strip has one square per person, all placed (no hints, no wrong checks)', (await shareText()).split('\n')[2] === '🟦'.repeat(DAY.size), (await shareText()).split('\n')[2])
  check('solved: the Share button comes with a text status line and the note that nothing leaves the device', (await count('[data-share-status][role=status]')) === 1 && /Nothing leaves your device/.test(await textOf('.share__note')))
  await shot('01-solved-real-browser')

  // Share sheet that takes files.
  await setMode('files')
  await load('')
  await sleep(700)
  const filesUi = await panelProbe()
  check('share sheet with files: Share is there, Copy and Download are not', !!filesUi && filesUi.buttons.includes('share') && !filesUi.buttons.includes('copy') && !filesUi.buttons.includes('download'), JSON.stringify(filesUi?.buttons))
  check('all buttons are at least 44px wide and 48px high', !!filesUi && filesUi.small === 0, String(filesUi?.small))
  await tapSel('[data-action=share]')
  const wide = await sharedInfo(0)
  check('Share (wide): the share sheet gets the PNG and the text', !!wide && wide.files.length === 1 && wide.files[0]!.name === `slaydoku-${DAY.n}.png` && wide.files[0]!.type === 'image/png' && textMatches(wide.text, expected) && wide.title === `Slaydoku #${DAY.n}`, JSON.stringify(wide))
  const widePng = await probeBlob('window.__log.shared[0].files[0]')
  check('the wide PNG is 1200x630 and really drawn (brand blue and white pixels)', !!widePng && widePng.w === 1200 && widePng.h === 630 && widePng.type === 'image/png' && widePng.blue > 2000 && widePng.white > 100000, JSON.stringify(widePng))
  check('feedback: "Shared." in the status line', (await status()) === 'Shared.', await status())
  await shot('02-shared-files')
  if (widePng) await Bun.write(join(CARDS, `${viewport}-wide.png`), Buffer.from(await blobBase64('window.__log.shared[0].files[0]'), 'base64'))

  await tapSel('[data-format=square]')
  await sleep(900)
  check('the square shape is chosen and the preview is square', (await evaluate(`document.querySelector('[data-format=square]').getAttribute('aria-pressed')`)) === 'true' && ((await panelProbe())?.imgW ?? 0) === ((await panelProbe())?.imgH ?? -1))
  await tapSel('[data-action=share]')
  const square = await sharedInfo(1)
  const squarePng = await probeBlob('window.__log.shared[1].files[0]')
  check('Share (square): the PNG is named slaydoku-<n>-square.png and is 1080x1080, really drawn', !!square && square.files[0]?.name === `slaydoku-${DAY.n}-square.png` && !!squarePng && squarePng.w === 1080 && squarePng.h === 1080 && squarePng.blue > 2000 && squarePng.white > 100000, JSON.stringify({ name: square?.files[0]?.name, squarePng }))
  await shot('03-shared-square')
  if (squarePng) await Bun.write(join(CARDS, `${viewport}-square.png`), Buffer.from(await blobBase64('window.__log.shared[1].files[0]'), 'base64'))

  // Keyboard: Tab to Share, Enter.
  await load('')
  await sleep(700)
  let focused = ''
  for (let i = 0; i < 25 && focused !== 'share'; i++) {
    await press('Tab', 'Tab', 9)
    focused = (await evaluate(`document.activeElement?.getAttribute('data-action') ?? ''`)) as string
  }
  await press('Enter', 'Enter', 13, '\r')
  check('keyboard: Tab reaches Share and Enter shares', focused === 'share' && (await logOf('shared')) === 1, `${focused} ${await logOf('shared')}`)

  // Text only.
  await setMode('text')
  await load('')
  await tapSel('[data-action=share]')
  const textOnly = await sharedInfo(0)
  check('share sheet without files: the text is shared alone', !!textOnly && textOnly.files.length === 0 && textMatches(textOnly.text, expected), JSON.stringify(textOnly))

  // The user closes the sheet; a sheet that fails.
  await setMode('abort')
  await load('')
  await tapSel('[data-action=share]')
  check('closing the share sheet is not an error (no message, no fallback buttons)', (await status()) === '' && (await count('[data-action=copy]')) === 0)
  await setMode('fail')
  await load('')
  await tapSel('[data-action=share]')
  check('a failing share sheet says so and offers Copy text and Download image', /did not work/.test(await status()) && (await count('[data-action=copy]')) === 1 && (await count('[data-action=download]')) === 1, await status())
  await shot('04-share-failed')

  // No share sheet: copy and download.
  await setMode('none')
  await load('')
  await sleep(700)
  const none = await panelProbe()
  check('no share sheet: Copy text and Download image instead of Share', !!none && !none.buttons.includes('share') && none.buttons.includes('copy') && none.buttons.includes('download'), JSON.stringify(none?.buttons))
  await shot('05-fallback-buttons')
  await tapSel('[data-action=copy]')
  const copied = (await evaluate('window.__log.copied[0] ?? null')) as string | null
  check('Copy text puts the text on the clipboard and says so', copied !== null && textMatches(copied, expected) && /Copied/.test(await status()), `${JSON.stringify(copied)} / ${await status()}`)
  await tapSel('[data-action=download]', 900)
  const dl = (await evaluate(`window.__log.downloads[0]?.name ?? null`)) as string | null
  const dlPng = await probeBlob('window.__log.downloads[0]?.blob')
  check('Download image (wide): slaydoku-<n>.png, 1200x630 PNG', dl === `slaydoku-${DAY.n}.png` && !!dlPng && dlPng.w === 1200 && dlPng.h === 630 && dlPng.blue > 2000, JSON.stringify({ dl, dlPng }))
  check('feedback after the download: "Image saved"', /Image saved/.test(await status()), await status())
  await tapSel('[data-format=square]')
  await sleep(900)
  await tapSel('[data-action=download]', 900)
  const dlSquare = await probeBlob('window.__log.downloads[1]?.blob')
  check('Download image (square): slaydoku-<n>-square.png, 1080x1080 PNG', ((await evaluate(`window.__log.downloads[1]?.name ?? null`)) as string | null) === `slaydoku-${DAY.n}-square.png` && !!dlSquare && dlSquare.w === 1080 && dlSquare.h === 1080 && dlSquare.blue > 2000, JSON.stringify(dlSquare))

  // Offline: everything is on the device.
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
  await tapSel('[data-action=download]', 900)
  const offlinePng = await probeBlob('window.__log.downloads[2]?.blob')
  await tapSel('[data-action=copy]')
  check('offline: the card is still made and downloaded, the text still copied', !!offlinePng && offlinePng.w === 1080 && (await logOf('copied')) === 2, JSON.stringify(offlinePng))
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  check('nothing was requested from another origin (all data stays on the device)', ((await evaluate(`performance.getEntriesByType('resource').every((e) => new URL(e.name).origin === location.origin)`)) as boolean) === true)

  // No clipboard API either: the textarea fallback.
  await setMode('noclip')
  await load('')
  await tapSel('[data-action=copy]')
  const exec = (await evaluate('window.__log.execCopied[0] ?? null')) as { cmd: string; value: string } | null
  check('no clipboard API: Copy text falls back to a textarea and execCommand("copy")', !!exec && exec.cmd === 'copy' && textMatches(exec.value, expected) && /Copied/.test(await status()), JSON.stringify(exec))

  // A result with hints and wrong checks (written directly), on another day.
  await setMode('none')
  await evaluate(
    `(() => { const key = ${JSON.stringify(RESULTS_KEY)}; const data = JSON.parse(localStorage.getItem(key)); data.results[${SEEDED.n}] = { n: ${SEEDED.n}, date: ${JSON.stringify(SEEDED.date)}, tier: ${JSON.stringify(SEEDED.tier)}, fp: ${JSON.stringify(SEEDED.fp)}, elapsedMs: 252000, hints: 2, wrongChecks: 1, murdererId: ${JSON.stringify(SEEDED.puzzle.people.find((q) => q.kind === 'suspect')!.id)} }; localStorage.setItem(key, JSON.stringify(data)) })()`,
  )
  await setDate(SEEDED.date)
  await load('')
  const seededExpected = expectedLines(SEEDED, { n: SEEDED.n, date: SEEDED.date, elapsedMs: 252_000, hints: 2, wrongChecks: 1 })
  const seededText = await shareText()
  check('a result with 2 hints and 1 wrong check: "04:12 · 2 hints" and yellow and red squares', textMatches(seededText, seededExpected) && seededText.includes('⏱ 04:12 · 💡 2 hints') && seededText.split('\n')[2] === '🟦'.repeat(SEEDED.size - 3) + '🟨🟨🟥', JSON.stringify(seededText))
  await shot('06-seeded-result')
  await tapSel('[data-action=download]', 900)
  const seededPng = await probeBlob('window.__log.downloads[0]?.blob')
  check('that result makes a card too (1200x630, red and amber squares drawn)', !!seededPng && seededPng.w === 1200 && seededPng.h === 630, JSON.stringify(seededPng))
  if (seededPng) await Bun.write(join(CARDS, `${viewport}-seeded-wide.png`), Buffer.from(await blobBase64('window.__log.downloads[0].blob'), 'base64'))
}

for (const [label, w, h] of VIEWPORTS) {
  viewport = label
  await scenario(w, h)
}

const failed = rows.filter((r) => !r.ok)
const md = [
  '| Viewport | Scenario | Result | Detail | Screenshots |',
  '|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.viewport} | ${r.scenario} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/').replace(/`/g, "'").slice(0, 300)} | ${r.shots.map((s) => `screenshots/${s}`).join(', ')} |`),
].join('\n')
await Bun.write(join(OUT, 'share-log.md'), md + '\n')
console.log(`${rows.length} checks, ${failed.length} failures`)
chrome.kill()
process.exit(failed.length ? 1 : 0)
