import { AvatarFrame, Eyes, Head, INK, Nose, Torso, type AvatarProps } from '../avatars/parts.tsx'
import { FaceHair, Wearables } from './accessories.tsx'
import { ClothesBack, ClothesFront } from './clothes.tsx'
import { darken, mix } from './color.ts'
import { hairLayers } from './hair.tsx'
import type { Brows, Mouth, ProceduralTraits } from './traits.ts'

export interface ProceduralAvatarProps extends AvatarProps {
  traits: ProceduralTraits
  /** Accessible name, usually the person's name. */
  title?: string
}

function MouthShape({ kind, dy, lip }: { kind: Mouth; dy: number; lip: string }) {
  const common = { fill: 'none', stroke: lip, strokeWidth: 1.8, strokeLinecap: 'round' } as const
  return (
    <g transform={`translate(0 ${dy})`}>
      {kind === 'smile' ? <path d="M44.5 54 C47 58 53 58 55.5 54" {...common} /> : null}
      {kind === 'grin' ? (
        <path d="M43.5 53 C45 60.5 55 60.5 56.5 53 Z" fill="#ffffff" stroke={lip} strokeWidth="1.4" strokeLinejoin="round" />
      ) : null}
      {kind === 'neutral' ? <path d="M46 55.5 L54 55.5" {...common} /> : null}
      {kind === 'smirk' ? <path d="M45 56 C49 57.5 53 56.5 56 53.5" {...common} /> : null}
    </g>
  )
}

function BrowShape({ kind, color }: { kind: Brows; color: string }) {
  const d =
    kind === 'raised'
      ? 'M36 38 C39 34 43 34 45 36.5 M55 36.5 C57 34 61 34 64 38'
      : 'M36 38 L44 37.2 M56 37.2 L64 38'
  return <path d={d} fill="none" stroke={color} strokeWidth={kind === 'thick' ? 2.8 : 1.6} strokeLinecap="round" />
}

/**
 * A flat 100x100 bust built from traits: same anatomy, ink and shading as the
 * eight drawn avatars, so the extra cast looks like it belongs on the same
 * table. Layers, back to front: torso, back hair, head, neckline, facial
 * hair, front hair, brows, eyes, nose, mouth, wearables.
 */
export function ProceduralAvatar({ traits, title, ...props }: ProceduralAvatarProps) {
  const { skin, hairStyle, hairColor, clothesStyle, clothesColor, accessory, mouth, brows } = traits
  const skinShade = mix(skin, '#a3502f', 0.3)
  const hat = accessory === 'beanie' || accessory === 'cap'
  const hair = hairLayers(hairStyle, hairColor, hat)
  const browColor = hairStyle === 'bald' ? darken(skin, 0.45) : darken(hairColor, 0.2)
  return (
    <AvatarFrame title={title} {...props}>
      <Torso fill={clothesColor} shade={darken(clothesColor, 0.28)} />
      <ClothesBack style={clothesStyle} color={clothesColor} />
      {hair.back}
      <Head skin={skin} shade={skinShade} />
      <ClothesFront style={clothesStyle} color={clothesColor} skin={skin} />
      <FaceHair traits={traits} />
      {hair.front}
      <BrowShape kind={brows} color={browColor} />
      <Eyes ink={INK} />
      <Nose stroke={skinShade} />
      <MouthShape kind={mouth} dy={accessory === 'moustache' ? 3 : 0} lip={mix(skin, '#7a1f2f', 0.7)} />
      <Wearables traits={traits} />
    </AvatarFrame>
  )
}
