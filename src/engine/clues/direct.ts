import { expandClue } from './types.ts'
import type { CatalogClue } from './types.ts'

/**
 * Direct clues: the card alone says where its holder stands, in words a player can find on the
 * board at once. It names a room, an object, a wall feature, a corner, or one row or column; it
 * needs no other person and no comparison.
 *
 * Everything else is indirect: it leans on another person (with, alone with, the gender kinds, same or
 * different room, not with, direction, exact distance, diagonal, quadrant), rules a place out instead of naming
 * one (not beside an object, an empty room), or asks the player to compare or count (direction of an object,
 * directly next to an object). The victim's fixed card is on every puzzle and counts for neither side. A combined
 * card (`both`) is direct when both of its parts are; a room-edge card (`inRoomEdge`) is direct when it names the
 * room, not when it leaves the room to the holder.
 *
 * The ONE definition: `src/validation` (the clue audit and its minimum share) and `src/engine/difficulty` (the
 * measured share) both use it.
 */
export const DIRECT_CLUE_KINDS: ReadonlySet<string> = new Set([
  'onObject', 'squareWithObject', 'besideObject', 'onlyOnObject', 'inRoom', 'inRoomOr', 'inCorner',
  'besideFeature', 'inFrontOfDoor', 'alone', 'inRow', 'inColumn', 'onLine',
])

/** Whether a card is direct: its kind is, or (combined card) both of its parts are. */
export function isDirectClue(clue: { type: string; personId: string; args?: unknown }): boolean {
  return expandClue(clue as CatalogClue).every((part) => {
    if (part.type === 'inRoomEdge') return (part.args as { roomId?: string }).roomId !== undefined
    return DIRECT_CLUE_KINDS.has(part.type)
  })
}
