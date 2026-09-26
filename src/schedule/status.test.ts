import { describe, expect, it } from 'vitest'
import { MIN_DAYS_LEFT, TOP_UP_BELOW, TOP_UP_DAYS, scheduleStatus, topUpPlan } from './status.ts'

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

describe('topUpPlan', () => {
  const launch = '2026-10-12'
  it('is not due with a comfortable margin and says where the next run would start', () => {
    const plan = topUpPlan(index, '2026-09-27', launch)
    expect(plan).toMatchObject({ daysLeft: 120, needed: false, start: '2027-02-09', days: TOP_UP_DAYS, end: '2027-05-09' })
    expect(plan.command).toBe('bun run schedule --start 2027-02-09 --days 90 --jobs 2')
  })
  it('is due below 60 days left, not at 60', () => {
    expect(TOP_UP_BELOW).toBe(60)
    expect(topUpPlan(index, '2026-12-10', launch)).toMatchObject({ daysLeft: 60, needed: false })
    expect(topUpPlan(index, '2026-12-11', launch)).toMatchObject({ daysLeft: 59, needed: true })
  })
  it('counts exactly 30 and 29 days left, the floor of schedule:check', () => {
    expect(topUpPlan(index, '2027-01-09', launch)).toMatchObject({ daysLeft: 30, needed: true })
    expect(topUpPlan(index, '2027-01-10', launch)).toMatchObject({ daysLeft: 29, needed: true })
    expect(scheduleStatus(index, '2027-01-09').ok).toBe(true)
    expect(scheduleStatus(index, '2027-01-10').ok).toBe(false)
  })
  it('starts on the launch date for an empty or missing schedule', () => {
    expect(topUpPlan(null, '2026-09-27', launch)).toMatchObject({ daysLeft: 0, needed: true, start: launch, end: '2027-01-09' })
    expect(topUpPlan({ first: launch, last: launch, count: 0 }, '2026-09-27', launch, 10)).toMatchObject({ needed: true, start: launch, days: 10, end: '2026-10-21' })
  })
  it('crosses month and year boundaries and leap days', () => {
    expect(topUpPlan({ first: launch, last: '2026-11-30', count: 50 }, '2026-11-01', launch, 31)).toMatchObject({ start: '2026-12-01', end: '2026-12-31' })
    expect(topUpPlan({ first: launch, last: '2027-12-31', count: 50 }, '2027-12-01', launch, 90)).toMatchObject({ start: '2028-01-01', end: '2028-03-30' })
    expect(topUpPlan({ first: launch, last: '2028-02-28', count: 50 }, '2028-02-01', launch, 2)).toMatchObject({ start: '2028-02-29', end: '2028-03-01' })
    expect(topUpPlan({ first: launch, last: '2027-01-31', count: 50 }, '2027-01-01', launch, 1)).toMatchObject({ start: '2027-02-01', end: '2027-02-01' })
  })
  it('is due when the schedule has already run out', () => {
    expect(topUpPlan(index, '2027-06-01', launch)).toMatchObject({ daysLeft: 0, needed: true, start: '2027-02-09' })
  })
  it('refuses a day count that is not a positive integer', () => {
    expect(() => topUpPlan(index, '2026-09-27', launch, 0)).toThrow(RangeError)
    expect(() => topUpPlan(index, '2026-09-27', launch, 1.5)).toThrow(RangeError)
  })
})
