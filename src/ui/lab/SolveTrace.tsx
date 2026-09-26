import { cellLabel } from './insight.ts'
import type { TraceStep } from './insight.ts'
import { LAB_NL } from './strings.ts'

const t = LAB_NL.insight

/** Longer lists of squares are folded away; the hint texts already say how many there are. */
const FEW_CELLS = 12

export interface SolveTraceProps {
  steps: readonly TraceStep[]
  /** False when the techniques could not finish the puzzle. */
  solved: boolean
}

/** Each human step: technique, the squares it is about and the three hint texts of the game. */
export function SolveTrace({ steps, solved }: SolveTraceProps) {
  return (
    <section className="lab-section" aria-labelledby="lab-trace-title">
      <h2 id="lab-trace-title">{t.traceTitle}</h2>
      <p className="lab-note">{t.traceIntro}</p>
      {solved ? null : (
        <p className="lab-warnings" role="alert">
          {t.traceUnsolved}
        </p>
      )}
      {steps.length === 0 ? <p className="lab-note">{t.traceEmpty}</p> : null}
      <ol className="lab-trace">
        {steps.map((step) => (
          <li key={step.index} className="lab-trace__step" data-step={step.index}>
            <h3>
              {t.step(step.index)}: {step.title} <small>({t.level(step.level)})</small>
            </h3>
            <p className="lab-trace__cells">
              <strong>{step.placement ? t.places : t.cells}:</strong>{' '}
              {step.cells.length > FEW_CELLS ? (
                <details>
                  <summary>{t.cellCount(step.cells.length)}</summary>
                  {step.cells.map(cellLabel).join(', ')}
                </details>
              ) : (
                step.cells.map(cellLabel).join(', ')
              )}
            </p>
            <dl className="lab-trace__hints">
              {([1, 2, 3] as const).map((level) => (
                <div key={level}>
                  <dt>{t.hint(level)}</dt>
                  <dd>{step.hints[level]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </section>
  )
}
