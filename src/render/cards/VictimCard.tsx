import { VICTIM_TEXT } from '../../engine/clues/en.ts'
import { Polaroid } from './Polaroid.tsx'
import { VictimIcon } from './VictimIcon.tsx'

/** Polaroid of the victim. Wording comes from `VICTIM_TEXT`. */
export function VictimCard({ className }: { className?: string }) {
  return (
    <Polaroid
      variant="victim"
      portrait={<VictimIcon />}
      photoColor="#f6d6dc"
      bubbleColor="#f7cfd8"
      name={VICTIM_TEXT.title}
      text={VICTIM_TEXT.clue}
      className={className}
    />
  )
}
