import { sameCell } from '../../engine/model/index.ts'
import type { Cell } from '../../engine/model/index.ts'
import { hasMark, hasNote, isPlaced } from '../../game/board.ts'
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

/** Whether the drag adds or removes, decided by the first cell of the stroke. */
export type PaintMode = 'add' | 'remove'

/** What a drag paints in each tool. Place mode paints notes; the eraser wipes cells. */
export function paintKind(tool: Tool): 'note' | 'x' | 'erase' {
  return tool === 'x' ? 'x' : tool === 'erase' ? 'erase' : 'note'
}

/** Add or remove for a stroke starting on `cell`: removes only when that cell already has the mark. */
export function paintModeFor(tool: Tool, selectedId: string | null, cell: Cell, board: Board): PaintMode {
  if (!selectedId) return 'add'
  const kind = paintKind(tool)
  if (kind === 'note') return hasNote(board, selectedId, cell) ? 'remove' : 'add'
  if (kind === 'x') return hasMark(board, selectedId, cell) ? 'remove' : 'add'
  return 'add'
}

/**
 * The action for one cell of a drag, or null when the cell already has the wanted state
 * (a stroke never flips a cell back and forth) or there is nobody selected to paint for.
 */
export function paintIntent(
  tool: Tool,
  mode: PaintMode,
  selectedId: string | null,
  cell: Cell,
  board: Board,
): Intent {
  const kind = paintKind(tool)
  if (kind === 'erase') return { action: { type: 'eraseCell', cell } }
  if (!selectedId) return { message: 'pickSuspect' }
  if (kind === 'note') {
    if (isPlaced(board, selectedId)) return null
    return hasNote(board, selectedId, cell) === (mode === 'add') ? null : { action: { type: 'toggleNote', personId: selectedId, cell } }
  }
  return hasMark(board, selectedId, cell) === (mode === 'add') ? null : { action: { type: 'toggleMark', personId: selectedId, cell } }
}
