import { useMemo } from 'react'
import { formatTime, useGhostClickGuard, withCastNames } from '../play/index.ts'
import type { SolvedRecord } from './progress.ts'
import type { Level } from './registry.ts'
import { LEVELS_NL } from './strings.ts'

export interface SolvedScreenProps {
  level: Level
  result: SolvedRecord
  /** The next level, when there is one and it is open. */
  next: Level | null
  onNext: () => void
  onList: () => void
  onViewBoard: () => void
}

/** Shown right after a solve (and on reload of that URL): who was alone with het cadeau, and the time. */
export function SolvedScreen({ level, result, next, onNext, onList, onViewBoard }: SolvedScreenProps) {
  const t = LEVELS_NL.solved
  // The last long press of a level opens this screen under the finger: its end must not click "next level".
  const ignoreGhostClick = useGhostClickGuard()
  // The play screen names letter-labelled suspects (A, B...) after the cast; say the same name here.
  const name = useMemo(() => {
    const puzzle = withCastNames(level.puzzle)
    return puzzle.people.find((p) => p.id === result.murdererId)?.label ?? result.murdererId
  }, [level.puzzle, result.murdererId])

  return (
    <main className="levels levels--solved">
      <section className="solved" aria-labelledby="solved-title" onClickCapture={ignoreGhostClick}>
        <p className="solved__level">{level.title}</p>
        <h1 id="solved-title" className="solved__title">{t.title}</h1>
        <p className="solved__alone" data-result="solved">{t.alone(name)}</p>
        <p className="solved__time">{t.time(formatTime(result.elapsedMs))}</p>
        <div className="solved__actions">
          {next ? (
            <button type="button" className="levels-btn levels-btn--primary" onClick={onNext}>
              {t.next(next.title)}
            </button>
          ) : (
            <p className="solved__done">{t.allDone}</p>
          )}
          <button type="button" className={next ? 'levels-btn' : 'levels-btn levels-btn--primary'} onClick={onList}>
            {t.toList}
          </button>
          <button type="button" className="levels-btn levels-btn--quiet" onClick={onViewBoard}>
            {t.viewBoard}
          </button>
        </div>
      </section>
    </main>
  )
}
