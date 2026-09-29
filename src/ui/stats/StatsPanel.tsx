import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Stats } from '../../game/stats/index.ts'
import { useLocale } from '../../locale/index.ts'
import { formatTime } from '../play/index.ts'
import { Modal } from '../play/Modal.tsx'
import { STATS_STRINGS } from './strings.ts'

type StatsText = (typeof STATS_STRINGS)['en']

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Keeps Tab and Shift+Tab inside the card while it is open (the background is not reachable by keyboard). */
function trapTab(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== 'Tab') return
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)]
  const first = items[0]
  const last = items.at(-1)
  if (!first || !last) return
  const active = document.activeElement
  if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !event.currentTarget.contains(active))) {
    event.preventDefault()
    first.focus()
  }
}

function Numbers({ stats, t }: { stats: Stats; t: StatsText }) {
  const n = t.numbers
  const rows: [key: string, label: string, value: string][] = [
    ['played', n.played, String(stats.played)],
    ['solved', n.solved, String(stats.solved)],
    ['solve-rate', n.solveRate, stats.solveRate === null ? t.none : t.percent(stats.solveRate)],
    ['current-streak', n.currentStreak, String(stats.currentStreak)],
    ['best-streak', n.bestStreak, String(stats.bestStreak)],
    ['total-hints', n.totalHints, String(stats.totalHints)],
    ['average-hints', n.averageHints, stats.averageHints === null ? t.none : t.average(stats.averageHints)],
  ]
  return (
    <dl className="stats-numbers">
      {rows.map(([key, label, value]) => (
        <div key={key} className="stats-numbers__item" data-stat={key}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Best and median time per tier as a list of bars: the bar is the median, the mark inside it the best time. Every row also says it in words. */
function Times({ stats, t }: { stats: Stats; t: StatsText }) {
  const longest = Math.max(1, ...stats.tiers.map((row) => Math.max(row.median, row.best)))
  return (
    <section className="stats-times" aria-labelledby="stats-times-title">
      <h3 id="stats-times-title" className="stats-section">{t.times.title}</h3>
      {stats.tiers.length === 0 ? (
        <p className="stats-times__empty" data-empty>{t.times.empty}</p>
      ) : (
        <ul className="stats-times__list">
          {stats.tiers.map((row) => (
            <li key={row.tier} className="stats-times__row" data-tier={row.tier}>
              <span className="stats-times__label">
                {t.tier[row.tier]} <span className="stats-times__count">({t.times.puzzles(row.solved)})</span>
              </span>
              <span
                className="stats-times__bar"
                role="img"
                aria-label={t.times.row(t.tier[row.tier], formatTime(row.best), formatTime(row.median))}
              >
                <span className="stats-times__fill" style={{ width: `${(row.median / longest) * 100}%` }} />
                <span className="stats-times__best" style={{ width: `${(row.best / longest) * 100}%` }} />
              </span>
              <span className="stats-times__values" aria-hidden="true">
                <span data-time="best">{t.times.best} {formatTime(row.best)}</span>
                <span data-time="median">{t.times.median} {formatTime(row.median)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export interface StatsPanelProps {
  stats: Stats
  onClose: () => void
  /** Deletes the statistics; returns whether it worked. The panel then shows the new (empty) numbers, which the caller hands in as `stats`. */
  onReset: () => boolean
}

/**
 * The statistics card: the numbers, the times per difficulty and a Reset button that asks first. A modal over the start screen (Escape and
 * a tap on the backdrop close it); the card scrolls inside itself, the page behind it does not trap the finger.
 */
export function StatsPanel({ stats, onClose, onReset }: StatsPanelProps) {
  const { locale } = useLocale()
  const t = STATS_STRINGS[locale]
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<'done' | 'failed' | null>(null)
  const wrapper = useRef<HTMLDivElement>(null)

  // The keyboard starts on the safe button of the current view. preventScroll: focusing a button at the bottom of a long card must not
  // scroll the numbers out of sight.
  useEffect(() => {
    wrapper.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })
  }, [confirming])

  const reset = () => {
    setMessage(onReset() ? 'done' : 'failed')
    setConfirming(false)
  }

  return (
    <Modal title={confirming ? t.reset.title : t.title} onClose={onClose} className="stats-panel">
      <div ref={wrapper} className="stats" data-view={confirming ? 'confirm' : 'stats'} onKeyDown={trapTab}>
        {confirming ? (
          <>
            <p className="stats-confirm__text" role="alert">{t.reset.text}</p>
            <div className="stats-actions">
              <button type="button" className="stats-btn" data-action="cancel-reset" data-autofocus onClick={() => setConfirming(false)}>
                {t.reset.cancel}
              </button>
              <button type="button" className="stats-btn stats-btn--danger" data-action="confirm-reset" onClick={reset}>
                {t.reset.confirm}
              </button>
            </div>
          </>
        ) : (
          <>
            {message ? (
              <p className="stats-message" role="status" data-message={message}>
                {message === 'done' ? t.reset.done : t.reset.failed}
              </p>
            ) : null}
            <Numbers stats={stats} t={t} />
            <p className="stats-note">{t.streakNote}</p>
            <Times stats={stats} t={t} />
            <div className="stats-actions">
              <button type="button" className="stats-btn stats-btn--quiet" data-action="reset" onClick={() => setConfirming(true)}>
                {t.reset.button}
              </button>
              <button type="button" className="stats-btn stats-btn--primary" data-action="close" data-autofocus onClick={onClose}>
                {t.close}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
