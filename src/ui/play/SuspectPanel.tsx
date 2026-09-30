import type { Puzzle } from '../../engine/model/index.ts'
import { useLocale } from '../../locale/index.ts'
import { CardGrid } from '../../render/cards/index.ts'
import type { BuiltCast } from '../../render/cards/index.ts'
import { usePlayStrings } from './strings.ts'

export interface SuspectPanelProps {
  puzzle: Puzzle
  cast: BuiltCast
  selectedId: string | null
  placedIds: readonly string[]
  /** A tap on a suspect's card: picks the person. */
  onSelect: (personId: string) => void
}

/**
 * The polaroid cards: pick who you are working with. CardGrid makes the suspects tappable and
 * passes the cast's `lookFor`, so the extra suspects of big boards get their generated portraits.
 * The victim card is never tappable (in CardGrid or here) — it stays out of the normal pick list —
 * but it does show a "your turn" selected state once `selectedId` reaches the victim, which
 * happens on its own the moment every suspect is placed (PlayScreen's `order`/`nextUnplaced`). The
 * player then places the victim with a normal board tap, exactly like a suspect (SLAY-9.24: the
 * last remaining square is no longer auto-filled).
 */
export function SuspectPanel({ puzzle, cast, selectedId, placedIds, onSelect }: SuspectPanelProps) {
  const { locale } = useLocale()
  const t = usePlayStrings()
  const victim = puzzle.people.find((p) => p.kind === 'victim')
  return (
    <section className="play-cards" aria-label={t.cards} data-victim-placed={victim && placedIds.includes(victim.id) ? '' : undefined}>
      <CardGrid
        people={puzzle.people}
        clues={puzzle.clues}
        scene={puzzle.scene}
        selectedId={selectedId ?? undefined}
        placedIds={placedIds}
        onSelect={onSelect}
        lookFor={cast.lookFor}
        locale={locale}
      />
    </section>
  )
}
