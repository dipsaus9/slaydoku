import { useEffect, useRef, type Dispatch, type PointerEvent as ReactPointerEvent, type SetStateAction } from 'react'
import type { Cell, Puzzle } from '../../engine/model/index.ts'
import type { Board as BoardData, GameAction, Hint } from '../../game/index.ts'
import { useLocale } from '../../locale/index.ts'
import { SceneObjectIcons } from '../../render/icons/index.ts'
import type { BuiltCast } from '../../render/cards/index.ts'
import type { ThemeIconId } from '../../render/icons/themes/types.ts'
import { createGeometry, SceneView, type FloorPattern } from '../../render/scene/index.ts'
import { FlashLayer, HintLayer, MarksLayer, PeopleLayer, PressRing } from './BoardLayers.tsx'
import { hintCells } from './hintCells.ts'
import { gestureIntent, paintIntent, paintModeFor, type Intent, type PaintMode, type Tool } from './intent.ts'
import { usePlayStrings } from './strings.ts'
import { useBoardZoom } from './useBoardZoom.ts'
import { cellAtPoint, useGesture } from './useGesture.ts'
import { boxAroundCells, isZoomed, revealBox, viewTransform, type View } from './zoom.ts'

export interface BoardProps {
  puzzle: Puzzle
  board: BoardData
  tool: Tool
  selectedId: string | null
  tags: Record<string, string>
  colors: Record<string, string>
  cast: BuiltCast
  hint: Hint | null
  roomStyles?: Partial<Record<string, FloorPattern>>
  /** Own theme art per object id (random themed boards); see SceneObjectIcons. */
  themeIcons?: Readonly<Record<string, ThemeIconId>>
  /** R1..Rn / C1..Cn along the left and top edge. */
  showAxisLabels?: boolean
  dispatch: (action: GameAction) => void
  /** The store’s board right now (not a render snapshot): a drag changes it many times per frame. */
  getBoard: () => BoardData
  /** Called with a hint for the player ("pick a suspect first") instead of an action. */
  onMessage: (message: 'pickSuspect') => void
  /** A placement went through: lets the screen move the selection on. */
  onPlaced?: (personId: string) => void
  /** Zoom and pan of the board (zoom.ts). The screen owns it: the toolbar button and a restart change it too. */
  view: View
  onView: Dispatch<SetStateAction<View>>
  /** Squares the Legend is pointing at (CAD-10.9); drawn inside the zoomed pane, never taking a touch. */
  flash?: readonly Cell[]
}

const NO_CELLS: readonly Cell[] = []

/**
 * The scene with the player's notes, X marks and people drawn on top, and the finger gestures:
 * tap, long press and drag (see gesture.ts / intent.ts for the rules, useGesture.ts for how
 * pointer events are wired and why Safari leaves them alone).
 *
 * Zoom (CAD-10.4): the frame (.play-board) stays put and takes every pointer event; the pane inside
 * it carries the scale and shift. One finger is a cell gesture as before; `elementFromPoint` sees the
 * transformed hit rects, so a spot on screen still resolves to the square drawn under it. Two fingers
 * pinch and pan (useBoardZoom.ts) and cancel the one-finger gesture.
 */
export function Board({ puzzle, board, tool, selectedId, tags, colors, cast, hint, roomStyles, themeIcons, showAxisLabels = true, dispatch, getBoard, onMessage, onPlaced, view, onView, flash = NO_CELLS }: BoardProps) {
  const t = usePlayStrings()
  const { locale } = useLocale()
  const stroke = useRef<{ mode: PaintMode } | null>(null)
  const run = (intent: Intent) => {
    if (!intent) return
    if ('message' in intent) return onMessage(intent.message)
    dispatch(intent.action)
    if (intent.action.type === 'place') onPlaced?.(intent.action.personId)
  }

  const { bind, pressed, cancel } = useGesture(cellAtPoint, {
    onTap: (cell: Cell) => run(gestureIntent(tool, 'tap', selectedId, cell, getBoard())),
    onLongPress: (cell: Cell) => run(gestureIntent(tool, 'longPress', selectedId, cell, getBoard())),
    onPaintStart: (cell: Cell) => {
      stroke.current = { mode: paintModeFor(tool, selectedId, cell, getBoard()) }
      run(paintIntent(tool, stroke.current.mode, selectedId, cell, getBoard()))
    },
    onPaintEnter: (cell: Cell) => {
      if (stroke.current) run(paintIntent(tool, stroke.current.mode, selectedId, cell, getBoard()))
    },
    onPaintEnd: () => {
      stroke.current = null
    },
  })

  const frame = useRef<HTMLDivElement>(null)
  const zoom = useBoardZoom(frame, view, onView, cancel)
  // After a pinch the finger left over still reaches the cell gesture, which is idle (useGesture.cancel) and ignores it.
  // The zoom sees every pointer first; the cell gesture runs only while fewer than two fingers are down.
  const handlers = {
    ...bind,
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (!zoom.bind.onPointerDown(e)) bind.onPointerDown(e)
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      if (!zoom.bind.onPointerMove(e)) bind.onPointerMove(e)
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      zoom.bind.onPointerUp(e)
      bind.onPointerUp(e)
    },
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => {
      zoom.bind.onPointerCancel(e)
      bind.onPointerCancel(e)
    },
  }

  // A hint opens on a zoomed board: bring the squares it points at into view.
  useEffect(() => {
    if (!hint) return
    const box = boxAroundCells(createGeometry(puzzle.scene, { axisLabels: showAxisLabels }), hintCells(puzzle, hint))
    if (box) onView((v) => revealBox(v, box))
  }, [hint, puzzle, showAxisLabels, onView])

  // Squares to point at on a zoomed board: bring them into view like a hint does.
  useEffect(() => {
    if (flash.length === 0) return
    const box = boxAroundCells(createGeometry(puzzle.scene, { axisLabels: showAxisLabels }), flash)
    if (box) onView((v) => revealBox(v, box))
  }, [flash, puzzle, showAxisLabels, onView])

  const layerProps = { puzzle, board, selectedId, tags, colors }
  return (
    <div
      ref={frame}
      className="play-board"
      data-tool={tool}
      data-zoomed={isZoomed(view) ? '' : undefined}
      data-zoom={view.scale.toFixed(2)}
      {...handlers}
    >
      <div className="play-board__pane" style={{ transform: viewTransform(view) }}>
        <SceneView
          scene={puzzle.scene}
          roomStyles={roomStyles}
          showAxisLabels={showAxisLabels}
          title={t.board}
          locale={locale}
          objectsLayer={(g) => <SceneObjectIcons objects={puzzle.scene.objects} geometry={g} themeIcons={themeIcons} />}
          marksLayer={(g) => (
            <>
              <HintLayer geometry={g} puzzle={puzzle} hint={hint} />
              <MarksLayer geometry={g} {...layerProps} />
              <PressRing geometry={g} cell={pressed} />
            </>
          )}
          peopleLayer={(g) => (
            <>
              <PeopleLayer geometry={g} {...layerProps} cast={cast} />
              <FlashLayer geometry={g} cells={flash} />
            </>
          )}
        />
      </div>
    </div>
  )
}
