import { AvatarFrame, Head, Torso, type AvatarProps } from './parts.tsx'

/**
 * Stand-in portrait for a person outside the drawn cast (a test letter, or a
 * name without its own avatar): neutral grey bust with the first letter.
 */
export function SilhouetteAvatar({ initial = '?', ...props }: AvatarProps & { initial?: string }) {
  return (
    <AvatarFrame title={initial} {...props}>
      <Torso fill="#8a93a3" shade="#66707f" />
      <Head skin="#b9c0cc" shade="#98a1b0" />
      <text
        x="50"
        y="53"
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="#ffffff"
      >
        {initial.slice(0, 1).toUpperCase()}
      </text>
    </AvatarFrame>
  )
}
