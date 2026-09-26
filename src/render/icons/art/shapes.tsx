import type { ReactNode } from 'react'
import { C, SW } from './tokens.ts'

interface ShapeStyle {
  fill?: string
  stroke?: string
  sw?: number
}

function styleProps({ fill = 'none', stroke = C.ink, sw = SW }: ShapeStyle) {
  const none = stroke === 'none'
  return {
    fill,
    stroke: none ? 'none' : stroke,
    strokeWidth: none ? 0 : sw,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
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
