import { readFileSync } from 'node:fs'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { at, puzzle as tutorial } from '../../game/fixture.ts'
import { createGameStore, DEFAULT_OPTIONS, isPlaced } from '../../game/index.ts'
import type { Cell } from '../../engine/model/index.ts'
import { LocaleProvider } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { AXIS_LABELS_KEY } from './axisLabels.ts'
import { help } from '../../content/help/help.ts'
import type { StorageLike } from '../../game/index.ts'
import { Glossary, markHelpSeen } from '../help/index.ts'
import { createMemoryStorage } from '../../game/memoryStorage.ts'
import { Board } from './Board.tsx'
import { HelpPanel } from './HelpPanel.tsx'
import { Modal } from './Modal.tsx'
import { IDENTITY } from './zoom.ts'
import { OptionsPanel } from './OptionsPanel.tsx'
import { gestureIntent, paintIntent, paintModeFor, type Intent, type Tool } from './intent.ts'
import { PlayScreen } from './PlayScreen.tsx'
import { ResultOverlay } from './ResultOverlay.tsx'
import { PLAY_STRINGS } from './strings.ts'
import { castFor, colorsFor, noteTags, withCastNames } from './people.ts'
import { selectionAfterUndoRedo } from './undoRedoSelection.ts'

const named = withCastNames(tutorial)
const idOf = (label: string) => named.people.find((p) => p.label === label)!.id
// The cast of the tutorial puzzle: pool names (castFor), not fixed ones.
const [Alice, Ben, Chloe] = named.people.filter((p) => p.kind === 'suspect').map((p) => p.label) as [string, string, string]

/** The browser language `LocaleProvider` defaults from, per `Locale` (SLAY-3.4). */
const BROWSER_LANGUAGE: Record<Locale, string> = { en: 'en-US', nl: 'nl-NL' }
const withLocale = (locale: Locale, children: ReactNode) => (
  <LocaleProvider storage={null} browserLanguage={BROWSER_LANGUAGE[locale]}>
    {children}
  </LocaleProvider>
)

describe('<PlayScreen/>', () => {
  const html = renderToStaticMarkup(<PlayScreen puzzle={tutorial} levelId="test" storage={null} now={() => 0} />)

  it('draws the board with one hit rect per cell', () => {
    expect((html.match(/data-cell="r\dc\d"/g) ?? []).length).toBe(16)
  })

  it('shows every suspect card by cast name, plus the gift', () => {
    for (const name of [Alice, Ben, Chloe, 'The victim']) expect(html).toContain(name)
    expect(html).toContain(`${Alice} stood next to a table.`)
  })

  it('has the six toolbar tools, by aria-label, in English (no LocaleProvider ancestor here: useLocale() falls back to English)', () => {
    // Six controls (SLAY-8.2: Place is back; SLAY-9.8: Zoom is gone, pinch/ctrl+wheel cover it),
    // Redo still lives behind a long press on Undo. On narrow viewports Options/Help sit behind
    // the header's settings icon (aria-label "More"); Legend has its own direct header icon
    // (SLAY-8.2, always icon-only).
    for (const label of ['Place', 'Note', 'X', 'Erase', 'Undo', 'Hint']) {
      expect(html).toContain(`aria-label="${label}"`)
    }
    expect(html).not.toContain('aria-label="Redo"')
    expect(html).toContain('role="toolbar"')
    // The header's Legend icon and its settings icon (Options, Help), next to the timer.
    expect(html).toContain('aria-label="Legend"')
    expect(html).toContain('aria-label="More"')
    expect(html).toContain('play-header__more')
  })

  it('also renders Options and Help as direct header actions (SLAY-9.2): CSS alone decides whether the inline pair or the ... trigger is visible, so both stay mounted', () => {
    expect(html).toContain('play-header__quick')
    // Reused MenuButtons (icon + visible label), same as inside the More sheet -- no aria-label of
    // their own, unlike the icon-only Legend/More.
    expect(html).toContain('>Options<')
    expect(html).toContain('>Help<')
    expect(html).not.toContain('aria-label="Options"')
    expect(html).not.toContain('aria-label="Help"')
  })

  it('gates the inline pair vs. the ... trigger purely in css, on the same breakpoint the rest of the phone layout uses (SLAY-9.2)', async () => {
    const css = (await import('node:fs')).readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    expect(css).toMatch(/\.play-header__quick \{\s*display: none;/)
    const wide = css.match(/@media \(min-width: 641px\) \{([^]*?)\n\}/)?.[1] ?? ''
    expect(wide).toMatch(/\.play-header__quick \{\s*display: flex;/)
    expect(wide).toMatch(/\.play-header__more \{\s*display: none;/)
  })

  it('lays the header out as two rows on a portrait phone and one row at desktop widths, with Legend labelled only at desktop (SLAY-14.4)', async () => {
    const css = (await import('node:fs')).readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    const phone = css.match(/@media \(max-width: 640px\) and \(max-aspect-ratio: 1 \/ 1\) \{([^]*?)\n\}/)?.[1] ?? ''
    expect(phone).toMatch(/\.play-header \{\s*display: grid;/)
    expect(phone).toMatch(/\.play-header__back \{[^}]*grid-row: 1;/)
    expect(phone).toMatch(/\.play-header__title \{[^}]*grid-row: 2;/)
    expect(phone).toMatch(/\.play-timer \{[^}]*grid-row: 2;/)
    expect(css).toMatch(/\.play-header__legend-label \{\s*display: none;/)
    const wide = css.match(/@media \(min-width: 641px\) \{([^]*?)\n\}/)?.[1] ?? ''
    expect(wide).toMatch(/\.play-header__legend-label \{\s*display: inline;/)
    // The visible Legend text is the aria-label, word for word.
    expect(html).toMatch(/aria-label="Legend"[^>]*>[^]*?<span class="play-header__legend-label" aria-hidden="true">Legend<\/span>/)
  })

  it('starts at 1x: an unzoomed board, no button needed \u2014 pinch and ctrl+wheel drive zoom (CAD-10.4, SLAY-9.8)', () => {
    expect(html).not.toContain('play-tool--zoom')
    expect(html).toContain('data-zoom="1.00"')
    expect(html).not.toContain('data-zoomed')
    expect(html).toContain('style="transform:none"')
  })

  it('keeps the toolbar targets 44px in the 6-column phone grid (SLAY-8.2: six controls after SLAY-9.8 removes Zoom, no More on the toolbar)', async () => {
    const css = (await import('node:fs')).readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    expect((css.match(/repeat\(6, minmax\(0, 1fr\)\)/g) ?? []).length).toBe(2)
    expect(css).not.toContain('.play-tool--more')
    expect(css).toMatch(/\.play-board\[data-zoomed\] \{[^}]*overflow: hidden/)
    // no will-change: the zoomed svg must be redrawn sharp, not stretched
    expect(css).not.toMatch(/will-change:\s*transform/)
  })

  it('shows the timer chip', () => {
    expect(html).toContain('0:00')
  })

  it('starts with no dialog and no hint open', () => {
    expect(html).not.toContain('play-modal')
    expect(html).not.toContain('play-hint')
  })

  it('lays the hint bar in the grid, never floating over the board (CAD-4.34)', async () => {
    expect(html).not.toContain('data-hint')
    const css = (await import('node:fs')).readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    const bar = css.match(/\.play-hint \{[^}]*\}/)?.[0] ?? ''
    expect(bar).toContain('grid-area: hint')
    expect(bar).not.toMatch(/position:\s*(fixed|absolute)/)
    // every layout gives an open hint its own area
    expect((css.match(/'(board |hint )?hint'/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('keeps every tool at least 44px: the css sets 56px tall buttons', async () => {
    const css = (await import('node:fs')).readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    expect(css).toMatch(/\.play-tool \{[^}]*min-height: 56px/)
    expect(css).toMatch(/\.play-btn \{[^}]*min-height: 48px/)
  })

  it('carries the Safari guards in css: touch-action, user-select, callout', async () => {
    const css = (await import('node:fs')).readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    const board = css.match(/\.play-board \{[^}]*\}/)?.[0] ?? ''
    expect(board).toContain('touch-action: none')
    expect(board).toContain('-webkit-touch-callout: none')
    expect(board).toContain('user-select: none')
    expect(css).toMatch(/\.play \{[^}]*touch-action: manipulation/)
    // no hover state on touch: :hover only inside a (hover: hover) query, so it never sticks after a tap
    const withoutHoverQueries = css.replace(/@media \(hover: hover\)[^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, '')
    expect(withoutHoverQueries).not.toMatch(/:hover/)
  })
})

describe.each(['en', 'nl'] as const)('<PlayScreen/> toolbar text (%s) (SLAY-3.4, SLAY-5.1)', (locale) => {
  const t = PLAY_STRINGS[locale].tools
  const html = renderToStaticMarkup(withLocale(locale, <PlayScreen puzzle={tutorial} levelId="test" storage={null} now={() => 0} />))

  it('shows the toolbar tools by aria-label in the current locale, Options/Help as direct header actions (SLAY-9.2, CSS decides which pair is visible per viewport), and the settings icon that still reaches them on narrow viewports; Legend has a visible label that matches its aria-label', () => {
    for (const label of [t.note, t.x, t.erase, t.undo, t.hint]) {
      expect(html).toContain(`aria-label="${label}"`)
    }
    expect(html).toContain('role="toolbar"')
    expect(html).toContain(`aria-label="${t.more}"`)
    for (const label of [t.options, t.help]) expect(html).toContain(`>${label}<`)
    // SLAY-14.4: Legend carries a visible text label (shown at desktop widths via CSS) matching its aria-label.
    expect(html).toContain(`aria-label="${t.legend}"`)
    expect(html).toContain(`>${t.legend}<`)
  })
})

describe('<HelpPanel/>', () => {
  const html = renderToStaticMarkup(<HelpPanel onClose={() => {}} />)
  it('opens on the goal and the steps, with a Keywords button', () => {
    expect(html).toContain('How it works')
    for (const line of help.goal) expect(html).toContain(line)
    for (const step of help.steps) expect(html).toContain(step.title)
    expect(html).toContain('>Keywords<')
    expect(html).toContain('>Start playing<')
  })

  it('hides the keyword glossary until the Keywords button is used', () => {
    expect(html).not.toContain('play-help__glossary')
    for (const word of ['alone with', 'exactly N rows', 'diagonal', 'in a corner']) {
      expect(html.toLowerCase()).not.toContain(word.toLowerCase())
    }
  })
})

describe('the Legend (CAD-10.9)', () => {
  it('has its own direct header icon, not on the main toolbar row and not behind the More sheet (SLAY-8.2)', () => {
    const html = renderToStaticMarkup(<PlayScreen puzzle={tutorial} levelId="test" storage={null} now={() => 0} />)
    // The header's own Legend icon is always there, one tap away — unlike Options and Help, which
    // stay closed inside the More sheet until it opens.
    expect(html).toContain('aria-label="Legend"')
    for (const label of ['Options', 'Help']) expect(html).not.toContain(`aria-label="${label}"`)
    // The main toolbar row is exactly the six controls (SLAY-8.2: Place is back; SLAY-9.8: Zoom
    // is gone), Legend not among them.
    const toolbarLabels = [...html.matchAll(/<button[^>]*class="play-tool[^"]*"[^>]*aria-label="([^"]+)"/g)].map((m) => m[1])
    expect(toolbarLabels).toEqual(['Place', 'Note', 'X', 'Erase', 'Undo', 'Hint'])
    // The header's settings icon, reachable in one tap, opens the sheet Options and Help sit behind.
    expect(html).toContain('aria-label="More"')
  })

  it('is reachable from the how-it-works card when opened on a level, not from the level list', () => {
    expect(renderToStaticMarkup(<HelpPanel onClose={() => {}} onLegend={() => {}} />)).toContain('>Legend<')
    expect(renderToStaticMarkup(<HelpPanel onClose={() => {}} />)).not.toContain('>Legend<')
  })

  it('draws the squares it points at inside the zoomed pane, without taking a touch', () => {
    const board = renderToStaticMarkup(
      <Board
        puzzle={named}
        board={createGameStore({ levelId: 't', puzzle: named, storage: null }).getState().board}
        tool="note"
        selectedId={null}
        tags={noteTags(named.people)}
        colors={colorsFor(named.people)}
        cast={castFor(named)}
        hint={null}
        dispatch={() => {}}
        getBoard={() => ({ notes: {}, marks: {}, placements: {} })}
        onMessage={() => {}}
        view={{ ...IDENTITY, scale: 2 }}
        onView={() => {}}
        flash={[{ row: 0, col: 1 }, { row: 2, col: 3 }]}
      />,
    )
    const pane = board.slice(board.indexOf('play-board__pane'))
    expect(pane).toContain('data-layer="flash" pointer-events="none"')
    expect((pane.match(/data-flash="/g) ?? []).length).toBe(2)
    expect(pane).toContain('data-flash="0,1"')
    expect(pane).toContain('data-flash="2,3"')
    expect(renderToStaticMarkup(<Board puzzle={named} board={createGameStore({ levelId: 't', puzzle: named, storage: null }).getState().board} tool="note" selectedId={null} tags={{}} colors={{}} cast={castFor(named)} hint={null} dispatch={() => {}} getBoard={() => ({ notes: {}, marks: {}, placements: {} })} onMessage={() => {}} view={IDENTITY} onView={() => {}} />)).not.toContain('data-layer="flash"')
  })

  it('hides the card while it shows the squares, and keeps it mounted', () => {
    const modal = renderToStaticMarkup(<Modal title="x" onClose={() => {}} peek><p>body</p></Modal>)
    expect(modal).toContain('data-peek=""')
    expect(modal).toContain('body')
    expect(renderToStaticMarkup(<Modal title="x" onClose={() => {}}><p>body</p></Modal>)).not.toContain('data-peek')
    const css = readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    expect(css).toMatch(/\.play-modal\[data-peek\] \{[^}]*visibility: hidden[^}]*pointer-events: none/)
  })
})

describe('<Glossary/>', () => {
  const html = renderToStaticMarkup(<Glossary />)
  it('lists the keywords', () => {
    for (const word of ['next to', 'alone', 'with', 'exactly N rows', 'diagonal', 'in a corner', 'next to a window']) {
      expect(html.toLowerCase()).toContain(word.toLowerCase())
    }
  })
})

describe('first visit help card (CAD-10.8)', () => {
  const render = (props: { storage: StorageLike | null; firstVisitHelp?: boolean }) =>
    renderToStaticMarkup(<PlayScreen puzzle={tutorial} levelId="test" now={() => 0} {...props} />)

  it('opens by itself on a first visit, and not without the flag', () => {
    expect(render({ storage: createMemoryStorage(), firstVisitHelp: true })).toContain('role="dialog"')
    expect(render({ storage: createMemoryStorage() })).not.toContain('role="dialog"')
  })

  it('does not open again once seen', () => {
    const storage = createMemoryStorage()
    markHelpSeen(storage)
    expect(render({ storage, firstVisitHelp: true })).not.toContain('role="dialog"')
  })

  it('is skipped without storage', () => {
    expect(render({ storage: null, firstVisitHelp: true })).not.toContain('role="dialog"')
  })
})

describe.each(['en', 'nl'] as const)('<ResultOverlay/> (%s)', (locale) => {
  const t = PLAY_STRINGS[locale].result

  it('solved: names who was alone with the victim, and the time', () => {
    const html = renderToStaticMarkup(
      withLocale(locale, <ResultOverlay puzzle={named} result={{ solved: true, murdererId: idOf(Alice), elapsedMs: 83_000 }} onRestart={() => {}} onDismiss={() => {}} />),
    )
    expect(html).toContain(t.solved(Alice))
    expect(html).toContain(t.time('1:23'))
  })

  it('wrong: counts, never who', () => {
    const html = renderToStaticMarkup(
      withLocale(locale, <ResultOverlay puzzle={named} result={{ solved: false, correctCount: 2, total: 4 }} onRestart={() => {}} onDismiss={() => {}} />),
    )
    expect(html).toContain(t.wrong(2, 4))
    for (const name of [Alice, Ben, Chloe]) expect(html).not.toContain(name)
  })
})

describe('the persistent Share control on a solved board (SLAY-9.13)', () => {
  /** A memory-backed save already solved before PlayScreen ever mounts, the way reopening an
   * already-solved day (or the moment right after a fresh solve) looks from PlayScreen's side. */
  const solvedStorage = () => {
    const storage = createMemoryStorage()
    const store = createGameStore({ levelId: 'share-persist', puzzle: named, storage, now: () => 1000 })
    store.dispatch({ type: 'place', personId: idOf(Alice), cell: at.A })
    store.dispatch({ type: 'place', personId: idOf(Ben), cell: at.B })
    store.dispatch({ type: 'place', personId: idOf(Chloe), cell: at.C })
    store.dispatch({ type: 'place', personId: 'V', cell: at.V })
    expect(store.getState().status).toBe('solved')
    return storage
  }

  it('shows the finish popover on a fresh mount of an already-solved save, not the persistent button (the popover has not been dismissed yet)', () => {
    const html = renderToStaticMarkup(<PlayScreen puzzle={named} levelId="share-persist" storage={solvedStorage()} now={() => 1000} />)
    expect(html).toContain('data-result="solved"')
    expect(html).not.toContain('data-action="share"')
  })

  it('never shows the persistent Share button while the board is unsolved', () => {
    const html = renderToStaticMarkup(<PlayScreen puzzle={named} levelId="test" storage={null} now={() => 0} />)
    expect(html).not.toContain('data-action="share"')
  })
})

/** Plays gestures against a real store, the way Board does. */
describe('gestures drive the game store', () => {
  const setup = () => {
    const store = createGameStore({ levelId: 'flow', puzzle: named, storage: null, now: () => 1000 })
    const run = (intent: Intent) => {
      if (intent && 'action' in intent) store.dispatch(intent.action)
      return intent
    }
    const tap = (tool: Tool, id: string | null, cell: Cell) => run(gestureIntent(tool, 'tap', id, cell, store.getState().board))
    const hold = (tool: Tool, id: string | null, cell: Cell) => run(gestureIntent(tool, 'longPress', id, cell, store.getState().board))
    return { store, tap, hold }
  }

  it('tap notes, long press places, and placing all four correctly solves it', () => {
    const { store, tap, hold } = setup()
    const A = idOf(Alice)
    tap('note', A, at.A)
    expect(store.getState().board.notes['1,2']).toEqual([A])
    hold('note', A, at.A)
    expect(isPlaced(store.getState().board, A)).toBe(true)
    for (const [id, cell] of [[idOf(Ben), at.B], [idOf(Chloe), at.C], ['V', at.V]] as const) hold('note', id, cell)
    const state = store.getState()
    expect(state.status).toBe('solved')
    expect(state.check).toMatchObject({ solved: true, murdererId: A })
  })

  it('a wrong full board reports only a count', () => {
    const { store, hold } = setup()
    hold('note', idOf(Alice), at.C)
    hold('note', idOf(Chloe), at.A)
    hold('note', idOf(Ben), at.B)
    hold('note', 'V', at.V)
    const check = store.getState().check
    expect(check).toEqual({ solved: false, correctCount: 2, total: 4 })
  })

  it('drag painting notes then X across cells', () => {
    const { store } = setup()
    const A = idOf(Alice)
    const cells = [{ row: 3, col: 0 }, { row: 3, col: 2 }, { row: 2, col: 2 }]
    const mode = paintModeFor('note', A, cells[0]!, store.getState().board)
    for (const cell of cells) {
      const intent = paintIntent('note', mode, A, cell, store.getState().board)
      if (intent && 'action' in intent) store.dispatch(intent.action)
    }
    expect(Object.keys(store.getState().board.notes).sort()).toEqual(['2,2', '3,0', '3,2'])
    // a second stroke starting on a noted cell removes
    const removing = paintModeFor('note', A, cells[0]!, store.getState().board)
    expect(removing).toBe('remove')
    for (const cell of cells) {
      const intent = paintIntent('note', removing, A, cell, store.getState().board)
      if (intent && 'action' in intent) store.dispatch(intent.action)
    }
    expect(store.getState().board.notes).toEqual({})
  })

  it('the eraser tap clears a cell; undo brings it back', () => {
    const { store, tap } = setup()
    const A = idOf(Alice)
    tap('note', A, at.V)
    tap('erase', null, at.V)
    expect(store.getState().board.notes).toEqual({})
    store.dispatch({ type: 'undo' })
    expect(store.getState().board.notes['0,0']).toEqual([A])
  })

  it('asks for a suspect first', () => {
    const { tap } = setup()
    expect(tap('note', null, at.A)).toEqual({ message: 'pickSuspect' })
  })
})

describe('undo/redo restore the right selection (SLAY-4.1)', () => {
  it('undo returns the person whose placement it removed; redo returns the one it restored', () => {
    const store = createGameStore({ levelId: 'undo-select', puzzle: named, storage: null, now: () => 0 })
    const A = idOf(Alice)
    const beforeUndo = store.getState().board
    store.dispatch({ type: 'place', personId: A, cell: at.A })
    const afterPlace = store.getState().board
    expect(selectionAfterUndoRedo('undo', beforeUndo, afterPlace)).toBeNull() // sanity: nothing removed yet

    store.dispatch({ type: 'undo' })
    const afterUndo = store.getState().board
    expect(selectionAfterUndoRedo('undo', afterPlace, afterUndo)).toBe(A)

    store.dispatch({ type: 'redo' })
    const afterRedo = store.getState().board
    expect(selectionAfterUndoRedo('redo', afterUndo, afterRedo)).toBe(A)
  })

  it('leaves the selection alone when the undone/redone edit was a note or a mark, not a placement', () => {
    const store = createGameStore({ levelId: 'undo-select-note', puzzle: named, storage: null, now: () => 0 })
    const A = idOf(Alice)
    store.dispatch({ type: 'toggleNote', personId: A, cell: at.A })
    const beforeUndo = store.getState().board
    store.dispatch({ type: 'undo' })
    const afterUndo = store.getState().board
    expect(selectionAfterUndoRedo('undo', beforeUndo, afterUndo)).toBeNull()

    store.dispatch({ type: 'redo' })
    const afterRedo = store.getState().board
    expect(selectionAfterUndoRedo('redo', afterUndo, afterRedo)).toBeNull()
  })

  it("the owner's scenario: place wrongly, undo, place the intended square — the same person lands there, not whoever auto-advance had moved on to", () => {
    const store = createGameStore({ levelId: 'undo-select-owner', puzzle: named, storage: null, now: () => 0 })
    const A = idOf(Alice)
    // Place Alice on the wrong square (square A).
    store.dispatch({ type: 'place', personId: A, cell: at.A })
    expect(isPlaced(store.getState().board, A)).toBe(true)
    const beforeUndo = store.getState().board

    // Undo the wrong placement: the fix re-selects Alice, not whoever auto-advance moved on to.
    store.dispatch({ type: 'undo' })
    const afterUndo = store.getState().board
    const reselected = selectionAfterUndoRedo('undo', beforeUndo, afterUndo)
    expect(reselected).toBe(A)
    expect(isPlaced(store.getState().board, A)).toBe(false)

    // Tap the intended square (square B) for the re-selected person.
    store.dispatch({ type: 'place', personId: reselected!, cell: at.B })
    expect(store.getState().board.placements[A]).toEqual(at.B)
  })
})

describe('axis labels', () => {
  it('draws R1..Rn and C1..Cn by default, matching "row N, column M" counted from top and left', () => {
    const html = renderToStaticMarkup(<PlayScreen puzzle={tutorial} levelId="test" storage={null} now={() => 0} />)
    expect((html.match(/data-axis="row"/g) ?? []).length).toBe(4)
    expect((html.match(/data-axis="col"/g) ?? []).length).toBe(4)
    for (const label of ['R1', 'R4', 'C1', 'C4']) expect(html).toContain(`>${label}<`)
  })

  it('drops them when the saved preference is off', () => {
    const storage = {
      getItem: (key: string) => (key === AXIS_LABELS_KEY ? 'false' : null),
      setItem: () => {},
      removeItem: () => {},
    }
    const html = renderToStaticMarkup(<PlayScreen puzzle={tutorial} levelId="test" storage={storage} now={() => 0} />)
    expect(html).not.toContain('data-axis=')
  })

  it.each(['en', 'nl'] as const)('has a switch for them in the options panel, reflecting the setting (%s)', (locale) => {
    const t = PLAY_STRINGS[locale].options
    const props = { options: DEFAULT_OPTIONS, onChange: () => {}, onAxisLabels: () => {}, onClearAll: () => {}, onRestart: () => {}, onClose: () => {} }
    const on = renderToStaticMarkup(withLocale(locale, <OptionsPanel {...props} showAxisLabels />))
    const off = renderToStaticMarkup(withLocale(locale, <OptionsPanel {...props} showAxisLabels={false} />))
    expect(on).toContain(t.axisLabels)
    expect((on.match(/aria-checked="true"/g) ?? []).length).toBe(4)
    expect((off.match(/aria-checked="true"/g) ?? []).length).toBe(3)
  })
})

describe('language switch in the Options modal (SLAY-9.4: LocaleToggle reachable from the play screen, not only the start screen)', () => {
  const props = { options: DEFAULT_OPTIONS, showAxisLabels: true, onChange: () => {}, onAxisLabels: () => {}, onClearAll: () => {}, onRestart: () => {}, onClose: () => {} }

  it.each(['en', 'nl'] as const)('renders the EN/NL locale toggle, reflecting the active locale (%s)', (locale) => {
    const html = renderToStaticMarkup(withLocale(locale, <OptionsPanel {...props} />))
    expect(html).toContain('aria-label="Language"')
    expect(html).toContain('data-locale-option="en"')
    expect(html).toContain('data-locale-option="nl"')
    // aria-pressed is declared before data-locale-option in LocaleToggle.tsx's JSX, in that order in the DOM.
    const active = html.match(/aria-pressed="true"[^>]*data-locale-option="([a-z]+)"/)?.[1]
    expect(active).toBe(locale)
  })

  it('is the same control the start screen uses: switching language does not require leaving the puzzle (LocaleToggle is a shared component, not a duplicate)', () => {
    const html = renderToStaticMarkup(withLocale('en', <OptionsPanel {...props} />))
    expect(html).toContain('daily__locale-option')
  })

  it("does not key the game store's useMemo on locale (AC #2: the board, notes, timer and undo/redo history must survive a language switch, not be recreated by it)", async () => {
    const src = (await import('node:fs')).readFileSync(new URL('./PlayScreen.tsx', import.meta.url), 'utf8')
    const storeMemo = src.match(/const store = useMemo<GameStore>\(\s*\(\) => createGameStore\([^)]*\),\s*(\[[^\]]*\])/)
    expect(storeMemo, 'store useMemo not found in PlayScreen.tsx').not.toBeNull()
    expect(storeMemo![1]).not.toContain('locale')
  })
})

describe('the hint bar slot in the play grid (CAD-4.34 layout stays)', () => {
  it('starts closed, and the hint bar keeps its own grid row', async () => {
    const html = renderToStaticMarkup(<PlayScreen puzzle={tutorial} levelId="test" storage={null} now={() => 0} />)
    expect(html).not.toContain('data-hint')
    expect(html).not.toContain('preview')
    const css = (await import('node:fs')).readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    expect(css).toMatch(/\.play\[data-hint\] \{/)
    expect(css.match(/\.play-hint \{[^}]*\}/)?.[0]).toContain('grid-area: hint')
  })
})

describe('the board fits the screen (SLAY-17.4)', () => {
  it("hands the drawing's height over width to the layout, and play.css divides every height budget by it", async () => {
    const html = renderToStaticMarkup(<PlayScreen puzzle={tutorial} levelId="test" storage={null} now={() => 0} />)
    expect(html).toMatch(/class="play"[^>]*style="--board-aspect:1\.\d+/)
    const css = (await import('node:fs')).readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    // Portrait width cap, landscape --board and short landscape --board: each one reads the aspect.
    expect(css.match(/var\(--board-aspect, 1\)/g)?.length).toBe(3)
  })
})
