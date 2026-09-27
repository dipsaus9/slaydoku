import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { help } from '../../content/help/help.ts'
import type { DayStatus } from '../../game/index.ts'
import { formatLongDate, formatDayMonth, startOfUtcDay, utcWithLocal } from '../../schedule/index.ts'
import type { ScheduleDay } from '../../schedule/index.ts'
import { HelpPanel, formatTime, withCastNames } from '../play/index.ts'
import { Link } from '../router/index.ts'
import { Countdown } from './Countdown.tsx'
import { DAILY_EN } from './strings.ts'

/** What the start screen shows. */
export type StartState =
  | { kind: 'loading' }
  | { kind: 'error'; onRetry: () => void }
  | { kind: 'before-launch'; first: string }
  | { kind: 'after-schedule' }
  | { kind: 'day'; day: ScheduleDay; status: DayStatus; ended: boolean }

export interface StartScreenProps {
  state: StartState
  clock: () => number
  /** The user chose Play or Continue. */
  onPlay: () => void
  /** Set while the shown puzzle is one day behind the clock: the "New puzzle available" banner and the puzzle number behind it. */
  rollover?: { n: number; onShow: () => void } | null
  /** The share card of a solved day (filled by `DailyFlow`); shown only when the day is solved. */
  share?: ReactNode
  /** Room for the statistics of the player (SLAY-1.6). */
  stats?: ReactNode
}

function PuzzleCard({ day, status, ended, clock, onPlay }: { day: ScheduleDay; status: DayStatus; ended: boolean; clock: () => number; onPlay: () => void }) {
  const t = DAILY_EN
  const solved = status.kind === 'solved' ? status.result : null
  const name = useMemo(() => {
    if (!solved) return ''
    return withCastNames(day.puzzle).people.find((p) => p.id === solved.murdererId)?.label ?? solved.murdererId
  }, [day.puzzle, solved])
  // The day ends at the next 00:00 UTC after its own date starts (not after "now"): a day that ended while the page was open shows no countdown.
  const dayEnd = startOfUtcDay(day.date) + 86_400_000
  return (
    <section className="daily-card" data-status={status.kind} data-day={day.date} aria-labelledby="daily-number">
      <h2 id="daily-number" className="daily-card__number" data-puzzle-number={day.n}>
        {t.puzzleNumber(day.n)}
      </h2>
      <p className="daily-card__date" data-date>{formatLongDate(day.date)}</p>
      <p className="daily-card__meta">
        <span className="daily-card__tier" data-tier={day.tier}>
          <span className="daily-card__tier-label">{t.difficulty}:</span> {t.tier[day.tier]}
        </span>
        <span className="daily-card__size" data-size={day.size}>{t.size(day.size)}</span>
      </p>

      {solved ? (
        <div className="daily-result" data-result="solved">
          <p className="daily-result__title">{t.solved.title}</p>
          <p className="daily-result__alone">{t.solved.alone(name)}</p>
          <p className="daily-result__facts">
            <span data-fact="time">{t.solved.time(formatTime(solved.elapsedMs))}</span>
            <span aria-hidden="true">{' · '}</span>
            <span data-fact="hints">{t.solved.hints(solved.hints)}</span>
          </p>
        </div>
      ) : ended ? (
        <p className="daily-card__ended" data-ended>{t.ended}</p>
      ) : (
        <button type="button" className="daily-btn daily-btn--primary daily-card__play" data-action={status.kind === 'inProgress' ? 'continue' : 'play'} onClick={onPlay}>
          {status.kind === 'inProgress' ? t.continue : t.play}
        </button>
      )}

      {ended ? null : (
        <Countdown
          clock={clock}
          target={dayEnd}
          kind={solved ? 'next' : 'ends'}
          label={solved ? t.nextIn : t.endsIn}
          until={(solved ? t.nextAt : t.endsAt)(utcWithLocal(dayEnd))}
        />
      )}
    </section>
  )
}

function BeforeLaunch({ first, clock }: { first: string; clock: () => number }) {
  const t = DAILY_EN.before
  const target = startOfUtcDay(first)
  return (
    <section className="daily-card" data-state="before-launch" aria-labelledby="daily-before">
      <h2 id="daily-before" className="daily-card__number">{t.title(formatDayMonth(first))}</h2>
      <p className="daily-card__date">{t.text}</p>
      <Countdown clock={clock} target={target} kind="starts" label={t.startsIn} until={t.startsAt(utcWithLocal(target, { withDate: true }))} />
    </section>
  )
}

/** The start screen (`/`): the puzzle of today with how to play it, until when it runs, and the result once solved. */
export function StartScreen({ state, clock, onPlay, rollover, share, stats }: StartScreenProps) {
  const t = DAILY_EN
  const [helpOpen, setHelpOpen] = useState(false)
  return (
    <main className="daily">
      <header className="daily__header">
        <h1 className="daily__title">{t.title}</h1>
        <p className="daily__subtitle">{t.subtitle}</p>
        <button type="button" className="daily-btn daily-btn--quiet daily__help" onClick={() => setHelpOpen(true)}>
          {help.link}
        </button>
      </header>

      {rollover ? (
        <div className="daily-banner" role="status" data-banner="new-puzzle">
          <span className="daily-banner__text">{t.rollover.banner}</span>
          <button type="button" className="daily-btn daily-btn--primary daily-banner__button" onClick={rollover.onShow}>
            {t.rollover.show(rollover.n)}
          </button>
        </div>
      ) : null}

      {state.kind === 'loading' ? <p className="daily__loading" role="status">{t.loading}</p> : null}
      {state.kind === 'error' ? (
        <section className="daily-card" data-state="error" role="alert">
          <h2 className="daily-card__number">{t.error.title}</h2>
          <p>{t.error.text}</p>
          <button type="button" className="daily-btn daily-btn--primary" onClick={state.onRetry}>
            {t.error.retry}
          </button>
        </section>
      ) : null}
      {state.kind === 'before-launch' ? <BeforeLaunch first={state.first} clock={clock} /> : null}
      {state.kind === 'after-schedule' ? (
        <section className="daily-card" data-state="after-schedule" aria-labelledby="daily-after">
          <h2 id="daily-after" className="daily-card__number">{t.after.title}</h2>
          <p className="daily-card__date">{t.after.text}</p>
        </section>
      ) : null}
      {state.kind === 'day' ? <PuzzleCard day={state.day} status={state.status} ended={state.ended} clock={clock} onPlay={onPlay} /> : null}

      <div className="daily__slot" data-slot="share">{state.kind === 'day' && state.status.kind === 'solved' ? share : null}</div>
      <div className="daily__slot" data-slot="stats">{stats}</div>

      <footer className="daily__footer">
        <Link href="/about" className="daily__about">
          {t.about}
        </Link>
      </footer>
      {helpOpen ? <HelpPanel onClose={() => setHelpOpen(false)} /> : null}
    </main>
  )
}
