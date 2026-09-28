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
