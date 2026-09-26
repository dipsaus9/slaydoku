import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../../index.css'
import { devSampleLevel } from '../devLevel.ts'
import { LevelFlow } from '../LevelFlow.tsx'
import { registerLevels } from '../registry.ts'

/**
 * Dev harness for the level flow (not part of the app build): three copies of the tutorial, so
 * locking and unlocking can be seen. Serve with
 *   bunx vite src/ui/levels/dev --config vite.config.ts
 * Progress lives in localStorage of that origin; clear it to start over.
 */
registerLevels([
  devSampleLevel,
  { ...devSampleLevel, id: 'kamer-2', title: 'Tweede kamer' },
  { ...devSampleLevel, id: 'kamer-3', title: 'Derde kamer' },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LevelFlow />
  </StrictMode>,
)
