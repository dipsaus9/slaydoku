import { useSyncExternalStore } from 'react'
import { currentPath, subscribe } from './router.ts'

/** The current path, re-read on every navigation (link, back, forward, redirect). */
export function usePath(): string {
  return useSyncExternalStore(subscribe, currentPath, () => '/')
}
