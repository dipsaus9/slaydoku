import type { ReactNode } from 'react'
import type { Tool } from './intent.ts'
import { usePlayStrings } from './strings.ts'
import { ToolIcon } from './toolIcons.tsx'
import { useGesture } from './useGesture.ts'
import { isZoomed, zoomLabel, type View } from './zoom.ts'

interface ToolButtonProps {
  icon: ReactNode
  label: string
  title?: string
  pressed?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

/**
 * A 44px+ touch target: icon-only on phone widths, icon plus its text label wherever there is
 * room (SLAY-8.2 brings the label back on larger-than-mobile viewports; `play-tool__label` is
 * hidden by a phone-width media query in play.css). The label is always the button's accessible
 * name (`aria-label`) and, absent a longer one, its `title` too.
 */
function ToolButton({ icon, label, title, pressed, disabled, onClick, className }: ToolButtonProps) {
  return (
    <button
      type="button"
      className={['play-tool', className].filter(Boolean).join(' ')}
      aria-pressed={pressed}
      aria-label={label}
      disabled={disabled}
      title={title ?? label}
      onClick={onClick}
    >
      <span className="play-tool__icon" aria-hidden="true">{icon}</span>
      <span className="play-tool__label" aria-hidden="true">{label}</span>
    </button>
  )
}

const ORIGIN = { row: 0, col: 0 }

/**
 * The eraser is one button with two gestures: a tap selects the eraser tool, a long press asks
 * to clear the whole board (as in the official app). Uses the same tap/long-press machine as
 * the board, so it also survives Safari's callout.
 */
function EraserButton({ active, label, title, onSelect, onClearAll }: { active: boolean; label: string; title: string; onSelect: () => void; onClearAll: () => void }) {
  const { bind } = useGesture(() => ORIGIN, { onTap: onSelect, onLongPress: onClearAll }, { longPressMs: 600, slopPx: 16 })
  return (
    <button
      type="button"
      className="play-tool play-tool--erase"
      aria-pressed={active}
      aria-label={label}
      title={title}
      {...bind}
      // Keyboard and screen readers: Enter/Space clicks; the pointer path handles touch.
      onClick={(e) => e.detail === 0 && onSelect()}
    >
      <span className="play-tool__icon" aria-hidden="true"><ToolIcon name="erase" /></span>
      <span className="play-tool__label" aria-hidden="true">{label}</span>
    </button>
  )
}

/**
 * Undo is one button with two gestures, the same machine the eraser uses (SLAY-5.1): a tap
 * undoes, a long press redoes — Redo no longer has a button of its own. Each gesture no-ops on
 * its own when there is nothing to do, so e.g. a long press still redoes right after the last
 * possible undo (`canUndo` false, `canRedo` true); the button only goes fully `disabled` (and
 * unreachable by keyboard) when neither is possible.
 */
function UndoButton({ canUndo, canRedo, label, title, onUndo, onRedo }: { canUndo: boolean; canRedo: boolean; label: string; title?: string; onUndo: () => void; onRedo: () => void }) {
  const { bind } = useGesture(
    () => ORIGIN,
    { onTap: () => canUndo && onUndo(), onLongPress: () => canRedo && onRedo() },
    { longPressMs: 600, slopPx: 16 },
  )
  return (
    <button
      type="button"
      className="play-tool play-tool--undo"
      aria-label={label}
      title={title ?? label}
      disabled={!canUndo && !canRedo}
      {...bind}
      onClick={(e) => e.detail === 0 && canUndo && onUndo()}
    >
      <span className="play-tool__icon" aria-hidden="true"><ToolIcon name="undo" /></span>
      <span className="play-tool__label" aria-hidden="true">{label}</span>
    </button>
  )
}

export interface ToolbarProps {
  tool: Tool
  onTool: (tool: Tool) => void
  canUndo: boolean
  canRedo: boolean
  hintOpen: boolean
  /** Zoom of the board: the button shows it, is pressed while zoomed, and toggles 1x and 2x. */
  zoom: View
  onZoom: () => void
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
  onClearAll: () => void
}

/**
 * The play-screen toolbar: seven controls, the same set on every viewport — Place, Note, X,
 * Erase, Undo, Hint, Zoom. Icon-only on phone widths; the text label returns next to the icon
 * wherever there is room (SLAY-8.2, play.css). Place came back as its own mode (SLAY-8.2):
 * SLAY-5.1 had removed it on the theory that its one capability, a tap that places, was already
 * reachable as the long press every mode has — but that made placing itself undiscoverable, so a
 * visible button is back. Redo lives behind a long press on Undo; Options, Help and Legend moved
 * to a small icon in the play-screen header (Legend also gets its own direct header icon).
 */
export function Toolbar(props: ToolbarProps) {
  const strings = usePlayStrings()
  const t = strings.tools
  const { tool, onTool } = props
  return (
    <div className="play-toolbar" role="toolbar" aria-label={t.label}>
      <ToolButton icon={<ToolIcon name="place" />} label={t.place} title={strings.toolTitle.place} pressed={tool === 'place'} onClick={() => onTool('place')} />
      <ToolButton icon={<ToolIcon name="note" />} label={t.note} title={strings.toolTitle.note} pressed={tool === 'note'} onClick={() => onTool('note')} />
      <ToolButton icon={<ToolIcon name="x" />} label={t.x} title={strings.toolTitle.x} pressed={tool === 'x'} onClick={() => onTool('x')} />
      <EraserButton active={tool === 'erase'} label={t.erase} title={strings.toolTitle.erase} onSelect={() => onTool('erase')} onClearAll={props.onClearAll} />
      <UndoButton canUndo={props.canUndo} canRedo={props.canRedo} label={t.undo} onUndo={props.onUndo} onRedo={props.onRedo} />
      <ToolButton icon={<ToolIcon name="hint" />} label={t.hint} pressed={props.hintOpen} onClick={props.onHint} />
      <ToolButton
        icon={
          <>
            <ToolIcon name={isZoomed(props.zoom) ? 'zoomOut' : 'zoomIn'} />
            <span className="play-tool__badge">{zoomLabel(props.zoom)}</span>
          </>
        }
        label={t.zoom}
        title={strings.toolTitle.zoom}
        pressed={isZoomed(props.zoom)}
        onClick={props.onZoom}
        className="play-tool--zoom"
      />
    </div>
  )
}
