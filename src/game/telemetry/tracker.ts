import type { Puzzle } from '../../engine/model/index.ts'
import type { HintLevel } from '../hints.ts'
import type { StorageLike } from '../persistence.ts'
import type { GameStore } from '../store.ts'
import { createRecorder } from './recorder.ts'
import type { Recorder } from './recorder.ts'

export interface TrackerConfig {
  puzzle: Puzzle
  puzzleId: string
  storage: StorageLike | null
  now?: () => number
  /** Whether the screen is in the foreground right now (not a hidden tab). */
  visible?: boolean
}

export interface Tracker {
  hint(level: HintLevel): void
  hintPlacement(): void
  /** Foreground or background: the active-time clock follows it. */
  setVisible(visible: boolean): void
  /** The player started the level over: closes this session and opens a fresh one. */
  restart(): void
  /** Screen closed: stops the clock and saves. Safe to call more than once. */
  stop(): void
  /** The current session's record, as it stands. */
  snapshot: Recorder['snapshot']
}

/**
 * Connects a recorder to a game store: watches every state change and hands out the small set of
 * calls the UI makes itself (hints, restart, visibility). Anything that goes wrong while recording
 * stays inside: play is never interrupted by telemetry.
 */
export function trackStore(store: GameStore, config: TrackerConfig): Tracker {
  const { puzzle, puzzleId, storage, now } = config
  let visible = config.visible ?? true
  let previous = store.getState()
  const start = (): Recorder => {
    const recorder = createRecorder({ puzzle, puzzleId, storage, now, initial: store.getState() })
    recorder.setActive(visible)
    return recorder
  }
  let recorder = start()
  const guard = (run: () => void) => {
    try {
      run()
    } catch {
      // telemetry is best effort; the game goes on
    }
  }

  const off = store.subscribe(() => {
    const next = store.getState()
    guard(() => recorder.observe(previous, next))
    previous = next
  })

  return {
    hint: (level) => guard(() => recorder.hint(level)),
    hintPlacement: () => guard(() => recorder.hintPlacement()),
    setVisible(next) {
      visible = next
      guard(() => recorder.setActive(next))
    },
    restart() {
      guard(() => {
        recorder.setActive(false)
        previous = store.getState()
        recorder = start()
      })
    },
    stop() {
      off()
      guard(() => recorder.setActive(false))
    },
    snapshot: () => recorder.snapshot(),
  }
}
