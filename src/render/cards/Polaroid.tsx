import type { CSSProperties, ReactNode } from 'react'
import './cards.css'
import { CARD_NL } from './strings.ts'

export interface PolaroidProps {
  /** The portrait drawing. */
  portrait: ReactNode
  /** Backdrop colour behind the portrait. */
  photoColor: string
  /** Name written under the photo. */
  name: string
  /** Fill of the clue bubble. */
  bubbleColor: string
  /** The clue text. Wraps; the card grows to fit it. A person with several cards gets one line per card. */
  text: string | readonly string[]
  /** Extra line above the text, e.g. the victim's title on the victim card. */
  variant?: 'suspect' | 'victim'
  selected?: boolean
  placed?: boolean
  /** Makes the card a button. */
  onClick?: () => void
  className?: string
}

/**
 * One polaroid: white frame, coloured photo, handwritten name and a rounded
 * clue bubble that overlaps the bottom edge, like the printed puzzle sheets.
 * Own layout and styling, no official art.
 */
export function Polaroid({
  portrait,
  photoColor,
  name,
  bubbleColor,
  text,
  variant = 'suspect',
  selected = false,
  placed = false,
  onClick,
  className,
}: PolaroidProps) {
  const lines = (typeof text === 'string' ? [text] : text).filter((line) => line !== '')
  const classes = ['polaroid', `polaroid--${variant}`, className].filter(Boolean).join(' ')
  const pic: CSSProperties = { backgroundColor: photoColor }
  const bubble: CSSProperties = { backgroundColor: bubbleColor }
  const body = (
    <>
      <span className="polaroid__photo">
        <span className="polaroid__pic" style={pic}>
          {portrait}
        </span>
        {placed ? (
          <span className="polaroid__badge" aria-hidden="true">
            ✓
          </span>
        ) : null}
      </span>
      <span className="polaroid__name">{name}</span>
      {lines.length > 0 ? (
        <span className="polaroid__clue" style={bubble}>
          {lines.map((line, i) => (
            <span key={i} className="polaroid__line">
              {line}
            </span>
          ))}
        </span>
      ) : null}
      {selected ? <span className="polaroid__sr">{CARD_NL.selected}</span> : null}
      {placed ? <span className="polaroid__sr">{CARD_NL.placed}</span> : null}
    </>
  )
  const state = { 'data-selected': selected || undefined, 'data-placed': placed || undefined }

  return onClick ? (
    <button type="button" className={classes} aria-pressed={selected} onClick={onClick} {...state}>
      {body}
    </button>
  ) : (
    <div className={classes} {...state}>
      {body}
    </div>
  )
}
