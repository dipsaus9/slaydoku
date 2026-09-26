import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { at, puzzle as tutorial } from '../../game/fixture.ts'
import { createGameStore, DEFAULT_OPTIONS, isPlaced } from '../../game/index.ts'
import type { Cell } from '../../engine/model/index.ts'
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
import { castFor, colorsFor, noteTags, withCastNames } from './people.ts'

const named = withCastNames(tutorial)
const idOf = (label: string) => named.people.find((p) => p.label === label)!.id
// The cast of the tutorial puzzle: pool names (castFor), not fixed ones.
const [Alice, Ben, Chloe] = named.people.filter((p) => p.kind === 'suspect').map((p) => p.label) as [string, string, string]

describe('<PlayScreen/>', () => {
  const html = renderToStaticMarkup(<PlayScreen puzzle={tutorial} levelId="test" storage={null} now={() => 0} />)

  it('draws the board with one hit rect per cell', () => {
    expect((html.match(/data-cell="r\dc\d"/g) ?? []).length).toBe(16)
  })

  it('shows every suspect card by cast name, plus the gift', () => {
    for (const name of [Alice, Ben, Chloe, 'The victim']) expect(html).toContain(name)
    expect(html).toContain(`${Alice} stood next to a table.`)
  })

  it('has the toolbar tools in English', () => {
    for (const label of ['Note', 'Place', 'X', 'Erase', 'Undo', 'Redo', 'Hint', 'Auto-X', 'Options', 'Help', 'Legend', 'Zoom']) {
      expect(html).toContain(`>${label}<`)
    }
    expect(html).toContain('role="toolbar"')
  })

  it('starts at 1x: a zoom button that shows 1x, an unzoomed board (CAD-10.4)', () => {
    expect(html).toContain('play-tool--zoom')
    expect(html).toContain('>1\u00d7<')
    expect(html).toContain('data-zoom="1.00"')
    expect(html).not.toContain('data-zoomed')
    expect(html).toContain('style="transform:none"')
  })

  it('keeps the toolbar targets 44px in the 6-column phone grid, zoom button on the first row', async () => {
    const css = (await import('node:fs')).readFileSync(new URL('./play.css', import.meta.url), 'utf8')
    expect((css.match(/repeat\(6, minmax\(0, 1fr\)\)/g) ?? []).length).toBe(2)
    expect((css.match(/\.play-tool--zoom \{\s*order: 0/g) ?? []).length).toBe(2)
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
  it('sits right after Help, as the last toolbar button', () => {
    const html = renderToStaticMarkup(<PlayScreen puzzle={tutorial} levelId="test" storage={null} now={() => 0} />)
    const labels = [...html.matchAll(/<span class="play-tool__label">([^<]+)<\/span>/g)].map((m) => m[1])
    expect(labels.slice(-2)).toEqual(['Help', 'Legend'])
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

describe('<ResultOverlay/>', () => {
  it('solved: names who was alone with the victim, and the time', () => {
    const html = renderToStaticMarkup(
      <ResultOverlay puzzle={named} result={{ solved: true, murdererId: idOf(Alice), elapsedMs: 83_000 }} onRestart={() => {}} onDismiss={() => {}} />,
    )
    expect(html).toContain(`You found the murderer! ${Alice} was alone with the victim.`)
    expect(html).toContain('Time: 1:23')
  })

  it('wrong: counts, never who', () => {
    const html = renderToStaticMarkup(
      <ResultOverlay puzzle={named} result={{ solved: false, correctCount: 2, total: 4 }} onRestart={() => {}} onDismiss={() => {}} />,
    )
    expect(html).toContain('Not quite: 2 of 4 correct, try again.')
    for (const name of [Alice, Ben, Chloe]) expect(html).not.toContain(name)
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

  it('has a switch for them in the options panel, reflecting the setting', () => {
    const props = { options: DEFAULT_OPTIONS, onChange: () => {}, onAxisLabels: () => {}, onClearAll: () => {}, onRestart: () => {}, onClose: () => {} }
    const on = renderToStaticMarkup(<OptionsPanel {...props} showAxisLabels />)
    const off = renderToStaticMarkup(<OptionsPanel {...props} showAxisLabels={false} />)
    expect(on).toContain('Row and column numbers')
    expect((on.match(/aria-checked="true"/g) ?? []).length).toBe(4)
    expect((off.match(/aria-checked="true"/g) ?? []).length).toBe(3)
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
