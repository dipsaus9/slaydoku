import type { ReactNode } from 'react'

/**
 * The toolbar's icon set (CAD-10.10): line icons in one 24px box, one stroke weight, round caps and
 * joins, painted with `currentColor` so the selected state (white) and disabled state recolour
 * them with the label. Purely decorative: the button's label is its accessible name.
 */
export type ToolIconName =
  | 'note'
  | 'place'
  | 'x'
  | 'erase'
  | 'undo'
  | 'hint'
  | 'autoX'
  | 'zoomIn'
  | 'zoomOut'
  | 'options'
  | 'help'
  | 'legend'
  | 'more'

/** Shape data per icon, drawn on a 24 x 24 grid with a 2 unit stroke. */
const SHAPES: Record<ToolIconName, ReactNode> = {
  // pencil, tip bottom-left
  note: (
    <>
      <path d="M4 20l1.1-4.3L16.4 4.4a2.1 2.1 0 0 1 3 0l.2.2a2.1 2.1 0 0 1 0 3L8.3 18.9z" />
      <path d="M14.5 6.3l3.2 3.2" />
    </>
  ),
  // a person: head and shoulders (SLAY-8.2)
  place: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20.2c.6-3.7 3.3-5.7 7-5.7s6.4 2 7 5.7" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  // eraser: a slanted block with its cut line, and the ground line under it
  erase: (
    <>
      <path d="M4.5 14.7l8.6-8.6a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8L11.6 19H8.4a2 2 0 0 1-1.4-.6l-2.5-2.5a2 2 0 0 1 0-2.8" />
      <path d="M9.7 9.5l5.8 5.8M13 19h7.5" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </>
  ),
  // light bulb
  hint: (
    <>
      <path d="M12 3a6 6 0 0 0-3.7 10.7c.7.6 1.1 1.3 1.1 2.1v.2h5.2v-.2c0-.8.4-1.5 1.1-2.1A6 6 0 0 0 12 3z" />
      <path d="M9.6 19.2h4.8M10.6 21.5h2.8" />
    </>
  ),
  // a cross plus a spark: the cross that comes by itself
  autoX: (
    <>
      <path d="M4.5 10.5l8 8M12.5 10.5l-8 8" />
      <path d="M18.3 3.5v5.4M15.6 6.2H21" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="10.6" cy="10.6" r="6.6" />
      <path d="M15.5 15.5L20.5 20.5M8 10.6h5.2M10.6 8v5.2" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="10.6" cy="10.6" r="6.6" />
      <path d="M15.5 15.5L20.5 20.5M8 10.6h5.2" />
    </>
  ),
  // gear: eight teeth around a hub
  options: (
    <>
      <path d="M10.11 4.95L10.5 2.52h3l.39 2.43 1.76.73 1.99-1.45 2.13 2.13-1.45 1.99.73 1.76 2.43.39v3l-2.43.39-.73 1.76 1.45 1.99-2.13 2.13-1.99-1.45-1.76.73-.39 2.43h-3l-.39-2.43-1.76-.73-1.99 1.45-2.13-2.13 1.45-1.99-.73-1.76L2.52 13.5v-3l2.43-.39.73-1.76L4.23 6.36l2.13-2.13 1.99 1.45z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M9.4 9.4a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.3-2.6 4" />
      <path d="M12 17.4h.01" />
    </>
  ),
  // a list: a dot and a line, three times (what is what on this board)
  legend: (
    <>
      <path d="M9.5 6h11M9.5 12h11M9.5 18h11" />
      <path d="M4.2 6h.01M4.2 12h.01M4.2 18h.01" strokeWidth="2.8" />
    </>
  ),
  // three dots (SLAY-4.2): the More control, opening Options, Help and Legend
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3.2" />,
}

export function ToolIcon({ name }: { name: ToolIconName }) {
  return (
    <svg
      className="play-tool__svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
    >
      {SHAPES[name]}
    </svg>
  )
}
