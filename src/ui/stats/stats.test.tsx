import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../../game/memoryStorage.ts'
import { recordResult } from '../../game/daily/results.ts'
import { computeStats } from '../../game/stats/index.ts'
import { LocaleProvider } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { StatsEntry } from './StatsEntry.tsx'
import { StatsPanel } from './StatsPanel.tsx'
import { STATS_STRINGS } from './strings.ts'

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim()
const res = (n: number, date: string, extra = {}) => ({ n, date, fp: `fp${n}`, elapsedMs: 125_000, hints: 1, wrongChecks: 0, murdererId: 'p1', ...extra })
const wrap = (locale: Locale, node: ReactNode) =>
  renderToStaticMarkup(
    <LocaleProvider storage={null} browserLanguage={locale === 'nl' ? 'nl-NL' : 'en-US'}>
      {node}
    </LocaleProvider>,
  )

describe.each(['en', 'nl'] as const)('<StatsEntry/> (%s)', (locale) => {
  const t = STATS_STRINGS[locale]

  it('shows a compact streak line and a Stats button', () => {
    const storage = createMemoryStorage()
    for (const [n, date] of [[1, '2026-10-12'], [2, '2026-10-13'], [3, '2026-10-14']] as const) recordResult(storage, res(n, date))
    const html = wrap(locale, <StatsEntry storage={storage} today="2026-10-14" />)
    expect(strip(html)).toContain(t.summary(3, 3))
    expect(html).toContain('data-stats-open')
    expect(html).toContain(`>${t.open}<`)
    expect(html).not.toContain('role="dialog"')
  })

  it('reads an empty device as a zero streak', () => {
    const html = wrap(locale, <StatsEntry storage={createMemoryStorage()} today="2026-10-14" />)
    expect(strip(html)).toContain(t.summary(0, 0))
  })
})

describe.each(['en', 'nl'] as const)('<StatsPanel/> (%s)', (locale) => {
  const t = STATS_STRINGS[locale]
  const stats = computeStats(
    [res(1, '2026-10-12', { tier: 'easy', elapsedMs: 60_000, hints: 0 }), res(2, '2026-10-13', { tier: 'easy', elapsedMs: 100_000, hints: 3 }), res(3, '2026-10-14', { tier: 'hard', elapsedMs: 754_000, hints: 1 })],
    '2026-10-14',
    [1, 2, 3, 4],
  )
  const html = wrap(locale, <StatsPanel stats={stats} onClose={() => {}} onReset={() => true} />)
  const text = strip(html)

  it('is a labelled modal dialog', () => {
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(text).toContain(t.title)
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
    expect(html).toContain(`aria-label="${t.times.row(t.tier.easy, '1:00', '1:20')}"`)
    expect(text).toContain(`${t.times.best} 12:34`)
    expect(text).toContain(`${t.times.median} 12:34`)
  })

  it('says so when there are no times yet, and shows dashes for the rates', () => {
    const empty = wrap(locale, <StatsPanel stats={computeStats([], '2026-10-14')} onClose={() => {}} onReset={() => true} />)
    expect(empty).toContain('data-empty')
    expect(strip(empty)).toContain(t.times.empty)
    expect(strip(/data-stat="solve-rate".*?<\/dd>/.exec(empty)![0]!)).toContain('–')
  })

  it('has a Reset button and says the data stays on the device', () => {
    expect(html).toContain('data-action="reset"')
    expect(text).toContain(t.reset.button)
    expect(text).toContain(t.device)
  })
})
