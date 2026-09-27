import { AVATAR_VIEWBOX, INK } from './avatars/parts.tsx'

/** The victim's portrait: a chalk outline on the floor, one foot tagged like evidence. Own drawing, flat like the avatars. */
export function VictimIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${AVATAR_VIEWBOX} ${AVATAR_VIEWBOX}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="50" cy="90" rx="34" ry="5" fill={INK} opacity="0.14" />
      <g fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="24" r="10" />
        <path d="M50 34 L50 60" />
        <path d="M50 40 L22 24" />
        <path d="M50 40 L80 30" />
        <path d="M50 60 L26 90" />
        <path d="M50 60 L74 88" />
      </g>
      <path d="M74 88 L83 93" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="61" y="77" width="20" height="13" rx="2" fill="#fdf8ec" stroke={INK} strokeWidth="2.5" transform="rotate(18 71 83.5)" />
    </svg>
  )
}
