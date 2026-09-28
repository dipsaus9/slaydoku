import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { PortraitLook } from '../../content/cast/index.ts'
import type { Cell, Puzzle } from '../../engine/model/index.ts'
import { createGameStore, defaultStorage, isPlaced, type GameStore, type StorageLike } from '../../game/index.ts'
import { useLocale } from '../../locale/index.ts'
import type { ThemeIconId } from '../../render/icons/themes/types.ts'
import type { FloorPattern } from '../../render/scene/index.ts'
import { useAxisLabels } from './axisLabels.ts'
import { Board } from './Board.tsx'
import { help } from '../../content/help/help.ts'
import { markHelpSeen, shouldShowHelp } from '../help/index.ts'
import { HelpPanel } from './HelpPanel.tsx'
import { HintBar } from './HintBar.tsx'
import { LegendPanel } from './LegendPanel.tsx'
import type { Tool } from './intent.ts'
import { OptionsPanel } from './OptionsPanel.tsx'
import { Modal } from './Modal.tsx'
import { castFor, colorsFor, formatTime, noteTags, withCastNames } from './people.ts'
import './play.css'
import { ResultOverlay } from './ResultOverlay.tsx'
import { usePlayStrings } from './strings.ts'
import { SuspectPanel } from './SuspectPanel.tsx'
import { Toolbar } from './Toolbar.tsx'
import { ToolIcon } from './toolIcons.tsx'
import { selectionAfterUndoRedo } from './undoRedoSelection.ts'
import { toggleZoom, IDENTITY, type View } from './zoom.ts'
import { useElapsed, useGameState, usePauseWhenHidden, useTelemetry } from './useGame.ts'

export interface PlayScreenProps {
  puzzle: Puzzle
  /** Key of the save slot; one level, one saved game. */
  levelId: string
  /** Heading in the top bar. */
  title?: string
  /** Floor pattern per room id (the house levels bring their own). */
  roomStyles?: Partial<Record<string, FloorPattern>>
  /** Own theme art per object id, for random themed boards (see SceneObjectIcons). */
  themeIcons?: Readonly<Record<string, ThemeIconId>>
  /** The looks of the suspects (one per suspect, in seat order), when the puzzle brings its own (a scheduled day does). Default: drawn from the cast seed. */
  portraits?: readonly PortraitLook[]
  /** Where progress is saved. Default localStorage; `null` turns saving off. */
  storage?: StorageLike | null
  /** Clock override, for tests. */
  now?: () => number
  /** Seed of the extra cast (names and faces of suspects beyond the drawn eight). */
  castSeed?: string | number
  /** Opens the "How it works" card by itself when this browser has not seen it yet (level 1 of the level flow). */
  firstVisitHelp?: boolean
  /** The share card for the solved dialog, made from the murderer and the time of the solve (the daily flow passes one). */
  resultShare?: (solve: { murdererId: string; elapsedMs: number }) => ReactNode
}

type Dialog = 'help' | 'legend' | 'options' | 'clear' | null

/**
 * One item of the header's settings sheet (SLAY-5.1): icon plus a visible label, unlike the
 * toolbar's icon-only controls — these are reached rarely enough (once per session) that the
 * label earns its place, and the sheet is not touch-target-constrained the way the toolbar is.
 */
function MenuButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" className="play-tool" onClick={onClick}>
      <span className="play-tool__icon" aria-hidden="true">{icon}</span>
      <span className="play-tool__label">{label}</span>
    </button>
  )
}

/** How long the Legend points at squares on the board before it comes back by itself. */
export const FLASH_MS = 2000

/** First person after `from` (in people order, wrapping) who is not on the grid yet. */
function nextUnplaced(order: readonly string[], from: string, placed: (id: string) => boolean): string | null {
  const start = order.indexOf(from)
  for (let step = 1; step <= order.length; step++) {
    const id = order[(start + step) % order.length]!
    if (!placed(id)) return id
  }
  return null
}

/**
 * The puzzle screen: floor plan with the player's notes, X marks and people; toolbar; the
 * polaroid cards; help, options, hints and the result overlay. Everything the player does goes
 * through the game store (src/game), so it is undoable, saved per level and auto-checked.
 * Built for iPad Safari in landscape and portrait (see play.css).
 */
export function PlayScreen({ puzzle: given, levelId, title: givenTitle, roomStyles, themeIcons, portraits, storage, now, castSeed, firstVisitHelp = false, resultShare }: PlayScreenProps) {
  const strings = usePlayStrings()
  const { locale } = useLocale()
  const title = givenTitle ?? strings.title
  const puzzle = useMemo(() => withCastNames(given, castSeed), [given, castSeed])
  const store = useMemo<GameStore>(
    () => createGameStore({ levelId, puzzle, storage, now }),
    [levelId, puzzle, storage, now],
  )
  const state = useGameState(store)
  const [showAxisLabels, setShowAxisLabels] = useAxisLabels(storage)
  const elapsed = useElapsed(store, state)
  usePauseWhenHidden(store)
  const telemetry = useTelemetry(store, puzzle, levelId, storage, now)

  const cast = useMemo(() => castFor(puzzle, castSeed, portraits), [puzzle, castSeed, portraits])
  const tags = useMemo(() => noteTags(puzzle.people), [puzzle.people])
  const colors = useMemo(() => colorsFor(puzzle.people), [puzzle.people])
  const order = useMemo(
    () => [...puzzle.people.filter((p) => p.kind === 'suspect'), ...puzzle.people.filter((p) => p.kind === 'victim')].map((p) => p.id),
    [puzzle.people],
  )

  const [tool, setTool] = useState<Tool>('note')
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const board = store.getState().board
    return order.find((id) => !isPlaced(board, id)) ?? order[0] ?? null
  })
  // Board zoom: not saved, and back to 1x for another level or a restart.
  const [view, setView] = useState<View>(IDENTITY)
  const [zoomedStore, setZoomedStore] = useState(store)
  if (zoomedStore !== store) {
    setZoomedStore(store)
    setView(IDENTITY)
  }
  // Where "seen" is remembered: the storage given, else localStorage; none at all means the card never opens by itself.
  const helpStorage = storage === undefined ? defaultStorage() : storage
  const [dialog, setDialog] = useState<Dialog>(() => (firstVisitHelp && shouldShowHelp(helpStorage) ? 'help' : null))
  // The header's settings sheet: Options and Help, one tap away from the small icon next to the
  // timer. Legend used to live here too (SLAY-5.1) but got its own direct header icon (SLAY-8.2).
  const [moreOpen, setMoreOpen] = useState(false)
  const openFromMore = (next: Dialog) => () => {
    setMoreOpen(false)
    setDialog(next)
  }
  useEffect(() => {
    if (dialog === 'help') markHelpSeen(helpStorage)
  }, [dialog, helpStorage])
  // Squares the Legend is pointing at: while set, the card steps aside so the board shows.
  const [flash, setFlash] = useState<readonly Cell[] | null>(null)
  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(null), FLASH_MS)
    return () => clearTimeout(timer)
  }, [flash])
  const closeDialog = () => {
    setDialog(null)
    setFlash(null)
  }
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0)
  const [dismissed, setDismissed] = useState<unknown>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A hint is about one position: any change of the board closes it.
  const [boardSeen, setBoardSeen] = useState(state.board)
  if (boardSeen !== state.board) {
    setBoardSeen(state.board)
    if (hintLevel !== 0) setHintLevel(0)
  }
  // The store is read inside, so the memo is keyed on the board it reads (the solver is not cheap).
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const hint = useMemo(() => (hintLevel === 0 ? null : store.hint(hintLevel, locale)), [store, hintLevel, state.board, locale])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const showHint = (level: 1 | 2 | 3) => {
    setHintLevel(level)
    telemetry.hint(level)
  }

  const say = (text: string) => {
    setToast(text)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  const solved = state.status === 'solved'
  const placedIds = puzzle.people.filter((p) => isPlaced(state.board, p.id)).map((p) => p.id)
  const showResult = state.check !== null && state.check !== dismissed

  const afterPlace = (id: string) => {
    const board = store.getState().board
    // The request may have been refused (blocked or taken square): then keep the selection.
    if (!isPlaced(board, id)) return
    setSelectedId(nextUnplaced(order, id, (other) => isPlaced(board, other)) ?? id)
  }

  // Undo/redo restore the selection the edit itself concerned, not wherever auto-advance
  // last left it. The history holds board snapshots only (no action metadata), so the person
  // is found by diffing placements immediately before and after the dispatch.
  const afterUndoRedo = (kind: 'undo' | 'redo') => {
    const before = store.getState().board
    store.dispatch({ type: kind })
    const after = store.getState().board
    const changed = selectionAfterUndoRedo(kind, before, after)
    if (changed) setSelectedId(changed)
  }

  // Tapping a card selects the person and closes any hint.
  const onCard = (id: string) => {
    setSelectedId(id)
    setHintLevel(0)
  }

  const restart = () => {
    store.dispatch({ type: 'restart' })
    telemetry.restart()
    setDismissed(null)
    setHintLevel(0)
    setSelectedId(order[0] ?? null)
    setView(IDENTITY)
  }

  return (
    <div className="play" data-status={state.status} data-hint={hintLevel !== 0 ? '' : undefined}>
      <header className="play-header">
        <h1 className="play-header__title">{title}</h1>
        <div className="play-header__actions">
          {state.options.showTimer ? (
            <button
              type="button"
              className="play-timer"
              aria-label={strings.timerHide}
              onClick={() => store.dispatch({ type: 'setOption', option: 'showTimer', value: false })}
            >
              <span aria-hidden="true">{'⏱'}</span> {formatTime(elapsed)}
            </button>
          ) : (
            <button
              type="button"
              className="play-timer play-timer--off"
              aria-label={strings.timerShow}
              onClick={() => store.dispatch({ type: 'setOption', option: 'showTimer', value: true })}
            >
              <span aria-hidden="true">{'⏱'}</span>
            </button>
          )}
          {/* Legend gets its own direct header icon (SLAY-8.2): checked often enough mid-solve
              that a second tap through the More sheet was too slow. Options and Help stay behind
              that sheet — once-per-session actions. */}
          <button
            type="button"
            className="play-header__legend"
            aria-label={strings.tools.legend}
            title={strings.toolTitle.legend}
            onClick={() => setDialog('legend')}
          >
            <ToolIcon name="legend" />
          </button>
          <button
            type="button"
            className="play-header__more"
            aria-label={strings.tools.more}
            aria-pressed={moreOpen}
            onClick={() => setMoreOpen(true)}
          >
            <ToolIcon name="more" />
          </button>
        </div>
      </header>
      {moreOpen ? (
        <Modal title={strings.tools.more} onClose={() => setMoreOpen(false)} className="play-modal__panel--more">
          <div className="play-more">
            <MenuButton icon={<ToolIcon name="options" />} label={strings.tools.options} onClick={openFromMore('options')} />
            <MenuButton icon={<ToolIcon name="help" />} label={strings.tools.help} onClick={openFromMore('help')} />
          </div>
        </Modal>
      ) : null}

      <div className="play-boardwrap">
        <Board
          puzzle={puzzle}
          board={state.board}
          tool={tool}
          selectedId={selectedId}
          tags={tags}
          colors={colors}
          cast={cast}
          hint={hint}
          roomStyles={roomStyles}
          themeIcons={themeIcons}
          showAxisLabels={showAxisLabels}
          dispatch={store.dispatch}
          getBoard={() => store.getState().board}
          onMessage={() => say(strings.pickSuspect)}
          onPlaced={afterPlace}
          view={view}
          onView={setView}
          flash={flash ?? undefined}
        />
      </div>

      <div className="play-tools">
        <Toolbar
          tool={tool}
          onTool={setTool}
          canUndo={!solved && state.history.past.length > 0}
          canRedo={!solved && state.history.future.length > 0}
          hintOpen={hintLevel !== 0}
          zoom={view}
          onZoom={() => setView(toggleZoom)}
          onUndo={() => afterUndoRedo('undo')}
          onRedo={() => afterUndoRedo('redo')}
          onHint={() => (hintLevel === 0 ? showHint(1) : setHintLevel(0))}
          onClearAll={() => setDialog('clear')}
        />
      </div>

      <div className="play-side">
        <SuspectPanel puzzle={puzzle} cast={cast} selectedId={selectedId} placedIds={placedIds} onSelect={onCard} />
      </div>

      {hintLevel !== 0 ? (
        <HintBar
          level={hintLevel}
          hint={hint}
          onMore={() => showHint(Math.min(3, hintLevel + 1) as 1 | 2 | 3)}
          onClose={() => setHintLevel(0)}
          onPlace={(personId, cell) => {
            telemetry.hintPlacement()
            store.dispatch({ type: 'place', personId, cell })
            afterPlace(personId)
          }}
        />
      ) : null}
      {toast ? <div className="play-toast" role="status">{toast}</div> : null}

      {dialog === 'help' ? <HelpPanel onClose={() => setDialog(null)} onLegend={() => setDialog('legend')} /> : null}
      {dialog === 'legend' ? (
        <LegendPanel puzzle={puzzle} cast={cast} tags={tags} colors={colors} onShow={setFlash} peek={flash !== null} onClose={closeDialog} />
      ) : null}
      {flash ? (
        <button type="button" className="play-peek" aria-label={help.legend.peek} onClick={() => setFlash(null)}>
          <span className="play-peek__chip" aria-hidden="true">{help.legend.peek}</span>
        </button>
      ) : null}
      {dialog === 'options' ? (
        <OptionsPanel
          options={state.options}
          showAxisLabels={showAxisLabels}
          onAxisLabels={setShowAxisLabels}
          onChange={(option, value) => store.dispatch({ type: 'setOption', option, value })}
          onClearAll={() => store.dispatch({ type: 'clearAll' })}
          onRestart={restart}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === 'clear' ? (
        <Modal title={strings.clearConfirm.title} onClose={() => setDialog(null)}>
          <p>{strings.clearConfirm.text}</p>
          <div className="play-modal__actions">
            <button type="button" className="play-btn" onClick={() => setDialog(null)}>
              {strings.clearConfirm.no}
            </button>
            <button
              type="button"
              className="play-btn play-btn--danger"
              onClick={() => {
                store.dispatch({ type: 'clearAll' })
                setDialog(null)
              }}
            >
              {strings.clearConfirm.yes}
            </button>
          </div>
        </Modal>
      ) : null}
      {showResult && state.check ? (
        <ResultOverlay puzzle={puzzle} result={state.check} onRestart={restart} onDismiss={() => setDismissed(state.check)} share={state.check.solved ? resultShare?.(state.check) : undefined} />
      ) : null}
    </div>
  )
}
