import type { ObjectType, Side } from '../../model/index.ts'

/**
 * Relational clues: facts that compare the card holder with another person
 * (or an object): compass directions, exact distances, diagonals, same or
 * different room. Same data conventions as the structural clues: plain JSON,
 * ids/indexes/enums only, 0-based grid coordinates. The other person may be
 * the victim.
 *
 * Compass words follow the official glossary: north/south/east/west compare
 * the row or column index strictly and apply in any room. People never share
 * a row or column, so an equal index is never "north of" and so on.
 */

/** Optional extra facts a direction/distance/diagonal clue can carry. */
export type Qualifiers = {
  /** The card holder stands in this room. */
  roomId?: string
  /** Nobody else in the holder's room (the victim counts). */
  alone?: boolean
}

export type CompassSide = Side
export type DiagonalDirection = 'northwest' | 'northeast' | 'southwest' | 'southeast'

type Kind<T extends string, A> = { personId: string; type: T; args: A }

/** Strictly north/south/east/west of another person, in any room. */
export type DirectionOfClue = Kind<
  'directionOf',
  Qualifiers & { side: CompassSide; otherId: string }
>
/** Strictly north/south/east/west of (a cell of) an object of this type. */
export type DirectionOfObjectClue = Kind<
  'directionOfObject',
  Qualifiers & { side: CompassSide; objectType: ObjectType }
>
/** Exactly `count` rows (north/south) or columns (east/west) from another person, in line with them. */
export type ExactDistanceClue = Kind<
  'exactDistance',
  Qualifiers & { side: CompassSide; count: number; otherId: string }
>
/** On the square directly on that side of an object of this type, in the object's room. */
export type DirectlyNextToObjectClue = Kind<
  'directlyNextToObject',
  { side: CompassSide; objectType: ObjectType }
>
/**
 * On the same diagonal (45 degrees, any distance) as another person.
 * `direction` limits it to one ray, `steps` to an exact distance.
 */
export type DiagonalClue = Kind<
  'diagonal',
  Qualifiers & { otherId: string; direction?: DiagonalDirection; steps?: number }
>
/** Strictly above-left, above-right, below-left or below-right of another person, in any room. */
export type QuadrantClue = Kind<
  'quadrant',
  Qualifiers & { direction: DiagonalDirection; otherId: string }
>
/** Same room as another person (others may be there). */
export type SameRoomClue = Kind<'sameRoom', { otherId: string }>
/** Not in the same room as another person. */
export type DifferentRoomClue = Kind<'differentRoom', { otherId: string }>
/** "Not with": same truth as different room, worded as the negation of "with". */
export type NotWithClue = Kind<'notWith', { otherId: string }>
/** Not beside any object of this type (beside = orthogonal, same room). */
export type NotBesideObjectClue = Kind<'notBesideObject', { objectType: ObjectType }>

export type RelationalClue =
  | DirectionOfClue
  | DirectionOfObjectClue
  | ExactDistanceClue
  | DirectlyNextToObjectClue
  | DiagonalClue
  | QuadrantClue
  | SameRoomClue
  | DifferentRoomClue
  | NotWithClue
  | NotBesideObjectClue

export type RelationalClueType = RelationalClue['type']

export const RELATIONAL_CLUE_TYPES: readonly RelationalClueType[] = [
  'directionOf',
  'directionOfObject',
  'exactDistance',
  'directlyNextToObject',
  'diagonal',
  'quadrant',
  'sameRoom',
  'differentRoom',
  'notWith',
  'notBesideObject',
]

export function isRelationalClue(clue: { type: string }): clue is RelationalClue {
  return (RELATIONAL_CLUE_TYPES as readonly string[]).includes(clue.type)
}
