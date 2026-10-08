// Locale verification driver (SLAY-3.6): a bounded Dutch smoke pass, one representative viewport,
// alongside the existing English suite (drive.ts, zoom.ts, legend.ts, screens.ts, stats.ts,
// share.ts, offline.ts — every one of them pins its own storage to locale 'en' so a Dutch browser
// never leaks into their English-text assertions, SLAY-3.2/SLAY-4.2). This driver does the
// opposite: it switches the language toggle itself and checks the app actually reads in Dutch —
// start screen, a played day's board room labels and clue cards (computed with the engine's own
// `renderClue(..., 'nl')`/`roomNameNlOf`, the same pure functions the board and cards call, so a
// missed locale branch fails this check rather than only "looking Dutch"), a hint, the header's
// settings sheet, Stats and a solved day's Share panel — with no leftover English text and no mix
// of the two languages on screen. It does not repeat the
// 2700+ checks the English suite already makes in English; see docs/verification/report.md.
//
// SLAY-6.2 adds a second, rendered-screen day (a different theme from the main walkthrough's) and
// an offline sweep of one scheduled day per theme (home/office/park/school/shop), both confirming
// real Dutch object nouns — not just on the one day the rest of this file already plays.
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
import { SCENE_THEMES, roomNameNlOf } from '../../src/content/themes/index.ts'
import { deriveMurderer } from '../../src/engine/model/index.ts'
import type { CatalogClue, RenderContext } from '../../src/engine/clues/index.ts'
import { OBJECT_WORDS, bothParts, isBothClue, renderClue } from '../../src/engine/clues/index.ts'
import { getHint, initialState } from '../../src/game/index.ts'
import { dailyId } from '../../src/game/daily/ids.ts'
import { puzzleFingerprint } from '../../src/game/fingerprint.ts'
import { SAVE_VERSION, saveKey } from '../../src/game/persistence.ts'
import type { ObjectType } from '../../src/engine/model/index.ts'
import type { ThemeId } from '../../src/content/themes/index.ts'
import { bareRoomName } from '../../src/render/scene/labels.ts'
import { DAILY_STRINGS } from '../../src/ui/daily/strings.ts'
import { DAYS, PLAY_DATE, RESULTS_KEY, dayOn, seedStorage } from './daily.ts'

/** Independent of `OBJECT_WORDS_NL`: pinned here so a regression in the dictionary this driver is
 * meant to catch (SLAY-6.2) cannot also make its own check pass. A handful of Dutch words happen to
 * spell the same as their English counterpart ("bed", "plant", "tv") — left out, since "no leftover
 * English" cannot be checked for those (there is nothing to tell apart). */
const EXPECT_NL: Partial<Record<ObjectType, string>> = {
  chair: 'stoel', rug: 'kleed', sofa: 'bank', car: 'auto', table: 'tafel', bookshelf: 'boekenkast',
  tree: 'boom', easel: 'schildersezel', desk: 'bureau', wardrobe: 'kledingkast', diningTable: 'eettafel',
  kitchenCounter: 'aanrecht', bicycle: 'fiets', gardenTable: 'tuintafel', bench: 'tuinbank', toilet: 'wc',
  sink: 'gootsteen', shower: 'douche', cabinet: 'kast', stairs: 'trap', dryer: 'droger',
  washingMachine: 'wasmachine', statue: 'standbeeld', flowers: 'bloembed', chest: 'kist', oilSlick: 'olievlek',
  framedPainting: 'ingelijst schilderij',
}

/** The `objectType` a clue names, `both`'s two parts included (`bothParts`, `types.ts`: never nested). */
function objectTypesOf(clue: CatalogClue): ObjectType[] {
  if (isBothClue(clue)) return bothParts(clue).flatMap((part) => objectTypesOf(part as CatalogClue))
  const type = (clue.args as Record<string, unknown>).objectType
  return typeof type === 'string' ? [type as ObjectType] : []
}

/** The first scheduled day of `theme` that has a clue naming an object type this driver can actually
 * check in Dutch (present in `EXPECT_NL`). A handful of Dutch words spell the same as their English
 * counterpart ("bed", "plant", "tv") and are deliberately left out of that dictionary (see its own
 * comment): a day whose first object-bearing clue happens to name one of those is skipped, since "no
 * leftover English" cannot be verified for a word that isn't different between the two languages. */
function firstObjectDay(theme: ThemeId): { date: string; type: ObjectType } {
  for (const day of DAYS) {
    if (day.theme !== theme) continue
    for (const clue of day.puzzle.clues) {
      const [type] = objectTypesOf(clue as CatalogClue)
      if (type && EXPECT_NL[type]) return { date: day.date, type }
    }
  }
  throw new Error(`no scheduled ${theme} day has a clue naming a checkable (non-identical) Dutch object noun`)
}

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
// settings icon and Options/Help behind it, the header's own Legend icon): whichever the element has.
// Options/Help now match twice (SLAY-9.2: a direct header copy plus the More sheet's copy, CSS
// deciding which is visible at a given width) -- the visible match wins (offsetParent is null
// anywhere in a display:none subtree), falling back to the first match so a truly-missing tool
// still throws below.
async function tool(label: string) {
  const r = (await evaluate(`(() => { const matches = [...document.querySelectorAll('.play-tool, .play-header__more, .play-header__legend')].filter(b => (b.querySelector('.play-tool__label')?.textContent.trim() ?? b.getAttribute('aria-label')) === ${JSON.stringify(label)}); const e = matches.find(b => b.offsetParent !== null) ?? matches[0]; if (!e) return null; e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)) as { x: number; y: number } | null
  if (!r) throw new Error('missing tool ' + label)
  await tap(r.x, r.y)
  await sleep(400) // ghost-click guard on a just-opened dialog (modalGuard.ts)
}
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>
const textOf = (sel: string) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent?.trim() ?? ''`) as Promise<string>
const localeKeyValue = () => evaluate(`localStorage.getItem('slaydoku:locale')`) as Promise<string | null>

// SLAY-9.25: the header's own layout -- checked here too, in Dutch (drive.ts's English suite checks
// the same thing at more widths): .play-header__lead (back + title) is the header's one flexible
// child, .play-header__actions never shrinks, so the two are expected to never overlap and the
// header is expected to never force the page to scroll sideways, in both icon states. moreLabel is
// read whenever the "..." trigger (not the desktop quick pair) is the one on screen: AC #3 wants a
// visible word there, not just the bare dots.
const headerProbe = () =>
  evaluate(
    `JSON.stringify((() => {
      const vis = (e) => !!e && e.offsetParent !== null
      const rect = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom } }
      const hdr = document.querySelector('.play-header')
      const parts = {}
      if (hdr) {
        const back = hdr.querySelector('.play-header__back'); if (vis(back)) parts.back = rect(back)
        const title = hdr.querySelector('.play-header__title'); if (vis(title)) parts.title = rect(title)
        const timer = hdr.querySelector('.play-timer'); if (vis(timer)) parts.timer = rect(timer)
        ;[...hdr.querySelectorAll('.play-header__actions button')].filter(vis).forEach((b, i) => { parts['action' + i + ':' + (b.getAttribute('aria-label') || '')] = rect(b) })
      }
      const title = document.querySelector('.play-header__title')
      const legend = document.querySelector('.play-header__legend[aria-label]:not([data-action])')
      const legendLabel = legend?.querySelector('.play-header__legend-label')
      return {
        parts, iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth,
        titleCut: title ? title.scrollWidth > title.clientWidth + 1 : false,
        titleWrap: title ? title.getBoundingClientRect().height > parseFloat(getComputedStyle(title).lineHeight) * 1.5 : false,
        moreVisible: vis(document.querySelector('.play-header__more')),
        moreLabel: document.querySelector('.play-header__more-label')?.textContent ?? null,
        legendLabelVisible: vis(legendLabel), legendLabelText: legendLabel?.textContent ?? null, legendAria: legend?.getAttribute('aria-label') ?? null,
      }
    })())`,
  ).then((s: string) => JSON.parse(s) as { parts: Record<string, { l: number; r: number; t: number; b: number }>; sw: number; iw: number; ih: number; titleCut: boolean; titleWrap: boolean; moreVisible: boolean; moreLabel: string | null; legendLabelVisible: boolean; legendLabelText: string | null; legendAria: string | null })
async function checkHeaderLayout(label: string) {
  const h = await headerProbe()
  const names = Object.keys(h.parts)
  // Pairwise: no two visible header controls overlap (SLAY-14.4, measured at the true viewport width).
  const overlaps: string[] = []
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++) {
      const a = h.parts[names[i]], b = h.parts[names[j]]
      if (a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5) overlaps.push(names[i] + '/' + names[j])
    }
  const offscreen = names.filter((n) => h.parts[n].l < -0.5 || h.parts[n].r > h.iw + 0.5)
  check(`${label}: no header control overlaps another or leaves the screen, no page-level horizontal scroll`, overlaps.length === 0 && offscreen.length === 0 && h.sw <= h.iw + 1, JSON.stringify({ overlaps, offscreen, sw: h.sw, iw: h.iw }))
  check(`${label}: the title is not wrapped and not cut off`, !h.titleWrap && !h.titleCut, JSON.stringify({ wrap: h.titleWrap, cut: h.titleCut }))
  const { back, title, timer } = h.parts
  const act0 = names.find((n) => n.startsWith('action'))
  if (back && title && timer && act0) {
    // Two rows on a portrait phone and in a short landscape column (SLAY-14.4, play.css); one row from 641px otherwise.
    const twoRows = (h.iw <= 640 && h.ih > h.iw) || (h.iw > h.ih && h.ih <= 500)
    if (twoRows) check(`${label}: phone layout is two rows (back + icons above, title + timer below)`, title.t >= back.b - 1 && timer.t >= h.parts[act0].b - 1, JSON.stringify(h.parts))
    else if (h.iw >= 641) check(`${label}: desktop layout is one row`, Math.abs((title.t + title.b) / 2 - (back.t + back.b) / 2) < 8 && Math.abs((timer.t + timer.b) / 2 - (back.t + back.b) / 2) < 8, JSON.stringify(h.parts))
  }
  if (h.moreVisible) check(`${label}: the More trigger carries a visible label, not a bare "..." icon`, !!h.moreLabel && h.moreLabel.trim().length > 0, JSON.stringify(h.moreLabel))
  if (h.iw >= 641) check(`${label}: the Legend button shows a visible label equal to its aria-label`, h.legendLabelVisible && h.legendLabelText === h.legendAria, JSON.stringify([h.legendLabelText, h.legendAria]))
}

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
check('baseline: start screen loads in English', (await textOf('[data-action=play]')) === 'Play' && (await textOf('[data-tier]')) === `Difficulty: ${DAILY_STRINGS.en.tier[DAY.tier!]}`)
// SLAY-9.22: the footer's About and Support links, English baseline (the Dutch switch is checked further down).
check(
  'baseline footer: About Slaydoku and Support Slaydoku, in English',
  (await textOf('.daily__about')) === 'About Slaydoku' && (await textOf('a[href="https://github.com/sponsors/dipsaus9"]')) === 'Support Slaydoku',
)
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
  'start screen reads in Dutch after the switch: puzzle label, difficulty, size, Play button',
  (await textOf('[data-puzzle-number]')) === DAILY_STRINGS.nl.puzzleLabel(DAY.date) &&
    (await textOf('[data-tier]')) === `Moeilijkheid: ${DAILY_STRINGS.nl.tier[DAY.tier!]}` &&
    (await textOf('[data-size]')) === `${DAY.size} × ${DAY.size} raster` &&
    (await textOf('[data-action=play]')) === 'Spelen',
  `${await textOf('[data-puzzle-number]')} | ${await textOf('[data-tier]')} | ${await textOf('[data-size]')} | ${await textOf('[data-action=play]')}`,
)
check(
  'no leftover English on the switched start screen',
  (await textOf('[data-tier]')) !== `Difficulty: ${DAILY_STRINGS.en.tier[DAY.tier!]}` && (await textOf('[data-action=play]')) !== 'Play',
)
// SLAY-9.22: the footer reads in Dutch after the switch too, same quiet weight (same class), same GitHub Sponsors URL.
check(
  'the footer reads in Dutch after the switch: Over Slaydoku · Steun Slaydoku, same class as About (quiet weight)',
  (await textOf('.daily__about')) === 'Over Slaydoku' &&
    (await textOf('a[href="https://github.com/sponsors/dipsaus9"]')) === 'Steun Slaydoku' &&
    (await evaluate(`document.querySelector('a[href="https://github.com/sponsors/dipsaus9"]')?.className`)) === 'daily__about',
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

// Board room labels (SLAY-5.2): the same real Dutch noun the clue text uses, not a second
// translation and not the stored English name leaking through.
const roomLabels = (await evaluate(
  `JSON.stringify([...document.querySelectorAll('[data-room-label]')].map((el) => el.textContent ?? ''))`,
).then((s) => JSON.parse(s as string))) as string[]
const expectedRoomLabels = DAY.puzzle.scene.rooms
  .map((r) => (roomNameNlOf(r.name) ?? bareRoomName(r.name)).toUpperCase())
  .sort()
check(
  `every board room label (${roomLabels.length}) reads the real Dutch noun, no leftover English room name`,
  JSON.stringify([...roomLabels].sort()) === JSON.stringify(expectedRoomLabels),
  `got ${roomLabels.join(', ')} | want ${expectedRoomLabels.join(', ')}`,
)

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

// SLAY-9.25: the unsolved header (timer, Legend, More), in Dutch.
await checkHeaderLayout('unsolved (3-icon), Dutch')

// From 641px the More trigger is hidden and Options/Help sit directly in the header (SLAY-9.2); below that they are behind "Meer".
const moreBehindTrigger = (await evaluate(`(() => { const e = document.querySelector('.play-header__more'); return !!e && e.offsetParent !== null })()`)) as boolean
if (moreBehindTrigger) await tool('Meer')
const moreLabels = (await evaluate(`JSON.stringify([...document.querySelectorAll(${JSON.stringify(moreBehindTrigger ? '.play-more .play-tool__label' : '.play-header__quick .play-tool__label')})].map(l => l.textContent))`).then((s) => JSON.parse(s as string))) as string[]
check("the header's settings sheet reads in Dutch: Opties, Help (Legenda has its own header icon, SLAY-8.2)", JSON.stringify(moreLabels) === JSON.stringify(['Opties', 'Help']), moreLabels.join())
if (moreBehindTrigger) {
  await tap(3, 3)
  await sleep(300)
}

// SLAY-9.25: the header's 4-icon state (once solved and dismissed, the persistent Share icon joins
// timer/Legend/More), in Dutch -- reached by seeding a fully-correct saved board directly
// (src/game/persistence.ts's own schema + puzzleFingerprint), the same shortcut this file already
// uses below for the start screen's solved state, rather than a full interactive solve (drive.ts's
// job, in English).
const solvedId = dailyId(DAY.n)
const solvedFp = puzzleFingerprint(DAY.puzzle)
const solvedPlacements: Record<string, { row: number; col: number }> = {}
for (const s of DAY.puzzle.solution) solvedPlacements[s.personId] = s.cell
const solvedSave = JSON.stringify({ version: SAVE_VERSION, levelId: solvedId, fp: solvedFp, board: { placements: solvedPlacements, notes: {}, marks: {} }, elapsedMs: 754000 })
// Leave the play screen first: it saves its own board when the page goes away, which would overwrite the seed (the header checks above ran on it).
await load('about')
await evaluate(`localStorage.setItem(${JSON.stringify(saveKey(solvedId))}, ${JSON.stringify(solvedSave)})`)
await load('play')
check('the seeded board opens already solved, in Dutch ("Opgelost!")', (await count('[data-result=solved]')) === 1 && (await textOf('.play-modal__title')) === 'Opgelost!')
await tapSel('.play-result--solved .play-btn:not(.play-btn--primary)')
check('View the board (Bekijk het bord) dismisses the overlay; the persistent Share icon joins the header', (await count('[data-result=solved]')) === 0 && (await count('[data-action=share]')) === 1)
await checkHeaderLayout('solved + dismissed (4-icon), Dutch')

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
  ['Over Slaydoku', 'Elke dag een nieuwe moordmysteriepuzzel', 'Hoe het werkt', 'Met dank aan', 'Privacy', 'Open source', 'Steun Slaydoku'].every((t) => aboutText.includes(t)),
  aboutText.slice(0, 200),
)
check(
  'About has no leftover English title, tagline or Support wording',
  !aboutText.includes('About Slaydoku') && !aboutText.includes('A new murder mystery puzzle every day') && !aboutText.includes('Support Slaydoku'),
)
// SLAY-9.22: the Dutch About page's own Support section links to the same GitHub Sponsors URL, quietly (no button class), opening in a new tab.
check(
  'About page (nl): the Steun Slaydoku section links to GitHub Sponsors, quietly, opening in a new tab',
  (await textOf('a[href="https://github.com/sponsors/dipsaus9"]')) === 'GitHub Sponsors' &&
    (await evaluate(`document.querySelector('a[href="https://github.com/sponsors/dipsaus9"]')?.className`)) === 'about__link' &&
    (await evaluate(`document.querySelector('a[href="https://github.com/sponsors/dipsaus9"]')?.getAttribute('target')`)) === '_blank' &&
    ((await evaluate(`document.querySelector('a[href="https://github.com/sponsors/dipsaus9"]')?.getAttribute('rel')`)) as string)?.includes('noopener'),
)

// 5. Share, on a solved day (result seeded directly, the same shortcut drive.ts uses for its own solved-start-screen state; playing the day end to end is drive.ts's job, in English). Headless Chrome has no
// navigator.share, so the SharePanel renders its fallback Copy/Download buttons (share.ts's own 'none' mode), never the Share button (share.supported is false) — the same on every locale.
await evaluate(
  `localStorage.setItem(${JSON.stringify(RESULTS_KEY)}, JSON.stringify({ version: 1, results: { ${DAY.n}: { n: ${DAY.n}, date: ${JSON.stringify(DAY.date)}, fp: ${JSON.stringify(DAY.fp)}, elapsedMs: 754000, hints: 1, wrongChecks: 0, murdererId: ${JSON.stringify(deriveMurderer(DAY.puzzle, DAY.puzzle.solution))} } } }))`,
)
await load('')
check('the seeded day shows as solved, in Dutch ("Opgelost!")', (await count('[data-result=solved]')) === 1 && (await evaluate(`document.querySelector('[data-result=solved]')?.textContent?.includes('Opgelost!')`)) === true)
// SLAY-9.13: the share card is no longer shown inline on a solved day's card -- a "Delen" (Share)
// button reopens it in a popover (the same Modal as Help/Options/Stats).
check('the solved day\'s card offers a Delen (Share) button in Dutch, not English', (await textOf('[data-slot=share] [data-action=share]')) === 'Delen')
await tapSel('[data-slot=share] [data-action=share]')
check(
  'the reopened Share panel reads in Dutch: title, the fallback buttons (no navigator.share in headless Chrome), the privacy note',
  (await textOf('.share__title')) === 'Deel je resultaat' &&
    (await textOf('[data-action=copy]')) === 'Kopiëren' &&
    (await textOf('[data-action=download]')) === 'Afbeelding downloaden' &&
    (await textOf('.share__note')) === 'Er verlaat niets je apparaat, tenzij je het deelt.',
  `title="${await textOf('.share__title')}" copy="${await textOf('[data-action=copy]')}" download="${await textOf('[data-action=download]')}"`,
)
check(
  'no leftover English on the Share panel',
  (await textOf('.share__title')) !== 'Share your result' && (await textOf('[data-action=copy]')) !== 'Copy' && (await textOf('[data-action=download]')) !== 'Download image',
)

// 6. Object nouns (SLAY-6.2): real Dutch, not the drawn object's English noun, on more than one
// scheduled day and every theme, not only PLAY_DATE's ("shop"). A whole-word match: "auto" must not
// also flag "auto's", and the English check must not fire on a Dutch word that happens to contain
// the English one as a substring.
const wordIn = (text: string, word: string) => new RegExp(`(?<![\\p{L}\\d])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\d])`, 'iu').test(text)

// 6a. Rendered screen, a second day, a different theme from the main walkthrough's ("home" vs
// PLAY_DATE's "shop"): the app's own DOM text, not just the pure function it is computed from.
const homeDay = firstObjectDay('home')
await evaluate(`localStorage.clear(); ${seedStorage(homeDay.date, true, 'nl')}`)
await load('')
await tapSel('[data-action=play]')
check(`the puzzle opens (theme "home", ${homeDay.date})`, (await count('.play-board')) === 1)
const homeCardLines = (await evaluate(
  `JSON.stringify([...document.querySelectorAll('.play-cards .polaroid__line')].map(el => el.textContent ?? ''))`,
).then((s) => JSON.parse(s as string))) as string[]
const homeExpected = EXPECT_NL[homeDay.type]
check(
  `theme "home" (${homeDay.date}): a rendered clue card names the real Dutch noun for "${homeDay.type}" ("${homeExpected}"), no leftover English ("${OBJECT_WORDS[homeDay.type].noun}")`,
  !!homeExpected && homeCardLines.some((l) => wordIn(l, homeExpected)) && !homeCardLines.some((l) => wordIn(l, OBJECT_WORDS[homeDay.type].noun)),
  homeCardLines.join(' | '),
)

// 6b. Offline sweep, one scheduled day per theme (pure `renderClue(..., 'nl')`, no browser): every
// theme actually produces a real Dutch object noun on a real scheduled puzzle, not just this
// driver's one played day.
for (const theme of SCENE_THEMES.map((t) => t.id)) {
  const { date, type } = firstObjectDay(theme)
  const day = dayOn(date)
  const dctx: RenderContext = { scene: day.puzzle.scene, people: day.puzzle.people }
  const lines = day.puzzle.clues.map((c) => renderClue(c as CatalogClue, dctx, 'nl'))
  const expected = EXPECT_NL[type]
  check(
    `theme "${theme}" (${date}): renderClue(..., 'nl') uses the real Dutch noun for "${type}" ("${expected}"), no leftover English ("${OBJECT_WORDS[type].noun}")`,
    !!expected && lines.some((l) => wordIn(l, expected)) && !lines.some((l) => wordIn(l, OBJECT_WORDS[type].noun)),
    lines.find((l) => wordIn(l, expected ?? '')) ?? lines.join(' | '),
  )
}

// --- report --------------------------------------------------------------------------------
const failed = rows.filter((r) => !r.ok)
const md = ['| Check | Result | Detail |', '|---|---|---|', ...rows.map((r) => `| ${r.scenario} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/')} |`)].join('\n')
await Bun.write(join(OUT, 'locale-log.md'), md + '\n')
console.log(`${rows.length} checks, ${failed.length} failures`)
chrome.kill()
process.exit(failed.length ? 1 : 0)
