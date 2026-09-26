import { demoPuzzle } from '../../content/demo/puzzle.ts'
import { demoRoomStyles } from '../../content/demo/scene.ts'
import type { Puzzle } from '../../engine/model/index.ts'
import type { FloorPattern } from '../../render/scene/index.ts'

/** A fixed sample the lab always lists (the game itself plays the daily schedule, not levels). */
export interface LabLevel {
  id: string
  title: string
  puzzle: Puzzle
  roomStyles?: Partial<Record<string, FloorPattern>>
}

/** The demo house puzzle. */
export const labLevels: readonly LabLevel[] = [{ id: 'demo', title: 'Demo', puzzle: demoPuzzle, roomStyles: demoRoomStyles }]
