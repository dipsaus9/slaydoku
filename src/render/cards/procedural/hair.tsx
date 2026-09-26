import type { ReactNode } from 'react'
import { darken } from './color.ts'
import type { HairStyle } from './traits.ts'

/** Hair caps over the top of the head (the head is centred on 50, 42). */
const CAP = 'M30.5 40 C29 22 40 15.5 50 15.5 C61 15.5 71 22 69.5 40 C67 31 60 27.5 50 27.5 C40 27.5 33 31 30.5 40 Z'
const CAP_CLOSE = 'M31.5 38 C31 24 41 19 50 19 C59 19 69 24 68.5 38 C66 30 59 27 50 27 C41 27 34 30 31.5 38 Z'
const CAP_SWEEP = 'M30 42 C27 20 42 13 56 15 C68 17 72 28 70 42 C68 33 62 28 52 27 C44 30 36 31 30 42 Z'
const CAP_FRINGE = 'M30 42 C27 20 40 14.5 50 14.5 C62 14.5 73 20 70 42 C69 34 64 31 50 31 C36 31 31 34 30 42 Z'

type Circle = readonly [number, number, number]

const CURLS: readonly Circle[] = [
  [28, 44, 9],
  [27, 32, 9],
  [33, 22, 10],
  [44, 15, 10],
  [56, 15, 10],
  [67, 22, 10],
  [73, 32, 9],
  [72, 44, 9],
]
const CURL_FRINGE: readonly Circle[] = [
  [39, 29, 7],
  [50, 26, 7.5],
  [61, 29, 7],
]

export interface HairLayers {
  /** Drawn before the head: long hair, ponytail, bun. */
  back: ReactNode
  /** Drawn over the head. */
  front: ReactNode
}

function circles(list: readonly Circle[]): ReactNode {
  return list.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />)
}

/**
 * Hair for one style. With a hat on, the crown is left to the hat: only what
 * hangs out below it (long hair, side curls, ponytail) stays.
 */
export function hairLayers(style: HairStyle, color: string, hat: boolean): HairLayers {
  const shade = darken(color, 0.18)
  switch (style) {
    case 'bald':
      return {
        back: null,
        front: hat ? null : (
          <g fill={color}>
            <ellipse cx="31" cy="38" rx="3.5" ry="6" />
            <ellipse cx="69" cy="38" rx="3.5" ry="6" />
          </g>
        ),
      }
    case 'buzz':
      return { back: null, front: hat ? null : <path d={CAP_CLOSE} fill={color} /> }
    case 'short':
      return { back: null, front: hat ? null : <path d={CAP} fill={color} /> }
    case 'sidePart':
      return {
        back: null,
        front: hat ? null : (
          <g>
            <path d={CAP_SWEEP} fill={color} />
            <path d="M58 15.5 C54 20 50 24 44 27" fill="none" stroke={shade} strokeWidth="1.3" strokeLinecap="round" />
          </g>
        ),
      }
    case 'curly':
      return {
        back: null,
        front: (
          <g fill={color}>
            {circles(hat ? CURLS.filter(([, y]) => y >= 32) : [...CURLS, ...CURL_FRINGE])}
          </g>
        ),
      }
    case 'bob':
      return {
        back: (
          <path
            d="M27 44 C24 22 36 13 50 13 C64 13 76 22 73 44 L74 68 C68 72 62 68 62 66 L38 66 C38 68 32 72 26 68 Z"
            fill={color}
          />
        ),
        front: hat ? null : <path d={CAP_SWEEP} fill={color} />,
      }
    case 'long':
      return {
        back: <path d="M27 42 C22 20 36 12 50 12 C64 12 78 20 73 42 L78 90 L22 90 Z" fill={color} />,
        front: hat ? null : <path d={CAP_FRINGE} fill={color} />,
      }
    case 'bun':
      return {
        back: hat ? null : <circle cx="50" cy="13" r="8" fill={color} />,
        front: hat ? null : <path d={CAP} fill={color} />,
      }
    case 'ponytail':
      return {
        back: <path d="M62 24 C82 20 90 44 80 68 C76 54 72 42 64 36 Z" fill={color} />,
        front: hat ? null : <path d={CAP_FRINGE} fill={color} />,
      }
  }
}
