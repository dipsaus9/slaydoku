import { INK } from '../avatars/parts.tsx'
import { darken } from './color.ts'
import type { ProceduralTraits } from './traits.ts'

/** Facial hair that sits on the face before the mouth is drawn. */
export function FaceHair({ traits }: { traits: ProceduralTraits }) {
  const { accessory, hairColor } = traits
  if (accessory === 'beard') {
    return (
      <path
        d="M31 46 C31 63 40 69 50 69 C60 69 69 63 69 46 C67 56 60 59 50 59 C40 59 33 56 31 46 Z"
        fill={hairColor}
      />
    )
  }
  if (accessory === 'moustache') {
    return (
      <path
        d="M39.5 55 C43.5 50.5 48 52.5 50 54.5 C52 52.5 56.5 50.5 60.5 55 C56.5 57 53 55.5 50 56 C47 55.5 43.5 57 39.5 55 Z"
        fill={hairColor}
      />
    )
  }
  return null
}

const FRECKLES: readonly (readonly [number, number])[] = [
  [40, 49],
  [43.5, 50.5],
  [38, 51.5],
  [60, 49],
  [56.5, 50.5],
  [62, 51.5],
]

/** Things worn over hair and face: glasses, freckles, hoops, headband, hats. */
export function Wearables({ traits }: { traits: ProceduralTraits }) {
  const { accessory, skin, accentColor } = traits
  switch (accessory) {
    case 'roundGlasses':
      return (
        <g fill="none" stroke={INK} strokeWidth="2">
          <circle cx="41.5" cy="43" r="6.8" />
          <circle cx="58.5" cy="43" r="6.8" />
          <path d="M48.3 42.5 C49.5 41.5 50.5 41.5 51.7 42.5" />
          <path d="M34.7 42 L31 40.5 M65.3 42 L69 40.5" />
        </g>
      )
    case 'squareGlasses':
      return (
        <g fill="none" stroke={accentColor} strokeWidth="2.2" strokeLinejoin="round">
          <rect x="34.5" y="38" width="13" height="10" rx="2.5" />
          <rect x="52.5" y="38" width="13" height="10" rx="2.5" />
          <path d="M47.5 41.5 L52.5 41.5" />
          <path d="M34.5 40.5 L31 39.5 M65.5 40.5 L69 39.5" />
        </g>
      )
    case 'freckles':
      return (
        <g fill={darken(skin, 0.28)}>
          {FRECKLES.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.95" />
          ))}
        </g>
      )
    case 'hoops':
      return (
        <g fill="none" stroke="#e0b13a" strokeWidth="1.7">
          <circle cx="31.5" cy="52" r="3.6" />
          <circle cx="68.5" cy="52" r="3.6" />
        </g>
      )
    case 'headband':
      return (
        <path
          d="M30.5 38 C30.5 24 40 17.5 50 17.5 C60 17.5 69.5 24 69.5 38"
          fill="none"
          stroke={accentColor}
          strokeWidth="4.2"
        />
      )
    case 'beanie':
      return (
        <g>
          <path d="M30 36 C28.5 15 40 10 50 10 C60 10 71.5 15 70 36 Z" fill={accentColor} />
          <rect x="29.5" y="30" width="41" height="7" rx="2" fill={darken(accentColor, 0.22)} />
          <circle cx="50" cy="8.5" r="4.2" fill={darken(accentColor, 0.12)} />
        </g>
      )
    case 'cap':
      return (
        <g>
          <path d="M30.5 35 C30 19 40 13 50 13 C60 13 70 19 69.5 35 Z" fill={accentColor} />
          <path d="M30.5 35 L79 35 C79 38.5 72 39.5 66 39.5 L30.5 39.5 Z" fill={darken(accentColor, 0.28)} />
          <circle cx="50" cy="12.5" r="1.8" fill={darken(accentColor, 0.28)} />
        </g>
      )
    default:
      return null
  }
}
