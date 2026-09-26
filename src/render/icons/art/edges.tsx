import type { ReactNode } from 'react'
import { Box, Disc, Stroke } from './shapes.tsx'
import { C } from './tokens.ts'

/** Edge features are drawn in a box one cell long and `EDGE_THICKNESS` thick, centred on the grid line. */
export const EDGE_LENGTH = 100
export const EDGE_THICKNESS = 20
const EDGE_SW = 4

/** Window: a pale glass pane in a frame, as on the official legend. */
export function windowArt(): ReactNode {
  return (
    <>
      <Box x={14} y={4} w={72} h={12} r={6} fill={C.sky} sw={EDGE_SW} />
      <Stroke x1={26} y1={10} x2={74} y2={10} stroke={C.white} sw={3} />
    </>
  )
}

/** Door seen from above: a wooden leaf filling the gap in the wall, with a handle. */
export function doorArt(): ReactNode {
  return (
    <>
      <Box x={14} y={4} w={72} h={12} r={4} fill={C.woodLight} sw={EDGE_SW} />
      <Disc x={74} y={10} r={2} fill={C.ink} sw={2} />
    </>
  )
}
