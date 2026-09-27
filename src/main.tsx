import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UpdateNotice, updater } from './pwa/index.ts'
import { getRouter } from './ui/router/index.ts'
import { installScreenTitles } from './ui/title/index.ts'

// A link shared before the clean URLs (`#/play`) is rewritten once to its path (`/play`).
getRouter().migrateLegacyHash()
installScreenTitles()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UpdateNotice updater={updater} />
  </StrictMode>,
)
