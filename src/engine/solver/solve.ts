import { evaluate, expandClue, isGenderClue } from '../clues/index.ts'
import type { CatalogClue } from '../clues/index.ts'
import { deriveMurderer, isOccupiable, roomIdAt, validatePlacement } from '../model/index.ts'
import type { Cell, Gender, ObjectType, Person, Placement, Scene } from '../model/index.ts'

export interface SolveOptions {
  /** Stop once this many solutions are found. Default 2: enough to tell unique from ambiguous. */
  limit?: number
  /**
   * Polled every few hundred search nodes; returning true abandons the search
   * (a wall-clock deadline for callers with a time budget). The result then
   * has `aborted: true` and only the solutions found so far.
   */
  shouldStop?: () => boolean
}

export interface SolveResult {
  /** Number of solutions found, never above `limit`. 1 means the puzzle is unique. */
  count: number
  /** The solutions found, one placement per person each, in `people` order. */
  solutions: Placement[][]
  /** True when `shouldStop` cut the search short: `count` is then only a lower bound. */
  aborted?: boolean
}

/**
 * Finds every way to place all people so that the Murdoku rules and every
 * clue hold, stopping at `limit` (default 2) solutions.
 *
 * Rules enforced: everyone on an occupiable cell, at most one person per row
 * and column, every row and column used on square grids, and the victim's
 * room holding exactly one suspect (the murderer). Clues are judged by the
 * catalog's `evaluate`. The search only prunes with sound relaxations of
 * them (single-person filters, pairwise support, room exclusivity) and every
 * complete candidate is verified in full before it counts, so a weak
 * relaxation costs time, never correctness. A combined card (`both`) is the conjunction of its two
 * parts, so the search works with the parts as two clues of the same holder.
 */
export function solve(
  scene: Scene,
  people: Person[],
  clues: CatalogClue[],
  options: SolveOptions = {},
): SolveResult {
  return new Solver(scene, people, clues.flatMap(expandClue), Math.max(1, options.limit ?? 2), options.shouldStop).run()
}

/** One clue with everything the search needs, resolved to indexes. */
interface Compiled {
  clue: CatalogClue
  holder: number
  /** The other person a clue compares with, or -1. */
  other: number
  /** Set for a gender clue: every person other than the holder who has that gender (they may fill the room). */
  gendered?: { gender: Gender; members: number[] }
  /** Nobody else in the holder's room (alone kind or `alone` qualifier). */
  aloneish: boolean
  /** Lazily filled supports: for a cell of one person, the cells of the other that agree with it. */
  holderSupport: (Uint32Array | undefined)[]
  otherSupport: (Uint32Array | undefined)[]
}

/** Domains are bitsets, `words` 32-bit words per person, so set operations cost a few word ops. */
interface State {
  allowed: Uint32Array
  /** Cell index per person, -1 while unplaced. */
  at: Int16Array
}

const popcount = (value: number): number => {
  let x = value - ((value >>> 1) & 0x55555555)
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
}

class Solver {
  private readonly scene: Scene
  private readonly people: Person[]
  private readonly limit: number
  private readonly cells: number
  private readonly words: number
  private readonly n: number
  private readonly cellList: Cell[] = []
  private readonly roomOf: Int16Array
  private readonly rowOf: Int16Array
  private readonly colOf: Int16Array
  private readonly roomMask: Uint32Array[] = []
  private readonly rowMask: Uint32Array[] = []
  private readonly colMask: Uint32Array[] = []
  private readonly objectMask = new Map<ObjectType, Uint32Array>()
  private readonly compiled: Compiled[] = []
  private readonly victim: number
  private readonly clues: CatalogClue[]
  private readonly solutions: Placement[][] = []
  private readonly square: boolean
  private unsolvable = false
  /** Candidate cells per person after the single-person filters: bounds every later domain. */
  private root = new Uint32Array(0)
  private dirty = false
  private readonly shouldStop: (() => boolean) | undefined
  private nodes = 0
  private aborted = false

  constructor(scene: Scene, people: Person[], clues: CatalogClue[], limit: number, shouldStop?: () => boolean) {
    this.shouldStop = shouldStop
    this.scene = scene
    this.people = people
    this.clues = clues
    this.limit = limit
    this.cells = scene.width * scene.height
    this.words = Math.ceil(this.cells / 32)
    this.n = people.length
    this.square = scene.width === scene.height
    this.rowOf = new Int16Array(this.cells)
    this.colOf = new Int16Array(this.cells)
    this.roomOf = new Int16Array(this.cells)
    const roomIndex = new Map(scene.rooms.map((room, i) => [room.id, i]))
    this.roomMask = scene.rooms.map(() => this.emptyMask())
    this.rowMask = Array.from({ length: scene.height }, () => this.emptyMask())
    this.colMask = Array.from({ length: scene.width }, () => this.emptyMask())
    for (let row = 0; row < scene.height; row++) {
      for (let col = 0; col < scene.width; col++) {
        const i = row * scene.width + col
        this.cellList.push({ row, col })
        this.rowOf[i] = row
        this.colOf[i] = col
        const room = roomIndex.get(roomIdAt(scene, { row, col }) ?? '') ?? -1
        this.roomOf[i] = room
        if (room >= 0) this.setBit(this.roomMask[room] as Uint32Array, 0, i)
        this.setBit(this.rowMask[row] as Uint32Array, 0, i)
        this.setBit(this.colMask[col] as Uint32Array, 0, i)
      }
    }
    for (const object of scene.objects) {
      const mask = this.objectMask.get(object.type) ?? this.emptyMask()
      for (const cell of object.cells) this.setBit(mask, 0, cell.row * scene.width + cell.col)
      this.objectMask.set(object.type, mask)
    }
    const victims = people.filter((p) => p.kind === 'victim')
    this.victim = victims.length === 1 ? people.indexOf(victims[0] as Person) : -1
    this.unsolvable = this.victim < 0 || new Set(people.map((p) => p.id)).size !== people.length
    this.compile()
  }

  // --- bitset helpers -------------------------------------------------------------------

  private emptyMask(): Uint32Array {
    return new Uint32Array(this.words)
  }

  private setBit(bits: Uint32Array, base: number, cell: number): void {
    bits[base + (cell >>> 5)] = ((bits[base + (cell >>> 5)] as number) | (1 << (cell & 31))) >>> 0
  }

  private hasBit(bits: Uint32Array, base: number, cell: number): boolean {
    return (((bits[base + (cell >>> 5)] as number) >>> (cell & 31)) & 1) === 1
  }

  /** Calls `visit` for every set bit of the person's domain, lowest cell first. */
  private forEachCell(bits: Uint32Array, base: number, visit: (cell: number) => void): void {
    for (let w = 0; w < this.words; w++) {
      let x = bits[base + w] as number
      while (x !== 0) {
        const low = x & -x
        visit(w * 32 + (31 - Math.clz32(low)))
        x = (x ^ low) >>> 0
      }
    }
  }

  private size(bits: Uint32Array, person: number): number {
    let size = 0
    const base = person * this.words
    for (let w = 0; w < this.words; w++) size += popcount(bits[base + w] as number)
    return size
  }

  private overlaps(bits: Uint32Array, base: number, mask: Uint32Array): boolean {
    for (let w = 0; w < this.words; w++) {
      if (((bits[base + w] as number) & (mask[w] as number)) !== 0) return true
    }
    return false
  }

  /** Removes `mask` cells from a person's domain. False when that evicts a placed person. */
  private remove(state: State, person: number, mask: Uint32Array): boolean {
    const base = person * this.words
    const placed = state.at[person] as number
    if (placed >= 0 && this.hasBit(mask, 0, placed)) return false
    for (let w = 0; w < this.words; w++) {
      const before = state.allowed[base + w] as number
      const after = (before & ~(mask[w] as number)) >>> 0
      if (after !== before) {
        state.allowed[base + w] = after
        this.dirty = true
      }
    }
    return true
  }

  /** Keeps only `mask` cells in a person's domain. */
  private restrict(state: State, person: number, mask: Uint32Array): boolean {
    const base = person * this.words
    const placed = state.at[person] as number
    if (placed >= 0 && !this.hasBit(mask, 0, placed)) return false
    for (let w = 0; w < this.words; w++) {
      const before = state.allowed[base + w] as number
      const after = (before & (mask[w] as number)) >>> 0
      if (after !== before) {
        state.allowed[base + w] = after
        this.dirty = true
      }
    }
    return true
  }

  // --- set-up ---------------------------------------------------------------------------

  private compile(): void {
    const index = new Map(this.people.map((p, i) => [p.id, i]))
    for (const clue of this.clues) {
      const args = clue.args as Record<string, unknown>
      const holder = index.get(clue.personId)
      const otherId = typeof args.otherId === 'string' ? args.otherId : undefined
      const other = otherId === undefined ? -1 : (index.get(otherId) ?? -2)
      if (holder === undefined || other === -2) {
        this.unsolvable = true // a clue about somebody who is not in the puzzle can never hold
        return
      }
      const gendered = isGenderClue(clue)
        ? {
            gender: clue.args.gender,
            members: this.people.flatMap((p, i) => (i !== holder && p.gender === clue.args.gender ? [i] : [])),
          }
        : undefined
      this.compiled.push({
        clue,
        holder,
        other: other === holder ? -1 : other,
        ...(gendered ? { gendered } : {}),
        aloneish: clue.type === 'alone' || args.alone === true,
        holderSupport: [],
        otherSupport: [],
      })
    }
  }

  run(): SolveResult {
    if (this.unsolvable) return { count: 0, solutions: [] }
    const state: State = {
      allowed: new Uint32Array(this.n * this.words),
      at: new Int16Array(this.n).fill(-1),
    }
    for (let p = 0; p < this.n; p++) {
      for (let c = 0; c < this.cells; c++) {
        if (isOccupiable(this.scene, this.cellList[c] as Cell)) this.setBit(state.allowed, p * this.words, c)
      }
    }
    this.filterUnary(state)
    this.root = state.allowed.slice()
    if (this.propagate(state)) this.search(state)
    return this.aborted
      ? { count: this.solutions.length, solutions: this.solutions, aborted: true }
      : { count: this.solutions.length, solutions: this.solutions }
  }

  /** Cells a clue's holder can stand on judged alone; empty rooms are closed to everybody. */
  private filterUnary(state: State): void {
    for (const { clue, holder, other } of this.compiled) {
      if (clue.type === 'emptyRoom') {
        const room = this.scene.rooms.findIndex((r) => r.id === clue.args.roomId)
        for (let p = 0; p < this.n; p++) this.remove(state, p, this.roomMask[room] ?? this.emptyMask())
        continue
      }
      // Judged on the holder alone these would always fail: they depend on who else is in the room.
      if (other >= 0 || clue.type === 'aloneWithMurderer' || isGenderClue(clue)) continue
      const keep = this.emptyMask()
      this.forEachCell(state.allowed, holder * this.words, (c) => {
        const placement = [{ personId: clue.personId, cell: this.cellList[c] as Cell }]
        if (evaluate(clue, this.scene, placement, this.people)) this.setBit(keep, 0, c)
      })
      this.restrict(state, holder, keep)
    }
  }

  /**
   * The cells of the other person that agree with `cell` for a two-person
   * clue (and stand in another row and column). Judged by `evaluate` with just
   * the two placed, which is a sound relaxation for every kind that takes an
   * `otherId`. Only cells still possible after the single-person filters count.
   */
  private support(entry: Compiled, ofHolder: boolean, cell: number): Uint32Array {
    const table = ofHolder ? entry.holderSupport : entry.otherSupport
    const cached = table[cell]
    if (cached) return cached
    const to = ofHolder ? entry.other : entry.holder
    const otherId = (entry.clue.args as { otherId: string }).otherId
    const found = this.emptyMask()
    this.forEachCell(this.root, to * this.words, (c) => {
      if (this.rowOf[c] === this.rowOf[cell] || this.colOf[c] === this.colOf[cell]) return
      const [holderCell, otherCell] = ofHolder ? [cell, c] : [c, cell]
      const ok = evaluate(
        entry.clue,
        this.scene,
        [
          { personId: entry.clue.personId, cell: this.cellList[holderCell] as Cell },
          { personId: otherId, cell: this.cellList[otherCell] as Cell },
        ],
        this.people,
      )
      if (ok) this.setBit(found, 0, c)
    })
    table[cell] = found
    return found
  }

  // --- propagation ----------------------------------------------------------------------

  /** Puts `person` on `cell` and closes its row and column to everybody else. */
  private place(state: State, person: number, cell: number): boolean {
    const base = person * this.words
    if (!this.hasBit(state.allowed, base, cell)) return false
    state.at[person] = cell
    state.allowed.fill(0, base, base + this.words)
    this.setBit(state.allowed, base, cell)
    const row = this.rowMask[this.rowOf[cell] as number] as Uint32Array
    const col = this.colMask[this.colOf[cell] as number] as Uint32Array
    for (let q = 0; q < this.n; q++) {
      if (q === person) continue
      if (!this.remove(state, q, row) || !this.remove(state, q, col)) return false
    }
    this.dirty = true
    return true
  }

  /** Runs every pruning rule to a fixpoint. False means this branch has no solution. */
  private propagate(state: State): boolean {
    do {
      this.dirty = false
      if (!this.applyClueRules(state) || !this.applyMurdererRule(state)) return false
      for (let p = 0; p < this.n; p++) {
        if (state.at[p] !== -1) continue
        const size = this.size(state.allowed, p)
        if (size === 0) return false
        if (size === 1) {
          let cell = -1
          this.forEachCell(state.allowed, p * this.words, (c) => (cell = c))
          if (!this.place(state, p, cell)) return false
        }
      }
      if (this.square && !this.rowsAndColumnsCoverable(state)) return false
      if (!this.linesMatchable(state, true) || !this.linesMatchable(state, false)) return false
    } while (this.dirty)
    return true
  }

  private applyClueRules(state: State): boolean {
    for (const entry of this.compiled) {
      const { clue, holder, other } = entry
      if (other >= 0 && !this.reviseBoth(state, entry)) return false
      const holderCell = state.at[holder] as number
      const otherCell = other >= 0 ? (state.at[other] as number) : -1
      // Rooms holding exactly the named people: nobody else may stand there.
      const closed: number[] = []
      if (entry.aloneish && holderCell >= 0) closed.push(this.roomOf[holderCell] as number)
      if (clue.type === 'aloneWith') {
        if (holderCell >= 0) closed.push(this.roomOf[holderCell] as number)
        else if (otherCell >= 0) closed.push(this.roomOf[otherCell] as number)
      }
      for (const room of closed) {
        for (let q = 0; q < this.n; q++) {
          if (q === holder || (clue.type === 'aloneWith' && q === other)) continue
          if (!this.remove(state, q, this.roomMask[room] as Uint32Array)) return false
        }
      }
      if (entry.gendered && !this.applyGenderRule(state, entry, holderCell)) return false
      if (clue.type === 'onlyOnObject' && holderCell >= 0) {
        const mask = this.objectMask.get(clue.args.objectType)
        for (let q = 0; mask && q < this.n; q++) {
          if (q !== holder && !this.remove(state, q, mask)) return false
        }
      }
    }
    return true
  }

  /**
   * Gender clues: the holder's room must hold somebody else of that gender, so the holder can only
   * stand in rooms one of them can still reach. "Alone with a man" also keeps everybody who is not
   * a man out of the holder's room, and everyone else out once one man is placed there.
   */
  private applyGenderRule(state: State, entry: Compiled, holderCell: number): boolean {
    const { members } = entry.gendered as NonNullable<Compiled['gendered']>
    const viable = this.emptyMask()
    for (let room = 0; room < this.roomMask.length; room++) {
      const mask = this.roomMask[room] as Uint32Array
      const reachable = members.some((q) => this.overlaps(state.allowed, q * this.words, mask))
      if (reachable) for (let w = 0; w < this.words; w++) viable[w] = ((viable[w] as number) | (mask[w] as number)) >>> 0
    }
    if (!this.restrict(state, entry.holder, viable)) return false
    if (entry.clue.type !== 'aloneWithGender' || holderCell < 0) return true
    const room = this.roomMask[this.roomOf[holderCell] as number] as Uint32Array
    let inside = -1
    for (const q of members) {
      const at = state.at[q] as number
      if (at >= 0 && this.hasBit(room, 0, at)) {
        if (inside >= 0) return false
        inside = q
      }
    }
    for (let q = 0; q < this.n; q++) {
      if (q === entry.holder) continue
      if (!members.includes(q) || (inside >= 0 && q !== inside)) {
        if (!this.remove(state, q, room)) return false
      }
    }
    return true
  }

  /** Drops every cell of either person that has no agreeing cell left for the other. */
  private reviseBoth(state: State, entry: Compiled): boolean {
    for (const ofHolder of [true, false]) {
      const p = ofHolder ? entry.holder : entry.other
      const q = ofHolder ? entry.other : entry.holder
      const keep = this.emptyMask()
      this.forEachCell(state.allowed, p * this.words, (c) => {
        if (this.overlaps(state.allowed, q * this.words, this.support(entry, ofHolder, c))) {
          this.setBit(keep, 0, c)
        }
      })
      if (!this.restrict(state, p, keep)) return false
    }
    return true
  }

  /**
   * The murderer is the only suspect in the victim's room: two suspects in a
   * room rule it out for the victim; once the victim's room is known it needs
   * exactly one suspect, which is forced when only one can still get there.
   */
  private applyMurdererRule(state: State): boolean {
    const suspects: number[] = []
    for (let p = 0; p < this.n; p++) if (p !== this.victim) suspects.push(p)
    const count = new Array<number>(this.roomMask.length).fill(0)
    for (const p of suspects) {
      const cell = state.at[p] as number
      if (cell >= 0) count[this.roomOf[cell] as number] = (count[this.roomOf[cell] as number] ?? 0) + 1
    }
    const victimCell = state.at[this.victim] as number
    if (victimCell < 0) {
      for (let room = 0; room < count.length; room++) {
        if ((count[room] as number) > 1 && !this.remove(state, this.victim, this.roomMask[room] as Uint32Array)) {
          return false
        }
      }
      return true
    }
    const room = this.roomOf[victimCell] as number
    const mask = this.roomMask[room] as Uint32Array
    const inside = count[room] as number
    if (inside > 1) return false
    if (inside === 1) {
      for (const p of suspects) {
        if (state.at[p] === -1 && !this.remove(state, p, mask)) return false
      }
      return true
    }
    // Nobody there yet: the only suspect still able to reach the room has to be the murderer.
    const reaching = suspects.filter(
      (p) => state.at[p] === -1 && this.overlaps(state.allowed, p * this.words, mask),
    )
    const [only, ...more] = reaching
    if (only === undefined) return false
    return more.length > 0 || this.restrict(state, only, mask)
  }

  /** Square grids: every row and column still free must be reachable by somebody unplaced. */
  private rowsAndColumnsCoverable(state: State): boolean {
    const rows = new Uint8Array(this.scene.height)
    const cols = new Uint8Array(this.scene.width)
    for (let p = 0; p < this.n; p++) {
      const at = state.at[p] as number
      if (at >= 0) {
        rows[this.rowOf[at] as number] = 1
        cols[this.colOf[at] as number] = 1
        continue
      }
      this.forEachCell(state.allowed, p * this.words, (c) => {
        rows[this.rowOf[c] as number] = 1
        cols[this.colOf[c] as number] = 1
      })
    }
    return rows.every((v) => v === 1) && cols.every((v) => v === 1)
  }

  /**
   * Everybody unplaced needs a row (or column) of their own among the free
   * ones. Checked as a bipartite matching, which catches groups of people
   * competing for too few lines, not just a single empty line.
   */
  private linesMatchable(state: State, rows: boolean): boolean {
    const lines = rows ? this.scene.height : this.scene.width
    const lineOf = rows ? this.rowOf : this.colOf
    const reach: number[][] = []
    for (let p = 0; p < this.n; p++) {
      if (state.at[p] !== -1) continue
      const seen = new Set<number>()
      this.forEachCell(state.allowed, p * this.words, (c) => seen.add(lineOf[c] as number))
      reach.push([...seen])
    }
    const owner = new Array<number>(lines).fill(-1)
    const tryPerson = (person: number, visited: Uint8Array): boolean => {
      for (const line of reach[person] as number[]) {
        if (visited[line]) continue
        visited[line] = 1
        const current = owner[line] as number
        if (current === -1 || tryPerson(current, visited)) {
          owner[line] = person
          return true
        }
      }
      return false
    }
    for (let person = 0; person < reach.length; person++) {
      if (!tryPerson(person, new Uint8Array(lines))) return false
    }
    return true
  }

  // --- search ---------------------------------------------------------------------------

  private search(state: State): void {
    if (this.solutions.length >= this.limit || this.aborted) return
    if ((++this.nodes & 255) === 0 && this.shouldStop?.()) {
      this.aborted = true
      return
    }
    // The victim goes first: once their room is known the murderer rule constrains the rest.
    let pick = state.at[this.victim] === -1 ? this.victim : -1
    let best = Infinity
    for (let p = 0; p < this.n && pick < 0; p++) {
      if (state.at[p] !== -1) continue
      const size = this.size(state.allowed, p)
      if (size < best) {
        best = size
        pick = p
      }
    }
    if (pick < 0) {
      this.leaf(state)
      return
    }
    const candidates: number[] = []
    this.forEachCell(state.allowed, pick * this.words, (c) => candidates.push(c))
    for (const c of candidates) {
      if (this.solutions.length >= this.limit || this.aborted) return
      const next: State = { allowed: state.allowed.slice(), at: state.at.slice() }
      if (this.place(next, pick, c) && this.propagate(next)) this.search(next)
    }
  }

  /** Full check of a complete candidate: the rules and every clue, judged by the catalog. */
  private leaf(state: State): void {
    const placements: Placement[] = this.people.map((person, i) => ({
      personId: person.id,
      cell: this.cellList[state.at[i] as number] as Cell,
    }))
    const puzzle = { scene: this.scene, people: this.people }
    if (!validatePlacement(puzzle, placements).ok) return
    if (deriveMurderer(puzzle, placements) === null) return
    if (!this.clues.every((clue) => evaluate(clue, this.scene, placements, this.people))) return
    this.solutions.push(placements)
  }
}
