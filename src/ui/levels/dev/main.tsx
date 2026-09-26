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
  { ...devSampleLevel, id: 'room-2', title: 'Second room' },
  { ...devSampleLevel, id: 'room-3', title: 'Third room' },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LevelFlow />
  </StrictMode>,
)
