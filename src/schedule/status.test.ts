import { describe, expect, it } from 'vitest'
import { MIN_DAYS_LEFT, scheduleStatus } from './status.ts'

const index = { first: '2026-10-12', last: '2027-02-08', count: 120 }

describe('scheduleStatus', () => {
  it('counts every day before the launch', () => {
    expect(scheduleStatus(index, '2026-09-27')).toMatchObject({ daysLeft: 120, ok: true, nextStart: '2027-02-09' })
    expect(scheduleStatus(index, '2026-10-11').daysLeft).toBe(120)
  })
  it('does not count today, which is in use', () => {
    expect(scheduleStatus(index, '2026-10-12').daysLeft).toBe(119)
    expect(scheduleStatus(index, '2027-02-07').daysLeft).toBe(1)
    expect(scheduleStatus(index, '2027-02-08').daysLeft).toBe(0)
  })
  it('is never negative once the schedule has run out', () => {
    expect(scheduleStatus(index, '2027-06-01')).toMatchObject({ daysLeft: 0, ok: false })
  })
  it('asks for a top-up under the minimum of 30 days', () => {
    expect(MIN_DAYS_LEFT).toBe(30)
    expect(scheduleStatus(index, '2027-01-10').daysLeft).toBe(29)
    expect(scheduleStatus(index, '2027-01-10').ok).toBe(false)
    expect(scheduleStatus(index, '2027-01-09')).toMatchObject({ daysLeft: 30, ok: true })
  })
  it('has nothing left for an empty schedule', () => {
    expect(scheduleStatus({ first: '2026-10-12', last: '2026-10-12', count: 0 }, '2026-10-01').ok).toBe(false)
  })
})
