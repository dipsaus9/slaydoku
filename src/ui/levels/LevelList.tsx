import { useState, type ReactNode } from 'react'
import { help } from '../../content/help/help.ts'
import { HelpPanel, formatTime } from '../play/index.ts'
import { Link } from '../router/index.ts'
import type { LevelEntry } from './progress.ts'
import { routePath } from './route.ts'
import { LEVELS_EN } from './strings.ts'

export interface LevelListProps {
  entries: readonly LevelEntry[]
  /** Why the player was sent back here, if they were. */
  notice?: string | null
  onDismissNotice?: () => void
  /** A level card was followed (plain left click); the link navigates by itself. */
  onOpen?: (levelId: string) => void
  /** Rendered under the level cards (the extra cases section). */
  footer?: ReactNode
}

function Lock() {
  return (
    <svg className="level-card__icon" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function Check() {
  return (
    <svg className="level-card__icon" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** All registered levels in play order, with status. Locked levels cannot be opened. */
export function LevelList({ entries, notice, onDismissNotice, onOpen, footer }: LevelListProps) {
  const t = LEVELS_EN
  const [helpOpen, setHelpOpen] = useState(false)
  return (
    <main className="levels">
      <header className="levels__header">
        <h1 className="levels__title">{t.title}</h1>
        <p className="levels__subtitle">{t.subtitle}</p>
        <button type="button" className="levels-btn levels-btn--quiet levels__help" onClick={() => setHelpOpen(true)}>
          {help.link}
        </button>
      </header>

      {notice ? (
        <div className="levels-notice" role="status">
          <span>{notice}</span>
          <button type="button" className="levels-btn levels-btn--quiet" onClick={onDismissNotice}>
            {t.dismissNotice}
          </button>
        </div>
      ) : null}

      {entries.length === 0 ? <p className="levels__empty">{t.empty}</p> : null}

      <ol className="levels__grid" aria-label={t.listLabel}>
        {entries.map((entry) => {
          const locked = entry.status === 'locked'
          const previous = entries[entry.index - 1]
          const className = `level-card level-card--${entry.status}`
          const inner = (
            <>
              <span className="level-card__number">{t.levelNumber(entry.index + 1)}</span>
              <span className="level-card__title">{entry.level.title}</span>
              <span className="level-card__status">
                {t.status[entry.status]}
                {entry.result ? <span className="level-card__time"> {'·'} {formatTime(entry.result.elapsedMs)}</span> : null}
              </span>
              {locked && previous ? <span className="level-card__hint">{t.lockedHint(previous.level.title)}</span> : null}
              {locked ? <Lock /> : entry.status === 'solved' ? <Check /> : null}
            </>
          )
          return (
            <li key={entry.level.id}>
              {locked ? (
                <button type="button" className={className} data-level={entry.level.id} data-status={entry.status} disabled>
                  {inner}
                </button>
              ) : (
                <Link
                  className={className}
                  data-level={entry.level.id}
                  data-status={entry.status}
                  href={routePath({ kind: 'play', levelId: entry.level.id })}
                  onClick={() => onOpen?.(entry.level.id)}
                >
                  {inner}
                </Link>
              )}
            </li>
          )
        })}
      </ol>

      {footer}
      <footer className="levels__footer">
        <Link href="/about" className="levels__about">
          {t.about}
        </Link>
      </footer>
      {helpOpen ? <HelpPanel onClose={() => setHelpOpen(false)} /> : null}
    </main>
  )
}
