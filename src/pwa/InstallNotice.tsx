import { useSyncExternalStore } from 'react'
import { useLocale } from '../locale/index.ts'
import type { InstallStore } from './install.ts'
import './pwa.css'
import { INSTALL_STRINGS } from './strings.ts'

/**
 * Small notice at the top of the page offering to add Slaydoku to the home screen. Nothing shows once the
 * app already runs standalone, once dismissed within its resurface window, or on a platform/browser that
 * supports neither the Android/Chromium `beforeinstallprompt` path nor the iOS Safari Share sheet (SLAY-9.23).
 */
export function InstallNotice({ store }: { store: InstallStore }) {
  const { locale } = useLocale()
  const t = INSTALL_STRINGS[locale]
  const platform = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  if (platform === null) return null

  if (platform === 'android') {
    return (
      <div className="install-notice" role="status" data-install-notice="android">
        <span className="install-notice__text">{t.androidText}</span>
        <button type="button" className="install-notice__button" onClick={store.install}>
          {t.androidInstall}
        </button>
        <button type="button" className="install-notice__dismiss" aria-label={t.dismiss} onClick={store.dismiss}>
          ×
        </button>
      </div>
    )
  }

  return (
    <div className="install-notice" role="status" data-install-notice="ios">
      <span className="install-notice__text">{t.iosText}</span>
      <button type="button" className="install-notice__dismiss" aria-label={t.dismiss} onClick={store.dismiss}>
        ×
      </button>
    </div>
  )
}
