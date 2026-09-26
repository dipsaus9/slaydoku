import { useCallback, useState } from 'react'
import { defaultStorage, type StorageLike } from '../../game/index.ts'

/**
 * The axis-labels toggle is a UI preference, so it lives here rather than in the game options
 * (src/game): its own small key, next to `slaydoku:game-options`. Default on.
 */
export const AXIS_LABELS_KEY = 'slaydoku:play-axis-labels'

export function loadAxisLabels(storage: StorageLike | null): boolean {
  if (!storage) return true
  try {
    const raw = storage.getItem(AXIS_LABELS_KEY)
    const data: unknown = raw === null ? null : JSON.parse(raw)
    return typeof data === 'boolean' ? data : true
  } catch {
    return true
  }
}

export function saveAxisLabels(storage: StorageLike | null, value: boolean): boolean {
  if (!storage) return false
  try {
    storage.setItem(AXIS_LABELS_KEY, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** `storage` follows PlayScreen: undefined is localStorage, null keeps the setting in memory only. */
export function useAxisLabels(storage: StorageLike | null | undefined): readonly [boolean, (value: boolean) => void] {
  const resolved = storage === undefined ? defaultStorage() : storage
  const [value, setValue] = useState(() => loadAxisLabels(resolved))
  const update = useCallback(
    (next: boolean) => {
      setValue(next)
      saveAxisLabels(resolved, next)
    },
    [resolved],
  )
  return [value, update]
}
