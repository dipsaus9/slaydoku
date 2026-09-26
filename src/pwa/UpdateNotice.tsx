import { useSyncExternalStore } from 'react'
import './pwa.css'
import { UPDATE_EN } from './strings.ts'
import type { Updater } from './updater.ts'

/** Small notice at the top of the page while a new version waits. Nothing is shown otherwise. */
export function UpdateNotice({ updater }: { updater: Updater }) {
  const waiting = useSyncExternalStore(updater.subscribe, updater.getSnapshot, updater.getSnapshot)
  if (!waiting) return null
  return (
    <div className="update-notice" role="status" data-update-notice>
      <span className="update-notice__text">{UPDATE_EN.available}</span>
      <button type="button" className="update-notice__button" onClick={updater.apply}>
        {UPDATE_EN.reload}
      </button>
    </div>
  )
}
