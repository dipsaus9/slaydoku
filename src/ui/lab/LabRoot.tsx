import { useCallback, useMemo, useState } from 'react'
import { demoLevels } from '../../content/levels.ts'
import { defaultStorage } from '../../game/persistence.ts'
import { Link, navigate, usePath } from '../router/index.ts'
import { GenerateForm } from './GenerateForm.tsx'
import { JudgementTransfer } from './JudgementBox.tsx'
import { LevelTable } from './LevelTable.tsx'
import { packView } from './packView.ts'
import { LabPlay } from './LabPlay.tsx'
import type { PlayView } from './LabPlay.tsx'
import { defaultFormValues, labPath, parseLabRoute } from './model.ts'
import type { FormValues } from './model.ts'
import type { LabPuzzle } from './protocol.ts'
import { LAB_EN } from './strings.ts'
import { useGeneration } from './useGeneration.ts'
import './lab.css'

const go = (path: string) => navigate(path)

const toHome = () => go(labPath({ kind: 'home' }))

function Notice({ children }: { children: string }) {
  return (
    <main className="lab">
      <p className="lab-note" role="status">
        {children}
      </p>
      <p>
        <button type="button" className="lab-btn" onClick={toHome}>
          {LAB_EN.play.back}
        </button>
      </p>
    </main>
  )
}

function LevelPlay({ levelId }: { levelId: string }) {
  const level = demoLevels.find((candidate) => candidate.id === levelId)
  const view = useMemo<PlayView | null>(
    () =>
      level
        ? {
            source: 'level',
            id: level.id,
            title: level.title,
            puzzle: level.puzzle,
            roomStyles: level.roomStyles,
            facts: [LAB_EN.size_(level.puzzle.scene.width), LAB_EN.play.clues(level.puzzle.clues.length)],
          }
        : null,
    [level],
  )
  if (!view) return <Notice>{LAB_EN.play.notFound}</Notice>
  return <LabPlay key={levelId} view={view} onBack={toHome} />
}

function GeneratedPlay({ puzzle }: { puzzle: LabPuzzle | null }) {
  const view = useMemo(() => (puzzle ? packView(puzzle, 'generated', puzzle.warnings) : null), [puzzle])
  if (!view) return <Notice>{LAB_EN.play.noGenerated}</Notice>
  return <LabPlay key={view.id} view={view} onBack={toHome} />
}

interface HomeProps {
  form: FormValues
  onForm: (values: FormValues) => void
  generation: ReturnType<typeof useGeneration>
}

function Home({ form, onForm, generation }: HomeProps) {
  const play = useCallback(() => go(labPath({ kind: 'generated' })), [])
  const storage = useMemo(() => defaultStorage(), [])
  return (
    <main className="lab">
      <header className="lab__header">
        <Link className="lab-btn" href="/">
          {'‹'} {LAB_EN.toGame}
        </Link>
        <h1>{LAB_EN.title}</h1>
        <p>{LAB_EN.subtitle}</p>
      </header>
      <GenerateForm
        values={form}
        onValues={onForm}
        job={generation.job}
        onStart={generation.start}
        onCancel={generation.cancel}
        onPlay={play}
      />
      <JudgementTransfer storage={storage} />
      <LevelTable levels={demoLevels} onOpen={(id) => go(labPath({ kind: 'level', id }))} />
    </main>
  )
}

/**
 * The dev-only puzzle lab (`/lab`): the registered levels and a generate form (Web Worker,
 * progress, cancel). State of the form and of a running job lives here, so opening a puzzle and
 * coming back finds everything as it was.
 */
export function LabRoot() {
  const path = usePath()
  const route = useMemo(() => parseLabRoute(path), [path])
  const generation = useGeneration()
  const [form, setForm] = useState<FormValues>(() => defaultFormValues())

  if (route.kind === 'level') return <LevelPlay levelId={route.id} />
  if (route.kind === 'generated') return <GeneratedPlay puzzle={generation.latest} />
  return <Home form={form} onForm={setForm} generation={generation} />
}
