import { VICTIM_TEXT, VICTIM_TEXT_NL } from '../../engine/clues/index.ts'
import type { Locale } from '../../locale/types.ts'
import { Polaroid } from './Polaroid.tsx'
import { VictimIcon } from './VictimIcon.tsx'

/**
 * Polaroid of the victim. Wording comes from `VICTIM_TEXT` ('en') or `VICTIM_TEXT_NL` ('nl'),
 * default 'en'. Never a button (no `onClick` is wired here or in CardGrid): the victim card stays
 * out of the normal pick list. `selected` only adds the same "your turn" styling a suspect card
 * gets, for the moment `selectedId` reaches the victim, once every suspect has a placement
 * (SLAY-9.24 AC #3) -- the player still places them with a normal board tap, not a card tap.
 */
export function VictimCard({ className, locale = 'en', selected }: { className?: string; locale?: Locale; selected?: boolean }) {
  const text = locale === 'nl' ? VICTIM_TEXT_NL : VICTIM_TEXT
  return (
    <Polaroid
      variant="victim"
      portrait={<VictimIcon />}
      photoColor="#f6d6dc"
      bubbleColor="#f7cfd8"
      name={text.title}
      text={text.clue}
      selected={selected}
      className={className}
    />
  )
}
