import type { TelemetryRecord } from '../../game/telemetry/index.ts'
import { clock } from './insight.ts'
import type { TelemetrySummary } from './insight.ts'
import { LAB_NL } from './strings.ts'

const t = LAB_NL.insight

const orDash = (value: number | null, show: (n: number) => string = String): string => (value === null ? t.summary.none : show(value))

export interface TelemetryListProps {
  records: readonly TelemetryRecord[]
  summary: TelemetrySummary
  onExport: () => void
}

/** Play sessions recorded for this puzzle, with median time, hints and errors. */
export function TelemetryList({ records, summary, onExport }: TelemetryListProps) {
  const s = t.summary
  return (
    <section className="lab-section" aria-labelledby="lab-telemetry-title">
      <h2 id="lab-telemetry-title">{t.telemetryTitle}</h2>
      <p className="lab-note">{t.telemetryNote}</p>
      {records.length === 0 ? (
        <p className="lab-note" data-telemetry="empty">
          {t.telemetryEmpty}
        </p>
      ) : (
        <>
          <dl className="lab-summary" data-telemetry="summary">
            <div>
              <dt>{s.sessions}</dt>
              <dd>
                {summary.sessions} ({s.solvedOf(summary.solved, summary.abandoned)})
              </dd>
            </div>
            <div>
              <dt>{s.medianTime}</dt>
              <dd>{orDash(summary.medianSeconds, clock)}</dd>
            </div>
            <div>
              <dt>{s.medianHints}</dt>
              <dd>{orDash(summary.medianHints)}</dd>
            </div>
            <div>
              <dt>{s.medianErrors}</dt>
              <dd>{orDash(summary.medianErrors)}</dd>
            </div>
          </dl>
          <table className="lab-table">
            <thead>
              <tr>
                <th>{t.records.started}</th>
                <th>{t.records.time}</th>
                <th>{t.records.hints}</th>
                <th>{t.records.hintPlacements}</th>
                <th>{t.records.wrong}</th>
                <th>{t.records.failedChecks}</th>
                <th>{t.records.undos}</th>
                <th>{t.records.outcome}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.sessionId}>
                  <td>{new Date(record.startedAt).toLocaleString('nl-NL')}</td>
                  <td>{clock(record.activeSeconds)}</td>
                  <td>
                    {record.hints[1]} / {record.hints[2]} / {record.hints[3]}
                  </td>
                  <td>{record.hintPlacements}</td>
                  <td>{record.wrongPlacements}</td>
                  <td>{record.failedChecks}</td>
                  <td>{record.undos}</td>
                  <td>{record.outcome === 'solved' ? t.records.solved : t.records.abandoned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p>
        <button type="button" className="lab-btn" onClick={onExport}>
          {t.exportTelemetry}
        </button>
      </p>
    </section>
  )
}
