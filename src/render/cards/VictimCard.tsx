import { GIFT_NL } from '../../engine/clues/nl.ts'
import { GiftIcon } from './GiftIcon.tsx'
import { Polaroid } from './Polaroid.tsx'

/** Polaroid of the victim, who in Slaydoku is the gift. Wording comes from `GIFT_NL`. */
export function VictimCard({ className }: { className?: string }) {
  return (
    <Polaroid
      variant="gift"
      portrait={<GiftIcon />}
      photoColor="#f6d6dc"
      bubbleColor="#f7cfd8"
      name={GIFT_NL.title}
      text={GIFT_NL.clue}
      className={className}
    />
  )
}
