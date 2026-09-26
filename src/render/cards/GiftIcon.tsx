import { AVATAR_VIEWBOX, INK } from './avatars/parts.tsx'

/** The victim's portrait: a wrapped present with a big bow. Own drawing, flat like the avatars. */
export function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${AVATAR_VIEWBOX} ${AVATAR_VIEWBOX}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="50" cy="90" rx="34" ry="5" fill={INK} opacity="0.14" />
      <rect x="18" y="46" width="64" height="42" rx="3" fill="#e2495f" />
      <rect x="64" y="46" width="18" height="42" fill="#b8293f" opacity="0.5" />
      <rect x="14" y="34" width="72" height="16" rx="3" fill="#f0627a" />
      <rect x="44" y="34" width="12" height="54" fill="#ffd23f" />
      <path d="M50 34 C36 34 26 26 30 18 C34 10 46 16 50 34 Z" fill="#ffd23f" />
      <path d="M50 34 C64 34 74 26 70 18 C66 10 54 16 50 34 Z" fill="#f5b81a" />
      <circle cx="50" cy="34" r="5" fill="#ffe27a" />
    </svg>
  )
}
