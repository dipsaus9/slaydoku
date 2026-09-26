import type { Gender, ObjectType, Side } from '../model/index.ts'
import type { RelationalClue } from './relational/types.ts'

/**
 * Structural clues: facts about where ONE person stands, judged from the
 * room, the objects, the walls and the people around them (no comparison with
 * another person's row/column; those relational kinds live in `relational/`).
 *
 * A clue is plain JSON data and fits the model's `Clue` slot: `personId` is
 * the card holder, `type` the kind, `args` the parameters. Parameters are
 * person ids, room ids, object types and indexes only, never free text, so
 * a solver or generator can enumerate every possible clue of a scene.
 * Row and column indexes are 0-based like `Cell`; the Dutch text shows them
 * 1-based.
 */

export type EdgeFeatureName = 'window' | 'door'
export type Axis = 'row' | 'column'
/** `middle` only exists on a grid with an odd number of rows/columns. */
export type LinePosition = 'first' | 'last' | 'middle'

type Kind<T extends string, A> = { personId: string; type: T; args: A }
type NoArgs = Record<string, never>

/** Stands in/on an object of this type (car, chair, rug...). */
export type OnObjectClue = Kind<'onObject', { objectType: ObjectType }>
/** "There was a framed painting on their square": same fact, worded from the object. */
export type SquareWithObjectClue = Kind<'squareWithObject', { objectType: ObjectType }>
/**
 * Beside an object of this type: orthogonal and in the same room. May be
 * beside several unless `exactlyOne` asks for exactly one such object.
 */
export type BesideObjectClue = Kind<
  'besideObject',
  { objectType: ObjectType; exactlyOne?: boolean }
>
/** The only person standing on an object of this type. */
export type OnlyOnObjectClue = Kind<'onlyOnObject', { objectType: ObjectType }>
export type InRoomClue = Kind<'inRoom', { roomId: string }>
export type InRoomOrClue = Kind<'inRoomOr', { roomIds: [string, string] }>
/** In a corner (two walls meet), of any room or of `roomId`. */
export type InCornerClue = Kind<'inCorner', { roomId?: string }>
/** Touching a window or door: the 1-2 cells on either side of it. */
export type BesideFeatureClue = Kind<'besideFeature', { feature: EdgeFeatureName }>
/** In front of a door: the cells touching a door. */
export type InFrontOfDoorClue = Kind<'inFrontOfDoor', NoArgs>
/** Nobody else in the room, the victim included. */
export type AloneClue = Kind<'alone', { roomId?: string }>
/** In the same room as `otherId` (who may be the victim); others may be there too. */
export type WithPersonClue = Kind<'withPerson', { otherId: string; roomId?: string }>
/** Only these two in the room (either may be the victim). */
export type AloneWithClue = Kind<'aloneWith', { otherId: string; roomId?: string }>
/** Nobody in the room, not even the victim. Holder-independent. */
export type EmptyRoomClue = Kind<'emptyRoom', { roomId: string }>
/**
 * At least one OTHER person of this gender in the holder's room (the holder never counts, so a man
 * with a woman in his room is told something). Needs the people's genders: see `evaluate`.
 */
export type RoomHasGenderClue = Kind<'roomHasGender', { gender: Gender }>
/** Exactly one other person in the holder's room, and that person has this gender. */
export type AloneWithGenderClue = Kind<'aloneWithGender', { gender: Gender }>
export type InRowClue = Kind<'inRow', { index: number }>
export type InColumnClue = Kind<'inColumn', { index: number }>
/** Top/last/middle row, or first/last/middle column. */
export type OnLineClue = Kind<'onLine', { axis: Axis; position: LinePosition }>
/**
 * The holder stands on the top (`north`), bottom (`south`), leftmost (`west`) or rightmost (`east`) line of a room:
 * the room of the holder, or the room named by `roomId`. The top row of a room is the smallest row that holds a square of
 * it, so this works for irregular rooms too (an L-shaped room has its top row at the tip of the L). Says nothing about
 * anybody else, so it is a structural single card.
 */
export type InRoomEdgeClue = Kind<'inRoomEdge', { roomId?: string; edge: Side }>
/** Victim card: alone with the murderer (the only suspect in the victim's room). */
export type AloneWithMurdererClue = Kind<'aloneWithMurderer', NoArgs>

/**
 * One clue kind that may be a part of a combined card (`BothClue`): every structural kind about the holder
 * themselves, the gender kinds included. Left out: `emptyRoom` (about a room, not the holder), the victim's
 * `aloneWithMurderer`, the relational kinds and `both` itself (no nesting).
 */
export type PartClue =
  | OnObjectClue
  | SquareWithObjectClue
  | BesideObjectClue
  | OnlyOnObjectClue
  | InRoomClue
  | InRoomOrClue
  | InCornerClue
  | BesideFeatureClue
  | InFrontOfDoorClue
  | AloneClue
  | WithPersonClue
  | AloneWithClue
  | RoomHasGenderClue
  | AloneWithGenderClue
  | InRowClue
  | InColumnClue
  | OnLineClue
  | InRoomEdgeClue

/** A part of a combined card: a `PartClue` without its holder (the holder is the one of the card). */
export type ClueBody = PartClue extends infer C ? (C extends PartClue ? Omit<C, 'personId'> : never) : never

/**
 * A combined card: exactly two facts about the SAME holder on one card, true when both are (the conjunction).
 * `a` and `b` are two different parts (`ClueBody`: `type` and `args`, no holder), never another combined
 * card. In Dutch it reads as one sentence with the holder's name once and "en" between the parts.
 */
export type BothClue = Kind<'both', { a: ClueBody; b: ClueBody }>

export type StructuralClue = PartClue | EmptyRoomClue | AloneWithMurdererClue | BothClue

export type StructuralClueType = StructuralClue['type']

export const STRUCTURAL_CLUE_TYPES: readonly StructuralClueType[] = [
  'onObject',
  'squareWithObject',
  'besideObject',
  'onlyOnObject',
  'inRoom',
  'inRoomOr',
  'inCorner',
  'besideFeature',
  'inFrontOfDoor',
  'alone',
  'withPerson',
  'aloneWith',
  'emptyRoom',
  'roomHasGender',
  'aloneWithGender',
  'inRow',
  'inColumn',
  'onLine',
  'inRoomEdge',
  'aloneWithMurderer',
  'both',
]

/** The kinds a part of a combined card may have (`PartClue`), in catalog order. */
export const PART_CLUE_TYPES: readonly StructuralClueType[] = STRUCTURAL_CLUE_TYPES.filter(
  (type) => type !== 'both' && type !== 'emptyRoom' && type !== 'aloneWithMurderer',
)

/**
 * Kinds that are about the people around the holder by gender. They name no person by id, but each
 * depends on WHO else stands in the room, so the solvers treat them like person-referencing cards:
 * never judged from the holder alone, and (in the solvability scale) usable from medium up.
 */
export const GENDER_CLUE_TYPES: readonly StructuralClueType[] = ['roomHasGender', 'aloneWithGender']

/** Whether a clue is one of the gender kinds (`GENDER_CLUE_TYPES`). */
export function isGenderClue(clue: { type: string }): clue is RoomHasGenderClue | AloneWithGenderClue {
  return (GENDER_CLUE_TYPES as readonly string[]).includes(clue.type)
}

/** Whether a clue is a combined card (`both`). */
export function isBothClue(clue: { type: string }): clue is BothClue {
  return clue.type === 'both'
}

/** The two parts of a combined card as clues of the card's holder, in the order stored. */
export function bothParts(clue: BothClue): [PartClue, PartClue] {
  const { a, b } = clue.args
  return [
    { ...a, personId: clue.personId } as PartClue,
    { ...b, personId: clue.personId } as PartClue,
  ]
}

/**
 * The clues a card stands for: a combined card is the conjunction of its two parts, so the solvers work with
 * the parts (each a plain clue of the same holder); every other card is itself.
 */
export function expandClue(clue: CatalogClue): CatalogClue[] {
  return isBothClue(clue) ? bothParts(clue) : [clue]
}

/** Every clue kind the catalog knows: structural (above) plus relational (`./relational/`). */
export type CatalogClue = StructuralClue | RelationalClue
