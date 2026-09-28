import type { Board } from '../../game/index.ts'

/**
 * Who Undo or Redo should re-select: the person whose placement the dispatch removed (undo) or
 * restored (redo), found by diffing `placements` on the two board snapshots taken immediately
 * before and after the dispatch (SLAY-4.1). `null` when the undone/redone edit was not a
 * placement (a note or an X mark), so the selection is left alone.
 */
export function selectionAfterUndoRedo(kind: 'undo' | 'redo', before: Board, after: Board): string | null {
  return kind === 'undo'
    ? (Object.keys(before.placements).find((id) => !(id in after.placements)) ?? null)
    : (Object.keys(after.placements).find((id) => !(id in before.placements)) ?? null)
}
