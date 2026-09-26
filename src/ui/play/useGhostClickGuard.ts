import { useEffect, useRef, type MouseEvent } from 'react'
import { isGhostClick } from './modalGuard.ts'

/**
 * A capture-phase click handler for the root of anything that appears while a finger may still be
 * down on the spot where a button will be (a dialog or the solved screen after a long press).
 * It swallows clicks in the first moments after mount, see modalGuard.ts.
 */
export function useGhostClickGuard(): (event: MouseEvent) => void {
  const mountedAt = useRef(Infinity)
  useEffect(() => {
    mountedAt.current = performance.now()
  }, [])
  return (event) => {
    // detail 0: a click from the keyboard (Enter or Space on a focused button), never the end of a press.
    if (event.detail === 0) return
    if (!isGhostClick(mountedAt.current, performance.now())) return
    event.stopPropagation()
    event.preventDefault()
  }
}
