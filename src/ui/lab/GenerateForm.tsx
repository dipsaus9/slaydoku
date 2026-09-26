import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getTheme } from '../../content/themes/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import type { ThemeId } from '../../content/themes/index.ts'
import { LAB_SIZES, LAB_THEMES, LAB_TIERS, MAX_BUDGET_S, MIN_BUDGET_S, parseForm } from './model.ts'
import type { FormValues } from './model.ts'
import type { Job } from './useGeneration.ts'
import type { GenerateRequest, LabFailure, LabPuzzle } from './protocol.ts'
import { LAB_NL } from './strings.ts'

export interface GenerateFormProps {
  values: FormValues
  onValues: (values: FormValues) => void
  job: Job
  onStart: (request: GenerateRequest) => void
  onCancel: () => void
  onPlay: (puzzle: LabPuzzle) => void
}

/** Seconds since `startedAt`, ticking while `active`. */
function useElapsedSeconds(active: boolean): number {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!active) return
    const started = performance.now()
    const timer = setInterval(() => setSeconds(Math.floor((performance.now() - started) / 1000)), 250)
    return () => {
      clearInterval(timer)
      setSeconds(0)
    }
  }, [active])
  return seconds
}

function Running({ job, onCancel }: { job: Extract<Job, { status: 'running' }>; onCancel: () => void }) {
  const t = LAB_NL.generate
  const seconds = useElapsedSeconds(true)
  const budgetSeconds = Math.round(job.request.budgetMs / 1000)
  return (
    <div className="lab-progress" role="status" aria-live="polite">
      <p className="lab-progress__line">
        <strong>{t.running}</strong> {t.phase[job.phase]}
      </p>
      <progress className="lab-progress__bar" max={budgetSeconds} value={Math.min(seconds, budgetSeconds)} />
      <p className="lab-progress__time">{t.elapsed(seconds, budgetSeconds)}</p>
      <button type="button" className="lab-btn lab-btn--danger" onClick={onCancel}>
        {t.cancel}
      </button>
    </div>
  )
}

function Failure({ failure }: { failure: LabFailure }) {
  const t = LAB_NL.generate
  const rejected = Object.entries(failure.rejections).filter(([, n]) => n > 0)
  return (
    <div className="lab-result lab-result--fail" role="alert">
      <h3>{t.failTitle}</h3>
      <p>{failure.reason}</p>
      {failure.timedOut ? <p>{t.failTimedOut}</p> : null}
      {failure.attempts > 0 ? <p>{t.failAttempts(failure.attempts)}</p> : null}
      {rejected.length > 0 ? (
        <p>
          {t.failRejections}: {rejected.map(([why, n]) => `${why} ${n}x`).join(', ')}
        </p>
      ) : null}
    </div>
  )
}

function Success({ puzzle, onPlay }: { puzzle: LabPuzzle; onPlay: (puzzle: LabPuzzle) => void }) {
  const t = LAB_NL.generate
  return (
    <div className="lab-result lab-result--ok">
      <h3>{t.resultOk(puzzle.id)}</h3>
      <p>{puzzle.title}</p>
      <p>{t.resultDetails(puzzle.attempts, puzzle.elapsedMs, puzzle.clueCount, puzzle.rating.score)}</p>
      {puzzle.warnings.length > 0 ? (
        <div className="lab-warnings">
          <p>
            <strong>{t.warningsTitle}</strong>
          </p>
          <ul>
            {puzzle.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <button type="button" className="lab-btn lab-btn--primary" onClick={() => onPlay(puzzle)}>
        {t.playGenerated}
      </button>
    </div>
  )
}

/** The generate form: size, tier, theme, seed, optional gift cell. Progress and cancel while it runs; then the result or the reason it failed. */
export function GenerateForm({ values, onValues, job, onStart, onCancel, onPlay }: GenerateFormProps) {
  const t = LAB_NL.generate
  const [errors, setErrors] = useState<string[]>([])
  const running = job.status === 'running'
  const set = (patch: Partial<FormValues>) => onValues({ ...values, ...patch })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (running) return
    const parsed = parseForm(values)
    if (!parsed.ok) return setErrors(parsed.errors)
    setErrors([])
    onStart(parsed.request)
  }

  return (
    <section className="lab-section" aria-labelledby="lab-generate-title">
      <h2 id="lab-generate-title">{t.title}</h2>
      <form className="lab-form" onSubmit={submit} noValidate>
        <label className="lab-field">
          <span>{t.size}</span>
          <select value={values.size} disabled={running} onChange={(e) => set({ size: Number(e.target.value) })}>
            {LAB_SIZES.map((size) => (
              <option key={size} value={size}>
                {LAB_NL.size_(size)}
              </option>
            ))}
          </select>
        </label>
        <label className="lab-field">
          <span>{t.tier}</span>
          <select value={values.tier} disabled={running} onChange={(e) => set({ tier: e.target.value as TierId })}>
            {LAB_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {LAB_NL.tier[tier]}
              </option>
            ))}
          </select>
        </label>
        <label className="lab-field">
          <span>{t.theme}</span>
          <select value={values.theme} disabled={running} onChange={(e) => set({ theme: e.target.value as ThemeId })}>
            {LAB_THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {getTheme(theme).nameNl}
              </option>
            ))}
          </select>
        </label>
        <div className="lab-field">
          <label htmlFor="lab-seed">{t.seed}</label>
          <span className="lab-field__row">
            <input id="lab-seed" inputMode="numeric" value={values.seed} disabled={running} onChange={(e) => set({ seed: e.target.value })} />
            <button
              type="button"
              className="lab-btn"
              disabled={running}
              onClick={() => set({ seed: String(Math.floor(Math.random() * 1_000_000)) })}
            >
              {t.randomSeed}
            </button>
          </span>
          <small>{t.seedHint}</small>
        </div>
        <fieldset className="lab-field lab-field--group">
          <legend>{t.victim}</legend>
          <span className="lab-field__row">
            <label>
              {t.victimRow}{' '}
              <input
                aria-label={t.victimRow}
                className="lab-input--short"
                inputMode="numeric"
                value={values.victimRow}
                disabled={running}
                onChange={(e) => set({ victimRow: e.target.value })}
              />
            </label>
            <label>
              {t.victimCol}{' '}
              <input
                aria-label={t.victimCol}
                className="lab-input--short"
                inputMode="numeric"
                value={values.victimCol}
                disabled={running}
                onChange={(e) => set({ victimCol: e.target.value })}
              />
            </label>
          </span>
          <small>{t.victimHint}</small>
        </fieldset>
        <label className="lab-field">
          <span>{t.budget}</span>
          <input
            inputMode="numeric"
            className="lab-input--short"
            min={MIN_BUDGET_S}
            max={MAX_BUDGET_S}
            value={values.budgetSeconds}
            disabled={running}
            onChange={(e) => set({ budgetSeconds: e.target.value })}
          />
        </label>

        {errors.length > 0 ? (
          <ul className="lab-errors" role="alert">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <div className="lab-form__actions">
          <button type="submit" className="lab-btn lab-btn--primary" disabled={running}>
            {t.submit}
          </button>
        </div>
      </form>

      {job.status === 'running' ? <Running job={job} onCancel={onCancel} /> : null}
      {job.status === 'cancelled' ? (
        <p className="lab-note" role="status">
          {t.cancelled}
        </p>
      ) : null}
      {job.status === 'error' ? (
        <div className="lab-result lab-result--fail" role="alert">
          <h3>{t.failTitle}</h3>
          <p>
            {t.workerFailed}: {job.reason}
          </p>
        </div>
      ) : null}
      {job.status === 'done' ? job.outcome.ok ? <Success puzzle={job.outcome.puzzle} onPlay={onPlay} /> : <Failure failure={job.outcome.failure} /> : null}
    </section>
  )
}
