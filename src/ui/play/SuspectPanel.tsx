import type { MouseEvent } from 'react'
import type { Puzzle } from '../../engine/model/index.ts'
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
 * portraits. The gift card is not tappable in CardGrid, yet the gift has to be placed too,
 * so a tap on it is picked up here on the wrapper (the card itself stays untouched).
 */
export function SuspectPanel({ puzzle, cast, selectedId, placedIds, onSelect }: SuspectPanelProps) {
  const victim = puzzle.people.find((p) => p.kind === 'victim')
  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (!victim) return
    if ((event.target as Element).closest('.polaroid--gift')) onSelect(victim.id)
  }
  return (
    <section
      className="play-cards"
      aria-label={PLAY_EN.cards}
      data-gift-selected={victim && victim.id === selectedId ? '' : undefined}
      data-gift-placed={victim && placedIds.includes(victim.id) ? '' : undefined}
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
      />
    </section>
  )
}
