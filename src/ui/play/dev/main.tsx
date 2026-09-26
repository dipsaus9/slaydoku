import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../../index.css'
import { PlayScreen } from '../PlayScreen.tsx'
import { devLevel, memoryStorage, seedScenario, type DevLevel, type Scenario } from './scenarios.ts'

/**
 * Dev harness for the play screen (not part of the app build). Serve with
 *   bunx vite src/ui/play/dev --config vite.config.ts
 * and open `/?level=house&scenario=notes`. Levels: tutorial | house. Scenarios: fresh | notes |
 * placed | wrong | solved. Progress lives in memory only, so a reload starts over.
 */
const params = new URLSearchParams(location.search)
const level = (params.get('level') ?? 'house') as DevLevel
const scenario = (params.get('scenario') ?? 'fresh') as Scenario

const setup = devLevel(level)
const storage = memoryStorage()
seedScenario(setup, scenario, storage)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlayScreen
      puzzle={setup.puzzle}
      levelId={setup.levelId}
      roomStyles={setup.roomStyles}
      storage={storage}
      title="Slaydoku"
    />
  </StrictMode>,
)
