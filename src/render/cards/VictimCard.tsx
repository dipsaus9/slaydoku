import { VICTIM_TEXT } from '../../engine/clues/en.ts'
import { GiftIcon } from './GiftIcon.tsx'
import { Polaroid } from './Polaroid.tsx'

/** Polaroid of the victim, who in Slaydoku is the gift. Wording comes from `VICTIM_TEXT`. */
export function VictimCard({ className }: { className?: string }) {
  return (
    <Polaroid
      variant="gift"
      portrait={<GiftIcon />}
      photoColor="#f6d6dc"
      bubbleColor="#f7cfd8"
      name={VICTIM_TEXT.title}
      text={VICTIM_TEXT.clue}
      className={className}
    />
  )
}
