import type { CatalogClue } from '../../engine/clues/index.ts'
import { renderClue } from '../../engine/clues/nl.ts'
import type { Clue, Person, Scene } from '../../engine/model/index.ts'
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
}

/**
 * All cards of a puzzle in a responsive grid: one polaroid per suspect, in
 * `people` order, then the gift card. Columns fill the width (about 150px
 * each), so an iPad shows four to six across and a phone two.
 */
export function CardGrid({ people, clues, scene, selectedId, placedIds = [], onSelect, lookFor, className }: CardGridProps) {
  const context = { scene, people }
  const hasVictim = people.some((p) => p.kind === 'victim')
  return (
    <ul className={['card-grid', className].filter(Boolean).join(' ')}>
      {people
        .filter((p) => p.kind === 'suspect')
        .map((person) => {
          // A person can hold several cards: show every one, in puzzle order.
          const own = clues.filter((c) => c.personId === person.id).map((c) => renderClue(c as CatalogClue, context))
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
      {hasVictim ? (
        <li>
          <VictimCard />
        </li>
      ) : null}
    </ul>
  )
}
