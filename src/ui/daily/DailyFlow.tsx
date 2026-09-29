import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { dailyId, dayStatus, observeSolve, progressStorage, readResult, recordPuzzleSolve, recordPuzzleStart, recordResult, resultOf, pageClock } from '../../game/index.ts'
import type { SolveRecord, StorageLike } from '../../game/index.ts'
import { SCHEDULE_INDEX, loadMonthFile } from '../../game/daily/source.ts'
import { themeIconsFor } from '../../content/themes/icons.ts'
import { phaseOf, puzzleNumberOf } from '../../schedule/index.ts'
import type { MonthFile, ScheduleDay, ScheduleIndex } from '../../schedule/index.ts'
import { PlayScreen } from '../play/index.ts'
import { navigate, usePath } from '../router/index.ts'
import { SharePanel } from '../share/index.ts'
import { StatsEntry } from '../stats/index.ts'
import { shareMetaOf } from '../../share/index.ts'
import { parseRoute, routePath } from './route.ts'
import { StartScreen } from './StartScreen.tsx'
import type { StartState } from './StartScreen.tsx'
import { useDailyStrings } from './strings.ts'
import { useDayLookup } from './useDayLookup.ts'
import { useToday } from './useToday.ts'
import './daily.css'

export interface DailyFlowProps {
  /** The clock in ms since the epoch. Default: the device clock, or the dev-only date override (`src/game/daily/clock.ts`). */
  clock?: () => number
  /** Where saves and results live. Default localStorage, or memory when there is none. */
  storage?: StorageLike
  /** The schedule index. Default: the committed `index.json`. */
  index?: ScheduleIndex
  /** Loads one month file (`YYYY-MM`). Default: the lazily loaded chunk of that month. */
  loadMonth?: (month: string) => Promise<MonthFile>
  /** Replaces the share card of a solved day (default: `SharePanel`, the card preview with Share, or Copy text and Download image). */
  share?: ReactNode
  /** Replaces the statistics entry of the start screen (default: `StatsEntry`, the streak line and the Stats button). */
  stats?: ReactNode
}

const go = (path: string, replace = false): void => navigate(path, { replace })

/**
 * The whole daily flow: start screen (`/`) -> puzzle (`/play`) -> back to the start screen, which then shows the result. The URL path
 * is the router, so reload and back keep working; a path the app does not know, and the old `/level/...` paths, go to `/`.
 *
 * Which day is on screen: the UTC date of the clock, "pinned" when the screen was opened. When the clock passes 00:00 UTC while the
 * page is open the pinned day is kept (a player in the middle of a puzzle is never switched away), and a "New puzzle available" notice
 * offers today's puzzle; the saved board and the result of the earlier day stay where they are (both are keyed by puzzle number).
 */
export function DailyFlow({ clock: givenClock, storage: givenStorage, index = SCHEDULE_INDEX, loadMonth = loadMonthFile, share, stats }: DailyFlowProps) {
  const clock = useMemo(() => givenClock ?? pageClock(), [givenClock])
  const storage = useMemo(() => givenStorage ?? progressStorage(), [givenStorage])
  const path = usePath()
  const route = useMemo(() => parseRoute(path), [path])
  const today = useToday(clock)
  const [pinned, setPinned] = useState(today)
  // Bumped on a solve so the status is read again; a change of path re-reads too.
  const [version, setVersion] = useState(0)

  // Opening the puzzle takes today's puzzle (never a day that ended while the start screen sat open).
  const [seenKind, setSeenKind] = useState(route.kind)
  if (seenKind !== route.kind) {
    setSeenKind(route.kind)
    if (route.kind === 'play' && pinned !== today) setPinned(today)
  }

  const todayPhase = phaseOf(today, index)
  const following = phaseOf(pinned, index) !== 'scheduled' || (route.kind !== 'play' && todayPhase !== 'scheduled')
  const shown = following ? today : pinned
  useEffect(() => {
    if (following && pinned !== today) setPinned(today)
  }, [following, pinned, today])
  const rolled = shown !== today

  const { state: lookup, retry } = useDayLookup(shown, index, loadMonth)
  const day = lookup.kind === 'day' ? lookup.day : null
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const status = useMemo(() => (day ? dayStatus(storage, day) : null), [storage, day, version, path])

  // A solved board whose result was never written (the write failed) is recorded now.
  useEffect(() => {
    if (day && status?.kind === 'solved' && readResult(storage, day.n, day.fp) === null) recordResult(storage, status.result)
  }, [storage, day, status])

  const unknown = route.kind === 'unknown'
  // SLAY-9.13 (AC #5, deliberate): a solved day stays playable. This covers two cases the same
  // way, on purpose: solving *just now* (status flips to 'solved' via the version bump below,
  // mid-session, PlayRoute never unmounts) and reopening an *already-solved* day from elsewhere
  // (a reload, the back button, or the bare `/play` URL after leaving) -- both land back on
  // PlayScreen, which reads the solved board straight from storage and reopens its own
  // ResultOverlay (state.check survives a reload; PlayScreen's own `dismissed` state starts
  // unset each mount). The alternative -- redirecting an already-solved day to the start screen,
  // as this used to do for every solved day -- would also have to special-case "solved this
  // session" to keep the finish popover reachable at all (AC #1), for no real benefit: replaying
  // a solved day was already reachable via the result dialog's own "Play again", so this changes
  // no capability, only whether the board is force-hidden first.
  const playable = route.kind === 'play' && day !== null && (route.n === null || route.n === day.n) && status !== null
  const refused = route.kind === 'play' && lookup.kind !== 'loading' && lookup.kind !== 'error' && !playable
  useEffect(() => {
    if (unknown || refused) go('/', true)
  }, [unknown, refused])

  const solve = useCallback(
    (played: ScheduleDay, solved: SolveRecord) => {
      recordResult(storage, resultOf(storage, played, solved))
      recordPuzzleSolve(storage, played.date, solved.elapsedMs)
      // No navigation here (SLAY-9.13): the player stays on the play screen, where PlayScreen's
      // own ResultOverlay (wired below through resultShare) is the finish popover. The version
      // bump still keeps `status`/stats in sync for whenever the player does leave (the back
      // button in PlayRoute's nav).
      setVersion((v) => v + 1)
    },
    [storage],
  )

  const showToday = () => {
    setPinned(today)
    if (route.kind === 'play') go('/')
  }
  const newPuzzleAvailable = rolled && todayPhase === 'scheduled'
  const rollover = newPuzzleAvailable ? { n: puzzleNumberOf(today, index.launch), onShow: showToday } : null

  if (playable && day) {
    return <PlayRoute key={day.n} day={day} storage={storage} onSolved={solve} onBack={() => go('/')} banner={rollover} />
  }

  let state: StartState
  if (lookup.kind === 'day' && status) state = { kind: 'day', day: lookup.day, status, ended: rolled }
  else if (lookup.kind === 'before-launch') state = { kind: 'before-launch', first: lookup.first }
  else if (lookup.kind === 'after-schedule') state = { kind: 'after-schedule' }
  else if (lookup.kind === 'loading') state = { kind: 'loading' }
  else state = { kind: 'error', onRetry: retry }
  const shareCard = share ?? (day && status?.kind === 'solved' ? <SharePanel result={status.result} meta={shareMetaOf(day)} /> : null)
  const statsEntry = stats ?? <StatsEntry storage={storage} today={today} version={version} onReset={() => setVersion((v) => v + 1)} />
  return <StartScreen state={state} clock={clock} rollover={rollover} share={shareCard} stats={statsEntry} onPlay={() => go(routePath({ kind: 'play', n: null }))} />
}

interface PlayRouteProps {
  day: ScheduleDay
  storage: StorageLike
  onSolved: (day: ScheduleDay, record: SolveRecord) => void
  onBack: () => void
  /** The "New puzzle available" notice, when the clock passed midnight while this puzzle was open. */
  banner: { n: number; onShow: () => void } | null
}

/**
 * One day's puzzle plus a back button. PlayScreen has no "solved" callback, so it is given a storage that reports a solved save
 * (`observeSolve`); the play screen itself stays untouched. The help card opens by itself on the first visit of this browser.
 */
function PlayRoute({ day, storage, onSolved, onBack, banner }: PlayRouteProps) {
  const t = useDailyStrings()
  const id = dailyId(day.n)
  // The theme's own art per object (a shop counter, a beanbag ...): the board and the Legend both draw it.
  const themeIcons = useMemo(() => themeIconsFor(day.theme, day.puzzle.scene.objects), [day])
  // The notice sits over the bottom of the screen: the player can send it away and keep playing; the start screen offers the new puzzle anyway.
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const watched = useMemo(() => observeSolve(storage, id, day.puzzle, (record) => onSolved(day, record)), [storage, id, day, onSolved])
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => recordPuzzleStart(storage, day.date), [day.date])
  return (
    <div className="daily-play">
      <PlayScreen puzzle={day.puzzle} levelId={id} title="" themeIcons={themeIcons} portraits={day.portraits} storage={watched} firstVisitHelp resultShare={(solve) => <SharePanel result={resultOf(storage, day, solve)} meta={shareMetaOf(day)} />} />
      <nav className="daily-play__nav">
        <button type="button" className="daily-play__back" aria-label={t.backLabel} onClick={onBack}>
          <span aria-hidden="true">{'‹'}</span> {t.back}
        </button>
        <span className="daily-play__title" data-play-title>{t.puzzleLabel(day.date)}</span>
      </nav>
      {banner && !noticeDismissed ? (
        <div className="daily-banner daily-banner--play" role="status" data-banner="new-puzzle">
          <span className="daily-banner__text">{t.rollover.banner}</span>
          <button type="button" className="daily-btn daily-btn--primary daily-banner__button" onClick={banner.onShow}>
            {t.rollover.show(banner.n)}
          </button>
          <button type="button" className="daily-btn daily-banner__dismiss" aria-label={t.rollover.dismiss} onClick={() => setNoticeDismissed(true)}>
            <span aria-hidden="true">{'\u00d7'}</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
