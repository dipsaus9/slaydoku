import type { BoardView } from '../human/board.ts'
import type { Link, LinkModel } from './links.ts'

/** Why a supposition failed: somebody, a row or a column has no square left. */
export interface Dead {
  kind: 'person' | 'row' | 'col'
  index: number
}

/** A square struck off because supposing it leads to a dead end. */
export interface Refutation {
  person: number
  cell: number
  /** The placements the supposition forced, in order (the supposition itself not included). */
  forced: { person: number; cell: number }[]
  dead: Dead
}

/** Mutable copy of the position a trial runs on. */
interface State {
  /** Candidate bit sets, `words` per person. */
  dom: Uint32Array
  cnt: Int32Array
  at: Int32Array
  /** How many people can still stand on each cell. */
  occ: Int32Array
  /** How many cells of each row/column somebody can still stand on. */
  rowReach: Int32Array
  colReach: Int32Array
  rowTaken: Uint8Array
  colTaken: Uint8Array
}

/**
 * The engine behind chain reasoning: "suppose this person stands here, and
 * follow what is forced". Everything is flat typed arrays and bit sets so that
 * thousands of suppositions per position stay cheap on a 16x16 board.
 *
 * Only sound consequences are followed, so a dead end really refutes the
 * supposition:
 *
 * - a placed person closes their row and column for everybody else;
 * - a person with one square left is placed;
 * - on a square grid (where every row and column holds somebody), a free row or
 *   column with a single reachable square that only one person can stand on
 *   places that person, and one without any reachable square is a contradiction;
 * - a clue card naming two people removes the squares of one that the other
 *   has no fitting square left for (arc consistency over the `Link` tables);
 * - a person without squares is a contradiction.
 */
export class Trial {
  private readonly width: number
  private readonly height: number
  private readonly people: number
  private readonly cells: number
  private readonly words: number
  private readonly base: State
  private readonly byPerson: Link[][]
  private readonly unplaced: number[]
  /** Square grid with one person per row: only then must every free line end up holding somebody. */
  private readonly square: boolean

  constructor(board: BoardView, model: LinkModel) {
    this.width = board.width
    this.height = board.height
    this.people = board.people.length
    this.square = board.width === board.height && board.people.length === board.width
    this.cells = board.cellCount
    this.words = model.words
    this.byPerson = Array.from({ length: this.people }, () => [])
    for (const link of model.links) {
      this.byPerson[link.holder]?.push(link)
      this.byPerson[link.other]?.push(link)
    }
    const dom = new Uint32Array(this.people * this.words)
    const cnt = new Int32Array(this.people)
    const at = new Int32Array(this.people).fill(-1)
    const occ = new Int32Array(this.cells)
    const rowTaken = new Uint8Array(this.height)
    const colTaken = new Uint8Array(this.width)
    this.unplaced = []
    for (let p = 0; p < this.people; p++) {
      for (const c of board.candidates(p)) {
        dom[p * this.words + (c >> 5)] = (dom[p * this.words + (c >> 5)] as number) | (1 << (c & 31))
        occ[c] = (occ[c] as number) + 1
        cnt[p] = (cnt[p] as number) + 1
      }
      if (board.isPlaced(p)) {
        at[p] = board.placedAt(p)
        rowTaken[board.row(at[p] as number)] = 1
        colTaken[board.col(at[p] as number)] = 1
      } else {
        this.unplaced.push(p)
      }
    }
    const rowReach = new Int32Array(this.height)
    const colReach = new Int32Array(this.width)
    for (let c = 0; c < this.cells; c++) {
      if ((occ[c] as number) > 0) {
        const r = Math.floor(c / this.width)
        rowReach[r] = (rowReach[r] as number) + 1
        colReach[c % this.width] = (colReach[c % this.width] as number) + 1
      }
    }
    this.base = { dom, cnt, at, occ, rowReach, colReach, rowTaken, colTaken }
  }

  /** Every square (of an unplaced person with a choice) whose supposition runs into a dead end. */
  refuteAll(): Refutation[] {
    const out: Refutation[] = []
    const order = [...this.unplaced]
      .filter((p) => (this.base.cnt[p] as number) > 1)
      .sort((a, b) => (this.base.cnt[a] as number) - (this.base.cnt[b] as number))
    for (const person of order) {
      for (let cell = 0; cell < this.cells; cell++) {
        if (!this.has(this.base, person, cell)) continue
        const run = this.suppose(person, cell)
        if (run) out.push({ person, cell, forced: run.forced.slice(1), dead: run.dead })
      }
    }
    return out
  }

  /** Supposes `person` on `cell`. Returns the dead end it leads to, or null when the chain works out. */
  suppose(person: number, cell: number): { forced: { person: number; cell: number }[]; dead: Dead } | null {
    return new Run(this, this.clone(), person, cell).result()
  }

  // --- internals shared with `Run` ---------------------------------------------------------

  has(state: State, person: number, cell: number): boolean {
    return ((state.dom[person * this.words + (cell >> 5)] as number) & (1 << (cell & 31))) !== 0
  }

  clone(): State {
    const b = this.base
    return {
      dom: b.dom.slice(),
      cnt: b.cnt.slice(),
      at: b.at.slice(),
      occ: b.occ.slice(),
      rowReach: b.rowReach.slice(),
      colReach: b.colReach.slice(),
      rowTaken: b.rowTaken.slice(),
      colTaken: b.colTaken.slice(),
    }
  }

  get shape() {
    return { square: this.square, width: this.width, height: this.height, people: this.people, cells: this.cells, words: this.words, byPerson: this.byPerson }
  }
}

/** One supposition being followed to its end. */
class Run {
  private readonly s: State
  private readonly square: boolean
  private readonly width: number
  private readonly height: number
  private readonly people: number
  private readonly words: number
  private readonly byPerson: Link[][]
  private readonly forced: { person: number; cell: number }[] = []
  private readonly placeQueue: number[] = []
  private readonly queued: Uint8Array
  private readonly dirty: number[] = []
  private readonly isDirty: Uint8Array
  /** Cells the line scan forces a person onto (the person may still have several candidates). */
  private readonly forcedCell = new Map<number, number>()
  private dead: Dead | null = null

  constructor(trial: Trial, state: State, person: number, cell: number) {
    const shape = trial.shape
    this.s = state
    this.square = shape.square
    this.width = shape.width
    this.height = shape.height
    this.people = shape.people
    this.words = shape.words
    this.byPerson = shape.byPerson
    this.queued = new Uint8Array(this.people)
    this.isDirty = new Uint8Array(this.people)
    this.place(person, cell)
  }

  result(): { forced: { person: number; cell: number }[]; dead: Dead } | null {
    this.propagate()
    return this.dead ? { forced: this.forced, dead: this.dead } : null
  }

  private propagate(): void {
    while (!this.dead) {
      const next = this.placeQueue.pop()
      if (next !== undefined) {
        this.queued[next] = 0
        const target = this.forcedCell.get(next) ?? this.onlyCell(next)
        this.forcedCell.delete(next)
        if ((this.s.at[next] as number) < 0 && target >= 0 && this.holds(next, target)) this.place(next, target)
        continue
      }
      const changed = this.dirty.pop()
      if (changed !== undefined) {
        this.isDirty[changed] = 0
        for (const link of this.byPerson[changed] as Link[]) this.revise(link, changed)
        continue
      }
      if (!this.square || !this.scanLines()) return
    }
  }

  private holds(person: number, cell: number): boolean {
    return ((this.s.dom[person * this.words + (cell >> 5)] as number) & (1 << (cell & 31))) !== 0
  }

  private onlyCell(person: number): number {
    const base = person * this.words
    for (let w = 0; w < this.words; w++) {
      const bits = this.s.dom[base + w] as number
      if (bits !== 0) return w * 32 + (31 - Math.clz32(bits & -bits))
    }
    return -1
  }

  private remove(person: number, cell: number): void {
    const s = this.s
    const at = person * this.words + (cell >> 5)
    const bit = 1 << (cell & 31)
    if (((s.dom[at] as number) & bit) === 0) return
    s.dom[at] = (s.dom[at] as number) & ~bit
    s.cnt[person] = (s.cnt[person] as number) - 1
    s.occ[cell] = (s.occ[cell] as number) - 1
    if (s.occ[cell] === 0) {
      const r = Math.floor(cell / this.width)
      const c = cell % this.width
      s.rowReach[r] = (s.rowReach[r] as number) - 1
      s.colReach[c] = (s.colReach[c] as number) - 1
    }
    if (!this.isDirty[person]) {
      this.isDirty[person] = 1
      this.dirty.push(person)
    }
    if (s.cnt[person] === 0) {
      this.dead ??= { kind: 'person', index: person }
    } else if (s.cnt[person] === 1 && (s.at[person] as number) < 0 && !this.queued[person]) {
      this.queued[person] = 1
      this.placeQueue.push(person)
    }
  }

  private place(person: number, cell: number): void {
    const s = this.s
    s.at[person] = cell
    this.forced.push({ person, cell })
    const base = person * this.words
    for (let w = 0; w < this.words; w++) {
      let bits = s.dom[base + w] as number
      while (bits !== 0) {
        const low = bits & -bits
        bits &= ~low
        const other = w * 32 + (31 - Math.clz32(low))
        if (other !== cell) this.remove(person, other)
      }
    }
    const row = Math.floor(cell / this.width)
    const col = cell % this.width
    s.rowTaken[row] = 1
    s.colTaken[col] = 1
    for (let q = 0; q < this.people && !this.dead; q++) {
      if (q === person) continue
      for (let c = 0; c < this.width; c++) this.remove(q, row * this.width + c)
      for (let r = 0; r < this.height; r++) this.remove(q, r * this.width + col)
    }
  }

  /** Arc consistency: drop squares of the far end of `link` that no square of `changed` supports. */
  private revise(link: Link, changed: number): void {
    const target = link.holder === changed ? link.other : link.holder
    const masks = link.holder === changed ? link.forOther : link.forHolder
    const s = this.s
    const words = this.words
    const from = changed * words
    for (let w = 0; w < words && !this.dead; w++) {
      let bits = s.dom[target * words + w] as number
      while (bits !== 0) {
        const low = bits & -bits
        bits &= ~low
        const cell = w * 32 + (31 - Math.clz32(low))
        let supported = false
        const off = cell * words
        for (let k = 0; k < words; k++) {
          if (((masks[off + k] as number) & (s.dom[from + k] as number)) !== 0) {
            supported = true
            break
          }
        }
        if (!supported) this.remove(target, cell)
      }
    }
  }

  /** Looks at the free rows and columns; true when that gave the loop something new to do. */
  private scanLines(): boolean {
    const s = this.s
    let progressed = false
    for (const rows of [true, false]) {
      const lines = rows ? this.height : this.width
      const taken = rows ? s.rowTaken : s.colTaken
      const reach = rows ? s.rowReach : s.colReach
      for (let line = 0; line < lines; line++) {
        if (taken[line]) continue
        const count = reach[line] as number
        if (count === 0) {
          this.dead ??= { kind: rows ? 'row' : 'col', index: line }
          return true
        }
        if (count !== 1) continue
        const cell = this.singleCell(rows, line)
        if (cell < 0 || s.occ[cell] !== 1) continue
        const who = this.soleOccupant(cell)
        if (who >= 0 && (s.at[who] as number) < 0 && !this.queued[who]) {
          // The person may still have other squares; the line forces them onto this one.
          this.queued[who] = 1
          this.forcedCell.set(who, cell)
          this.placeQueue.push(who)
          progressed = true
        }
      }
    }
    return progressed
  }

  private singleCell(rows: boolean, line: number): number {
    const n = rows ? this.width : this.height
    for (let i = 0; i < n; i++) {
      const cell = rows ? line * this.width + i : i * this.width + line
      if ((this.s.occ[cell] as number) > 0) return cell
    }
    return -1
  }

  private soleOccupant(cell: number): number {
    for (let p = 0; p < this.people; p++) {
      if (((this.s.dom[p * this.words + (cell >> 5)] as number) & (1 << (cell & 31))) !== 0) return p
    }
    return -1
  }
}
