import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SCENE_THEMES } from '../../../content/themes/index.ts'
import { renderContactSheet } from '../contactSheet.ts'
import { ORIENTATIONS } from '../orientation.ts'
import { insideCells, shapeExtents } from './svgBounds.ts'
import { THEME_ICON_DEFINITIONS } from './registry.ts'
import { resolveThemeObjectIcon } from './resolve.ts'
import { ThemeObjectIconGlyph } from './ThemeObjectIcon.tsx'
import { THEME_ICON_IDS } from './types.ts'

describe('theme icon registry', () => {
  it('defines every id, each with at least one footprint and no duplicates', () => {
    expect(Object.keys(THEME_ICON_DEFINITIONS).sort()).toEqual([...THEME_ICON_IDS].sort())
    for (const id of THEME_ICON_IDS) {
      const { variants } = THEME_ICON_DEFINITIONS[id]
      expect(variants.length, id).toBeGreaterThan(0)
      expect(new Set(variants.map((v) => v.id)).size, id).toBe(variants.length)
    }
  })

  it('draws every variant inside its own cells, stroke included', () => {
    for (const id of THEME_ICON_IDS) {
      for (const v of THEME_ICON_DEFINITIONS[id].variants) {
        const shapes = shapeExtents(renderToStaticMarkup(<svg>{v.draw()}</svg>))
        expect(shapes.length, `${id} ${v.id} draws something`).toBeGreaterThan(0)
        for (const { points, pad } of shapes) {
          for (const [x, y] of points) {
            for (const [dx, dy] of [[-pad, -pad], [pad, -pad], [-pad, pad], [pad, pad]] as const) {
              expect(insideCells(x + dx, y + dy, v.cells), `${id} ${v.id} point ${x},${y} pad ${pad}`).toBe(true)
            }
          }
        }
      }
    }
  })

  it('resolves every footprint under every rotation and mirror', () => {
    for (const id of THEME_ICON_IDS) {
      for (const v of THEME_ICON_DEFINITIONS[id].variants) {
        for (const o of ORIENTATIONS) {
          const icon = resolveThemeObjectIcon({ engineType: 'chair', themeIcon: id }, v.cells, o)
          expect(icon, `${id} ${v.id}`).toBeDefined()
        }
      }
    }
  })
})

describe('theme object icons', () => {
  it('uses the engine icon when the object has no theme art', () => {
    const markup = renderToStaticMarkup(
      <svg><ThemeObjectIconGlyph object={{ engineType: 'tv' }} cells={[{ row: 0, col: 0 }]} /></svg>,
    )
    expect(markup).toContain('data-icon="tv"')
  })

  it('renders theme art for an object with a theme icon, and nothing for an unknown footprint', () => {
    const own = { engineType: 'bed' as const, themeIcon: 'hammock' as const }
    const cells = [{ row: 3, col: 4 }, { row: 4, col: 4 }]
    expect(renderToStaticMarkup(<svg><ThemeObjectIconGlyph object={own} cells={cells} /></svg>)).toContain('data-theme-icon="hammock"')
    expect(renderToStaticMarkup(<svg><ThemeObjectIconGlyph object={own} cells={[{ row: 0, col: 0 }]} /></svg>)).not.toContain('data-theme-icon')
  })
})

describe('contact sheet', () => {
  it('includes every theme icon and every theme object', () => {
    const html = renderContactSheet()
    for (const id of THEME_ICON_IDS) expect(html, id).toContain(`data-theme-icon-card="${id}"`)
    for (const theme of SCENE_THEMES) {
      expect(html, theme.id).toContain(`data-theme="${theme.id}"`)
      for (const o of theme.objects) expect(html).toContain(`data-theme-object="${o.kind}"`)
    }
  })
})
