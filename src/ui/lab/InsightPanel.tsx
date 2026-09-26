import { useEffect, useMemo, useState } from 'react'
import type { Puzzle } from '../../engine/model/index.ts'
import type { StorageLike } from '../../game/persistence.ts'
import { exportTelemetry, loadTelemetry } from '../../game/telemetry/index.ts'
import { withCastNames } from '../play/people.ts'
import { downloadText } from './download.ts'
import { buildInsight, recordsFor, summarizeTelemetry } from './insight.ts'
import type { Insight } from './insight.ts'
import { JudgementBox, JudgementTransfer } from './JudgementBox.tsx'
import { ScoreBreakdown } from './ScoreBreakdown.tsx'
import { SolveTrace } from './SolveTrace.tsx'
import { LAB_EN } from './strings.ts'
import { TelemetryList } from './TelemetryList.tsx'

const t = LAB_EN.insight

type Computed = { status: 'computing' } | { status: 'failed' } | { status: 'ready'; insight: Insight }

/** Keyed on the played puzzle: another cast seed gives other names in the hints. */
const cache = new WeakMap<Puzzle, Insight>()

/** Runs the (slow, synchronous) analysis after the first paint, so the screen shows "Bezig" meanwhile. */
function useInsight(puzzle: Puzzle, played: Puzzle): Computed {
  const [done, setDone] = useState<{ puzzle: Puzzle; result: Insight | null } | null>(null)
  useEffect(() => {
    const cached = cache.get(played)
    const timer = setTimeout(
      () => {
        try {
          const insight = cached ?? buildInsight(puzzle, played)
          cache.set(played, insight)
          setDone({ puzzle, result: insight })
        } catch {
          setDone({ puzzle, result: null })
        }
      },
      cached ? 0 : 30,
    )
    return () => clearTimeout(timer)
  }, [puzzle, played])
  if (!done || done.puzzle !== puzzle) return { status: 'computing' }
  return done.result ? { status: 'ready', insight: done.result } : { status: 'failed' }
}

export interface InsightPanelProps {
  puzzleId: string
  puzzle: Puzzle
  /** Same seed the play screen casts the names with, so hint texts name the same people. */
  castSeed?: string
  /** Where judgements and play sessions live: localStorage in the lab, a stand-in in tests. */
  storage: StorageLike | null
}

/** Everything a developer needs to judge one puzzle: score breakdown, solve trace, play data and a verdict. */
export function InsightPanel({ puzzleId, puzzle, castSeed, storage }: InsightPanelProps) {
  const played = useMemo(() => withCastNames(puzzle, castSeed), [puzzle, castSeed])
  const computed = useInsight(puzzle, played)
  const records = useMemo(() => recordsFor(loadTelemetry(storage), puzzleId), [storage, puzzleId])
  const summary = useMemo(() => summarizeTelemetry(records), [records])

  return (
    <div className="lab-insight">
      {computed.status === 'computing' ? (
        <p className="lab-note" role="status">
          {t.computing}
        </p>
      ) : null}
      {computed.status === 'failed' ? (
        <p className="lab-errors" role="alert">
          {t.failed}
        </p>
      ) : null}
      {computed.status === 'ready' ? (
        <>
          <ScoreBreakdown metrics={computed.insight.metrics} score={computed.insight.score} weights={computed.insight.weights} />
          <SolveTrace steps={computed.insight.trace} solved={computed.insight.metrics.solved} />
        </>
      ) : null}
      <TelemetryList records={records} summary={summary} onExport={() => downloadText('slaydoku-speelgegevens.json', exportTelemetry(storage))} />
      <JudgementBox puzzleId={puzzleId} storage={storage} />
      <JudgementTransfer storage={storage} />
    </div>
  )
}
