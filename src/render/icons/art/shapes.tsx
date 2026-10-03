import type { ReactNode } from 'react'
import { C, DETAIL, SW, U } from './tokens.ts'

interface ShapeStyle {
  fill?: string
  stroke?: string
  sw?: number
  /** Optional whole-shape opacity (0..1); left out of the markup when undefined. */
  opacity?: number
}

function styleProps({ fill = 'none', stroke = C.ink, sw = SW, opacity }: ShapeStyle) {
  const none = stroke === 'none'
  return {
    fill,
    stroke: none ? 'none' : stroke,
    strokeWidth: none ? 0 : sw,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
    ...(opacity === undefined ? {} : { opacity }),
  }
}

export function Box({
  x,
  y,
  w,
  h,
  r = 8,
  ...style
}: { x: number; y: number; w: number; h: number; r?: number } & ShapeStyle): ReactNode {
  return <rect x={x} y={y} width={w} height={h} rx={r} {...styleProps(style)} />
}

export function Disc({
  x,
  y,
  r,
  ...style
}: { x: number; y: number; r: number } & ShapeStyle): ReactNode {
  return <circle cx={x} cy={y} r={r} {...styleProps(style)} />
}

export function Oval({
  x,
  y,
  rx,
  ry,
  ...style
}: { x: number; y: number; rx: number; ry: number } & ShapeStyle): ReactNode {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} {...styleProps(style)} />
}

export function Stroke({
  x1,
  y1,
  x2,
  y2,
  ...style
}: { x1: number; y1: number; x2: number; y2: number } & ShapeStyle): ReactNode {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} {...styleProps({ ...style, fill: 'none' })} />
}

/** Absolute path data only (M L H V C Q Z): the bounds test reads it. */
export function Shape({ d, ...style }: { d: string } & ShapeStyle): ReactNode {
  return <path d={d} {...styleProps(style)} />
}

/**
 * Four small square feet, one in each corner of a cols x rows footprint. Square feet at an equal
 * inset make the set identical under all 8 rotations and mirrors. Draw it first so the body sits
 * on top; only the corners peek out. Stays inside the footprint, stroke included.
 */
export function Feet({
  cols,
  rows,
  size = 11,
  inset = 6,
  fill = C.woodDeep,
}: {
  cols: number
  rows: number
  size?: number
  inset?: number
  fill?: string
}): ReactNode {
  const far = (count: number) => count * U - inset - size
  const xs = [inset, far(cols)]
  const ys = [inset, far(rows)]
  return (
    <>
      {ys.flatMap((y) =>
        xs.map((x) => (
          <Box key={`${x}-${y}`} x={x} y={y} w={size} h={size} r={3} fill={fill} sw={DETAIL} />
        )),
      )}
    </>
  )
}
