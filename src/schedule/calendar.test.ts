import { describe, expect, it } from 'vitest'
import { SCENE_THEMES } from '../content/themes/index.ts'
import type { ThemeId } from '../content/themes/index.ts'
import { SEASONAL_RULES, SIMPSHOUSE_DATES, seasonalThemeOf } from './calendar.ts'
import { addDays } from './dates.ts'
import { rotationThemeOf, themeOf } from './pick.ts'
import { readSchedule } from './schedule.testing.ts'

const all = () => true
const none = () => false
const seasonal = (date: string) => seasonalThemeOf(date, all)

describe('seasonal rules are data', () => {
  it('lists Simpshouse dates first, as a plain list', () => {
    expect(SIMPSHOUSE_DATES).toEqual(['2026-10-14'])
    expect(SEASONAL_RULES.map((r) => r.theme)).toEqual(['simpshouse', 'carnaval', 'christmas', 'halloween', 'fall'])
  })
})

describe('priority order', () => {
  it.each([
    ['2026-10-14', 'simpshouse'],
    ['2026-11-11', 'carnaval'],
    ['2026-10-17', 'halloween'],
    ['2026-10-31', 'halloween'],
    ['2026-12-01', 'christmas'],
    ['2026-12-31', 'christmas'],
    ['2026-10-01', 'fall'],
    ['2026-10-16', 'fall'],
    ['2026-11-01', 'fall'],
    ['2026-11-10', 'fall'],
    ['2026-11-12', 'fall'],
    ['2026-11-30', 'fall'],
  ] as const)('%s is %s', (date, theme) => {
    expect(seasonal(date)).toBe(theme)
  })

  it('leaves plain days to the rotation', () => {
    for (const date of ['2026-09-28', '2026-09-30', '2027-01-05', '2027-03-15', '2027-07-04']) {
      expect(seasonal(date), date).toBeUndefined()
    }
  })

  it('the 11th of November is not Fall', () => {
    expect(seasonalThemeOf('2026-11-11', (id) => id === 'fall')).toBeUndefined()
  })
})

describe('windows repeat yearly', () => {
  it('applies in 2027 and 2028 (leap year) alike', () => {
    for (const year of ['2027', '2028', '2029']) {
      expect(seasonal(`${year}-10-14`), year).toBe('fall')
      expect(seasonal(`${year}-10-20`), year).toBe('halloween')
      expect(seasonal(`${year}-11-11`), year).toBe('carnaval')
      expect(seasonal(`${year}-12-25`), year).toBe('christmas')
      expect(seasonal(`${year}-03-01`), year).toBeUndefined()
    }
  })

  it('does not treat the leap day as seasonal and keeps neighbours plain', () => {
    expect(seasonal('2028-02-29')).toBeUndefined()
    expect(seasonal('2028-02-28')).toBeUndefined()
    expect(seasonal('2028-03-01')).toBeUndefined()
  })

  it('Simpshouse fires only on its listed dates, not yearly', () => {
    expect(seasonal('2027-10-14')).toBe('fall')
  })
})

describe('a rule only applies when its theme is registered', () => {
  it('with nothing registered every date is plain', () => {
    for (let d = '2026-09-27', i = 0; i < 500; d = addDays(d, 1), i++) expect(seasonalThemeOf(d, none), d).toBeUndefined()
  })

  it('skips an unregistered theme and falls to the next rule', () => {
    const only = (...ids: ThemeId[]) => (id: ThemeId) => ids.includes(id)
    expect(seasonalThemeOf('2026-10-14', only('fall'))).toBe('fall')
    expect(seasonalThemeOf('2026-10-14', only('halloween'))).toBeUndefined()
  })
})

describe('rotation guard against the committed schedule', () => {
  const { days } = readSchedule()

  it('keeps the five-theme cycle: seasonal themes are not in the rotation', () => {
    const rotation = new Set<ThemeId>()
    for (let d = '2026-09-27', i = 0; i < 100; d = addDays(d, 1), i++) rotation.add(rotationThemeOf(d))
    expect(rotation.size).toBe(5)
    for (const theme of SCENE_THEMES.filter((t) => t.seasonal)) expect(rotation.has(theme.id)).toBe(false)
  })

  it('every committed day outside a seasonal window keeps the scheduled theme', () => {
    let checked = 0
    for (const day of days) {
      if (seasonalThemeOf(day.date, all)) continue
      expect(themeOf(day.date), day.date).toBe(day.theme)
      expect(rotationThemeOf(day.date), day.date).toBe(day.theme)
      checked++
    }
    expect(checked).toBeGreaterThan(20)
  })

  it('with no seasonal theme registered, the rotation alone equals the committed schedule for all days', () => {
    for (const day of days) {
      expect(seasonalThemeOf(day.date, none), day.date).toBeUndefined()
      expect(rotationThemeOf(day.date), day.date).toBe(day.theme)
    }
  })
})
