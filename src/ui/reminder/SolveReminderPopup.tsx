import { useEffect, useRef, useState } from 'react'
import type { StorageLike } from '../../pwa/install.ts'
import { ReminderDialog } from './ReminderDialog.tsx'
import { useReminder } from './context.ts'
import { POPUP_DELAY_MS, defaultPopupStorage, shouldOfferPopup, writePopupDismissed } from './popup.ts'

export interface SolveReminderPopupProps {
  /** Where the 14-day dismissal lives. Default localStorage (null when blocked). */
  storage?: StorageLike | null
  clock?: () => number
  delayMs?: number
}

/**
 * SLAY-15.5: mount this when the player has just solved the puzzle. It decides once, at mount, whether to offer the reminder
 * (store 'off', not dismissed in the last 14 days) and opens the reminder dialog after a short pause, so the solved result and
 * its share panel are on screen first. Every close (Not now, Escape, backdrop, after Save) remembers the dismissal and gives
 * focus back to what had it before.
 */
export function SolveReminderPopup({ storage, clock = Date.now, delayMs = POPUP_DELAY_MS }: SolveReminderPopupProps) {
  const { state } = useReminder()
  const [store] = useState(() => (storage === undefined ? defaultPopupStorage() : storage))
  const [open, setOpen] = useState(false)
  const [offered] = useState(() => shouldOfferPopup(state.status, store, clock()))
  const opener = useRef<Element | null>(null)
  useEffect(() => {
    if (!offered) return
    const timer = setTimeout(() => {
      opener.current = document.activeElement
      setOpen(true)
    }, delayMs)
    return () => clearTimeout(timer)
  }, [offered, delayMs])
  if (!open) return null
  const close = () => {
    writePopupDismissed(store, clock())
    setOpen(false)
    const back = opener.current
    if (back instanceof HTMLElement && back.isConnected) back.focus()
    else if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }
  return <ReminderDialog onClose={close} closeLabelKey="notNow" startEnabled />
}
