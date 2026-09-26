import { useMemo, useState } from 'react'
import type { Puzzle } from '../../engine/model/index.ts'
import type { ThemeIconId } from '../../render/icons/themes/types.ts'
import type { FloorPattern } from '../../render/scene/index.ts'
import { defaultStorage } from '../../game/persistence.ts'
import { createMemoryStorage } from '../levels/progress.ts'
import { PlayScreen } from '../play/index.ts'
import { InsightPanel } from './InsightPanel.tsx'
import { verifySummary } from './model.ts'
import { LAB_EN } from './strings.ts'

/** Where a lab puzzle came from. */
export type LabSource = 'level' | 'generated'

/** One puzzle ready to open in the play screen. */
export interface PlayView {
  source: LabSource
  id: string
  title: string
  puzzle: Puzzle
  roomStyles?: Partial<Record<string, FloorPattern>>
  themeIcons?: Record<string, ThemeIconId>
  castSeed?: string
  /** Facts shown under the title (size, tier, score, ...). */
  facts: string[]
  /** Pack checks a generated puzzle failed; shown as a warning. */
  warnings?: string[]
}

export interface LabPlayProps {
  view: PlayView
  onBack: () => void
}

/**
 * A lab puzzle in the normal play screen, with a plain bar above it: what it is, the verify result
 * (unique solution: pass or fail), restart and a JSON copy. Progress goes to a throw-away memory
 * store, so the lab never touches the real game saves or the solved records.
 */
export function LabPlay({ view, onBack }: LabPlayProps) {
  const t = LAB_EN.play
  const [run, setRun] = useState(0)
  const [tab, setTab] = useState<'play' | 'insight'>('play')
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle')
  // The real browser store: judgements and the game's play sessions live there, not in the throw-away play store.
  const insightStorage = useMemo(() => defaultStorage(), [])
  const verify = useMemo(() => verifySummary(view.puzzle), [view.puzzle])
  // A new run (or a new puzzle) starts on an empty board.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const storage = useMemo(() => createMemoryStorage(), [view, run])

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(view.puzzle, null, 2)).then(
      () => setCopy('done'),
      () => setCopy('failed'),
    )
  }

  return (
    <div className="lab-play">
      <header className="lab-bar">
        <button type="button" className="lab-btn" onClick={onBack}>
          {'‹'} {t.back}
        </button>
        <div className="lab-tabs" role="group" aria-label={t.tabs.label}>
          {(['play', 'insight'] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`lab-btn${tab === id ? ' lab-btn--primary' : ''}`}
              aria-pressed={tab === id}
              data-tab={id}
              onClick={() => setTab(id)}
            >
              {t.tabs[id]}
            </button>
          ))}
        </div>
        <div className="lab-bar__what">
          <strong>{view.title}</strong>
          <span className="lab-bar__facts">
            {t.source[view.source]} {'·'} {view.id}
            {view.facts.map((fact) => ` · ${fact}`).join('')}
          </span>
        </div>
        <div
          className={`lab-verify lab-verify--${verify.pass ? 'pass' : 'fail'}`}
          role="status"
          data-verify={verify.pass ? 'pass' : 'fail'}
        >
          <strong>
            {t.verifyTitle}: {verify.pass ? t.pass : t.fail}
          </strong>
          <span>
            {t.solutions(verify.solutionCount)}
            {verify.murderer ? ` · ${t.murderer(verify.murderer)}` : ''}
          </span>
        </div>
        <button type="button" className="lab-btn" onClick={() => setRun((n) => n + 1)}>
          {t.restart}
        </button>
        <button type="button" className="lab-btn" onClick={copyJson}>
          {copy === 'done' ? t.copied : copy === 'failed' ? t.copyFailed : t.copy}
        </button>
      </header>
      {verify.problems.length > 0 ? (
        <ul className="lab-bar__problems">
          {verify.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}
      {view.warnings && view.warnings.length > 0 ? (
        <ul className="lab-bar__problems lab-bar__problems--warn">
          {view.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
      {tab === 'insight' ? (
        <main className="lab lab-insight-page">
          <InsightPanel puzzleId={view.id} puzzle={view.puzzle} castSeed={view.castSeed} storage={insightStorage} />
        </main>
      ) : null}
      {/* Kept mounted while the insight shows, so the board is as it was when the developer switches back. */}
      <div hidden={tab !== 'play'}>
        <PlayScreen
          key={run}
          puzzle={view.puzzle}
          levelId={`lab-${view.id}`}
          title=""
          roomStyles={view.roomStyles}
          themeIcons={view.themeIcons}
          castSeed={view.castSeed}
          storage={storage}
        />
      </div>
    </div>
  )
}
