import type { ReactNode } from 'react'

/**
 * Shared building blocks for the drawn avatars. Every avatar is a 100x100
 * flat bust: head centred on (50, 42), shoulders at the bottom edge, no
 * background (the card or board supplies that). Each avatar file decides its
 * own hair, clothes and accessories; only the bare anatomy lives here.
 */

export interface AvatarProps {
  /** Rendered size in px for both sides; omit to fill the container. */
  size?: number
  className?: string
  /** Hide it from assistive tech, e.g. when the name is printed next to it. */
  decorative?: boolean
}

export const AVATAR_VIEWBOX = 100

/** Outline / feature ink shared by all avatars. */
export const INK = '#2a2a36'

interface FrameProps extends AvatarProps {
  /** Accessible name; the avatar is decorative when omitted. */
  title?: string
  children: ReactNode
}

/** The <svg> element around one avatar drawing. */
export function AvatarFrame({ size, className, title, decorative, children }: FrameProps) {
  const label = decorative ? undefined : title
  return (
    <svg
      viewBox={`0 0 ${AVATAR_VIEWBOX} ${AVATAR_VIEWBOX}`}
      width={size}
      height={size}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  )
}

/** Shoulders and chest: a flat torso in the shirt colour. */
export function Torso({ fill, shade }: { fill: string; shade: string }) {
  return (
    <g>
      <path d="M6 100 C6 82 24 74 50 74 C76 74 94 82 94 100 Z" fill={fill} />
      <path d="M50 74 C76 74 94 82 94 100 L60 100 C62 86 58 78 50 74 Z" fill={shade} opacity="0.45" />
    </g>
  )
}

/** Neck, ears and head with a flat half-face shade. Drawn after the back hair. */
export function Head({ skin, shade }: { skin: string; shade: string }) {
  return (
    <g>
      <rect x="42" y="58" width="16" height="20" rx="4" fill={skin} />
      <path d="M42 66 L58 66 L58 72 C52 76 46 76 42 72 Z" fill={shade} opacity="0.6" />
      <circle cx="31.5" cy="45" r="4.5" fill={skin} />
      <circle cx="68.5" cy="45" r="4.5" fill={skin} />
      <ellipse cx="50" cy="42" rx="18.5" ry="21.5" fill={skin} />
      <path d="M50 20.5 A18.5 21.5 0 0 1 50 63.5 C56 60 62 50 62 42 C62 32 58 24 50 20.5 Z" fill={shade} opacity="0.5" />
    </g>
  )
}

/** Plain eyes at y 43 with the pupils in `ink`. */
export function Eyes({ ink = INK, gap = 8 }: { ink?: string; gap?: number }) {
  return (
    <g fill={ink}>
      <ellipse cx={50 - gap} cy="43" rx="2" ry="2.4" />
      <ellipse cx={50 + gap} cy="43" rx="2" ry="2.4" />
    </g>
  )
}

/** A small nose: one soft stroke. */
export function Nose({ stroke }: { stroke: string }) {
  return <path d="M50 44 C48.5 48 48 50 50.5 50.5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
}
