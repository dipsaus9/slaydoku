import type { ReactNode } from 'react'
import type { CheckResult } from '../../game/index.ts'
import type { Puzzle } from '../../engine/model/index.ts'
import { Modal } from './Modal.tsx'
import { formatTime } from './people.ts'
import { usePlayStrings } from './strings.ts'

export interface ResultOverlayProps {
  puzzle: Puzzle
  result: CheckResult
  onRestart: () => void
  onDismiss: () => void
  /** Shown in the solved dialog under the time, e.g. the share card of a daily puzzle. Never shown for a wrong board. */
  share?: ReactNode
}

/**
 * Feedback once everybody is placed. Solved: who was alone with the gift, and the time.
 * Wrong: only how many are right, never who (so the player still has to think).
 */
export function ResultOverlay({ puzzle, result, onRestart, onDismiss, share }: ResultOverlayProps) {
  const t = usePlayStrings().result
  if (result.solved) {
    const name = puzzle.people.find((p) => p.id === result.murdererId)?.label ?? result.murdererId
    return (
      <Modal title={t.solvedTitle} onClose={onDismiss} dismissible={false} className="play-result play-result--solved">
        <p className="play-result__text" data-result="solved">{t.solved(name)}</p>
        <p className="play-result__time">{t.time(formatTime(result.elapsedMs))}</p>
        {share}
        <div className="play-modal__actions">
          <button type="button" className="play-btn" onClick={onDismiss}>
            {t.viewBoard}
          </button>
          <button type="button" className="play-btn play-btn--primary" onClick={onRestart}>
            {t.again}
          </button>
        </div>
      </Modal>
    )
  }
  return (
    <Modal title={t.wrongTitle} onClose={onDismiss} className="play-result play-result--wrong">
      <p className="play-result__text" data-result="wrong">{t.wrong(result.correctCount, result.total)}</p>
      <div className="play-modal__actions">
        <button type="button" className="play-btn play-btn--primary" onClick={onDismiss}>
          {t.keepGoing}
        </button>
      </div>
    </Modal>
  )
}
