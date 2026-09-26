import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { labLevels as demoLevels } from './levels.ts'
import type { TelemetryRecord } from '../../game/telemetry/index.ts'
import { createMemoryStorage } from '../../game/memoryStorage.ts'
import { InsightPanel } from './InsightPanel.tsx'
import { buildInsight, summarizeTelemetry } from './insight.ts'
import { JudgementBox, JudgementTransfer } from './JudgementBox.tsx'
import { saveJudgement } from './judgements.ts'
import { LabPlay } from './LabPlay.tsx'
import { ScoreBreakdown } from './ScoreBreakdown.tsx'
import { SolveTrace } from './SolveTrace.tsx'
import { LAB_EN } from './strings.ts'
import { TelemetryList } from './TelemetryList.tsx'

const level = demoLevels[0]!
const insight = buildInsight(level.puzzle)
const t = LAB_EN.insight

describe('score breakdown', () => {
  const html = renderToStaticMarkup(<ScoreBreakdown metrics={insight.metrics} score={insight.score} weights={insight.weights} />)

  it('shows every metric with its value and the score', () => {
    for (const key of Object.keys(t.metrics) as (keyof typeof t.metrics)[]) {
      expect(html).toContain(`data-metric="${key}"`)
      expect(html).toContain(t.metrics[key])
    }
    expect(html).toContain(t.scoreResult(insight.score.score))
    expect(html).toContain(`>${insight.metrics.steps}<`)
  })
})

describe('solve trace view', () => {
  it('shows technique, squares and the three hint texts per step', () => {
    const html = renderToStaticMarkup(<SolveTrace steps={insight.trace} solved />)
    for (const step of insight.trace) {
      expect(html).toContain(`data-step="${step.index}"`)
      expect(html).toContain(step.title)
      for (const level of [1, 2, 3] as const) expect(html).toContain(step.hints[level].replaceAll('"', '&quot;').replaceAll("'", '&#x27;'))
    }
    expect(html).toContain(t.hint(1))
    expect(html).toContain(t.hint(3))
    expect(html).not.toContain(t.traceUnsolved)
  })

  it('folds a long list of squares away', () => {
    const cells = Array.from({ length: 13 }, (_, col) => ({ row: 0, col }))
    const step = { ...insight.trace[0]!, cells }
    const html = renderToStaticMarkup(<SolveTrace steps={[step]} solved />)
    expect(html).toContain(`<summary>${t.cellCount(13)}</summary>`)
    expect(renderToStaticMarkup(<SolveTrace steps={[insight.trace.find((s) => s.cells.length <= 12)!]} solved />)).not.toContain('<details')
  })

  it('warns when the techniques could not finish the puzzle', () => {
    expect(renderToStaticMarkup(<SolveTrace steps={[]} solved={false} />)).toContain(t.traceUnsolved)
  })
})

describe('telemetry list', () => {
  const rec = (sessionId: string, seconds: number): TelemetryRecord => ({
    sessionId, puzzleId: 'p', startedAt: 1_700_000_000_000, activeSeconds: seconds, hints: { 1: 2, 2: 1, 3: 0 },
    hintPlacements: 0, wrongPlacements: 3, failedChecks: 1, undos: 4, outcome: 'solved',
  })

  it('lists the sessions with their summary', () => {
    const records = [rec('a', 90), rec('b', 150)]
    const html = renderToStaticMarkup(<TelemetryList records={records} summary={summarizeTelemetry(records)} onExport={() => {}} />)
    expect(html).toContain('data-telemetry="summary"')
    expect(html).toContain('2:00')
    expect(html).toContain('2 / 1 / 0')
    expect(html).toContain(t.exportTelemetry)
  })

  it('says so when nothing was recorded', () => {
    const html = renderToStaticMarkup(<TelemetryList records={[]} summary={summarizeTelemetry([])} onExport={() => {}} />)
    expect(html).toContain(t.telemetryEmpty)
  })
})

describe('judgement box', () => {
  it('shows the three verdicts and no judgement yet', () => {
    const html = renderToStaticMarkup(<JudgementBox puzzleId="a" storage={createMemoryStorage()} />)
    for (const label of Object.values(t.verdicts)) expect(html).toContain(label)
    expect(html).toContain('data-judged="none"')
  })

  it('shows a stored judgement as chosen', () => {
    const storage = createMemoryStorage()
    saveJudgement(storage, 'a', 'too-hard', 0)
    const html = renderToStaticMarkup(<JudgementBox puzzleId="a" storage={storage} />)
    expect(html).toContain('data-judged="too-hard"')
    expect(html).toMatch(/aria-pressed="true"[^>]*data-verdict="too-hard"/)
  })

  it('offers export and import with the number judged', () => {
    const storage = createMemoryStorage()
    saveJudgement(storage, 'a', 'good', 0)
    const html = renderToStaticMarkup(<JudgementTransfer storage={storage} />)
    expect(html).toContain('data-judged-count="1"')
    expect(html).toContain(t.exportJudgements)
    expect(html).toContain(t.importJudgements)
  })
})

describe('insight panel and play tabs', () => {
  it('starts with a busy note, then the play data and the judgement', () => {
    const html = renderToStaticMarkup(<InsightPanel puzzleId={level.id} puzzle={level.puzzle} storage={createMemoryStorage()} />)
    expect(html).toContain(t.computing)
    expect(html).toContain(t.telemetryTitle)
    expect(html).toContain(t.judgementTitle)
  })

  it('has a play and an insight tab in the lab bar, on play', () => {
    const html = renderToStaticMarkup(
      <LabPlay view={{ source: 'level', id: level.id, title: level.title, puzzle: level.puzzle, facts: [] }} onBack={() => {}} />,
    )
    expect(html).toContain('data-tab="play"')
    expect(html).toContain('data-tab="insight"')
    expect(html).not.toContain(t.scoreTitle)
  })
})
