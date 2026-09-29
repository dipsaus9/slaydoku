import type { Cell, Puzzle } from '../../engine/model/index.ts'
import type { BuiltCast } from '../../render/cards/index.ts'
import { HELP_CONTENT } from '../../content/help/help.ts'
import { useLocale } from '../../locale/index.ts'
import { Legend } from '../help/index.ts'
import { Modal } from './Modal.tsx'

export interface LegendPanelProps {
  puzzle: Puzzle
  cast: BuiltCast
  tags: Record<string, string>
  colors: Record<string, string>
  /** A row was tapped: the screen flashes these squares on the board. */
  onShow: (cells: readonly Cell[]) => void
  /** While the squares are shown the card steps aside (hidden, not closed). */
  peek: boolean
  onClose: () => void
}

/**
 * "Legend": the card that says what is drawn on this level's board. A modal like the help card:
 * scrolls inside on a small screen, closes with its button, Escape or a tap on the backdrop. The
 * close button stays in reach at the bottom while the list scrolls.
 */
export function LegendPanel({ puzzle, cast, tags, colors, onShow, peek, onClose }: LegendPanelProps) {
  const { locale } = useLocale()
  const help = HELP_CONTENT[locale]
  return (
    <Modal title={help.legend.title} onClose={onClose} peek={peek} className="play-modal__panel--wide play-modal__panel--help play-modal__panel--legend">
      <Legend puzzle={puzzle} cast={cast} tags={tags} colors={colors} onShow={onShow} />
      <div className="play-modal__actions play-help__actions">
        <button type="button" className="play-btn play-btn--primary" onClick={onClose} autoFocus>
          {help.legend.close}
        </button>
      </div>
    </Modal>
  )
}
