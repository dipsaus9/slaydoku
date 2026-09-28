import type { MouseEvent } from 'react'
import type { Puzzle } from '../../engine/model/index.ts'
import { useLocale } from '../../locale/index.ts'
import { CardGrid } from '../../render/cards/index.ts'
import type { BuiltCast } from '../../render/cards/index.ts'
import { PLAY_EN } from './strings.ts'

export interface SuspectPanelProps {
  puzzle: Puzzle
  cast: BuiltCast
  selectedId: string | null
  placedIds: readonly string[]
  /** A tap on a card: picks the person. */
  onSelect: (personId: string) => void
}

/**
 * The polaroid cards: pick who you are working with. CardGrid makes the suspects tappable
 * and passes the cast's `lookFor`, so the extra suspects of big boards get their generated
 * portraits. The victim card is not tappable in CardGrid, yet the victim has to be placed too,
 * so a tap on it is picked up here on the wrapper (the card itself stays untouched).
 */
export function SuspectPanel({ puzzle, cast, selectedId, placedIds, onSelect }: SuspectPanelProps) {
  const { locale } = useLocale()
  const victim = puzzle.people.find((p) => p.kind === 'victim')
  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (!victim) return
    if ((event.target as Element).closest('.polaroid--victim')) onSelect(victim.id)
  }
  return (
    <section
      className="play-cards"
      aria-label={PLAY_EN.cards}
      data-victim-selected={victim && victim.id === selectedId ? '' : undefined}
      data-victim-placed={victim && placedIds.includes(victim.id) ? '' : undefined}
      onClick={onClick}
    >
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
