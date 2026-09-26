import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { Puzzle } from '../../engine/model/index.ts'
import { defaultStorage } from '../../game/index.ts'
import { trackStore } from '../../game/telemetry/index.ts'
import type { GameState, GameStore, HintLevel, StorageLike } from '../../game/index.ts'
import type { Tracker } from '../../game/telemetry/index.ts'

/** The store's current state; re-renders on every change. */
export function useGameState(store: GameStore): GameState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState)
}

/**
 * Elapsed play time in ms, refreshed twice a second while the clock runs. Reads the store's
 * clock, so pausing and solving freeze it.
 */
export function useElapsed(store: GameStore, state: GameState): number {
  const [, tick] = useState(0)
  const running = state.timer.runningSince !== null
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => tick((n) => n + 1), 500)
    return () => clearInterval(id)
  }, [running])
  return store.elapsed()
}

/** Pauses the clock while the tab or app is in the background (iPad Safari suspends timers anyway). */
export function usePauseWhenHidden(store: GameStore): void {
  useEffect(() => {
    const onChange = () => store.dispatch({ type: document.hidden ? 'pause' : 'resume' })
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [store])
}

/** What the screen tells the telemetry recorder itself; everything else it learns from the store. */
export interface Telemetry {
  hint(level: HintLevel): void
  hintPlacement(): void
  /** Call after the store restarted the level. */
  restart(): void
}

/**
 * Records how this level is played (see src/game/telemetry): local only, best effort. Active time
 * follows the tab: it stops while the page is hidden. Nothing here can throw into the screen.
 */
export function useTelemetry(
  store: GameStore,
  puzzle: Puzzle,
  puzzleId: string,
  storage: StorageLike | null | undefined,
  now?: () => number,
): Telemetry {
  const tracker = useRef<Tracker | null>(null)
  useEffect(() => {
    let live: Tracker
    try {
      live = trackStore(store, {
        puzzle,
        puzzleId,
        // Same storage as the save slot: null switches both off, undefined means localStorage.
        storage: storage === undefined ? defaultStorage() : storage,
        now,
        visible: !document.hidden,
      })
    } catch {
      return
    }
    tracker.current = live
    const onChange = () => live.setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => {
      document.removeEventListener('visibilitychange', onChange)
      live.stop()
      if (tracker.current === live) tracker.current = null
    }
  }, [store, puzzle, puzzleId, storage, now])
  return useMemo(
    () => ({
      hint: (level) => tracker.current?.hint(level),
      hintPlacement: () => tracker.current?.hintPlacement(),
      restart: () => tracker.current?.restart(),
    }),
    [],
  )
}
