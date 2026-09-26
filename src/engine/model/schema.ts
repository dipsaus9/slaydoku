import { isGender, isObjectType } from './catalog.ts'
import { cellKey, cellsInRoom, inBounds, orthogonalNeighbors, SIDES } from './scene.ts'
import type { Cell, Puzzle, Scene } from './types.ts'

export interface SchemaIssue {
  /** JSON path of the offending value, e.g. `scene.objects[1].cells[0]`. */
  path: string
  message: string
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; issues: SchemaIssue[] }

type Json = Record<string, unknown>

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isCellShape(value: unknown): value is Cell {
  return isRecord(value) && Number.isInteger(value.row) && Number.isInteger(value.col)
}

/**
 * Structural and integrity check of a scene: shapes, unique ids, every cell
 * assigned to a known room, rooms non-empty and connected, objects inside the
 * grid, connected, within one room and never overlapping, edge features on the
 * grid. Returns every problem found; an empty list means valid.
 */
export function checkScene(value: unknown, path = 'scene'): SchemaIssue[] {
  const issues: SchemaIssue[] = []
  const bad = (at: string, message: string) => issues.push({ path: at, message })

  if (!isRecord(value)) return [{ path, message: 'Expected an object.' }]
  const { width, height, rooms, cellRooms, objects, edgeFeatures } = value
  if (!isPositiveInt(width)) bad(`${path}.width`, 'Expected a positive integer.')
  if (!isPositiveInt(height)) bad(`${path}.height`, 'Expected a positive integer.')

  const roomIds = new Set<string>()
  if (!Array.isArray(rooms)) {
    bad(`${path}.rooms`, 'Expected an array.')
  } else {
    rooms.forEach((room: unknown, i) => {
      const at = `${path}.rooms[${i}]`
      if (!isRecord(room) || typeof room.id !== 'string' || typeof room.name !== 'string') {
        bad(at, 'Expected { id: string, name: string }.')
      } else if (roomIds.has(room.id)) {
        bad(at, `Duplicate room id "${room.id}".`)
      } else {
        roomIds.add(room.id)
      }
    })
  }

  if (!isPositiveInt(width) || !isPositiveInt(height)) return issues
  const dims = { width, height }

  let gridOk = true
  if (!Array.isArray(cellRooms) || cellRooms.length !== height) {
    bad(`${path}.cellRooms`, `Expected ${height} rows.`)
    gridOk = false
  } else {
    cellRooms.forEach((row: unknown, r) => {
      if (!Array.isArray(row) || row.length !== width) {
        bad(`${path}.cellRooms[${r}]`, `Expected ${width} entries.`)
        gridOk = false
        return
      }
      row.forEach((id: unknown, c) => {
        if (typeof id !== 'string' || !roomIds.has(id)) {
          bad(`${path}.cellRooms[${r}][${c}]`, 'Expected the id of a known room.')
          gridOk = false
        }
      })
    })
  }

  // Only safe to walk the grid once every cell holds a known room id.
  const grid = gridOk ? ({ width, height, cellRooms } as unknown as Scene) : null
  if (grid) {
    for (const id of roomIds) {
      const cells = cellsInRoom(grid, id)
      if (cells.length === 0) bad(`${path}.rooms`, `Room "${id}" has no cells.`)
      else if (!isConnected(dims, cells)) bad(`${path}.rooms`, `Room "${id}" is not connected.`)
    }
  }

  const taken = new Map<string, string>()
  if (!Array.isArray(objects)) {
    bad(`${path}.objects`, 'Expected an array.')
  } else {
    const objectIds = new Set<string>()
    objects.forEach((object: unknown, i) => {
      const at = `${path}.objects[${i}]`
      if (!isRecord(object) || typeof object.id !== 'string') {
        bad(at, 'Expected an object with a string id.')
        return
      }
      const objectId = object.id
      if (objectIds.has(objectId)) bad(at, `Duplicate object id "${objectId}".`)
      objectIds.add(objectId)
      if (!isObjectType(object.type)) bad(`${at}.type`, 'Unknown object type.')
      const cells: unknown = object.cells
      if (!Array.isArray(cells) || cells.length === 0) {
        bad(`${at}.cells`, 'Expected at least one cell.')
        return
      }
      let cellsOk = true
      cells.forEach((cell: unknown, j) => {
        if (!isCellShape(cell) || !inBounds(dims, cell)) {
          bad(`${at}.cells[${j}]`, 'Expected a cell inside the grid.')
          cellsOk = false
          return
        }
        const owner = taken.get(cellKey(cell))
        if (owner !== undefined) bad(`${at}.cells[${j}]`, `Cell already covered by "${owner}".`)
        else taken.set(cellKey(cell), objectId)
      })
      if (cellsOk) {
        const list = cells as Cell[]
        if (!isConnected(dims, list)) bad(`${at}.cells`, 'Object cells must touch orthogonally.')
        if (grid && new Set(list.map((c) => grid.cellRooms[c.row]?.[c.col])).size > 1) {
          bad(`${at}.cells`, 'An object must stay within one room.')
        }
      }
    })
  }

  if (!Array.isArray(edgeFeatures)) {
    bad(`${path}.edgeFeatures`, 'Expected an array.')
  } else {
    edgeFeatures.forEach((feature: unknown, i) => {
      const at = `${path}.edgeFeatures[${i}]`
      if (!isRecord(feature)) return bad(at, 'Expected an object.')
      if (feature.kind !== 'window' && feature.kind !== 'door') {
        bad(`${at}.kind`, 'Expected "window" or "door".')
      }
      if (!SIDES.some((side) => side === feature.side)) {
        bad(`${at}.side`, 'Expected north, east, south or west.')
      }
      if (!isCellShape(feature.cell) || !inBounds(dims, feature.cell)) {
        bad(`${at}.cell`, 'Expected a cell inside the grid.')
      }
    })
  }

  return issues
}

/**
 * Structural and integrity check of a puzzle: valid scene, unique people with
 * exactly one victim, a solution that places every person once inside the
 * grid, and clue slots that reference known people. It does not check the
 * Murdoku rules; use validateSolution for that.
 */
export function checkPuzzle(value: unknown): SchemaIssue[] {
  if (!isRecord(value)) return [{ path: '$', message: 'Expected an object.' }]
  const issues = checkScene(value.scene)
  const bad = (path: string, message: string) => issues.push({ path, message })

  const personIds = new Set<string>()
  if (!Array.isArray(value.people)) {
    bad('people', 'Expected an array.')
  } else {
    let victims = 0
    value.people.forEach((person: unknown, i) => {
      const at = `people[${i}]`
      if (
        !isRecord(person) ||
        typeof person.id !== 'string' ||
        typeof person.label !== 'string' ||
        (person.kind !== 'suspect' && person.kind !== 'victim')
      ) {
        return bad(at, 'Expected { id, kind: "suspect" | "victim", label }.')
      }
      if (person.gender !== undefined && !isGender(person.gender)) bad(`${at}.gender`, 'Expected "vrouw" or "man".')
      if (personIds.has(person.id)) bad(at, `Duplicate person id "${person.id}".`)
      personIds.add(person.id)
      if (person.kind === 'victim') victims++
    })
    if (victims !== 1) bad('people', `Expected exactly one victim, found ${victims}.`)
  }

  const scene = isRecord(value.scene) ? value.scene : {}
  const dims =
    isPositiveInt(scene.width) && isPositiveInt(scene.height)
      ? { width: scene.width, height: scene.height }
      : null
  if (!Array.isArray(value.solution)) {
    bad('solution', 'Expected an array.')
  } else {
    const placed = new Set<string>()
    value.solution.forEach((placement: unknown, i) => {
      const at = `solution[${i}]`
      if (!isRecord(placement) || typeof placement.personId !== 'string') {
        return bad(at, 'Expected { personId, cell }.')
      }
      if (!personIds.has(placement.personId)) bad(at, `Unknown person "${placement.personId}".`)
      if (placed.has(placement.personId)) bad(at, `"${placement.personId}" placed twice.`)
      placed.add(placement.personId)
      if (!isCellShape(placement.cell) || (dims && !inBounds(dims, placement.cell))) {
        bad(`${at}.cell`, 'Expected a cell inside the grid.')
      }
    })
    for (const id of personIds) {
      if (!placed.has(id)) bad('solution', `Person "${id}" has no solution cell.`)
    }
  }

  if (!Array.isArray(value.clues)) {
    bad('clues', 'Expected an array.')
  } else {
    value.clues.forEach((clue: unknown, i) => {
      const at = `clues[${i}]`
      if (!isRecord(clue) || typeof clue.personId !== 'string' || typeof clue.type !== 'string') {
        return bad(at, 'Expected { personId, type, args? }.')
      }
      if (!personIds.has(clue.personId)) bad(at, `Unknown person "${clue.personId}".`)
      if (clue.args !== undefined && !isRecord(clue.args)) bad(`${at}.args`, 'Expected an object.')
    })
  }
  return issues
}

function parseJson(text: string): ParseResult<unknown> {
  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON.'
    return { ok: false, issues: [{ path: '$', message }] }
  }
}

export function serializePuzzle(puzzle: Puzzle): string {
  return JSON.stringify(puzzle, null, 2)
}

/** Parses JSON text into a schema-checked puzzle. */
export function parsePuzzle(text: string): ParseResult<Puzzle> {
  const parsed = parseJson(text)
  if (!parsed.ok) return parsed
  const issues = checkPuzzle(parsed.value)
  return issues.length ? { ok: false, issues } : { ok: true, value: parsed.value as Puzzle }
}

export function serializeScene(scene: Scene): string {
  return JSON.stringify(scene, null, 2)
}

/** Parses JSON text into a schema-checked scene. */
export function parseScene(text: string): ParseResult<Scene> {
  const parsed = parseJson(text)
  if (!parsed.ok) return parsed
  const issues = checkScene(parsed.value)
  return issues.length ? { ok: false, issues } : { ok: true, value: parsed.value as Scene }
}

/** Whether `cells` (already inside the grid) form one orthogonally connected group. */
function isConnected(dims: { width: number; height: number }, cells: Cell[]): boolean {
  const wanted = new Set(cells.map(cellKey))
  const [first] = cells
  if (!first) return true
  const reached = new Set([cellKey(first)])
  const queue = [first]
  for (let cell = queue.pop(); cell; cell = queue.pop()) {
    for (const n of orthogonalNeighbors(dims, cell)) {
      const key = cellKey(n)
      if (wanted.has(key) && !reached.has(key)) {
        reached.add(key)
        queue.push(n)
      }
    }
  }
  return reached.size === wanted.size
}
