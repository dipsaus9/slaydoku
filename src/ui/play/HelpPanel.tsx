import { useState } from 'react'
import { help } from '../../content/help/help.ts'
import { Glossary, HowItWorks } from '../help/index.ts'
import { Modal } from './Modal.tsx'

type View = 'guide' | 'keywords'

/**
 * "Zo werkt het": the goal and the steps first. The keyword glossary is a second view behind the
 * "Kernwoorden" button; it starts closed on every open because the state lives in this component,
 * which is mounted fresh each time the panel opens.
 */
export function HelpPanel({ onClose, onLegend }: { onClose: () => void; onLegend?: () => void }) {
  const [view, setView] = useState<View>('guide')
  const t = help.keywords
  return (
    <Modal title={view === 'guide' ? help.title : t.title} onClose={onClose} className="play-modal__panel--wide play-modal__panel--help">
      {view === 'guide' ? <HowItWorks /> : <Glossary />}
      <div className="play-modal__actions play-help__actions">
        {view === 'guide' ? (
          <>
            <button type="button" className="play-btn" onClick={() => setView('keywords')}>
              {t.button}
            </button>
            {onLegend ? (
              <button type="button" className="play-btn" onClick={onLegend}>
                {help.legend.button}
              </button>
            ) : null}
            <button type="button" className="play-btn play-btn--primary" onClick={onClose} autoFocus>
              {help.close}
            </button>
          </>
        ) : (
          <button type="button" className="play-btn play-btn--primary" onClick={() => setView('guide')} autoFocus>
            {t.back}
          </button>
        )}
      </div>
    </Modal>
  )
}
