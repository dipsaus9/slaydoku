import type { Person } from '../../engine/model/index.ts'
import { SilhouetteAvatar } from './avatars/silhouette.tsx'
import { castMemberFor } from './cast.ts'
import { Polaroid } from './Polaroid.tsx'
import type { CardLook } from './procedural/index.ts'

export interface SuspectCardProps {
  person: Person
  /** Finished clue sentence(s), from `renderClue`: one per card the person holds. */
  clue: string | readonly string[]
  /** The card of the suspect being placed right now. */
  selected?: boolean
  /** The suspect already stands on the board. */
  placed?: boolean
  /** Tap handler; the card becomes a button when given. */
  onSelect?: (personId: string) => void
  /** Portrait and colours for a person outside the drawn cast (see procedural/buildCast). */
  look?: CardLook
  className?: string
}

const FALLBACK_PHOTO = '#d5dae3'
const FALLBACK_BUBBLE = '#e6e9ef'

/** Polaroid of one suspect: portrait, name (the person's label) and clue text. */
export function SuspectCard({ person, clue, selected, placed, onSelect, look, className }: SuspectCardProps) {
  const member = castMemberFor(person.label)
  return (
    <Polaroid
      portrait={
        member ? (
          <member.Avatar decorative />
        ) : (
          (look?.portrait ?? <SilhouetteAvatar initial={person.label} decorative />)
        )
      }
      photoColor={member?.photo ?? look?.photo ?? FALLBACK_PHOTO}
      bubbleColor={member?.bubble ?? look?.bubble ?? FALLBACK_BUBBLE}
      name={person.label}
      text={clue}
      selected={selected}
      placed={placed}
      onClick={onSelect ? () => onSelect(person.id) : undefined}
      className={className}
    />
  )
}
