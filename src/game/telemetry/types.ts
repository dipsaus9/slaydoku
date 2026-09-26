/** How a play session ended. A session that is still open (or whose tab was killed) reads as abandoned. */
export type TelemetryOutcome = 'solved' | 'abandoned'

/** Hint uses per level: how often the hint was shown at that level. */
export interface HintUses {
  1: number
  2: number
  3: number
}

/**
 * How one puzzle was played, once. Numbers and ids only: no name, no device, no free text.
 * Lives in localStorage on this device and is never sent anywhere.
 */
export interface TelemetryRecord {
  /** Unique per play session: puzzle id plus start time. */
  sessionId: string
  /** The level the player opened (same id as the save slot). */
  puzzleId: string
  /** Wall clock at the start of the session, ms since epoch. */
  startedAt: number
  /** Seconds the session was in the foreground: pauses while the tab is hidden, stops when solved. */
  activeSeconds: number
  hints: HintUses
  /** Placements that came from the place-for-me button of a level 3 hint. */
  hintPlacements: number
  /** Placements on a square that is not the person's true square. */
  wrongPlacements: number
  /** Times every person was placed but the check said it is not right. */
  failedChecks: number
  undos: number
  outcome: TelemetryOutcome
}
