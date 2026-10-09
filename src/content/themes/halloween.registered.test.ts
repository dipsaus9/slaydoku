import { describe, expect, it } from 'vitest'
import { addDays } from '../../schedule/dates.ts'
import { themeOf } from '../../schedule/pick.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { halloweenTheme as theme } from './halloween.ts'
import { getTheme } from './index.ts'

// SLAY-24 (which took over SLAY-18.10) registered the Halloween theme and regenerated 17-31 October.
describe('Halloween theme once registered (enabled by SLAY-24)', () => {
  it('is registered as a seasonal theme', () => {
    expect(getTheme('halloween')).toBe(theme)
  })

  it('is the theme of 17-31 October every year, and of no day outside that window', () => {
    for (const year of ['2027', '2028']) {
      for (let d = `${year}-10-17`; d <= `${year}-10-31`; d = addDays(d, 1)) expect(themeOf(d), d).toBe('halloween')
      for (let d = `${year}-01-01`, i = 0; i < 366; d = addDays(d, 1), i++) {
        const md = d.slice(5)
        if (md < '10-17' || md > '10-31') expect(themeOf(d), d).not.toBe('halloween')
      }
    }
  })

  it('leaves the theme of every committed day outside 17-31 October unchanged', () => {
    let checked = 0
    for (const day of readSchedule().days) {
      const md = day.date.slice(5)
      if (md >= '10-17' && md <= '10-31') continue
      expect(themeOf(day.date), day.date).toBe(day.theme)
      checked++
    }
    expect(checked).toBeGreaterThan(50)
  })
})
