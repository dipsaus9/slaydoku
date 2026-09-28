// Locale verification driver (SLAY-3.6): a bounded Dutch smoke pass, one representative viewport,
// alongside the existing English suite (drive.ts, zoom.ts, legend.ts, screens.ts, stats.ts,
// share.ts, offline.ts — every one of them pins its own storage to locale 'en' so a Dutch browser
// never leaks into their English-text assertions, SLAY-3.2/SLAY-4.2). This driver does the
// opposite: it switches the language toggle itself and checks the app actually reads in Dutch —
// start screen, a played day's clue cards (computed with the engine's own `renderClue(..., 'nl')`,
// the same pure function the cards call, so a missed locale branch fails this check rather than
// only "looking Dutch"), a hint, the header's settings sheet, Stats and a solved day's Share panel —
// with no leftover English text and no mix of the two languages on screen. It does not repeat the
// 2700+ checks the English suite already makes in English; see docs/verification/report.md.
//
// Usage (from the repo root):
//   bun run build && bunx vite preview --port 5197 &
//   BASE=http://localhost:5197/ CDP_PORT=9417 OUT=/tmp/locale-shots bun docs/verification/locale.ts
// Env: VIEWPORT (default 390x844, one representative viewport — this is a smoke pass, not the full
// suite), BASE, CDP_PORT (default 9417), CHROME, OUT (folder for the log; default a folder under
// the system temp dir, never inside the repo).
// Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deriveMurderer } from '../../src/engine/model/index.ts'
import type { CatalogClue, RenderContext } from '../../src/engine/clues/index.ts'
import { renderClue } from '../../src/engine/clues/index.ts'
import { getHint, initialState } from '../../src/game/index.ts'
import { PLAY_DATE, RESULTS_KEY, dayOn, seedStorage } from './daily.ts'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT ?? 9417)
const BASE = process.env.BASE ?? 'http://localhost:5197/'
const OUT = process.env.OUT ?? join(tmpdir(), 'slaydoku-locale-shots')
const [VIEWPORT, VW, VH] = (() => {
  const label = process.env.VIEWPORT ?? '390x844'
  const [w, h] = label.split('x').map(Number)
  return [label, w!, h!] as const
})()
const DAY = dayOn(PLAY_DATE)

mkdirSync(OUT, { recursive: true })
const profile = mkdtempSync(join(tmpdir(), 'chrome-locale-'))
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
const urlOf = (p: string) => new URL(p, BASE).href
async function load(p: string) {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(200)
  await send('Page.navigate', { url: urlOf(p) })
  await sleep(1800)
}
async function reload() {
  await send('Page.reload')
  await sleep(1500)
}

const touch = (type: string, x: number, y: number) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] })
async function tap(x: number, y: number) {
  await touch('touchStart', x, y)
  await sleep(60)
  await touch('touchEnd', x, y)
}
const rectOf = (sel: string) =>
  evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`) as Promise<{ x: number; y: number } | null>
async function tapSel(sel: string) {
  const r = await rectOf(sel)
  if (!r) throw new Error('missing ' + sel)
  await tap(r.x, r.y)
  await sleep(250)
}
// A toolbar control (SLAY-5.1: icon-only, found by its accessible name — aria-label — since it
// has no visible text) or a header/sheet item that still shows a visible label (the header's
// settings icon, and Options/Help/Legend behind it): whichever the element has.
async function tool(label: string) {
  const r = (await evaluate(`(() => { const e = [...document.querySelectorAll('.play-tool, .play-header__more')].find(b => (b.querySelector('.play-tool__label')?.textContent.trim() ?? b.getAttribute('aria-label')) === ${JSON.stringify(label)}); if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)) as { x: number; y: number } | null
  if (!r) throw new Error('missing tool ' + label)
  await tap(r.x, r.y)
  await sleep(400) // ghost-click guard on a just-opened dialog (modalGuard.ts)
}
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>
const textOf = (sel: string) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent?.trim() ?? ''`) as Promise<string>
const localeKeyValue = () => evaluate(`localStorage.getItem('slaydoku:locale')`) as Promise<string | null>

// --- logging ---------------------------------------------------------------------------------
interface Row { scenario: string; ok: boolean; detail: string }
const rows: Row[] = []
function check(scenario: string, ok: boolean, detail = '') {
  rows.push({ scenario, ok, detail })
  console.log(ok ? 'PASS' : 'FAIL', VIEWPORT, scenario, detail)
}

// --- expected Dutch clue text, computed the same way the cards do (CardGrid.tsx: renderClue(c, { scene, people }, locale)) ---
const ctx: RenderContext = { scene: DAY.puzzle.scene, people: DAY.puzzle.people }
const suspects = DAY.puzzle.people.filter((p) => p.kind === 'suspect')
const expectedCards = suspects
  .map((p) => ({
    name: p.label,
    lines: DAY.puzzle.clues.filter((c) => c.personId === p.id).map((c) => renderClue(c as CatalogClue, ctx, 'nl')),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

// --- run ---------------------------------------------------------------------------------------
await setViewport(VW, VH)
await send('Page.enable')
await send('Runtime.enable')
// Headless Chrome defines navigator.share as a function (unlike a real phone browser without a share
// sheet target); undefine it on every document so the Share panel always shows its Copy/Download
// fallback here, the same way share.ts's own 'none' mode does for the English suite.
await send('Page.addScriptToEvaluateOnNewDocument', { source: "Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })" })
await send('Page.navigate', { url: BASE })
await sleep(1500)

// 1. Start screen, English baseline, then the toggle switches it to Dutch. helpSeen=true: the
// first-visit "How it works" card is drive.ts's own scenario, not this one's; left unseen it would
// open over the toolbar on the first Play and swallow every tap below it.
await evaluate(`localStorage.clear(); ${seedStorage(PLAY_DATE, true, 'en')}`)
await load('')
check('baseline: start screen loads in English', (await textOf('[data-action=play]')) === 'Play' && (await textOf('[data-tier]')) === 'Difficulty: Hard')
check(
  'the language toggle is reachable: EN and NL options, EN pressed to start',
  (await count('[data-locale-option=en]')) === 1 &&
    (await count('[data-locale-option=nl]')) === 1 &&
    (await textOf('[data-locale-option=en]')) === 'EN' &&
    (await textOf('[data-locale-option=nl]')) === 'NL' &&
    (await evaluate(`document.querySelector('[data-locale-option=en]').getAttribute('aria-pressed')`)) === 'true' &&
    (await evaluate(`document.querySelector('[data-locale-option=nl]').getAttribute('aria-pressed')`)) === 'false',
)

await tapSel('[data-locale-option=nl]')
check('switching the toggle persists the choice (localStorage)', (await localeKeyValue()) === 'nl', await localeKeyValue())
check(
  'start screen reads in Dutch after the switch: puzzle number, difficulty, size, Play button',
  (await textOf('[data-puzzle-number]')) === `Puzzel #${DAY.n}` &&
    (await textOf('[data-tier]')) === 'Moeilijkheid: Moeilijk' &&
    (await textOf('[data-size]')) === `${DAY.size} × ${DAY.size} raster` &&
    (await textOf('[data-action=play]')) === 'Spelen',
  `#${await textOf('[data-puzzle-number]')} | ${await textOf('[data-tier]')} | ${await textOf('[data-size]')} | ${await textOf('[data-action=play]')}`,
)
check(
  'no leftover English on the switched start screen',
  (await textOf('[data-tier]')) !== 'Difficulty: Hard' && (await textOf('[data-action=play]')) !== 'Play',
)
check(
  'the toggle stays reachable and correctly labeled after switching: NL now pressed, both options still shown',
  (await textOf('[data-locale-option=en]')) === 'EN' &&
    (await textOf('[data-locale-option=nl]')) === 'NL' &&
    (await evaluate(`document.querySelector('[data-locale-option=nl]').getAttribute('aria-pressed')`)) === 'true' &&
    (await evaluate(`document.querySelector('[data-locale-option=en]').getAttribute('aria-pressed')`)) === 'false',
)

await reload()
check('the Dutch choice survives a reload', (await localeKeyValue()) === 'nl' && (await textOf('[data-action=play]')) === 'Spelen')

// 2. Play a scheduled day: clue cards (checked against the engine's own Dutch render) and a hint.
await tapSel('[data-action=play]')
check('the puzzle opens', (await count('.play-board')) === 1)
const cards = (await evaluate(
  `JSON.stringify([...document.querySelectorAll('.play-cards .polaroid:not(.polaroid--victim)')].map(el => ({ name: el.querySelector('.polaroid__name')?.textContent ?? '', lines: [...el.querySelectorAll('.polaroid__line')].map(s => s.textContent ?? '') })).sort((a, b) => a.name.localeCompare(b.name)))`,
).then((s) => JSON.parse(s as string))) as { name: string; lines: string[] }[]
check(
  `every clue card (${cards.length} suspects) renders the exact Dutch text renderClue(..., 'nl') computes — no leftover English, none missing`,
  JSON.stringify(cards) === JSON.stringify(expectedCards),
  JSON.stringify(cards) === JSON.stringify(expectedCards) ? '' : `got ${JSON.stringify(cards)} want ${JSON.stringify(expectedCards)}`,
)

// The exact Dutch hint text a fresh board's level-1 hint should show, from the same pure function
// PlayScreen.tsx's store calls (getHint, through hints.ts's nextStep/hintFor/focusHint chain) — not
// a guess at wording. Catches the locale getting lost anywhere in that chain (found unwired end to
// end on this story: hints.ts never threaded locale to nextStep/deduction/solveHuman, hintFor never
// passed it to focusHint/stepHint, store.ts's hint() never took it, and PlayScreen.tsx never read
// useLocale() to give it — every hint rendered in English regardless of the app's language).
const expectedHint1 = getHint(DAY.puzzle, initialState(), 1, 'nl')
await tool('Hint')
const hintLevel = await textOf('.play-hint__level')
const hintText = await textOf('.play-hint__text')
check('a hint shows Dutch text: "Hint 1 van 3", not "Hint 1 of 3"', /^Hint 1 van 3$/.test(hintLevel), hintLevel)
check(
  `the hint body is the exact Dutch text getHint(..., 'nl') computes for this board, not English`,
  !!expectedHint1 && hintText === expectedHint1.text,
  hintText === expectedHint1?.text ? '' : `got "${hintText}" want "${expectedHint1?.text}"`,
)
await tapSel('.play-hint__actions .play-btn:not(.play-btn--primary)')
check('the hint bar closes', (await count('.play-hint')) === 0)

await tool('Meer')
const moreLabels = (await evaluate(`JSON.stringify([...document.querySelectorAll('.play-more .play-tool__label')].map(l => l.textContent))`).then((s) => JSON.parse(s as string))) as string[]
check("the header's settings sheet reads in Dutch: Opties, Help, Legenda", JSON.stringify(moreLabels) === JSON.stringify(['Opties', 'Help', 'Legenda']), moreLabels.join())
await tap(3, 3)
await sleep(300)

// 3. Stats (reachable without solving anything; StatsPanel uses the same Modal as Legend/Help/Options).
await load('')
check(
  'Stats: the open button and the streak summary are Dutch, not English',
  (await textOf('[data-stats-open]')) === 'Statistieken' && /^Reeks \d+ · Beste \d+$/.test(await textOf('[data-stats-summary]')),
  `open="${await textOf('[data-stats-open]')}" summary="${await textOf('[data-stats-summary]')}"`,
)
await tapSel('[data-stats-open]')
check(
  'the Stats card opens with a Dutch title, not English',
  (await textOf('.play-modal__title')) === 'Jouw statistieken',
  await textOf('.play-modal__title'),
)
await sleep(200) // the dialog's own ghost-click guard (modalGuard.ts, GHOST_CLICK_MS=350) ignores a tap inside it within 350ms of opening
await tapSel('[data-action=close]')
check('the Stats card closes', (await count('.play-modal')) === 0)

// 4. About.
await load('about')
const aboutText = (await evaluate(`document.querySelector('.about')?.innerText ?? ''`)) as string
check(
  'About reads in Dutch: title, tagline, every section title',
  ['Over Slaydoku', 'Elke dag een nieuwe moordmysteriepuzzel', 'Hoe het werkt', 'Met dank aan', 'Privacy', 'Open source', 'Contact'].every((t) => aboutText.includes(t)),
  aboutText.slice(0, 200),
)
check('About has no leftover English title or tagline', !aboutText.includes('About Slaydoku') && !aboutText.includes('A new murder mystery puzzle every day'))

// 5. Share, on a solved day (result seeded directly, the same shortcut drive.ts uses for its own solved-start-screen state; playing the day end to end is drive.ts's job, in English). Headless Chrome has no
// navigator.share, so the SharePanel renders its fallback Copy/Download buttons (share.ts's own 'none' mode), never the Share button (share.supported is false) — the same on every locale.
await evaluate(
  `localStorage.setItem(${JSON.stringify(RESULTS_KEY)}, JSON.stringify({ version: 1, results: { ${DAY.n}: { n: ${DAY.n}, date: ${JSON.stringify(DAY.date)}, fp: ${JSON.stringify(DAY.fp)}, elapsedMs: 754000, hints: 1, wrongChecks: 0, murdererId: ${JSON.stringify(deriveMurderer(DAY.puzzle, DAY.puzzle.solution))} } } }))`,
)
await load('')
check('the seeded day shows as solved, in Dutch ("Opgelost!")', (await count('[data-result=solved]')) === 1 && (await evaluate(`document.querySelector('[data-result=solved]')?.textContent?.includes('Opgelost!')`)) === true)
check(
  'the Share panel reads in Dutch: title, the fallback buttons (no navigator.share in headless Chrome), the privacy note',
  (await textOf('.share__title')) === 'Deel je resultaat' &&
    (await textOf('[data-action=copy]')) === 'Tekst kopiëren' &&
    (await textOf('[data-action=download]')) === 'Afbeelding downloaden' &&
    (await textOf('.share__note')) === 'Er verlaat niets je apparaat, tenzij je het deelt.',
  `title="${await textOf('.share__title')}" copy="${await textOf('[data-action=copy]')}" download="${await textOf('[data-action=download]')}"`,
)
check(
  'no leftover English on the Share panel',
  (await textOf('.share__title')) !== 'Share your result' && (await textOf('[data-action=copy]')) !== 'Copy text' && (await textOf('[data-action=download]')) !== 'Download image',
)

// --- report --------------------------------------------------------------------------------
const failed = rows.filter((r) => !r.ok)
const md = ['| Check | Result | Detail |', '|---|---|---|', ...rows.map((r) => `| ${r.scenario} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/')} |`)].join('\n')
await Bun.write(join(OUT, 'locale-log.md'), md + '\n')
console.log(`${rows.length} checks, ${failed.length} failures`)
chrome.kill()
process.exit(failed.length ? 1 : 0)
