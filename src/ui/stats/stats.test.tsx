import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../../game/memoryStorage.ts'
import { recordResult } from '../../game/daily/results.ts'
import { computeStats } from '../../game/stats/index.ts'
import { StatsEntry } from './StatsEntry.tsx'
import { StatsPanel } from './StatsPanel.tsx'
import { STATS_EN } from './strings.ts'

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim()
const res = (n: number, date: string, extra = {}) => ({ n, date, fp: `fp${n}`, elapsedMs: 125_000, hints: 1, wrongChecks: 0, murdererId: 'p1', ...extra })

describe('<StatsEntry/>', () => {
  it('shows a compact streak line and a Stats button', () => {
    const storage = createMemoryStorage()
    for (const [n, date] of [[1, '2026-10-12'], [2, '2026-10-13'], [3, '2026-10-14']] as const) recordResult(storage, res(n, date))
    const html = renderToStaticMarkup(<StatsEntry storage={storage} today="2026-10-14" />)
    expect(strip(html)).toContain('Streak 3 · Best 3')
    expect(html).toContain('data-stats-open')
    expect(html).toContain('>Stats<')
    expect(html).not.toContain('role="dialog"')
  })

  it('reads an empty device as a zero streak', () => {
    const html = renderToStaticMarkup(<StatsEntry storage={createMemoryStorage()} today="2026-10-14" />)
    expect(strip(html)).toContain('Streak 0 · Best 0')
  })
})

describe('<StatsPanel/>', () => {
  const stats = computeStats(
    [res(1, '2026-10-12', { tier: 'easy', elapsedMs: 60_000, hints: 0 }), res(2, '2026-10-13', { tier: 'easy', elapsedMs: 100_000, hints: 3 }), res(3, '2026-10-14', { tier: 'hard', elapsedMs: 754_000, hints: 1 })],
    '2026-10-14',
    [1, 2, 3, 4],
  )
  const html = renderToStaticMarkup(<StatsPanel stats={stats} onClose={() => {}} onReset={() => true} />)
  const text = strip(html)

  it('is a labelled modal dialog', () => {
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(text).toContain(STATS_EN.title)
  })

  it('shows every number', () => {
    const value = (key: string) => strip(new RegExp(`data-stat="${key}".*?</dd>`).exec(html)![0]!)
    expect(value('played')).toContain('4')
    expect(value('solved')).toContain('3')
    expect(value('solve-rate')).toContain('75%')
    expect(value('current-streak')).toContain('3')
    expect(value('best-streak')).toContain('3')
    expect(value('total-hints')).toContain('4')
    expect(value('average-hints')).toContain('1.3')
  })

  it('lists best and median time per difficulty as bars with a text alternative', () => {
    expect(html).toContain('data-tier="easy"')
    expect(html).toContain('data-tier="hard"')
    expect(html).not.toContain('data-tier="medium"')
    expect(html).toContain('aria-label="Easy: best 1:00, median 1:20"')
    expect(text).toContain('Best 12:34')
    expect(text).toContain('Median 12:34')
  })

  it('says so when there are no times yet, and shows dashes for the rates', () => {
    const empty = renderToStaticMarkup(<StatsPanel stats={computeStats([], '2026-10-14')} onClose={() => {}} onReset={() => true} />)
    expect(empty).toContain('data-empty')
    expect(strip(empty)).toContain(STATS_EN.times.empty)
    expect(strip(/data-stat="solve-rate".*?<\/dd>/.exec(empty)![0]!)).toContain('–')
  })

  it('has a Reset button and says the data stays on the device', () => {
    expect(html).toContain('data-action="reset"')
    expect(text).toContain('Reset stats')
    expect(text).toContain('Nothing is sent anywhere')
  })
})
