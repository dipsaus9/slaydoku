import { VICTIM_TEXT, VICTIM_TEXT_NL } from '../../engine/clues/index.ts'
import type { Locale } from '../../locale/types.ts'
import { Polaroid } from './Polaroid.tsx'
import { VictimIcon } from './VictimIcon.tsx'

/** Polaroid of the victim. Wording comes from `VICTIM_TEXT` ('en') or `VICTIM_TEXT_NL` ('nl'), default 'en'. */
export function VictimCard({ className, locale = 'en' }: { className?: string; locale?: Locale }) {
  const text = locale === 'nl' ? VICTIM_TEXT_NL : VICTIM_TEXT
  return (
    <Polaroid
      variant="victim"
      portrait={<VictimIcon />}
      photoColor="#f6d6dc"
      bubbleColor="#f7cfd8"
      name={text.title}
      text={text.clue}
      className={className}
    />
  )
}
