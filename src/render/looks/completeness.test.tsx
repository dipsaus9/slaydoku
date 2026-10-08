import { describe, expect, it } from 'vitest'
import { SCENE_THEMES } from '../../content/themes/index.ts'
import { ORIENTATIONS, orientCells } from '../icons/orientation.ts'
import { themeIconFootprints } from '../icons/themes/resolve.ts'
import { iconFootprints } from '../icons/resolve.ts'
import { themeIconsFor } from '../../content/themes/icons.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { solidFor, solidOf } from './solid.ts'

/**
 * The look-completeness test (SLAY-17.4): every kind of every registered theme has art in the block look, for every footprint it can take and
 * in all 8 orientations. A new theme, a new kind or a new footprint without a model fails here by name, so nothing is ever drawn in another
 * style. "How to draw a new object" in docs/design/looks.md says how to add one.
 */
describe('look completeness: every theme object kind has block art', () => {
  it('lists the registered themes and has kinds to check', () => {
    expect(SCENE_THEMES.length).toBeGreaterThanOrEqual(6)
    expect(SCENE_THEMES.some((t) => t.id === 'simpshouse')).toBe(true)
  })

  for (const theme of SCENE_THEMES) {
    describe(theme.id, () => {
      for (const object of theme.objects) {
        it(`${object.kind} (${object.themeIcon ?? object.engineType}): every footprint in all 8 orientations`, () => {
          const variants = themeIconFootprints(object) ?? iconFootprints(object.engineType)
          expect(variants.length).toBeGreaterThan(0)
          for (const footprint of object.footprints) {
            // The footprint as the generator can place it must resolve to art, and the art must have a model, whichever way it is turned.
            const first = solidFor(object.engineType, object.themeIcon, footprint.cells)
            expect(first, `${object.kind} ${footprint.id} has no art in the block look`).not.toBeNull()
            expect(first!.prims.length).toBeGreaterThan(0)
            for (const o of ORIENTATIONS) {
              const turned = orientCells(footprint.cells, Math.max(...footprint.cells.map((c) => c.col)) + 1, Math.max(...footprint.cells.map((c) => c.row)) + 1, o)
              expect(solidFor(object.engineType, object.themeIcon, turned, o), `${object.kind} ${footprint.id} ${o.rotation}${o.mirror ? ' mirrored' : ''}`).not.toBeNull()
            }
          }
        })
      }
    })
  }
})

describe('look completeness: the baked schedule', () => {
  it('draws every object of every scheduled day with block art', () => {
    const { days } = readSchedule()
    expect(days.length).toBeGreaterThan(100)
    const missing: string[] = []
    for (const day of days) {
      const themeIcons = themeIconsFor(day.theme, day.puzzle.scene.objects)
      for (const object of day.puzzle.scene.objects) if (!solidOf(object, themeIcons)) missing.push(`${day.date} ${object.id}`)
    }
    expect(missing).toEqual([])
  })
})
