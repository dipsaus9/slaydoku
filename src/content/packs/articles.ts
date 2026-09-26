import { SCENE_THEMES } from '../themes/index.ts'

/**
 * Room names in the themes are bare nouns ("Keuken"). Clues and maps of the
 * house levels carry the article in the stored name ("de Keuken", "het Toilet",
 * see CAD-4.29), so the pack does the same. Dutch has two: every noun is "de"
 * unless it is listed here or ends in one of the "het" suffixes.
 */
export const HET_ROOMS: ReadonlySet<string> = new Set([
  'Toilet', 'Archief', 'Kantoor', 'Restaurant', 'Magazijn', 'Terras', 'Paviljoen', 'Tuinhuis', 'Hertenkamp',
  'Bosschage', 'Conciergehok',
])

/** Names that do not read well after "in" as they are; replaced, article included. */
const RENAMED: Readonly<Record<string, string>> = {
  Elektronica: 'de Elektronicahoek',
  Pashokjes: 'de Pashokjes',
}

const HET_SUFFIXES = ['lokaal'] as const

/** "de Keuken", "het Toilet": the stored room name for a bare theme room name. */
export function withArticle(bare: string): string {
  const renamed = RENAMED[bare]
  if (renamed) return renamed
  if (HET_ROOMS.has(bare) || HET_SUFFIXES.some((s) => bare.toLowerCase().endsWith(s))) return `het ${bare}`
  return `de ${bare}`
}

/** Bare room names of every theme, for the test that keeps the article table complete. */
export const ALL_THEME_ROOM_NAMES: readonly string[] = [...new Set(SCENE_THEMES.flatMap((t) => t.rooms.map((r) => r.name)))]
