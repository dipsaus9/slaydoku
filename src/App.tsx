import { lazy, Suspense } from 'react'
import './content/levels.ts'
import { AboutScreen, isAboutPath } from './ui/about/index.ts'
import { LevelFlow } from './ui/levels/index.ts'
import { usePath } from './ui/router/index.ts'

/*
 * The puzzle lab (/lab) exists in `bun run dev` only. `import.meta.env.DEV` is a build-time
 * constant, so in the production build this whole branch, the lab chunk and its worker are
 * dropped. Keep the lab out of every import that is not behind this check.
 */
const LabRoute = import.meta.env.DEV ? lazy(() => import('./ui/lab/index.ts').then((m) => ({ default: m.LabRoot }))) : null

/** The game: `/about` is the About page, every other path belongs to the level flow. */
function Game() {
  return isAboutPath(usePath()) ? <AboutScreen /> : <LevelFlow />
}

/** Dev only: `/lab...` shows the lab, everything else the game. */
function DevApp({ Lab }: { Lab: NonNullable<typeof LabRoute> }) {
  const path = usePath()
  if (!/^\/lab(\/|$)/.test(path)) return <Game />
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  )
}

function App() {
  return LabRoute ? <DevApp Lab={LabRoute} /> : <Game />
}

export default App
