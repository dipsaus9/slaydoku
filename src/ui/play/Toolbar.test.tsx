import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS } from '../../game/index.ts'
import { PLAY_NL } from './strings.ts'
import { Toolbar, type ToolbarProps } from './Toolbar.tsx'
import { IDENTITY } from './zoom.ts'

const noop = () => {}
const props: ToolbarProps = {
  tool: 'note',
  onTool: noop,
  options: DEFAULT_OPTIONS,
  canUndo: true,
  canRedo: true,
  hintOpen: false,
  zoom: IDENTITY,
  onZoom: noop,
  onUndo: noop,
  onRedo: noop,
  onHint: noop,
  onToggleAutoX: noop,
  onOpenOptions: noop,
  onOpenHelp: noop,
  onOpenLegend: noop,
  onClearAll: noop,
}

function buttons(html: string): string[] {
  return html.match(/<button\b[\s\S]*?<\/button>/g) ?? []
}

describe('<Toolbar/> icons (CAD-10.10)', () => {
  const html = renderToStaticMarkup(<Toolbar {...props} />)
  const all = buttons(html)

  it('has all twelve buttons', () => {
    expect(all).toHaveLength(12)
  })

  it('gives every tool button an svg icon and a Dutch label', () => {
    const labels = Object.entries(PLAY_NL.tools)
      .filter(([key]) => key !== 'label')
      .map(([, label]) => label)
    expect(labels).toHaveLength(12)
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
    expect(used).toHaveLength(12)
  })

  it('keeps aria-pressed and the title text on the mode buttons', () => {
    const note = all.find((b) => b.includes('>Notitie<'))!
    expect(note).toContain('aria-pressed="true"')
    expect(note).toContain(`title="${PLAY_NL.toolTitle.note}"`)
    for (const [label, title] of [['Plaats', PLAY_NL.toolTitle.place], ['X', PLAY_NL.toolTitle.x], ['Gum', PLAY_NL.toolTitle.erase]]) {
      const b = all.find((x) => x.includes(`>${label}<`))!
      expect(b).toContain('aria-pressed="false"')
      expect(b).toContain(`title="${title}"`)
    }
  })

  it('shows the zoom level as a badge on the magnifier and swaps the glyph when zoomed', () => {
    const zoom = all.find((b) => b.includes('play-tool--zoom'))!
    expect(zoom).toContain('data-icon="zoomIn"')
    expect(zoom).toContain('<span class="play-tool__badge">1×</span>')
    const zoomed = buttons(renderToStaticMarkup(<Toolbar {...props} zoom={{ ...IDENTITY, scale: 2 }} />)).find((b) => b.includes('play-tool--zoom'))!
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
