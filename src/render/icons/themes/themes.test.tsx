import { describe, expect, it } from 'vitest'
import { renderContactSheet } from '../contactSheet.ts'
import { ORIENTATIONS } from '../orientation.ts'
import { SCENE_THEMES } from '../../../content/themes/index.ts'
import { THEME_ICON_DEFINITIONS } from './registry.ts'
import { resolveThemeObjectIcon } from './resolve.ts'
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

describe('contact sheet', () => {
  it('includes every theme icon and every theme object', () => {
    const html = renderContactSheet()
    for (const id of THEME_ICON_IDS) expect(html, id).toContain(`data-theme-icon-card="${id}"`)
    for (const theme of SCENE_THEMES) {
      expect(html, theme.id).toContain(`data-theme="${theme.id}"`)
      for (const o of theme.objects) expect(html).toContain(`data-theme-object="${o.kind}"`)
    }
    expect(html).not.toContain('no art')
  })
})
