import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { dailyId, dayStatus, observeSolve, progressStorage, readResult, recordResult, resultOf, pageClock } from '../../game/index.ts'
import type { SolveRecord, StorageLike } from '../../game/index.ts'
import { SCHEDULE_INDEX, loadMonthFile } from '../../game/daily/source.ts'
import { themeIconsFor } from '../../content/themes/icons.ts'
import { phaseOf, puzzleNumberOf } from '../../schedule/index.ts'
import type { MonthFile, ScheduleDay, ScheduleIndex } from '../../schedule/index.ts'
import { PlayScreen } from '../play/index.ts'
import { navigate, usePath } from '../router/index.ts'
import { parseRoute, routePath } from './route.ts'
import { StartScreen } from './StartScreen.tsx'
import type { StartState } from './StartScreen.tsx'
import { DAILY_EN } from './strings.ts'
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
  /** Share button of a solved day (SLAY-1.7). */
  share?: ReactNode
  /** Statistics of the player (SLAY-1.6). */
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
  const playable = route.kind === 'play' && day !== null && (route.n === null || route.n === day.n) && status !== null && status.kind !== 'solved'
  const refused = route.kind === 'play' && lookup.kind !== 'loading' && lookup.kind !== 'error' && !playable
  const solvedNow = route.kind === 'play' && status?.kind === 'solved'
  useEffect(() => {
    if (unknown || refused || solvedNow) go('/', true)
  }, [unknown, refused, solvedNow])

  const solve = useCallback(
    (played: ScheduleDay, solved: SolveRecord) => {
      recordResult(storage, resultOf(storage, played, solved))
      setVersion((v) => v + 1)
      go('/', true)
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
  return <StartScreen state={state} clock={clock} rollover={rollover} share={share} stats={stats} onPlay={() => go(routePath({ kind: 'play', n: null }))} />
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
  const id = dailyId(day.n)
  // The theme's own art per object (a shop counter, a beanbag ...): the board and the Legend both draw it.
  const themeIcons = useMemo(() => themeIconsFor(day.theme, day.puzzle.scene.objects), [day])
  // The notice sits over the bottom of the screen: the player can send it away and keep playing; the start screen offers the new puzzle anyway.
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const watched = useMemo(() => observeSolve(storage, id, day.puzzle, (record) => onSolved(day, record)), [storage, id, day, onSolved])
  return (
    <div className="daily-play">
      <PlayScreen puzzle={day.puzzle} levelId={id} title="" themeIcons={themeIcons} portraits={day.portraits} storage={watched} firstVisitHelp />
      <nav className="daily-play__nav">
        <button type="button" className="daily-play__back" aria-label={DAILY_EN.backLabel} onClick={onBack}>
          <span aria-hidden="true">{'‹'}</span> {DAILY_EN.back}
        </button>
        <span className="daily-play__title" data-play-title>{DAILY_EN.puzzleNumber(day.n)}</span>
      </nav>
      {banner && !noticeDismissed ? (
        <div className="daily-banner daily-banner--play" role="status" data-banner="new-puzzle">
          <span className="daily-banner__text">{DAILY_EN.rollover.banner}</span>
          <button type="button" className="daily-btn daily-btn--primary daily-banner__button" onClick={banner.onShow}>
            {DAILY_EN.rollover.show(banner.n)}
          </button>
          <button type="button" className="daily-btn daily-banner__dismiss" aria-label={DAILY_EN.rollover.dismiss} onClick={() => setNoticeDismissed(true)}>
            <span aria-hidden="true">{'\u00d7'}</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
