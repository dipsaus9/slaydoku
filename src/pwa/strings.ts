import type { Locale } from '../locale/index.ts'

interface UpdateStrings {
  available: string
  reload: string
}

/** English wording of the update notice. */
export const UPDATE_EN: UpdateStrings = {
  available: 'New version available',
  reload: 'Reload',
}

/** Dutch wording of the update notice. */
export const UPDATE_NL: UpdateStrings = {
  available: 'Nieuwe versie beschikbaar',
  reload: 'Herladen',
}

/** The update notice's wording per locale. Read through `useLocale()`, never English alone. */
export const UPDATE_STRINGS: Record<Locale, UpdateStrings> = { en: UPDATE_EN, nl: UPDATE_NL }

interface InstallStrings {
  /** Android/Chromium: a real one-tap install exists. */
  androidText: string
  androidInstall: string
  /** iOS Safari: no programmatic install exists, so the wording spells out the manual steps. */
  iosText: string
  dismiss: string
}

/** English wording of the install notices. */
export const INSTALL_EN: InstallStrings = {
  androidText: 'Install Slaydoku for one-tap access from your home screen',
  androidInstall: 'Install',
  iosText: 'Install Slaydoku: tap Share, then Add to Home Screen',
  dismiss: 'Close',
}

/** Dutch wording of the install notices. */
export const INSTALL_NL: InstallStrings = {
  androidText: 'Installeer Slaydoku voor toegang met één tik vanaf je beginscherm',
  androidInstall: 'Installeren',
  iosText: 'Installeer Slaydoku: tik op Delen, dan op Zet op beginscherm',
  dismiss: 'Sluiten',
}

/** The install notices' wording per locale. Read through `useLocale()`, never English alone. */
export const INSTALL_STRINGS: Record<Locale, InstallStrings> = { en: INSTALL_EN, nl: INSTALL_NL }
