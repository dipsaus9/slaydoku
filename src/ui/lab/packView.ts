import { getTheme } from '../../content/themes/index.ts'
import type { PackEntry } from '../../content/packs/types.ts'
import { themeIconsFor } from '../../content/themes/icons.ts'
import type { PlayView } from './LabPlay.tsx'
import { LAB_EN } from './strings.ts'

const packFacts = (entry: Pick<PackEntry, 'size' | 'tier' | 'theme' | 'clueCount' | 'rating'>): string[] => [
  LAB_EN.size_(entry.size),
  LAB_EN.tier[entry.tier],
  getTheme(entry.theme).name,
  LAB_EN.play.clues(entry.clueCount),
  LAB_EN.play.score(entry.rating.score),
]

/** A pack or generated puzzle as the play view wants it. */
export function packView(entry: PackEntry, source: 'generated', warnings?: string[]): PlayView {
  return {
    source,
    id: entry.id,
    title: entry.title,
    puzzle: entry.puzzle,
    castSeed: entry.id,
    themeIcons: themeIconsFor(entry.theme, entry.puzzle.scene.objects),
    facts: packFacts(entry),
    warnings,
  }
}

