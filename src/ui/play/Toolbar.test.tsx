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
  onClearAll: noop,
}

/** The six icon-only controls (SLAY-5.1): Place is gone, Redo lives behind a long press on
 * Undo, and Options/Help/Legend moved to the play-screen header — everything the toolbar shows. */
const MAIN_ROW = ['note', 'x', 'erase', 'undo', 'hint', 'zoom'] as const

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

describe.each(['en', 'nl'] as const)('<Toolbar/> icons (CAD-10.10, SLAY-5.1) (%s)', (locale) => {
  const t = PLAY_STRINGS[locale]
  const html = renderToolbar(locale)
  const all = buttons(html)

  it('has exactly the six main-row buttons, none with a visible text label', () => {
    expect(all).toHaveLength(6)
    expect(html).not.toContain('play-tool__label')
    for (const label of [t.tools.note, t.tools.x, t.tools.erase, t.tools.undo, t.tools.hint, t.tools.zoom, t.tools.place, t.tools.redo, t.tools.more]) {
      expect(html).not.toContain(`>${label}<`)
    }
  })

  it('gives every button an svg icon and an aria-label plus a title, in the current locale', () => {
    const labels = MAIN_ROW.map((key) => t.tools[key])
    expect(labels).toHaveLength(6)
    for (const button of all) {
      expect(button).toMatch(/<span class="play-tool__icon" aria-hidden="true"><svg\b[^>]*class="play-tool__svg"/)
      expect(button).toMatch(/aria-label="[^"]+"/)
      expect(button).toMatch(/title="[^"]+"/)
    }
    for (const label of labels) expect(html).toContain(`aria-label="${label}"`)
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

  it('uses a distinct icon per button: note, x, erase, undo, hint, zoom', () => {
    const used = (html.match(/data-icon="(\w+)"/g) ?? []).map((m) => m.slice(11, -1))
    expect(used).toEqual(['note', 'x', 'erase', 'undo', 'hint', 'zoomIn'])
  })

  it('no control keeps Place, Redo or More: they are gone from the toolbar', () => {
    expect(html).not.toContain('data-icon="place"')
    expect(html).not.toContain('data-icon="redo"')
    expect(html).not.toContain('data-icon="more"')
    expect(html).not.toContain('play-tool--more')
  })

  it('keeps aria-pressed and the title text on the mode buttons', () => {
    const note = all.find((b) => b.includes(`aria-label="${t.tools.note}"`))!
    expect(note).toContain('aria-pressed="true"')
    expect(note).toContain(`title="${t.toolTitle.note}"`)
    for (const [label, title] of [[t.tools.x, t.toolTitle.x], [t.tools.erase, t.toolTitle.erase]]) {
      const b = all.find((x) => x.includes(`aria-label="${label}"`))!
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

  it('the Undo button is enabled whenever undo or redo is possible, disabled only when neither is', () => {
    const both = all.find((b) => b.includes(`aria-label="${t.tools.undo}"`))!
    expect(both).not.toContain('disabled')

    const undoOnly = buttons(renderToolbar(locale, { canUndo: true, canRedo: false })).find((b) => b.includes(`aria-label="${t.tools.undo}"`))!
    expect(undoOnly).not.toContain('disabled')

    const redoOnly = buttons(renderToolbar(locale, { canUndo: false, canRedo: true })).find((b) => b.includes(`aria-label="${t.tools.undo}"`))!
    expect(redoOnly).not.toContain('disabled')

    const neither = buttons(renderToolbar(locale, { canUndo: false, canRedo: false })).find((b) => b.includes(`aria-label="${t.tools.undo}"`))!
    expect(neither).toContain('disabled')
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
