import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import iconMark from '../../brand/icon.svg'
import { HELP_CONTENT } from '../../content/help/help.ts'
import type { DayStatus } from '../../game/index.ts'
import { useLocale } from '../../locale/index.ts'
import { formatDayMonth, startOfUtcDay, utcWithLocal } from '../../schedule/index.ts'
import type { ScheduleDay } from '../../schedule/index.ts'
import { HelpPanel, formatTime, withCastNames } from '../play/index.ts'
import { Modal } from '../play/Modal.tsx'
import { Link } from '../router/index.ts'
import { Countdown } from './Countdown.tsx'
import { LocaleToggle } from './LocaleToggle.tsx'
import gameplayEnStill from './intro/gameplay-en-still.webp'
import gameplayEn from './intro/gameplay-en.webp'
import gameplayNlStill from './intro/gameplay-nl-still.webp'
import gameplayNl from './intro/gameplay-nl.webp'
import { useDailyStrings } from './strings.ts'

/**
 * Everybody sees the same clock: Amsterdam time, not each visitor's own device timezone (owner decision, 2026-09-27). "Ends at 00:00 UTC
 * (02:00 Amsterdam time)" reads the same for every player, wherever they are.
 */
const LOCAL_CLOCK = { timeZone: 'Europe/Amsterdam', label: 'Amsterdam time' } as const

/**
 * The gameplay example next to the intro (SLAY-9.18): a short loop recorded from the real play screen by
 * `docs/verification/intro.ts`, on day #1, which is over, so it spoils nothing anyone can still play. Under
 * prefers-reduced-motion a single still frame shows instead of the loop.
 */
const GAMEPLAY = { en: { loop: gameplayEn, still: gameplayEnStill }, nl: { loop: gameplayNl, still: gameplayNlStill } } as const

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

/**
 * Today's puzzle, inside the open hero (SLAY-9.18): no box around it. The action comes first, right under the tagline
 * (Play/Continue, or the result with View board and Share once solved); difficulty and size, the byline and the countdown
 * follow as small lines under it, the way Wordle keeps its date and number to a quiet byline.
 */
function PuzzleCard({ day, status, ended, clock, onPlay, onShare }: { day: ScheduleDay; status: DayStatus; ended: boolean; clock: () => number; onPlay: () => void; onShare: (() => void) | null }) {
  const t = useDailyStrings()
  const solved = status.kind === 'solved' ? status.result : null
  const name = useMemo(() => {
    if (!solved) return ''
    return withCastNames(day.puzzle).people.find((p) => p.id === solved.murdererId)?.label ?? solved.murdererId
  }, [day.puzzle, solved])
  // The day ends at the next 00:00 UTC after its own date starts (not after "now"): a day that ended while the page was open shows no countdown.
  const dayEnd = startOfUtcDay(day.date) + 86_400_000
  return (
    <section className="daily-card" data-status={status.kind} data-day={day.date} aria-labelledby="daily-number">
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
      ) : null}

      {ended && !solved ? (
        <p className="daily-card__ended" data-ended>
          {t.ended}
        </p>
      ) : (
        <div className="daily-card__actions">
          {solved ? (
            // SLAY-9.16: a fresh app/tab landing on '/' after the day is already solved had no way back to the board (the PWA
            // reopen dead end) -- the same onPlay wiring as Play/Continue, which resolves to the current day's /play route.
            <button type="button" className="daily-btn daily-btn--primary daily-card__play" data-action="view-board" onClick={onPlay}>
              {t.solved.viewBoard}
            </button>
          ) : (
            <button type="button" className="daily-btn daily-btn--primary daily-card__play" data-action={status.kind === 'inProgress' ? 'continue' : 'play'} onClick={onPlay}>
              {status.kind === 'inProgress' ? t.continue : t.play}
            </button>
          )}
          {/* The Share popover's opener (SLAY-9.13): a second pill in the same row once the day is solved, the slot empty before that. */}
          <div className="daily__slot daily__slot--inline" data-slot="share">
            {solved && onShare ? (
              <button type="button" className="daily-btn daily-btn--outline" data-action="share" onClick={onShare}>
                {t.slots.share}
              </button>
            ) : null}
          </div>
        </div>
      )}

      <div className="daily-card__details">
        {/* Wordle-style byline (SLAY-9.9): the puzzle's date-based label (SLAY-10.2) and the site name. The label already carries
            the date (SLAY-9.15): no second, always-English long-date segment alongside it. */}
        <p className="daily-card__byline">
          <span id="daily-number" className="daily-card__byline-label" data-puzzle-number={day.n}>
            {t.puzzleLabel(day.date)}
          </span>
          <span className="daily-card__byline-sep" aria-hidden="true">·</span>
          <span className="daily-card__byline-site">{t.title}</span>
        </p>
        <p className="daily-card__meta">
          <span className="daily-card__tier" data-tier={day.tier}>
            <span className="daily-card__tier-label">{t.difficulty}:</span> {t.tier[day.tier]}
          </span>
          <span className="daily-card__meta-sep" aria-hidden="true">·</span>
          <span className="daily-card__size" data-size={day.size}>
            {t.size(day.size)}
          </span>
        </p>
        {ended ? null : (
          <Countdown
            clock={clock}
            target={dayEnd}
            kind={solved ? 'next' : 'ends'}
            label={solved ? t.nextIn : t.endsIn}
            until={solved ? t.nextAt(utcWithLocal(dayEnd, LOCAL_CLOCK)) : undefined}
          />
        )}
      </div>
    </section>
  )
}

function BeforeLaunch({ first, clock }: { first: string; clock: () => number }) {
  const t = useDailyStrings().before
  const target = startOfUtcDay(first)
  return (
    <section className="daily-card" data-state="before-launch" aria-labelledby="daily-before">
      <h2 id="daily-before" className="daily-card__number">{t.title(formatDayMonth(first))}</h2>
      <p className="daily-card__date">{t.text}</p>
      <Countdown clock={clock} target={target} kind="starts" label={t.startsIn} until={t.startsAt(utcWithLocal(target, { ...LOCAL_CLOCK, withDate: true }))} />
    </section>
  )
}

/** What the game is, for somebody who has never played, next to a short recording of real play (SLAY-9.18). */
function Intro() {
  const t = useDailyStrings().intro
  const { locale } = useLocale()
  const media = GAMEPLAY[locale]
  return (
    <section className="daily-intro" aria-labelledby="daily-intro-title">
      <h2 id="daily-intro-title" className="daily-intro__title">
        {t.title}
      </h2>
      <p className="daily-intro__text">{t.text}</p>
      <figure className="daily-intro__figure">
        <picture>
          <source srcSet={media.still} media="(prefers-reduced-motion: reduce)" />
          {/* Lazy: below the hero, it never holds up the Play button. */}
          <img className="daily-intro__media" src={media.loop} width="600" height="351" alt={t.alt} loading="lazy" decoding="async" />
        </picture>
        <figcaption className="daily-intro__caption">{t.caption}</figcaption>
      </figure>
    </section>
  )
}

/** The start screen (`/`): the puzzle of today with how to play it, until when it runs, and the result once solved. */
export function StartScreen({ state, clock, onPlay, rollover, share, stats }: StartScreenProps) {
  const t = useDailyStrings()
  const { locale } = useLocale()
  const help = HELP_CONTENT[locale]
  const [helpOpen, setHelpOpen] = useState(false)
  // The solved day's share card as a reopenable popover (SLAY-9.13, AC #4), not shown inline any
  // more: a compact button opens the same Modal-wrapped share panel PlayScreen's own persistent
  // Share button reopens (see PlayScreen.tsx), so a player who left the play screen without
  // sharing still finds it here.
  const [shareOpen, setShareOpen] = useState(false)
  return (
    <main className="daily">
      {/* The language switch and the Help link sit in a quiet top bar (SLAY-9.18), out of the hero's own
          flow: a Wordle-style landing has nothing between its tagline and its buttons. */}
      <div className="daily__bar">
        <button type="button" className="daily-btn daily-btn--quiet daily__help" onClick={() => setHelpOpen(true)}>
          <span className="daily__help-icon" aria-hidden="true">
            ?
          </span>
          {help.link}
        </button>
        <LocaleToggle />
      </div>

      {rollover ? (
        <div className="daily-banner" role="status" data-banner="new-puzzle">
          <span className="daily-banner__text">{t.rollover.banner}</span>
          <button type="button" className="daily-btn daily-btn--primary daily-banner__button" onClick={rollover.onShow}>
            {t.rollover.show(rollover.n)}
          </button>
        </div>
      ) : null}

      {/* One open hero on the plain background (SLAY-9.18, after SLAY-9.9's first pass): the icon mark, the wordmark, a
          prominent tagline and, straight under it, the one next step -- no card or box around any of it. There is no Login
          or subscription button (Slaydoku has no accounts or leaderboard at launch, CLAUDE.md). */}
      <div className="daily__hero">
        <img className="daily__mark" src={iconMark} width="64" height="64" alt="" />
        <h1 className="daily__title">{t.title}</h1>
        <p className="daily__subtitle">{t.subtitle}</p>

        {state.kind === 'loading' ? (
          <p className="daily__loading" role="status">
            {t.loading}
          </p>
        ) : null}
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
        {state.kind === 'day' ? (
          <PuzzleCard day={state.day} status={state.status} ended={state.ended} clock={clock} onPlay={onPlay} onShare={share ? () => setShareOpen(true) : null} />
        ) : null}
      </div>

      {/* Below a clear break, quieter than the hero: the streak line (SLAY-1.6), what the game is, the About link. */}
      <div className="daily__more">
        <div className="daily__slot" data-slot="stats">
          {stats}
        </div>
        <Intro />
        <footer className="daily__footer">
          <Link href="/about" className="daily__about">
            {t.about}
          </Link>
          <span className="daily__footer-sep" aria-hidden="true">·</span>
          {/* Quiet GitHub Sponsors link (SLAY-9.22), same weight as the About link: not a primary
              call-to-action, next to it rather than in the hero. Leaves the app, so it opens in a
              new tab with rel=noopener. */}
          <a href="https://github.com/sponsors/dipsaus9" className="daily__about" target="_blank" rel="noopener noreferrer">
            {t.support}
          </a>
        </footer>
      </div>

      {helpOpen ? <HelpPanel onClose={() => setHelpOpen(false)} /> : null}
      {shareOpen ? (
        <Modal title={t.slots.share} onClose={() => setShareOpen(false)}>
          {share}
        </Modal>
      ) : null}
    </main>
  )
}
