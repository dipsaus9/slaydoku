import { sameCell } from '../../engine/model/index.ts'
import type { Cell } from '../../engine/model/index.ts'
import type { Board, GameAction } from '../../game/types.ts'

/** What the finger does on the board: the toolbar's four modes (SLAY-8.2: place is back — a tap
 * that places was reachable as the long press every mode has, but that made placing undiscoverable
 * on its own; a dedicated tool makes it a real, visible mode again). */
export type Tool = 'note' | 'place' | 'x' | 'erase'

export type Gesture = 'tap' | 'longPress'

/** What a gesture on a cell turns into: a game action, a hint for the player, or nothing. */
export type Intent = { action: GameAction } | { message: 'pickSuspect' } | null

/**
 * The official app: a tap on a cell writes a small-letter note, a long press places the suspect.
 * The toolbar can swap those two (place mode), turn taps into X marks, or into the eraser. Long
 * press always places, except in place mode (where it writes a note instead, so both stay
 * reachable) and with the eraser (nothing).
 */
export function gestureIntent(
  tool: Tool,
  gesture: Gesture,
  selectedId: string | null,
  cell: Cell,
  board: Board,
): Intent {
  if (tool === 'erase') return gesture === 'tap' ? { action: { type: 'eraseCell', cell } } : null
  if (!selectedId) return { message: 'pickSuspect' }

  const writesNote = tool === 'note' ? gesture === 'tap' : tool === 'place' && gesture === 'longPress'
  if (writesNote) return { action: { type: 'toggleNote', personId: selectedId, cell } }
  if (tool === 'x' && gesture === 'tap') return { action: { type: 'toggleMark', personId: selectedId, cell } }

  // Placing (every remaining case: a long press in every mode but place, or a tap in place mode):
  // pressing the suspect's own square again takes them off the board.
  const own = board.placements[selectedId]
  if (own && sameCell(own, cell)) return { action: { type: 'remove', personId: selectedId } }
  return { action: { type: 'place', personId: selectedId, cell } }
}
