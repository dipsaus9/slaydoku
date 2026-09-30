import type { CatalogClue } from '../../engine/clues/index.ts'
import { renderClue } from '../../engine/clues/index.ts'
import type { Clue, Person, Scene } from '../../engine/model/index.ts'
import type { Locale } from '../../locale/types.ts'
import type { CardLook } from './procedural/index.ts'
import { SuspectCard } from './SuspectCard.tsx'
import { VictimCard } from './VictimCard.tsx'

export interface CardGridProps {
  people: Person[]
  clues: Clue[]
  /** Room names for clue text. */
  scene: Pick<Scene, 'rooms'>
  selectedId?: string
  placedIds?: readonly string[]
  onSelect?: (personId: string) => void
  /** Portrait and colours for extra suspects, by label; see procedural/buildCast. */
  lookFor?: (label: string) => CardLook | undefined
  className?: string
  /** The language every card's text renders in (SLAY-3.2). Default 'en'. */
  locale?: Locale
}

/**
 * All cards of a puzzle in a responsive grid: one polaroid per suspect, in
 * `people` order, then the victim card. Columns fill the width (about 150px
 * each), so an iPad shows four to six across and a phone two.
 */
export function CardGrid({ people, clues, scene, selectedId, placedIds = [], onSelect, lookFor, className, locale = 'en' }: CardGridProps) {
  const context = { scene, people }
  const victim = people.find((p) => p.kind === 'victim')
  return (
    <ul className={['card-grid', className].filter(Boolean).join(' ')}>
      {people
        .filter((p) => p.kind === 'suspect')
        .map((person) => {
          // A person can hold several cards: show every one, in puzzle order.
          const own = clues.filter((c) => c.personId === person.id).map((c) => renderClue(c as CatalogClue, context, locale))
          return (
            <li key={person.id}>
              <SuspectCard
                person={person}
                clue={own}
                selected={person.id === selectedId}
                placed={placedIds.includes(person.id)}
                onSelect={onSelect}
                look={lookFor?.(person.label)}
              />
            </li>
          )
        })}
      {victim ? (
        <li>
          {/* The victim's card is never tappable (no onSelect) -- it stays out of the normal pick
              list -- but it does show the same "your turn" selected state a suspect card gets
              once selectedId reaches the victim (SLAY-9.24 AC #3), which PlayScreen's order/
              nextUnplaced already does the instant every suspect is placed. */}
          <VictimCard locale={locale} selected={victim.id === selectedId} />
        </li>
      ) : null}
    </ul>
  )
}
