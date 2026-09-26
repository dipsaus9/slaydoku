import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useGhostClickGuard } from './useGhostClickGuard.ts'

export interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Extra class for the panel, e.g. a wider one for the help. */
  className?: string
  /** Tapping the dimmed backdrop closes it. Default true. */
  dismissible?: boolean
  /** Hidden but still mounted (its scroll position and state stay): the board shows through while something on it is pointed out. */
  peek?: boolean
}

/**
 * A plain overlay dialog. Own markup instead of <dialog>: no top-layer or focus quirks on
 * older iPad Safari, and it renders in tests. Escape and a backdrop tap close it.
 */
export function Modal({ title, onClose, children, className, dismissible = true, peek = false }: ModalProps) {
  const titleId = useId()
  // Only a press that both starts and ends on the backdrop dismisses. A long press that opened this
  // dialog ends with a click on the backdrop (the dialog appeared under the finger): that must not close it.
  const pressedBackdrop = useRef(false)
  // The end of the press that opened this dialog must not click a button in it (see modalGuard.ts).
  const ignoreGhostClick = useGhostClickGuard()
  useEffect(() => {
    if (!dismissible) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, dismissible])

  return (
    <div
      className="play-modal"
      data-peek={peek ? '' : undefined}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (dismissible && pressedBackdrop.current && e.target === e.currentTarget) onClose()
        pressedBackdrop.current = false
      }}
    >
      <div
        className={['play-modal__panel', className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClickCapture={ignoreGhostClick}
      >
        <h2 id={titleId} className="play-modal__title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
