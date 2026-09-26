import { inBounds, isOccupiable, roomIdAt } from './scene.ts'
import type { Cell, Person, Placement, Puzzle, Scene } from './types.ts'

export type PlacementIssueCode =
  | 'unknown-person'
  | 'duplicate-person'
  | 'missing-person'
  | 'out-of-bounds'
  | 'not-occupiable'
  | 'row-conflict'
  | 'col-conflict'
  | 'row-empty'
  | 'col-empty'
  | 'no-murderer'

export interface PlacementIssue {
  code: PlacementIssueCode
  message: string
  personIds: string[]
}

export interface PlacementResult {
  ok: boolean
  issues: PlacementIssue[]
}

export interface PlacementOptions {
  /**
   * Player work in progress: not everyone has to be placed yet, and the
   * "every row and column holds someone" and victim checks are skipped.
   * Conflicts (row, column, blocked cell) are still reported.
   */
  partial?: boolean
}

type PuzzleShape = Pick<Puzzle, 'scene' | 'people'>

/**
 * The victim's cell: what remains once every suspect is placed. Exactly one
 * row and one column must be free; their crossing is the victim's cell.
 * Returns null while the suspects do not leave exactly one such cell (also
 * when the suspects overlap in a row or column). The cell is not checked for
 * occupiability; validatePlacement does that.
 */
export function deriveVictimCell(scene: Scene, suspectCells: Cell[]): Cell | null {
  const rows = new Set(suspectCells.map((c) => c.row))
  const cols = new Set(suspectCells.map((c) => c.col))
  if (rows.size !== suspectCells.length || cols.size !== suspectCells.length) return null
  const freeRows: number[] = []
  const freeCols: number[] = []
  for (let row = 0; row < scene.height; row++) if (!rows.has(row)) freeRows.push(row)
  for (let col = 0; col < scene.width; col++) if (!cols.has(col)) freeCols.push(col)
  const [row, ...moreRows] = freeRows
  const [col, ...moreCols] = freeCols
  if (row === undefined || col === undefined || moreRows.length || moreCols.length) return null
  return { row, col }
}

/**
 * Checks a set of placements against the Murdoku rules:
 * - every person placed exactly once (unless `partial`), nobody unknown;
 * - only on in-grid, occupiable cells (multi-cell objects: any one cell);
 * - at most one person per row and per column across the whole grid, and on a
 *   square grid every row and column holds someone (non-square grids only
 *   forbid sharing, as "almost every grid" has one per row and column);
 *
 * The victim standing on the single leftover cell follows from the rules
 * above (everyone in their own row and column, every row and column used);
 * deriveVictimCell computes that cell for a solver or generator.
 */
export function validatePlacement(
  puzzle: PuzzleShape,
  placements: Placement[],
  options: PlacementOptions = {},
): PlacementResult {
  const { scene, people } = puzzle
  const partial = options.partial ?? false
  const issues: PlacementIssue[] = []
  const add = (code: PlacementIssueCode, message: string, personIds: string[] = []) =>
    issues.push({ code, message, personIds })

  const byId = new Map<string, Person>(people.map((p) => [p.id, p]))
  const seen = new Set<string>()
  const valid: Placement[] = []
  for (const placement of placements) {
    const { personId, cell } = placement
    if (!byId.has(personId)) {
      add('unknown-person', `Unknown person "${personId}".`, [personId])
      continue
    }
    if (seen.has(personId)) {
      add('duplicate-person', `"${personId}" is placed more than once.`, [personId])
      continue
    }
    seen.add(personId)
    if (!inBounds(scene, cell)) {
      add('out-of-bounds', `"${personId}" is outside the grid.`, [personId])
      continue
    }
    if (!isOccupiable(scene, cell)) {
      add('not-occupiable', `"${personId}" stands on a blocked cell.`, [personId])
    }
    valid.push(placement)
  }
  if (!partial) {
    for (const person of people) {
      if (!seen.has(person.id)) add('missing-person', `"${person.id}" is not placed.`, [person.id])
    }
  }

  const rowGroups = groupBy(valid, (p) => p.cell.row)
  const colGroups = groupBy(valid, (p) => p.cell.col)
  for (const [row, group] of rowGroups) {
    if (group.length > 1) {
      add('row-conflict', `Row ${row + 1} holds more than one person.`, ids(group))
    }
  }
  for (const [col, group] of colGroups) {
    if (group.length > 1) {
      add('col-conflict', `Column ${col + 1} holds more than one person.`, ids(group))
    }
  }

  if (!partial && scene.width === scene.height) {
    for (let row = 0; row < scene.height; row++) {
      if (!rowGroups.has(row)) add('row-empty', `Row ${row + 1} holds nobody.`)
    }
    for (let col = 0; col < scene.width; col++) {
      if (!colGroups.has(col)) add('col-empty', `Column ${col + 1} holds nobody.`)
    }
  }

  return { ok: issues.length === 0, issues }
}

/**
 * The murderer: the only suspect standing in the victim's room. Returns that
 * suspect's id, or null when the victim is unplaced or the victim's room holds
 * zero or several suspects.
 */
export function deriveMurderer(puzzle: PuzzleShape, placements: Placement[]): string | null {
  const { scene, people } = puzzle
  const kind = new Map(people.map((p) => [p.id, p.kind]))
  const victimPlacement = placements.find((p) => kind.get(p.personId) === 'victim')
  if (!victimPlacement) return null
  const room = roomIdAt(scene, victimPlacement.cell)
  if (room === undefined) return null
  const inRoom = placements.filter(
    (p) => kind.get(p.personId) === 'suspect' && roomIdAt(scene, p.cell) === room,
  )
  const [only, ...rest] = inRoom
  return only && rest.length === 0 ? only.personId : null
}

/** A finished puzzle's solution: valid placement plus a determinable murderer. */
export function validateSolution(puzzle: Puzzle): PlacementResult {
  const { issues } = validatePlacement(puzzle, puzzle.solution)
  if (deriveMurderer(puzzle, puzzle.solution) === null) {
    issues.push({
      code: 'no-murderer',
      message: 'The victim must share a room with exactly one suspect.',
      personIds: [],
    })
  }
  return { ok: issues.length === 0, issues }
}

function ids(group: Placement[]): string[] {
  return group.map((p) => p.personId)
}

function groupBy<T>(items: T[], key: (item: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>()
  for (const item of items) {
    const k = key(item)
    map.set(k, [...(map.get(k) ?? []), item])
  }
  return map
}
