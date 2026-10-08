import { AvatarFrame, INK, Torso, type AvatarProps } from '../avatars/parts.tsx'
import { darken, lighten } from './color.ts'

export interface MonkeyAvatarProps extends AvatarProps {
  /** Fur colour. */
  fur: string
  /** Shirt colour. */
  clothes: string
  title?: string
}

/**
 * Biko's portrait: a monkey bust on the same 100x100 frame, ink and flat half-shading as the human portraits. Round ears with pale
 * insides, a pale heart-shaped face patch, a muzzle with nostrils and a wide grin, and a shirt like everybody else's.
 */
export function MonkeyAvatar({ fur, clothes, title, ...props }: MonkeyAvatarProps) {
  const shade = darken(fur, 0.22)
  const face = lighten(fur, 0.62)
  return (
    <AvatarFrame title={title} {...props}>
      <Torso fill={clothes} shade={darken(clothes, 0.28)} />
      <path d="M44 66 C44 72 56 72 56 66 L56 76 L44 76 Z" fill={fur} />
      <circle cx="27" cy="43" r="9.5" fill={fur} />
      <circle cx="73" cy="43" r="9.5" fill={fur} />
      <circle cx="27" cy="43" r="5.5" fill={face} />
      <circle cx="73" cy="43" r="5.5" fill={face} />
      <ellipse cx="50" cy="42" rx="19.5" ry="22" fill={fur} />
      <path d="M50 20 A19.5 22 0 0 1 50 64 C57 61 63 51 63 42 C63 32 59 24 50 20 Z" fill={shade} opacity="0.45" />
      <path d="M50 34 C46 29 33 31 33 43 C33 52 40 56 44 62 C47 65 53 65 56 62 C60 56 67 52 67 43 C67 31 54 29 50 34 Z" fill={face} />
      <ellipse cx="50" cy="55" rx="10.5" ry="8" fill={lighten(fur, 0.45)} />
      <g fill={INK}>
        <ellipse cx="42" cy="43" rx="2.2" ry="2.6" />
        <ellipse cx="58" cy="43" rx="2.2" ry="2.6" />
        <ellipse cx="47.5" cy="51.5" rx="1" ry="1.4" />
        <ellipse cx="52.5" cy="51.5" rx="1" ry="1.4" />
      </g>
      <path d="M36 37.5 C39 35 43 35 45.5 37 M54.5 37 C57 35 61 35 64 37.5" fill="none" stroke={darken(fur, 0.35)} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M43.5 57 C45 62.5 55 62.5 56.5 57 Z" fill="#ffffff" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    </AvatarFrame>
  )
}
