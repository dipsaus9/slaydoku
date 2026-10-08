/**
 * Murdoku data model. Plain, JSON-safe data only: every type here survives
 * `JSON.parse(JSON.stringify(x))` unchanged, so puzzles can be stored as files.
 *
 * Coordinates are 0-based `{ row, col }`, row 0 at the top. Display code turns
 * them into the 1-based "r1c1" notation used by the official puzzles.
 */

/** A grid coordinate. */
export interface Cell {
  row: number
  col: number
}

/** A named room ("area"): an enclosed, possibly irregular, group of cells. Outdoor areas count too. */
export interface Room {
  id: string
  name: string
}

/** Object kinds. The catalog (see catalog.ts) says which can be occupied. */
export type ObjectType =
  | 'chair'
  | 'rug'
  | 'bed'
  | 'sofa'
  | 'car'
  | 'oilSlick'
  | 'framedPainting'
  | 'table'
  | 'tv'
  | 'plant'
  | 'bookshelf'
  | 'chest'
  | 'tree'
  | 'flowers'
  | 'easel'
  | 'statue'
  | 'washingMachine'
  | 'dryer'
  | 'cabinet'
  | 'stairs'
  | 'toilet'
  | 'sink'
  | 'shower'
  | 'desk'
  | 'wardrobe'
  | 'diningTable'
  | 'kitchenCounter'
  | 'bicycle'
  | 'gardenTable'
  | 'bench'
  // Decor objects (SLAY-19.1), all blocking.
  | 'lamp'
  | 'mirror'
  | 'coatRack'
  | 'fridge'
  | 'bathtub'
  | 'fireplace'
  | 'piano'
  | 'aquarium'
  | 'exerciseBike'
  | 'bin'
  | 'waterCooler'
  | 'serverRack'
  | 'globe'
  | 'gymBox'
  | 'playEquipment'
  | 'barbecue'
  | 'tent'
  | 'shoppingCart'
  | 'kiosk'

/**
 * An object standing on the grid. It covers one or more cells (a 2-cell bed,
 * an L-shaped sofa). A person occupies exactly one of its cells.
 */
export interface PlacedObject {
  id: string
  type: ObjectType
  cells: Cell[]
}

export type Side = 'north' | 'east' | 'south' | 'west'

export type EdgeFeatureKind = 'window' | 'door'

/**
 * A window or door on a grid line: the `side` edge of `cell`. On an inner
 * line the same feature can be written from either neighbour; helpers treat
 * both spellings as equal.
 */
export interface EdgeFeature {
  kind: EdgeFeatureKind
  cell: Cell
  side: Side
}

/** The crime scene: one rectangular grid split into rooms, with objects and edge features. */
export interface Scene {
  width: number
  height: number
  rooms: Room[]
  /** Room id per cell, `cellRooms[row][col]`; `height` rows of `width` entries. */
  cellRooms: string[][]
  objects: PlacedObject[]
  edgeFeatures: EdgeFeature[]
}

export type PersonKind = 'suspect' | 'victim'

/** Optional gender of a person, used by the gender clues. English nouns, so clue text can name them (woman/man). */
export type Gender = 'woman' | 'man'

export interface Person {
  /** Stable id, e.g. "A" or "victim". */
  id: string
  kind: PersonKind
  /** Display label, e.g. a letter or a name. */
  label: string
  /** Optional. Puzzles where nobody has a gender never get gender clues; the victim has none. */
  gender?: Gender
}

/** Where one person stands. */
export interface Placement {
  personId: string
  cell: Cell
}

/**
 * A clue card. Only a slot for now: the clue vocabulary and its evaluation
 * are defined by a later story. `type` names the clue kind, `args` carries
 * its JSON parameters.
 */
export interface Clue {
  personId: string
  type: string
  args?: Record<string, unknown>
}

/** A complete puzzle: scene, people, the unique solution and the clue cards. */
export interface Puzzle {
  scene: Scene
  /** Suspects plus exactly one victim. */
  people: Person[]
  solution: Placement[]
  clues: Clue[]
}
