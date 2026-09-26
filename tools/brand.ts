// Brand asset generator: `bun tools/brand.ts`.
// Renders the SVG sources in src/brand/ to the committed files in public/ with headless Chrome
// over the DevTools protocol, and writes favicon.ico (16/32/48 PNG entries) by hand.
//
// Sources                      -> Outputs (public/)
//   src/brand/favicon.svg      -> favicon.svg (copy), favicon-32.png, favicon.ico
//   src/brand/icon.svg         -> apple-touch-icon.png (180), icon-192.png, icon-512.png (full bleed)
//   src/brand/og-image.svg     -> og-image.png (1200x630)
//
// Output is deterministic: running the command twice yields identical bytes. The share image
// uses the Trebuchet MS text stack (macOS ships it), so regenerate on macOS to keep bytes stable.
// Env: CHROME (path to the Chrome binary).
import { spawn } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')
const SRC = join(ROOT, 'src/brand')
const OUT = join(ROOT, 'public')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9361

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const profile = mkdtempSync(join(tmpdir(), 'brand-chrome-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })

async function connect(): Promise<string> {
  for (let i = 0; i < 50; i++) {
    try {
      const list = (await (await fetch(`http://localhost:${PORT}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[]
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {}
    await sleep(200)
  }
  throw new Error('Chrome did not start; set CHROME to the binary path')
}

const ws = new WebSocket(await connect())
await new Promise((r) => (ws.onopen = r))
let nextId = 0
const pending = new Map<number, (v: any) => void>()
ws.onmessage = (m) => {
  const msg = JSON.parse(String(m.data))
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)!(msg)
}
const send = (method: string, params: object = {}) =>
  new Promise<any>((resolve, reject) => {
    const id = ++nextId
    pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)))
    ws.send(JSON.stringify({ id, method, params }))
  })

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })

/** Renders an SVG source to a PNG of exactly size x size (or width x height). */
async function render(svgFile: string, width: number, height = width): Promise<Buffer> {
  const svg = readFileSync(join(SRC, svgFile)).toString('base64')
  const html = `<!doctype html><body style="margin:0;background:transparent"><img style="display:block;width:${width}px;height:${height}px" src="data:image/svg+xml;base64,${svg}">`
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` })
  for (let i = 0; i < 50; i++) {
    const ok = await send('Runtime.evaluate', { expression: 'document.images[0]?.decode().then(() => true, () => false)', awaitPromise: true, returnByValue: true }).catch(() => undefined)
    if (ok?.result?.value === true) break
    await sleep(100)
  }
  await sleep(150)
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 } })
  return Buffer.from(shot.data, 'base64')
}

/** ICO container holding the given square PNGs (PNG-in-ICO, supported since Vista). */
function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)
  const dir = Buffer.alloc(16 * images.length)
  let offset = header.length + dir.length
  images.forEach(({ size, png }, i) => {
    const e = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, e)
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1)
    dir.writeUInt16LE(1, e + 4) // colour planes
    dir.writeUInt16LE(32, e + 6) // bits per pixel
    dir.writeUInt32LE(png.length, e + 8)
    dir.writeUInt32LE(offset, e + 12)
    offset += png.length
  })
  return Buffer.concat([header, dir, ...images.map((i) => i.png)])
}

const write = (name: string, data: Buffer) => {
  writeFileSync(join(OUT, name), data)
  console.log(`public/${name} (${data.length} bytes)`)
}

try {
  copyFileSync(join(SRC, 'favicon.svg'), join(OUT, 'favicon.svg'))
  console.log('public/favicon.svg')
  const fav32 = await render('favicon.svg', 32)
  write('favicon-32.png', fav32)
  write('favicon.ico', ico([{ size: 16, png: await render('favicon.svg', 16) }, { size: 32, png: fav32 }, { size: 48, png: await render('favicon.svg', 48) }]))
  write('apple-touch-icon.png', await render('icon.svg', 180))
  write('icon-192.png', await render('icon.svg', 192))
  write('icon-512.png', await render('icon.svg', 512))
  write('og-image.png', await render('og-image.svg', 1200, 630))
} finally {
  ws.close()
  chrome.kill()
  await sleep(300)
  rmSync(profile, { recursive: true, force: true })
}
