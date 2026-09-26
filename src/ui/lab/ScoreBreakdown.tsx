import type { DifficultyMetrics, ScoreV2, ScoreWeights } from '../../engine/difficulty/index.ts'
import { LAB_EN } from './strings.ts'

const t = LAB_EN.insight

/** Which score part each metric feeds (people, card count and solved feed none). */
const PART_OF: Partial<Record<keyof DifficultyMetrics, keyof ScoreWeights>> = {
  hardestLevel: 'level',
  steps: 'steps',
  longestChain: 'chain',
  cluesPerStep: 'cluesPerStep',
  directClueShare: 'indirectClues',
  candidatesPerStep: 'candidates',
  cardsPerPlacement: 'cards',
  referenceShare: 'references',
  squaresFromCards: 'squares',
  ladderChain: 'ladderChain',
  placeableAloneShare: 'scarcity',
}

const ROWS = Object.keys(t.metrics) as (keyof DifficultyMetrics)[]

const percent = (share: number): string => `${Math.round(share * 100)}%`

function valueText(metrics: DifficultyMetrics, key: keyof DifficultyMetrics): string {
  const value = metrics[key]
  if (typeof value === 'boolean') return value ? t.yes : t.no
  return key === 'directClueShare' || key === 'referenceShare' || key === 'placeableAloneShare' ? percent(value) : String(value)
}

export interface ScoreBreakdownProps {
  metrics: DifficultyMetrics
  score: ScoreV2
  weights: ScoreWeights
}

/** Every score v2 metric with its value, the 0..100% part it becomes and its weight, then the score. */
export function ScoreBreakdown({ metrics, score, weights }: ScoreBreakdownProps) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  return (
    <section className="lab-section" aria-labelledby="lab-score-title">
      <h2 id="lab-score-title">{t.scoreTitle}</h2>
      <p className="lab-note">{t.scoreIntro}</p>
      <p className="lab-score" data-score={score.score}>
        <strong>{t.scoreResult(score.score)}</strong>
      </p>
      <table className="lab-table" data-testid="score-table">
        <thead>
          <tr>
            <th>{t.columns.metric}</th>
            <th>{t.columns.value}</th>
            <th>{t.columns.part}</th>
            <th>{t.columns.weight}</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((key) => {
            const part = PART_OF[key]
            return (
              <tr key={key} data-metric={key}>
                <td>{t.metrics[key]}</td>
                <td>{valueText(metrics, key)}</td>
                <td>{part ? percent(score.parts[part]) : t.noPart}</td>
                <td>{part && total > 0 ? percent(weights[part] / total) : t.noPart}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
