import { describe, expect, it } from 'vitest'
import { seasonalThemeOf } from '../../schedule/calendar.ts'
import { addDays } from '../../schedule/dates.ts'
import { rotationThemeOf, themeOf } from '../../schedule/pick.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { CARNAVAL_THEME, carnavalTheme } from './carnaval.ts'
import { SCENE_THEMES } from './index.ts'
import type { ThemeId } from './types.ts'

/**
 * Carnaval once registered (SLAY-18.7 wrote these, SLAY-18.10 un-skips them). SLAY-18.7 builds the theme but leaves `CARNAVAL_THEME`
 * undefined, because registering it moves 2026-11-11 from its committed theme to carnaval and that day has to be regenerated in the same
 * change. SLAY-18.10 sets `CARNAVAL_THEME = carnavalTheme`, regenerates 11 November, and turns `describe.skip` below into `describe`.
 */
describe.skip('carnaval in the calendar, once registered (un-skipped by SLAY-18.10)', () => {
  const registered = new Set(SCENE_THEMES.map((t) => t.id))
  const withoutCarnaval = (date: string): ThemeId => seasonalThemeOf(date, (id) => registered.has(id) && id !== 'carnaval') ?? rotationThemeOf(date)

  it('is registered as the seasonal carnaval theme', () => {
    expect(CARNAVAL_THEME).toBe(carnavalTheme)
    expect(SCENE_THEMES).toContain(carnavalTheme)
  })

  it('picks carnaval on 11 November every year', () => {
    for (let year = 2026; year <= 2030; year++) expect(themeOf(`${year}-11-11`), String(year)).toBe('carnaval')
  })

  it('changes no other day: every date but 11 November has the theme it had before carnaval was registered', () => {
    let checked = 0
    for (let d = '2026-09-27'; d <= '2028-12-31'; d = addDays(d, 1)) {
      if (d.endsWith('-11-11')) continue
      expect(themeOf(d), d).toBe(withoutCarnaval(d))
      checked++
    }
    expect(checked).toBeGreaterThan(800)
  })

  it('keeps the theme of every committed day except 11 November', () => {
    const { days } = readSchedule()
    for (const day of days) if (!day.date.endsWith('-11-11')) expect(themeOf(day.date), day.date).toBe(day.theme)
  })
})
