import { useSyncExternalStore } from 'react'
import { useLocale } from '../locale/index.ts'
import './pwa.css'
import { UPDATE_STRINGS } from './strings.ts'
import type { Updater } from './updater.ts'

/** Small notice at the top of the page while a new version waits. Nothing is shown otherwise. */
export function UpdateNotice({ updater }: { updater: Updater }) {
  const { locale } = useLocale()
  const t = UPDATE_STRINGS[locale]
  const waiting = useSyncExternalStore(updater.subscribe, updater.getSnapshot, updater.getSnapshot)
  if (!waiting) return null
  return (
    <div className="update-notice" role="status" data-update-notice>
      <span className="update-notice__text">{t.available}</span>
      <button type="button" className="update-notice__button" onClick={updater.apply}>
        {t.reload}
      </button>
    </div>
  )
}
