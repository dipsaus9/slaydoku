import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UpdateNotice, updater } from './pwa/index.ts'
import { installCanonicalLink } from './ui/canonical/index.ts'
import { getRouter } from './ui/router/index.ts'
import { installScreenTitles } from './ui/title/index.ts'

// A link shared before the clean URLs (`#/play`) is rewritten once to its path (`/play`).
getRouter().migrateLegacyHash()
installScreenTitles()
installCanonicalLink()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UpdateNotice updater={updater} />
    {/* Vercel Web Analytics and Speed Insights: page views and Core Web Vitals, aggregate only, no cookie.
        Both no-op with a console notice until the corresponding toggle is switched on for this project
        in the Vercel dashboard (Analytics / Speed Insights tabs) — an owner-only step, see docs/launch.md. */}
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)
