import { isOccupiable } from '../../model/index.ts'
import type { Cell, Person, Scene } from '../../model/index.ts'

/**
 * What a technique may look at: the candidate cells of every person and who is
 * already placed. Cells are addressed by index (`row * width + col`); people by
 * their index in `people`. Techniques get this read-only view, the solving loop
 * owns the mutable `Board`.
 */
export interface BoardView {
  readonly scene: Scene
  readonly people: readonly Person[]
  /** Index of the one victim in `people`, or -1. */
  readonly victim: number
  readonly width: number
  readonly height: number
  readonly cellCount: number
  /** Cells `person` may still stand on, ascending. A placed person has exactly one. */
  candidates(person: number): number[]
  hasCandidate(person: number, cell: number): boolean
  candidateCount(person: number): number
  /** Cell of a placed person, or -1. */
  placedAt(person: number): number
  isPlaced(person: number): boolean
  row(cell: number): number
  col(cell: number): number
  cell(index: number): Cell
  /** Index into `scene.rooms`, or -1 for a cell without a known room. */
  room(cell: number): number
  roomCells(room: number): number[]
  /** A row/column already holds a placed person, so nobody else can use it. */
  rowTaken(row: number): boolean
  colTaken(col: number): boolean
  /** The room every candidate of `person` lies in, or -1 when they could still be in several. */
  certainRoom(person: number): number
}

/** Mutable candidate grid the solving loop works on. */
export class Board implements BoardView {
  readonly scene: Scene
  readonly people: readonly Person[]
  readonly victim: number
  readonly width: number
  readonly height: number
  readonly cellCount: number
  private readonly sets: Set<number>[]
  private readonly at: number[]
  private readonly roomIndex: number[]
  private readonly rooms: number[][]

  constructor(scene: Scene, people: readonly Person[]) {
    this.scene = scene
    this.people = people
    this.width = scene.width
    this.height = scene.height
    this.cellCount = scene.width * scene.height
    const victims = people.flatMap((p, i) => (p.kind === 'victim' ? [i] : []))
    this.victim = victims.length === 1 ? (victims[0] as number) : -1
    const roomOf = new Map(scene.rooms.map((room, i) => [room.id, i]))
    this.rooms = scene.rooms.map(() => [])
    this.roomIndex = []
    for (let c = 0; c < this.cellCount; c++) {
      const room = roomOf.get(scene.cellRooms[Math.floor(c / this.width)]?.[c % this.width] ?? '') ?? -1
      this.roomIndex.push(room)
      if (room >= 0) (this.rooms[room] as number[]).push(c)
    }
    const open: number[] = []
    for (let c = 0; c < this.cellCount; c++) if (isOccupiable(scene, this.cell(c))) open.push(c)
    this.sets = people.map(() => new Set(open))
    this.at = people.map(() => -1)
  }

  candidates(person: number): number[] {
    return [...(this.sets[person] as Set<number>)]
  }

  hasCandidate(person: number, cell: number): boolean {
    return (this.sets[person] as Set<number>).has(cell)
  }

  candidateCount(person: number): number {
    return (this.sets[person] as Set<number>).size
  }

  placedAt(person: number): number {
    return this.at[person] as number
  }

  isPlaced(person: number): boolean {
    return this.at[person] !== -1
  }

  row(cell: number): number {
    return Math.floor(cell / this.width)
  }

  col(cell: number): number {
    return cell % this.width
  }

  cell(index: number): Cell {
    return { row: this.row(index), col: this.col(index) }
  }

  room(cell: number): number {
    return this.roomIndex[cell] as number
  }

  roomCells(room: number): number[] {
    return this.rooms[room] ?? []
  }

  rowTaken(row: number): boolean {
    return this.at.some((cell) => cell !== -1 && this.row(cell) === row)
  }

  colTaken(col: number): boolean {
    return this.at.some((cell) => cell !== -1 && this.col(cell) === col)
  }

  certainRoom(person: number): number {
    let room = -2
    for (const c of this.sets[person] as Set<number>) {
      const here = this.room(c)
      if (room === -2) room = here
      else if (room !== here) return -1
    }
    return room === -2 ? -1 : room
  }

  // --- mutation: only the solving loop calls these -------------------------------------

  /** Removes a candidate. Returns whether it was there. */
  eliminate(person: number, cell: number): boolean {
    return (this.sets[person] as Set<number>).delete(cell)
  }

  /** Marks `person` as standing on `cell`: their other candidates go. */
  place(person: number, cell: number): void {
    this.sets[person] = new Set([cell])
    this.at[person] = cell
  }

  /** How many people are still to be placed. */
  unplaced(): number {
    return this.at.filter((cell) => cell === -1).length
  }

  /** A contradiction: somebody has nowhere left to stand, or two placed people share a line. */
  broken(): boolean {
    const seenRows = new Set<number>()
    const seenCols = new Set<number>()
    for (let p = 0; p < this.people.length; p++) {
      if (this.candidateCount(p) === 0) return true
      const cell = this.at[p] as number
      if (cell === -1) continue
      if (seenRows.has(this.row(cell)) || seenCols.has(this.col(cell))) return true
      seenRows.add(this.row(cell))
      seenCols.add(this.col(cell))
    }
    return false
  }
}
