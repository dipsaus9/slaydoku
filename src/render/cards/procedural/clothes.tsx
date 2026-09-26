import type { ReactNode } from 'react'
import { darken } from './color.ts'
import type { ClothesStyle } from './traits.ts'

/** Parts of the outfit that sit behind the neck and hair (drawn before the head). */
export function ClothesBack({ style, color }: { style: ClothesStyle; color: string }): ReactNode {
  if (style === 'stripes') {
    return (
      <g stroke="#ffffff" strokeWidth="3" opacity="0.4">
        <path d="M16 86 L84 86" />
        <path d="M12 93 L88 93" />
        <path d="M9 100 L91 100" />
      </g>
    )
  }
  if (style !== 'hoodie') return null
  return <path d="M28 86 C26 68 38 66 50 68 C62 66 74 68 72 86 Z" fill={darken(color, 0.22)} />
}

/** Parts of the outfit that sit in front of the neck (drawn after the head). */
export function ClothesFront({
  style,
  color,
  skin,
}: {
  style: ClothesStyle
  color: string
  skin: string
}): ReactNode {
  const dark = darken(color, 0.3)
  switch (style) {
    case 'crew':
      return <path d="M41 76 C45 82 55 82 59 76" fill="none" stroke={dark} strokeWidth="2.2" strokeLinecap="round" />
    case 'vneck':
      return (
        <g>
          <path d="M41 75 L50 90 L59 75 Z" fill={skin} />
          <path d="M41 75 L50 90 L59 75" fill="none" stroke={dark} strokeWidth="1.8" strokeLinejoin="round" />
        </g>
      )
    case 'hoodie':
      return (
        <g fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round">
          <path d="M45.5 79 L45 91" />
          <path d="M54.5 79 L55 91" />
        </g>
      )
    case 'collar':
      return (
        <g fill="#ffffff" stroke={dark} strokeWidth="0.8" strokeLinejoin="round">
          <path d="M41 74 L50 88 L38 85 Z" />
          <path d="M59 74 L50 88 L62 85 Z" />
        </g>
      )
    default:
      return null
  }
}
