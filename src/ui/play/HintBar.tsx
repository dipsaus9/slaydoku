import type { Hint } from '../../game/index.ts'
import { usePlayStrings } from './strings.ts'

export interface HintBarProps {
  /** The level shown; the hint is null when the solver has nothing to say. */
  level: 1 | 2 | 3
  hint: Hint | null
  onMore: () => void
  onClose: () => void
  /** Puts the hinted person on the hinted square, through the normal place action. */
  onPlace: (personId: string, cell: { row: number; col: number }) => void
}

/** Progressive hint under the board: which card and who, then which squares, then why and what to do. */
export function HintBar({ level, hint, onMore, onClose, onPlace }: HintBarProps) {
  const t = usePlayStrings().hint
  const placement = hint?.level === 3 ? hint.placement : undefined
  return (
    <div className="play-hint" role="status" data-level={level}>
      <div className="play-hint__body">
        {hint ? (
          <>
            <span className="play-hint__level">{t.level(level)}</span>
            <p className="play-hint__text">{hint.text}</p>
          </>
        ) : (
          <p className="play-hint__text">{t.none}</p>
        )}
      </div>
      <div className="play-hint__actions">
        {hint && level < 3 ? (
          <button type="button" className="play-btn play-btn--primary" onClick={onMore}>
            {t.more}
          </button>
        ) : null}
        {placement ? (
          <button
            type="button"
            className="play-btn play-btn--primary play-hint__place"
            onClick={() => onPlace(placement.personId, placement.cell)}
          >
            {t.place}
          </button>
        ) : null}
        <button type="button" className="play-btn" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </div>
  )
}
