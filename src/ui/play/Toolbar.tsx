import type { ReactNode } from 'react'
import type { GameOptions } from '../../game/index.ts'
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

/** A 44px+ touch target: icon on top, short label below. */
function ToolButton({ icon, label, title, pressed, disabled, onClick, className }: ToolButtonProps) {
  return (
    <button
      type="button"
      className={['play-tool', className].filter(Boolean).join(' ')}
      aria-pressed={pressed}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      <span className="play-tool__icon" aria-hidden="true">{icon}</span>
      <span className="play-tool__label">{label}</span>
    </button>
  )
}

const ORIGIN = { row: 0, col: 0 }

/**
 * The eraser is one button with two gestures: a tap selects the eraser tool, a long press asks
 * to clear the whole board (as in the official app). Uses the same tap/long-press machine as
 * the board, so it also survives Safari's callout.
 */
function EraserButton({ active, onSelect, onClearAll }: { active: boolean; onSelect: () => void; onClearAll: () => void }) {
  const t = usePlayStrings()
  const { bind } = useGesture(() => ORIGIN, { onTap: onSelect, onLongPress: onClearAll }, { longPressMs: 600, slopPx: 16 })
  return (
    <button
      type="button"
      className="play-tool play-tool--hold"
      aria-pressed={active}
      title={t.toolTitle.erase}
      {...bind}
      // Keyboard and screen readers: Enter/Space clicks; the pointer path handles touch.
      onClick={(e) => e.detail === 0 && onSelect()}
    >
      <span className="play-tool__icon" aria-hidden="true"><ToolIcon name="erase" /></span>
      <span className="play-tool__label">{t.tools.erase}</span>
    </button>
  )
}

export interface ToolbarProps {
  tool: Tool
  onTool: (tool: Tool) => void
  options: GameOptions
  canUndo: boolean
  canRedo: boolean
  hintOpen: boolean
  /** Zoom of the board: the button shows it, is pressed while zoomed, and toggles 1x and 2x. */
  zoom: View
  onZoom: () => void
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
  onToggleAutoX: () => void
  onOpenOptions: () => void
  onOpenHelp: () => void
  onOpenLegend: () => void
  onClearAll: () => void
}

export function Toolbar(props: ToolbarProps) {
  const strings = usePlayStrings()
  const t = strings.tools
  const { tool, onTool, options } = props
  return (
    <div className="play-toolbar" role="toolbar" aria-label={t.label}>
      <div className="play-toolbar__group" role="group" aria-label={t.mode}>
        <ToolButton icon={<ToolIcon name="note" />} label={t.note} title={strings.toolTitle.note} pressed={tool === 'note'} onClick={() => onTool('note')} />
        <ToolButton icon={<ToolIcon name="place" />} label={t.place} title={strings.toolTitle.place} pressed={tool === 'place'} onClick={() => onTool('place')} />
        <ToolButton icon={<ToolIcon name="x" />} label={t.x} title={strings.toolTitle.x} pressed={tool === 'x'} onClick={() => onTool('x')} />
        <EraserButton active={tool === 'erase'} onSelect={() => onTool('erase')} onClearAll={props.onClearAll} />
      </div>
      <div className="play-toolbar__group">
        <ToolButton icon={<ToolIcon name="undo" />} label={t.undo} disabled={!props.canUndo} onClick={props.onUndo} />
        <ToolButton icon={<ToolIcon name="redo" />} label={t.redo} disabled={!props.canRedo} onClick={props.onRedo} />
        <ToolButton icon={<ToolIcon name="hint" />} label={t.hint} pressed={props.hintOpen} onClick={props.onHint} />
        <ToolButton icon={<ToolIcon name="autoX" />} label={t.autoX} pressed={options.autoXOnPlace} title={strings.options.autoXHelp} onClick={props.onToggleAutoX} className="play-tool--toggle" />
      </div>
      <div className="play-toolbar__group">
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
        <ToolButton icon={<ToolIcon name="options" />} label={t.options} onClick={props.onOpenOptions} />
        <ToolButton icon={<ToolIcon name="help" />} label={t.help} onClick={props.onOpenHelp} />
        <ToolButton icon={<ToolIcon name="legend" />} label={t.legend} title={strings.toolTitle.legend} onClick={props.onOpenLegend} />
      </div>
    </div>
  )
}
