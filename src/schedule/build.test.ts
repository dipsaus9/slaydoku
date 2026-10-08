import { describe, expect, it } from 'vitest'
import { nominalCast } from './cast.ts'
import { DAY_BUDGET_MS, buildDay, attemptBudgetMs, withFallback } from './build.ts'
import type { DayBuild } from './build.ts'
import { addDays } from './dates.ts'
import { dayProblems } from './gates.ts'
import { readSchedule } from './schedule.testing.ts'
import { ATTEMPT_WINDOW, FALLBACK_SIZE, canFallBack, planDay } from './pick.ts'

const firstPlan = (test: (p: ReturnType<typeof planDay>) => boolean) => {
  for (let i = 0; i < 400; i++) {
    const plan = planDay(addDays('2026-10-12', i))
    if (test(plan)) return plan
  }
  throw new Error('no such day')
}

describe('buildDay', () => {
  it('builds a gated day for a small board, and the same one again', () => {
    const plan = firstPlan((p) => p.size === 6 && p.tier === 'easy')
    const a = buildDay(plan, plan.size, nominalCast(plan.date))
    const b = buildDay(plan, plan.size, nominalCast(plan.date))
    expect(a.ok).toBe(true)
    if (!a.ok || !b.ok) return
    expect(JSON.stringify(a.day)).toBe(JSON.stringify(b.day))
    expect(a.day).toMatchObject({ n: plan.n, date: plan.date, size: 6, tier: 'easy', theme: plan.theme })
    expect(a.day.seed).toBe(plan.seed + a.day.attempts - 1)
    expect(a.rejected.length).toBe(a.day.attempts - 1)
    expect(dayProblems(a.day)).toEqual([])
    expect(a.day.puzzle.people.filter((p) => p.kind === 'suspect').map((p) => p.label)).toEqual(nominalCast(plan.date).names)
  })
  it('lists every rejected seed with the gate that rejected it, and rebuilds a day with the same plan the same way twice', { timeout: 60_000 }, () => {
    const retried = readSchedule().days.filter((d) => d.attempts > 1 && d.fallbackFrom === undefined).sort((x, y) => x.size - y.size)[0]!
    const plan = planDay(retried.date)
    const built = buildDay(plan, plan.size, nominalCast(plan.date))
    expect(built.ok).toBe(true)
    if (!built.ok) return
    // Not byte for byte against the committed day any more: the themes have been revised since (SLAY-17.1, SLAY-17.2),
    // which changes every random draw of a rebuilt scene. The committed files are baked and stay as they are.
    expect(built.day).toMatchObject({ n: retried.n, date: retried.date, size: retried.size, tier: retried.tier, theme: retried.theme })
    const again = buildDay(plan, plan.size, nominalCast(plan.date))
    expect(again.ok && JSON.stringify(again.day)).toBe(JSON.stringify(built.day))
    expect(built.rejected.length).toBe(built.day.attempts - 1)
    built.rejected.forEach((r, k) => {
      expect(r.seed).toBe(plan.seed + k)
      expect(r.gate.length).toBeGreaterThan(0)
    })
  })
  it('runs dry when the day budget is used up', () => {
    const plan = firstPlan((p) => p.size === 6)
    const built = buildDay(plan, plan.size, nominalCast(plan.date), undefined, -1)
    expect(built).toMatchObject({ ok: false, rejected: [] })
    expect(built.ok ? '' : built.reason).toContain('budget')
  })
  it('documents the windows and budgets', () => {
    expect(ATTEMPT_WINDOW).toBe(50)
    expect(DAY_BUDGET_MS).toBeGreaterThan(attemptBudgetMs({ size: 12, tier: 'expert' }))
    expect(attemptBudgetMs({ size: 12, tier: 'expert' })).toBeGreaterThan(attemptBudgetMs({ size: 12, tier: 'medium' }))
  })
})

describe('fallback rule', () => {
  const planned = firstPlan((p) => canFallBack(p))
  const dry: DayBuild = { ok: false, rejected: [{ seed: planned.seed, gate: 'generation', reason: 'budget', ms: 1 }], reason: 'no seed passed', ms: 5 }

  it('leaves a good build alone', () => {
    const good = buildDay(firstPlan((p) => p.size === 6), 6, nominalCast(firstPlan((p) => p.size === 6).date))
    expect(withFallback(planned, good, [])).toEqual({ build: good, fellBack: false })
  })
  it('does not rescue a day that may not fall back', () => {
    const other = firstPlan((p) => p.size === 9)
    expect(withFallback(other, dry, [])).toEqual({ build: dry, fellBack: false })
  })
  it('makes a 9x9 of the same tier and theme, records where it fell back from and keeps the failed seeds', () => {
    const calls: number[] = []
    const stub: typeof buildDay = (plan, size, _cast, from) => {
      calls.push(size)
      expect(from).toBe(12)
      return { ok: false, rejected: [{ seed: plan.seed, gate: 'x', reason: 'y', ms: 1 }], reason: 'nope', ms: 1 }
    }
    const result = withFallback(planned, dry, [], stub)
    expect(calls).toEqual([FALLBACK_SIZE])
    expect(result.fellBack).toBe(true)
    expect(result.build).toMatchObject({ ok: false })
    expect(result.build.rejected.length).toBe(2)
  })
  it('builds a real 9x9 expert or hard day, passing every gate, when the 12x12 ran dry', { timeout: 120_000 }, () => {
    const dryBuild = buildDay(planned, 12, nominalCast(planned.date), undefined, -1)
    expect(dryBuild.ok).toBe(false)
    const { build, fellBack } = withFallback(planned, dryBuild, nominalCast(addDays(planned.date, -1)).names)
    expect(fellBack).toBe(true)
    expect(build.ok).toBe(true)
    if (!build.ok) return
    expect(build.day).toMatchObject({ size: 9, tier: planned.tier, theme: planned.theme, fallbackFrom: 12 })
    expect(dayProblems(build.day)).toEqual([])
    expect(build.day.puzzle.people.filter((p) => p.kind === 'suspect').length).toBe(8)
  })
})
