import { isBesideFeature, isBesideObject, objectsAt, roomIdAt } from '../model/index.ts'
import type { Cell, Gender, ObjectType, Person, Placement, Scene } from '../model/index.ts'
import { isCorner, lineIndex, roomEdgeIndex } from './geometry.ts'
import { evaluateRelational } from './relational/evaluate.ts'
import { isRelationalClue } from './relational/types.ts'
import { bothParts } from './types.ts'
import type { CatalogClue } from './types.ts'

/** Who stands where, with the lookups every evaluator needs. */
class Standing {
  private readonly cells = new Map<string, Cell>()
  private readonly rooms = new Map<string, string | undefined>()

  private readonly scene: Scene

  constructor(scene: Scene, placements: Placement[]) {
    this.scene = scene
    for (const { personId, cell } of placements) {
      this.cells.set(personId, cell)
      this.rooms.set(personId, roomIdAt(scene, cell))
    }
  }

  cellOf(personId: string): Cell | undefined {
    return this.cells.get(personId)
  }

  roomOf(personId: string): string | undefined {
    return this.rooms.get(personId)
  }

  /** Ids of everyone (victim included) standing in `roomId`. */
  peopleIn(roomId: string): string[] {
    return [...this.rooms].filter(([, room]) => room === roomId).map(([id]) => id)
  }

  onObjectType(personId: string, type: ObjectType): boolean {
    const cell = this.cells.get(personId)
    return cell !== undefined && objectsAt(this.scene, cell).some((o) => o.type === type)
  }

  everyone(): string[] {
    return [...this.cells.keys()]
  }
}

/** The people other than `holderId` standing in `room` who have `gender`. */
function othersOfGender(
  standing: Standing,
  people: readonly Pick<Person, 'id' | 'gender'>[],
  holderId: string,
  room: string,
  gender: Gender,
): string[] {
  return standing
    .peopleIn(room)
    .filter((id) => id !== holderId && people.find((p) => p.id === id)?.gender === gender)
}

/**
 * Whether `clue` is true for a full placement (every person placed, victim
 * included). Unplaced people referenced by the clue make it false. The
 * `roomId` parameters some kinds carry pin the room the fact happens in.
 *
 * `aloneWithMurderer` belongs on the victim's card: evaluated there it is
 * true when the victim's room holds exactly one suspect. Use `checkClue` to
 * verify the card holder.
 *
 * The gender kinds (`roomHasGender`, `aloneWithGender`) need to know who has which gender:
 * pass `people`. Without it (or when nobody has a gender) they are false.
 *
 * A combined card (`both`) is the conjunction: true when both of its parts are.
 */
export function evaluate(
  clue: CatalogClue,
  scene: Scene,
  placements: Placement[],
  people: readonly Pick<Person, 'id' | 'gender'>[] = [],
): boolean {
  if (isRelationalClue(clue)) return evaluateRelational(clue, scene, placements)
  if (clue.type === 'both') return bothParts(clue).every((part) => evaluate(part, scene, placements, people))
  const standing = new Standing(scene, placements)
  const cell = standing.cellOf(clue.personId)
  const room = standing.roomOf(clue.personId)

  // Holder-independent: about a room, not about the card holder.
  if (clue.type === 'emptyRoom') return standing.peopleIn(clue.args.roomId).length === 0

  if (cell === undefined || room === undefined) return false
  const inPinnedRoom = (roomId: string | undefined) => roomId === undefined || roomId === room

  switch (clue.type) {
    case 'onObject':
    case 'squareWithObject':
      return standing.onObjectType(clue.personId, clue.args.objectType)
    case 'besideObject': {
      const count = scene.objects.filter(
        (o) => o.type === clue.args.objectType && isBesideObject(scene, cell, o),
      ).length
      return clue.args.exactlyOne ? count === 1 : count >= 1
    }
    case 'onlyOnObject':
      return (
        standing.onObjectType(clue.personId, clue.args.objectType) &&
        standing
          .everyone()
          .every((id) => id === clue.personId || !standing.onObjectType(id, clue.args.objectType))
      )
    case 'inRoom':
      return room === clue.args.roomId
    case 'inRoomOr':
      return clue.args.roomIds.includes(room)
    case 'inCorner':
      return isCorner(scene, cell) && inPinnedRoom(clue.args.roomId)
    case 'besideFeature':
      return isBesideFeature(scene, cell, clue.args.feature)
    case 'inFrontOfDoor':
      return isBesideFeature(scene, cell, 'door')
    case 'alone':
      return inPinnedRoom(clue.args.roomId) && standing.peopleIn(room).length === 1
    case 'withPerson':
      return inPinnedRoom(clue.args.roomId) && standing.roomOf(clue.args.otherId) === room
    case 'aloneWith': {
      const inRoom = standing.peopleIn(room)
      return (
        inPinnedRoom(clue.args.roomId) &&
        clue.args.otherId !== clue.personId &&
        inRoom.length === 2 &&
        inRoom.includes(clue.args.otherId)
      )
    }
    case 'roomHasGender':
      return othersOfGender(standing, people, clue.personId, room, clue.args.gender).length >= 1
    case 'aloneWithGender': {
      const inRoom = standing.peopleIn(room)
      return (
        inRoom.length === 2 &&
        othersOfGender(standing, people, clue.personId, room, clue.args.gender).length === 1
      )
    }
    case 'inRow':
      return cell.row === clue.args.index
    case 'inColumn':
      return cell.col === clue.args.index
    case 'onLine': {
      const row = clue.args.axis === 'row'
      const index = lineIndex(row ? scene.height : scene.width, clue.args.position)
      return index !== null && (row ? cell.row : cell.col) === index
    }
    case 'inRoomEdge': {
      if (!inPinnedRoom(clue.args.roomId)) return false
      const index = roomEdgeIndex(scene, room, clue.args.edge)
      const row = clue.args.edge === 'north' || clue.args.edge === 'south'
      return index !== null && (row ? cell.row : cell.col) === index
    }
    case 'aloneWithMurderer':
      return standing.peopleIn(room).length === 2
  }
}
