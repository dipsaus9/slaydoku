import type { Locale } from '../../locale/index.ts'

interface ShareStrings {
  title: string
  preview: (description: string) => string
  formats: { label: string; wide: string; square: string }
  share: string
  copy: string
  download: string
  textLabel: string
  status: {
    shared: string
    copied: string
    copyFailed: string
    downloaded: string
    downloadFailed: string
    shareFailed: string
    preparing: string
  }
  note: string
}

/** English wording of the share panel. */
export const SHARE_EN: ShareStrings = {
  title: 'Share your result',
  preview: (description) => `Preview of your result card. ${description}`,
  formats: { label: 'Card shape', wide: 'Wide', square: 'Square' },
  share: 'Share',
  copy: 'Copy text',
  download: 'Download image',
  textLabel: 'Text that is shared',
  status: {
    shared: 'Shared.',
    copied: 'Copied to your clipboard.',
    copyFailed: 'Could not copy. Select the text above and copy it by hand.',
    downloaded: 'Image saved to your device.',
    downloadFailed: 'Could not make the image.',
    shareFailed: 'Sharing did not work here. Copy the text or download the image instead.',
    preparing: 'Preparing the image…',
  },
  note: 'Nothing leaves your device unless you share it.',
}

/** Dutch wording of the share panel. */
export const SHARE_NL: ShareStrings = {
  title: 'Deel je resultaat',
  preview: (description) => `Voorbeeld van je resultaatkaart. ${description}`,
  formats: { label: 'Kaartvorm', wide: 'Breed', square: 'Vierkant' },
  share: 'Delen',
  copy: 'Tekst kopiëren',
  download: 'Afbeelding downloaden',
  textLabel: 'Tekst die wordt gedeeld',
  status: {
    shared: 'Gedeeld.',
    copied: 'Gekopieerd naar je klembord.',
    copyFailed: 'Kopiëren mislukt. Selecteer de tekst hierboven en kopieer die zelf.',
    downloaded: 'Afbeelding opgeslagen op je apparaat.',
    downloadFailed: 'De afbeelding kon niet worden gemaakt.',
    shareFailed: 'Delen werkte hier niet. Kopieer de tekst of download de afbeelding.',
    preparing: 'Afbeelding wordt voorbereid…',
  },
  note: 'Er verlaat niets je apparaat, tenzij je het deelt.',
}

/** The share panel's wording per locale. Read through `useLocale()`, never English alone. */
export const SHARE_STRINGS: Record<Locale, ShareStrings> = { en: SHARE_EN, nl: SHARE_NL }
