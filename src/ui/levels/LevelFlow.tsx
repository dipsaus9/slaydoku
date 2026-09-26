import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlayScreen } from '../play/index.ts'
import { navigate, usePath } from '../router/index.ts'
import { LevelList } from './LevelList.tsx'
import { levelEntries, observeSolve, progressStorage, readProgress, recordSolve, saveProgress } from './progress.ts'
import type { Progress, SolvedRecord } from './progress.ts'
import { getLevels } from './registry.ts'
import type { Level } from './registry.ts'
import { isListPath, parseRoute, resolveRoute, routePath } from './route.ts'
import type { Refusal, Route } from './route.ts'
import { SolvedScreen } from './SolvedScreen.tsx'
import { LEVELS_NL } from './strings.ts'
import { defaultStorage } from '../../game/index.ts'
import type { StorageLike } from '../../game/index.ts'
import './levels.css'

export interface LevelFlowProps {
  /** Levels in play order. Default: the registry (`registerLevels`). */
  levels?: readonly Level[]
  /** Where progress and saved boards live. Default localStorage, or memory when there is none. */
  storage?: StorageLike
  /** Clock override, for tests. */
  now?: () => number
  /** Rendered under the level cards, with the progress of the levels (the extra cases section). */
  listFooter?: (progress: Progress) => ReactNode
}

const go = (route: Route, replace = false): void => navigate(routePath(route), { replace })

/**
 * The whole level flow: list -> puzzle -> solved screen -> list. The URL path is the router
 * (`/`, `/level/<id>`, `/level/<id>/solved`), so reload and back keep working. A path that
 * points at a locked level is refused and shows the list with a message; a path the app does not
 * know shows the list and is replaced by `/`.
 */
export function LevelFlow({ levels: given, storage: givenStorage, now, listFooter }: LevelFlowProps) {
  const levels = given ?? getLevels()
  const storage = useMemo(() => givenStorage ?? progressStorage(), [givenStorage])
  const path = usePath()
  // Bumped on a solve so the list model is read again; visiting the list re-reads too.
  const [version, setVersion] = useState(0)
  const [notice, setNotice] = useState<Refusal | null>(null)

  const requested = useMemo(() => parseRoute(path), [path])
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const progress = useMemo(() => readProgress(levels, storage), [levels, storage, version, requested])
  const { route, refused } = useMemo(() => resolveRoute(requested, levels, progress), [requested, levels, progress])

  useEffect(() => {
    if (!refused) return
    setNotice(refused)
    go({ kind: 'list' }, true)
  }, [refused])

  const unknown = requested.kind === 'list' && !isListPath(path)
  useEffect(() => {
    if (unknown) go({ kind: 'list' }, true)
  }, [unknown])

  // Stable, so the storage handed to the play screen (and with it the game store) is not rebuilt.
  const solve = useCallback(
    (level: Level, record: SolvedRecord) => {
      saveProgress(storage, recordSolve(readProgress(levels, storage), level.id, record), levels)
      setVersion((v) => v + 1)
      go({ kind: 'solved', levelId: level.id })
    },
    [levels, storage],
  )

  const level = route.kind === 'list' ? null : levels.find((l) => l.id === route.levelId) ?? null
  if (route.kind === 'play' && level) {
    // Level 1 opens the how-it-works card on its first visit, if there is real storage to remember it in.
    const firstVisitHelp = levels[0] === level && (givenStorage ?? defaultStorage()) !== null
    return <PlayRoute key={level.id} level={level} storage={storage} now={now} firstVisitHelp={firstVisitHelp} onSolved={solve} onBack={() => go({ kind: 'list' })} />
  }
  if (route.kind === 'solved' && level) {
    const index = levels.indexOf(level)
    const next = levels[index + 1]
    const nextOpen = next !== undefined && levelEntries(levels, progress)[index + 1]?.status !== 'locked'
    return (
      <SolvedScreen
        level={level}
        result={progress.solved[level.id]!}
        next={nextOpen ? next : null}
        onNext={() => next && go({ kind: 'play', levelId: next.id })}
        onList={() => go({ kind: 'list' })}
        onViewBoard={() => go({ kind: 'play', levelId: level.id })}
      />
    )
  }
  return (
    <LevelList
      entries={levelEntries(levels, progress)}
      footer={listFooter?.(progress)}
      notice={notice ? LEVELS_NL.refused[notice] : null}
      onDismissNotice={() => setNotice(null)}
      onOpen={() => setNotice(null)}
    />
  )
}

interface PlayRouteProps {
  level: Level
  storage: StorageLike
  now?: () => number
  firstVisitHelp: boolean
  onSolved: (level: Level, record: SolvedRecord) => void
  onBack: () => void
}

/**
 * One puzzle plus a back button. PlayScreen has no "solved" callback, so it is given a storage
 * that reports a solved save (see `observeSolve`); the play screen itself stays untouched.
 */
function PlayRoute({ level, storage, now, firstVisitHelp, onSolved, onBack }: PlayRouteProps) {
  const watched = useMemo(() => observeSolve(storage, level, (record) => onSolved(level, record)), [storage, level, onSolved])

  return (
    <div className="level-play">
      <PlayScreen puzzle={level.puzzle} levelId={level.id} title="" roomStyles={level.roomStyles} storage={watched} now={now} firstVisitHelp={firstVisitHelp} />
      <nav className="level-play__nav">
        <button type="button" className="level-play__back" aria-label={LEVELS_NL.backLabel} onClick={onBack}>
          <span aria-hidden="true">{'‹'}</span> {LEVELS_NL.back}
        </button>
        <span className="level-play__title">{level.title}</span>
      </nav>
    </div>
  )
}
