import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { PLAY_STRINGS } from './strings.ts'
import { Toolbar, type ToolbarProps } from './Toolbar.tsx'
import { IDENTITY } from './zoom.ts'

const noop = () => {}
const props: ToolbarProps = {
  tool: 'note',
  onTool: noop,
  canUndo: true,
  canRedo: true,
  hintOpen: false,
  zoom: IDENTITY,
  onZoom: noop,
  onUndo: noop,
  onRedo: noop,
  onHint: noop,
  onOpenOptions: noop,
  onOpenHelp: noop,
  onOpenLegend: noop,
  onClearAll: noop,
}

/** The eight tool controls plus More (SLAY-4.2): everything the closed toolbar shows. Options,
 * Help and Legend sit behind More and are covered by docs/verification (they need a real click,
 * which renderToStaticMarkup can't do). */
const MAIN_ROW = ['note', 'place', 'x', 'erase', 'undo', 'redo', 'hint', 'zoom', 'more'] as const

/** The browser language `LocaleProvider` defaults from, per `Locale` (SLAY-3.4). */
const BROWSER_LANGUAGE: Record<Locale, string> = { en: 'en-US', nl: 'nl-NL' }

const renderToolbar = (locale: Locale, over: Partial<ToolbarProps> = {}) =>
  renderToStaticMarkup(
    <LocaleProvider storage={null} browserLanguage={BROWSER_LANGUAGE[locale]}>
      <Toolbar {...props} {...over} />
    </LocaleProvider>,
  )

function buttons(html: string): string[] {
  return html.match(/<button\b[\s\S]*?<\/button>/g) ?? []
}

describe.each(['en', 'nl'] as const)('<Toolbar/> icons (CAD-10.10) (%s)', (locale) => {
  const t = PLAY_STRINGS[locale]
  const html = renderToolbar(locale)
  const all = buttons(html)

  it('has the nine main-row buttons (eight tools plus More), Options/Help/Legend closed behind it', () => {
    expect(all).toHaveLength(9)
    for (const label of [t.tools.options, t.tools.help, t.tools.legend]) {
      expect(html).not.toContain(`<span class="play-tool__label">${label}</span>`)
    }
  })

  it('gives every main-row button an svg icon and a label in the current locale', () => {
    const labels = MAIN_ROW.map((key) => t.tools[key])
    expect(labels).toHaveLength(9)
    for (const button of all) {
      expect(button).toMatch(/<span class="play-tool__icon" aria-hidden="true"><svg\b[^>]*class="play-tool__svg"/)
      expect(button).toMatch(/<span class="play-tool__label">[^<]+<\/span>/)
    }
    for (const label of labels) expect(html).toContain(`<span class="play-tool__label">${label}</span>`)
  })

  it('draws every icon in the same 24px box and stroke, with currentColor', () => {
    for (const svg of html.match(/<svg\b[^>]*>/g) ?? []) {
      expect(svg).toContain('viewBox="0 0 24 24"')
      expect(svg).toContain('width="24"')
      expect(svg).toContain('stroke-width="2"')
      expect(svg).toContain('stroke-linecap="round"')
      expect(svg).toContain('stroke="currentColor"')
      expect(svg).toContain('aria-hidden="true"')
    }
  })

  it('uses a distinct icon per button', () => {
    const used = (html.match(/data-icon="(\w+)"/g) ?? []).map((m) => m.slice(11, -1))
    expect(new Set(used).size).toBe(used.length)
    expect(used).toHaveLength(9)
  })

  it('the More control is closed by default and reachable in one tap', () => {
    const more = all.find((b) => b.includes('play-tool--more'))!
    expect(more).toContain('data-icon="more"')
    expect(more).toContain('aria-pressed="false"')
    expect(more).toContain(`>${t.tools.more}<`)
  })

  it('keeps aria-pressed and the title text on the mode buttons', () => {
    const note = all.find((b) => b.includes(`>${t.tools.note}<`))!
    expect(note).toContain('aria-pressed="true"')
    expect(note).toContain(`title="${t.toolTitle.note}"`)
    for (const [label, title] of [[t.tools.place, t.toolTitle.place], [t.tools.x, t.toolTitle.x], [t.tools.erase, t.toolTitle.erase]]) {
      const b = all.find((x) => x.includes(`>${label}<`))!
      expect(b).toContain('aria-pressed="false"')
      expect(b).toContain(`title="${title}"`)
    }
  })

  it('shows the zoom level as a badge on the magnifier and swaps the glyph when zoomed', () => {
    const zoom = all.find((b) => b.includes('play-tool--zoom'))!
    expect(zoom).toContain('data-icon="zoomIn"')
    expect(zoom).toContain('<span class="play-tool__badge">1×</span>')
    const zoomed = buttons(renderToolbar(locale, { zoom: { ...IDENTITY, scale: 2 } })).find((b) => b.includes('play-tool--zoom'))!
    expect(zoomed).toContain('data-icon="zoomOut"')
    expect(zoomed).toContain('2×')
  })
})

describe('toolbar css states (CAD-10.10)', () => {
  const css = readFileSync(new URL('./play.css', import.meta.url), 'utf8')

  it('styles selected, pressed, focus-visible and disabled', () => {
    expect(css).toMatch(/\.play-tool\[aria-pressed='true'\] \{[^}]*background: var\(--accent\)[^}]*color: #ffffff/)
    expect(css).toContain('.play-tool:active')
    expect(css).toMatch(/\.play-tool:focus-visible \{[^}]*outline:/)
    expect(css).toMatch(/\.play-tool:disabled \{/)
  })

  it('sizes the icon box at 24px', () => {
    expect(css).toMatch(/\.play-tool__svg \{[^}]*width: 24px[^}]*height: 24px/)
  })
})
