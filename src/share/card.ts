import type { DailyResult } from '../game/daily/results.ts'
import type { Locale } from '../locale/index.ts'
import { cardDescription, stripCells } from './emoji.ts'
import type { StripCell } from './emoji.ts'
import { capitalize, dateLabel, formatDuration, hintsLabel, sizeLabel, tierLabel } from './format.ts'
import { siteLabel } from './site.ts'
import type { ShareMeta } from './types.ts'

/**
 * Brand colours. INK/PAPER/PANEL/LINE are the warm evidence-board surface tones (src/brand/tokens.css's
 * --color-ink/--color-bg/--color-paper/--color-line, SLAY-2.1). ACCENT/AMBER/RED stay pinned to their original hex
 * rather than following the tokens' case-file-red accent: they are the same three colours as the share emoji
 * (🟦🟨🟥, see emoji.ts), so the card and the text must keep matching each other, not the rest of the site's chrome.
 */
const INK = '#2a2a36'
const PAPER = '#f7f2e6'
const PANEL = '#fdf8ec'
const LINE = '#cbb994'
const ACCENT = '#2b7de9'
const AMBER = '#e0a43a'
const RED = '#d95b4b'
const MUTED = '#5d5d6b'

/** Colour of each strip square: the same three as the emoji. */
const STRIP_FILL: Record<StripCell, string> = { placed: ACCENT, hint: AMBER, wrong: RED }
const STRIP_WORDS: Record<StripCell, string> = { placed: 'placed', hint: 'hint', wrong: 'wrong check' }
const STRIP_WORDS_NL: Record<StripCell, string> = { placed: 'geplaatst', hint: 'hint', wrong: 'foute controle' }

/** System fonts only: nothing is fetched, and the card looks about the same on every device. The default headline font (see HeadlineFont below). */
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

/** The self-hosted display font (public/fonts/, same file as src/brand/tokens.css's --font-display). */
const FONT_URL = '/fonts/fraunces-variable-latin.woff2'
/** Font-family list to draw the headline with once the display font is loaded, matching --font-display exactly. */
const FONT_DISPLAY = "'Fraunces', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif"
/** How long to wait for the display font before drawing with the system stack instead (ms). */
const FONT_TIMEOUT_MS = 400

/** The plain system stack: what cardSvg draws the headline with by default, and what loadDisplayFont falls back to. */
const SYSTEM_HEADLINE: HeadlineFont = { family: FONT }

/** What to draw the card's headline (the "Slaydoku" wordmark) with. */
export interface HeadlineFont {
  /** Font-family list for the headline text. */
  family: string
  /**
   * An `@font-face` rule to embed in the card's own `<defs>`, or undefined for the plain system stack. A data URI,
   * not a URL: an SVG used as an `<img>`/canvas source never fetches its own external resources (no network
   * request, no custom font), so the only way the display font can actually appear in the drawn PNG is inlined.
   */
  fontFace?: string
}

const toBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/**
 * Loads the display font (Fraunces) and returns what to draw the headline with. Fetches the font file, verifies it
 * parses with the FontFace API, and races that against `timeoutMs` — a slow or blocked network must never hold up
 * or blank the card. On success the bytes are embedded as a base64 `@font-face` (see HeadlineFont). On any failure
 * or timeout this resolves the plain system stack, exactly what the card drew before this existed. Browser only:
 * anywhere without `fetch`/`FontFace` (SSR, tests) resolves the fallback immediately, no work attempted.
 */
export async function loadDisplayFont(url: string = FONT_URL, timeoutMs: number = FONT_TIMEOUT_MS): Promise<HeadlineFont> {
  if (typeof fetch === 'undefined' || typeof FontFace === 'undefined') return SYSTEM_HEADLINE
  try {
    const load = (async (): Promise<string> => {
      const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer())
      await new FontFace('Fraunces', bytes).load()
      return toBase64(bytes)
    })()
    const timeout = new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('display font load timed out')), timeoutMs))
    const base64 = await Promise.race([load, timeout])
    return { family: FONT_DISPLAY, fontFace: `<style>@font-face{font-family:'Fraunces';font-weight:300 900;font-style:normal;src:url(data:font/woff2;base64,${base64}) format('woff2');}</style>` }
  } catch {
    return SYSTEM_HEADLINE
  }
}

export const escapeXml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const num = (n: number): string => String(Math.round(n * 100) / 100)

interface TextOptions {
  x: number
  y: number
  size: number
  weight?: number
  fill?: string
  anchor?: 'start' | 'middle' | 'end'
  font?: string
}

function text(content: string, { x, y, size, weight = 400, fill = INK, anchor = 'start', font = FONT }: TextOptions): string {
  return `<text x="${num(x)}" y="${num(y)}" font-family="${font}" font-size="${num(size)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" style="font-variant-numeric:tabular-nums">${escapeXml(content)}</text>`
}

/** The app icon (src/brand/icon.svg, 64 units) as a group: the dark tile with the room grid and the magnifying glass. */
function iconTile(x: number, y: number, size: number): string {
  const rooms = ['#f1d9a6', '#f1d9a6', '#cdebd0', '#bfe3f2', '#bfe3f2', '#cdebd0', '#e2d7f1', '#e2d7f1', '#cdebd0']
  const cells = rooms.map((fill, i) => `<rect x="${8 + (i % 3) * 12.5}" y="${8 + Math.floor(i / 3) * 12.5}" width="11" height="11" rx="1.6" fill="${fill}"/>`).join('')
  return (
    `<g transform="translate(${num(x)} ${num(y)}) scale(${num(size / 64)})"><rect width="64" height="64" rx="14" fill="${INK}"/>${cells}` +
    `<line x1="47" y1="47" x2="57" y2="57" stroke="${AMBER}" stroke-width="7.5" stroke-linecap="round"/>` +
    `<circle cx="36" cy="36" r="16" fill="#fbf8f0" stroke="${AMBER}" stroke-width="4.5"/><circle cx="36" cy="36" r="6.5" fill="${ACCENT}"/></g>`
  )
}

/** The wordmark: the icon tile and the name, the card's headline (see HeadlineFont). */
function wordmark(x: number, y: number, tile: number, size: number, font: string): string {
  return iconTile(x, y, tile) + text('Slaydoku', { x: x + tile + tile * 0.28, y: y + tile * 0.5 + size * 0.34, size, weight: 800, font })
}

/** The difficulty pill, its width taken from the text (system fonts differ a little, so it has room to spare). */
function pill(label: string, x: number, y: number, size: number, anchor: 'start' | 'middle' = 'start'): string {
  const height = size * 2
  const width = label.length * size * 0.6 + size * 1.8
  const left = anchor === 'middle' ? x - width / 2 : x
  return `<rect x="${num(left)}" y="${num(y)}" width="${num(width)}" height="${num(height)}" rx="${num(height / 2)}" fill="${ACCENT}"/>` + text(label, { x: left + width / 2, y: y + height / 2 + size * 0.35, size, weight: 700, fill: PANEL, anchor: 'middle' })
}

/** The strip of squares, one per person, its width fixed to `width` at most. Returns the markup and the height. */
function strip(cells: readonly StripCell[], x: number, y: number, maxWidth: number, maxSquare: number, anchor: 'start' | 'middle'): string {
  const gap = maxSquare * 0.2
  const square = Math.min(maxSquare, (maxWidth - gap * (cells.length - 1)) / cells.length)
  const total = cells.length * square + (cells.length - 1) * gap
  const left = anchor === 'middle' ? x - total / 2 : x
  return cells.map((cell, i) => `<rect x="${num(left + i * (square + gap))}" y="${num(y)}" width="${num(square)}" height="${num(square)}" rx="${num(square * 0.2)}" fill="${STRIP_FILL[cell]}"/>`).join('')
}

/** Legend of the strip, only for the kinds present: a swatch and a word each. */
function legend(cells: readonly StripCell[], x: number, y: number, size: number, anchor: 'start' | 'middle', words: Record<StripCell, string>): string {
  const kinds = (['placed', 'hint', 'wrong'] as const).filter((kind) => cells.includes(kind))
  const swatch = size * 0.8
  const widths = kinds.map((kind) => swatch + size * 0.4 + words[kind].length * size * 0.56)
  const gap = size * 1.4
  const total = widths.reduce((sum, w) => sum + w, 0) + gap * (kinds.length - 1)
  let cursor = anchor === 'middle' ? x - total / 2 : x
  return kinds
    .map((kind, i) => {
      const out = `<rect x="${num(cursor)}" y="${num(y - swatch * 0.85)}" width="${num(swatch)}" height="${num(swatch)}" rx="${num(swatch * 0.2)}" fill="${STRIP_FILL[kind]}"/>` + text(words[kind], { x: cursor + swatch + size * 0.4, y, size, fill: MUTED })
      cursor += widths[i]! + gap
      return out
    })
    .join('')
}

/** Big time: smaller from an hour on so it always fits its column. */
const timeSize = (time: string, big: number): number => (time.length > 5 ? big * 0.78 : big)

interface Parts {
  number: string
  date: string
  tier: string
  time: string
  hints: string
  site: string
  cells: StripCell[]
}

function wide(p: Parts, headlineFont: string, words: Record<StripCell, string>): string {
  return (
    `<rect width="1200" height="630" fill="${PAPER}"/><rect x="32" y="32" width="1136" height="566" rx="36" fill="${PANEL}" stroke="${LINE}" stroke-width="2"/>` +
    wordmark(84, 72, 72, 46, headlineFont) +
    text(p.number, { x: 84, y: 214, size: 38, weight: 700 }) +
    text(p.date, { x: 84, y: 254, size: 26, fill: MUTED }) +
    pill(p.tier, 84, 284, 24) +
    text(p.time, { x: 80, y: 484, size: timeSize(p.time, 170), weight: 800 }) +
    text(p.hints, { x: 84, y: 548, size: 36, weight: 600, fill: MUTED }) +
    iconTile(786, 84, 280) +
    strip(p.cells, 926, 432, 380, 44, 'middle') +
    legend(p.cells, 926, 508, 19, 'middle', words) +
    text(p.site, { x: 926, y: 560, size: 26, weight: 600, anchor: 'middle', fill: INK })
  )
}

function square(p: Parts, headlineFont: string, words: Record<StripCell, string>): string {
  return (
    `<rect width="1080" height="1080" fill="${PAPER}"/><rect x="36" y="36" width="1008" height="1008" rx="44" fill="${PANEL}" stroke="${LINE}" stroke-width="2"/>` +
    iconTile(492, 88, 96) +
    text('Slaydoku', { x: 540, y: 258, size: 62, weight: 800, anchor: 'middle', font: headlineFont }) +
    text(p.number, { x: 540, y: 340, size: 48, weight: 700, anchor: 'middle' }) +
    text(p.date, { x: 540, y: 386, size: 30, fill: MUTED, anchor: 'middle' }) +
    pill(p.tier, 540, 424, 28, 'middle') +
    text(p.time, { x: 540, y: 690, size: timeSize(p.time, 250), weight: 800, anchor: 'middle' }) +
    text(p.hints, { x: 540, y: 772, size: 46, weight: 600, fill: MUTED, anchor: 'middle' }) +
    strip(p.cells, 540, 828, 720, 56, 'middle') +
    legend(p.cells, 540, 934, 24, 'middle', words) +
    text(p.site, { x: 540, y: 1000, size: 34, weight: 600, anchor: 'middle' })
  )
}

/**
 * The share card as an SVG document: wordmark, puzzle number, date, difficulty pill, the time big, the hints, a strip of one square per
 * person (see `stripCells`) and the site. Two designs: a landscape one (1200x630 units) and a square one (1080x1080); `width` and
 * `height` set the size of the picture, which scales the design. Shapes and text only: no images, no script, nothing fetched by the SVG
 * itself — `headline` (default: the plain system stack) is the one already-resolved choice from `loadDisplayFont`, embedded inline when
 * it carries a font. It carries the labels of the puzzle and never its solution, names or clues. `locale` (default English) picks the
 * language of every label drawn on it, including the strip's legend.
 */
export function cardSvg(result: DailyResult, meta: ShareMeta, { width, height }: { width: number; height: number }, headline: HeadlineFont = SYSTEM_HEADLINE, locale: Locale = 'en'): string {
  const isWide = width / height > 1.2
  const parts: Parts = {
    number: `Puzzle #${result.n}`,
    date: dateLabel(result.date, locale),
    tier: `${tierLabel(meta.tier, locale)} · ${sizeLabel(meta.size)}`,
    time: formatDuration(result.elapsedMs),
    hints: capitalize(hintsLabel(result.hints, locale)),
    site: siteLabel(meta.siteUrl),
    cells: stripCells(result, meta.size),
  }
  const words = locale === 'nl' ? STRIP_WORDS_NL : STRIP_WORDS
  const [vw, vh] = isWide ? [1200, 630] : [1080, 1080]
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${vw} ${vh}" role="img" aria-labelledby="card-title">` +
    `<title id="card-title">${escapeXml(cardDescription(result, meta, locale))}</title>` +
    (headline.fontFace ?? '') +
    (isWide ? wide(parts, headline.family, words) : square(parts, headline.family, words)) +
    '</svg>'
  )
}
