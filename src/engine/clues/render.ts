import type { Locale } from '../../locale/types.ts'
import { bothFragments as bothFragmentsEn, bothPartsText as bothPartsTextEn, renderClue as renderClueEn, roomName as roomNameEn } from './en.ts'
import type { RenderContext } from './en.ts'
import { bothFragmentsNl, bothPartsTextNl, renderClueNl, roomNameNl } from './nl.ts'
import type { BothClue, CatalogClue } from './types.ts'

/**
 * The locale-aware entry points every call site should use to show a clue to a player (SLAY-3.2):
 * `en.ts` and `nl.ts` each hold one language's pure wording, unaware of the other; this file picks
 * between them. `locale` defaults to `'en'`, so every caller that predates locale support (the
 * solver's step explanations, the generator's ladder format, the puzzle-quality audits, every
 * existing test that calls `renderClue` from `en.ts` directly) keeps rendering English, unchanged.
 */

export function renderClue(clue: CatalogClue, ctx: RenderContext, locale: Locale = 'en'): string {
  return locale === 'nl' ? renderClueNl(clue, ctx) : renderClueEn(clue, ctx)
}

export function bothFragments(
  clue: BothClue,
  ctx: RenderContext,
  locale: Locale = 'en',
): { first: string; second: string; text: string } {
  return locale === 'nl' ? bothFragmentsNl(clue, ctx) : bothFragmentsEn(clue, ctx)
}

export function bothPartsText(clue: CatalogClue, ctx: RenderContext, lead?: string, locale: Locale = 'en'): string | null {
  if (locale === 'nl') return lead === undefined ? bothPartsTextNl(clue, ctx) : bothPartsTextNl(clue, ctx, lead)
  return lead === undefined ? bothPartsTextEn(clue, ctx) : bothPartsTextEn(clue, ctx, lead)
}

export function roomName(ctx: RenderContext, roomId: string, locale: Locale = 'en'): string {
  return locale === 'nl' ? roomNameNl(ctx, roomId) : roomNameEn(ctx, roomId)
}
