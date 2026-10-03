// Push reminder verification driver (SLAY-14.11).
// Builds the production site into $OUT/site, points the app at a fake Worker, serves it with `vite preview` and drives headless
// Chrome over the DevTools protocol through the client flow of the daily reminder:
//   1. in a normal browser tab (no standalone display) the reminder row and the Options entry are absent;
//   2. in emulated standalone display (window.matchMedia answers true for display-mode: standalone: headless Chrome ignores
//      Emulation.setEmulatedMedia for it) on a start screen with an earlier solved day, the
//      reminder row shows; the dialog enables the reminder at a chosen hour and the fake Worker receives POST /subscribe with the
//      expected body (a real push subscription made with the test VAPID key, the hour, the locale);
//   3. a push delivered with CDP ServiceWorker.deliverPushMessage shows the fixed notification (in the browser language);
//   4. the notificationclick handler of the service worker (a NotificationEvent dispatched inside the worker for that very
//      notification: CDP has no "click a notification" call) closes it and takes the open tab to /play;
//   5. switching the reminder off sends DELETE /subscribe for the same endpoint and the row says it is off again;
//   6. the About page states what is stored server-side and how to turn it off, in English and Dutch.
//
// How the fake Worker gets in: REMINDER_CONFIG (src/pwa/reminder.ts) holds the deployed Worker URL and public key, and the guard
// that treats placeholders as "unavailable" stays untouched. The driver replaces those two strings in a COPY of the built
// assets (never in the repo) with the fake Worker's URL and a freshly generated VAPID public key, then serves that copy.
// The fake Worker is a Bun.serve on localhost with the CORS headers the real one sends.
//
// Usage (from the repo root): bun docs/verification/push.ts
// Env: VIEWPORT (WxH, default 390x844), OUT (folder for screenshots and the built site; default a temp folder outside the repo),
// PORT (preview port, default 5199), WORKER_PORT (fake Worker port, default 5200), CDP_PORT (default 9354), CHROME.
// Exits non-zero when a check fails.
import { spawn } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LOCALE_KEY } from '../../src/locale/storage.ts'
import { ABOUT_STRINGS } from '../../src/ui/about/strings.ts'
import { REMINDER_CONFIG, REMINDER_KEY } from '../../src/pwa/reminder.ts'
import { notificationBody } from '../../src/pwa/notify.ts'
import { DATE_KEY, PLAY_DATE, RESULTS_KEY, dayOn } from './daily.ts'

const HERE = import.meta.dir
const ROOT = join(HERE, '../..')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CDP = Number(process.env.CDP_PORT ?? 9354)
const PORT = Number(process.env.PORT ?? 5199)
const WORKER_PORT = Number(process.env.WORKER_PORT ?? 5200)
const OUT = process.env.OUT ?? mkdtempSync(join(tmpdir(), 'slaydoku-push-'))
const BUILT = join(OUT, 'built')
const SITE = join(OUT, 'site')
const BASE = `http://localhost:${PORT}`
const WORKER = `http://localhost:${WORKER_PORT}`
const HOUR = 9
const START = `document.querySelectorAll('.daily-card').length === 1`
mkdirSync(OUT, { recursive: true })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const failures: string[] = []
let checks = 0
const [VW, VH] = (process.env.VIEWPORT ?? '390x844').split('x').map(Number) as [number, number]
function check(name: string, ok: boolean, detail = '') {
  checks++
  console.log(ok ? 'PASS' : 'FAIL', `${VW}x${VH}`, name, detail)
  if (!ok) failures.push(name)
}

async function run(cmd: string[], env: Record<string, string> = {}) {
  const proc = Bun.spawn(cmd, { cwd: ROOT, env: { ...process.env, ...env }, stdout: 'pipe', stderr: 'pipe' })
  const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  if ((await proc.exited) !== 0) throw new Error(`${cmd.join(' ')} failed:\n${out}\n${err}`)
  return out
}

// --- test VAPID key (a valid uncompressed P-256 public key, so pushManager.subscribe accepts it) -----
const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])
const rawKey = new Uint8Array((await crypto.subtle.exportKey('raw', keyPair.publicKey)) as ArrayBuffer)
const VAPID = Buffer.from(rawKey).toString('base64url')

// --- build, then patch a copy of the build ----------------------------------------------------
console.log('building ...')
await run(['bunx', 'vite', 'build', '--outDir', BUILT, '--emptyOutDir'], { VERCEL_PROJECT_PRODUCTION_URL: BASE })
cpSync(BUILT, SITE, { recursive: true })
let patched = 0
const walk = (dir: string) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (entry.name.endsWith('.js')) {
      const src = readFileSync(path, 'utf8')
      if (!src.includes(REMINDER_CONFIG.workerUrl)) continue
      writeFileSync(path, src.replaceAll(REMINDER_CONFIG.workerUrl, WORKER).replaceAll(REMINDER_CONFIG.vapidPublicKey, VAPID))
      patched++
    }
  }
}
walk(SITE)
if (patched === 0) throw new Error('placeholder config not found in the build; the driver cannot point the app at the fake Worker')

// --- fake Worker ------------------------------------------------------------------------------
const requests: { method: string; path: string; origin: string | null; body: any }[] = []
const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-methods': 'POST, DELETE, OPTIONS', 'access-control-allow-headers': 'content-type' }
const worker = Bun.serve({
  port: WORKER_PORT,
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    const text = await req.text()
    requests.push({ method: req.method, path: new URL(req.url).pathname, origin: req.headers.get('origin'), body: text ? JSON.parse(text) : null })
    return new Response('{"ok":true}', { status: 200, headers: { ...cors, 'content-type': 'application/json' } })
  },
})

// --- serve ------------------------------------------------------------------------------------
const preview = spawn('bunx', ['vite', 'preview', '--outDir', SITE, '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(BASE)).ok) break
  } catch {}
  await sleep(200)
}

// --- chrome -----------------------------------------------------------------------------------
const profile = mkdtempSync(join(tmpdir(), 'chrome-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })
type Target = { type: string; url: string; webSocketDebuggerUrl: string }
const targets = async () => (await (await fetch(`http://localhost:${CDP}/json/list`)).json()) as Target[]
async function connect(type = 'page', match = '') {
  for (let i = 0; i < 50; i++) {
    try {
      const found = (await targets()).find((t) => t.type === type && t.url.includes(match))
      if (found) return found.webSocketDebuggerUrl
    } catch {}
    await sleep(200)
  }
  throw new Error(`no ${type} target`)
}
function client(url: string) {
  const socket = new WebSocket(url)
  let nextId = 0
  const pending = new Map<number, (v: unknown) => void>()
  const events: { method: string; params: any }[] = []
  socket.onmessage = (m) => {
    const msg = JSON.parse(String(m.data))
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)!(msg)
    else if (msg.method) events.push(msg)
  }
  const ready = new Promise((r) => (socket.onopen = r))
  const send = (method: string, params: object = {}) =>
    new Promise<any>((resolve) => {
      const id = ++nextId
      pending.set(id, (msg: any) => resolve(msg.result ?? msg.error))
      socket.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async (expression: string) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value
  return { ready, send, evaluate, events, close: () => socket.close() }
}
const page = client(await connect())
await page.ready
const { send, evaluate } = page
async function until(expression: string, ms = 10000, via = evaluate) {
  for (let t = 0; t < ms; t += 150) {
    if (await via(expression)) return true
    await sleep(150)
  }
  return false
}
/** Waits until the fake Worker has seen a request with this method. */
async function request(method: string, ms = 90000) {
  for (let t = 0; t < ms; t += 150) {
    if (requests.some((r) => r.method === method)) return true
    await sleep(150)
  }
  return false
}
async function shot(name: string) {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 })
  writeFileSync(join(OUT, `${name}.jpg`), Buffer.from(r.data, 'base64'))
}
const goto = async (path: string) => {
  await send('Page.navigate', { url: 'about:blank' })
  await sleep(150)
  await send('Page.navigate', { url: `${BASE}${path}` })
}
const count = (sel: string) => evaluate(`document.querySelectorAll(${JSON.stringify(sel)}).length`) as Promise<number>
const text = (sel: string) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? ''`) as Promise<string>
const click = (sel: string) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.click()`)

await send('Page.enable')
await send('Runtime.enable')
await send('ServiceWorker.enable')
await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: true })
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
await send('Browser.grantPermissions', { origin: BASE, permissions: ['notifications'] })
// Locale pinned to English before the app's script runs (same reason as the other drivers). navigator.language stays the browser's.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { if (!localStorage.getItem(${JSON.stringify(LOCALE_KEY)})) localStorage.setItem(${JSON.stringify(LOCALE_KEY)}, 'en') } catch {}` })

const earlier = dayOn('2026-11-20')
const results = { version: 1, results: { [earlier.n]: { n: earlier.n, date: earlier.date, fp: earlier.fp, elapsedMs: 60000, hints: 0, wrongChecks: 0, murdererId: 'x' } } }
// What an installed app sees: the standalone display mode (matchMedia is the only thing the app asks).
const STANDALONE = `(() => { const real = window.matchMedia.bind(window); window.matchMedia = (q) => { const m = real(q); return /display-mode:\\s*standalone/.test(q) ? Object.create(m, { matches: { value: true } }) : m } })()`
const seed = `localStorage.setItem(${JSON.stringify(DATE_KEY)}, ${JSON.stringify(PLAY_DATE)}); localStorage.setItem(${JSON.stringify(RESULTS_KEY)}, ${JSON.stringify(JSON.stringify(results))}); localStorage.setItem('slaydoku:help-seen', '{"version":1}')`

try {
  // ---- 1. a normal browser tab: no reminder UI ------------------------------------------------
  await goto(`/?date=${PLAY_DATE}`)
  check('the start screen opens', await until(START))
  await evaluate(seed)
  await goto('/')
  await until(START)
  await sleep(500)
  check('normal tab (not installed): no reminder row', (await count('[data-reminder-row]')) === 0)

  // ---- 2. standalone: enable the reminder -----------------------------------------------------
  await send('Page.addScriptToEvaluateOnNewDocument', { source: STANDALONE })
  await goto('/')
  await until(START)
  check('standalone display: the reminder row shows after a solved day', await until(`document.querySelector('[data-reminder-row]') !== null`))
  check('worker takes control of the page', await until('navigator.serviceWorker.controller !== null', 15000))
  check('the row says it is off', (await text('[data-reminder-summary]')).includes('reminder'), await text('[data-reminder-summary]'))
  await shot('push-01-row')
  await click('[data-reminder-open]')
  check('the dialog opens', await until(`document.querySelector('[data-reminder-toggle]') !== null`))
  await click('[data-reminder-toggle]')
  await evaluate(`(() => { const s = document.querySelector('[data-reminder-hour]'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, '${HOUR}'); s.dispatchEvent(new Event('change', { bubbles: true })) })()`)
  await shot('push-02-dialog')
  await click('[data-reminder-save]')
  const posted = await request('POST')
  const post = requests.find((r) => r.method === 'POST')
  check('the fake Worker received POST /subscribe', posted && post?.path === '/subscribe', JSON.stringify(requests.map((r) => `${r.method} ${r.path}`)))
  const sub = post?.body?.subscription
  check('the body has the push endpoint and both keys', typeof sub?.endpoint === 'string' && sub.endpoint.startsWith('http') && !!sub.keys?.p256dh && !!sub.keys?.auth, sub?.endpoint?.slice(0, 40))
  check('the body has the chosen hour and the locale, and nothing else', post?.body?.hour === HOUR && typeof post?.body?.locale === 'string' && Object.keys(post.body).sort().join() === 'hour,locale,subscription', JSON.stringify({ ...post?.body, subscription: '...' }))
  check('the request came from the app origin', post?.origin === BASE, String(post?.origin))
  check('the chosen hour is remembered on the device', (await until(`localStorage.getItem(${JSON.stringify(REMINDER_KEY)}) === '${HOUR}'`)) === true)
  check('the dialog closes and the row says it is on', (await until(`document.querySelector('[data-reminder-toggle]') === null`)) && (await text('[data-reminder-summary]')).includes('09:00'), await text('[data-reminder-summary]'))
  await shot('push-03-on')

  // ---- 3. a delivered push shows the notification --------------------------------------------
  const reg = page.events.filter((e) => e.method === 'ServiceWorker.workerRegistrationUpdated').flatMap((e) => e.params.registrations as { registrationId: string; scopeURL: string }[]).find((r) => r.scopeURL.startsWith(BASE))
  check('the service worker registration is known to the protocol', !!reg)
  await send('ServiceWorker.deliverPushMessage', { origin: BASE, registrationId: reg!.registrationId, data: '' })
  const shown = await until(`navigator.serviceWorker.ready.then(r => r.getNotifications()).then(n => n.length)`)
  const notes = JSON.parse((await evaluate(`navigator.serviceWorker.ready.then(r => r.getNotifications()).then(n => JSON.stringify(n.map(x => ({ title: x.title, body: x.body, tag: x.tag }))))`)) as string) as { title: string; body: string; tag: string }[]
  check('a delivered push shows one notification', shown && notes.length === 1, JSON.stringify(notes))
  check('it has the fixed title and no puzzle information', notes[0]?.title === 'Slaydoku' && notes[0]?.body === notificationBody(await evaluate('navigator.language')) && notes[0]?.tag === 'slaydoku-daily', JSON.stringify(notes[0]))

  // ---- 4. clicking it lands on /play ---------------------------------------------------------
  check('before the click the tab is on /', (await evaluate('location.pathname')) === '/')
  const sw = client(await connect('service_worker', BASE))
  await sw.ready
  await sw.send('Runtime.enable')
  // A real click carries the user activation that WindowClient.focus() demands; a synthetic event does not, so focus() is let through.
  await sw.evaluate(`WindowClient.prototype.focus = function () { return Promise.resolve(this) }`)
  await sw.evaluate(`self.registration.getNotifications().then(n => { self.dispatchEvent(new NotificationEvent('notificationclick', { notification: n[0], action: '' })) })`)
  sw.close()
  check('the click takes the open tab to /play', await until(`location.pathname === '/play'`, 10000))
  check('the play screen shows', await until(`document.querySelectorAll('.play-board').length === 1`))
  check('the notification is closed by the click', (await evaluate(`navigator.serviceWorker.ready.then(r => r.getNotifications()).then(n => n.length)`)) === 0)
  await shot('push-04-play')

  // ---- 5. switching off deletes the subscription ---------------------------------------------
  await goto('/')
  await until(START)
  await click('[data-reminder-open]')
  await until(`document.querySelector('[data-reminder-toggle]') !== null`)
  await click('[data-reminder-toggle]')
  await click('[data-reminder-save]')
  const deleted = await request('DELETE')
  const del = requests.find((r) => r.method === 'DELETE')
  check('switching off sends DELETE /subscribe for the same endpoint', deleted && del?.path === '/subscribe' && del.body?.endpoint === sub?.endpoint && Object.keys(del.body).join() === 'endpoint', JSON.stringify(del?.body))
  check('the local hour is forgotten', await until(`localStorage.getItem(${JSON.stringify(REMINDER_KEY)}) === null`))
  check('no push subscription is left on the device', (await evaluate(`navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription()).then(s => s === null)`)) === true)

  // ---- 6. the About page ---------------------------------------------------------------------
  for (const locale of ['en', 'nl'] as const) {
    await evaluate(`localStorage.setItem(${JSON.stringify(LOCALE_KEY)}, '${locale}')`)
    await goto('/about')
    check(`About (${locale}): the page opens`, await until(`document.querySelector('.about') !== null`))
    const t = ABOUT_STRINGS[locale].reminder
    check(`About (${locale}): states what is stored server-side and how to turn it off`, (await text('[data-about-reminder]')).includes(t.text) && (await text('[data-about-reminder]')).includes(t.off))
    const fits = (await evaluate(`(() => { const r = document.querySelector('[data-about-reminder]').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth })()`)) as boolean
    check(`About (${locale}): the section fits the screen`, fits)
    await evaluate(`document.querySelector('[data-about-reminder]').scrollIntoView()`)
    await shot(`push-05-about-${locale}`)
  }
} catch (error) {
  failures.push(`crashed: ${error instanceof Error ? error.message : String(error)}`)
  console.error(error)
} finally {
  chrome.kill()
  preview.kill()
  void worker.stop(true)
}

console.log(failures.length === 0 ? 'all checks passed' : `FAILED: ${failures.join('; ')}`, `\nscreenshots and site in ${OUT}`)
console.log(`${checks} checks, ${failures.length} failures`)
process.exit(failures.length === 0 ? 0 : 1)
