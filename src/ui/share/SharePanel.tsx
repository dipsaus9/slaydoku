import type { CardFormat, ShareMeta } from '../../share/index.ts'
import type { DailyResult } from '../../game/daily/results.ts'
import type { ShareNavigator } from './actions.ts'
import { SHARE_EN } from './strings.ts'
import { useShare } from './useShare.ts'
import './share.css'

export interface SharePanelProps {
  result: DailyResult
  meta: ShareMeta
  /** The browser's share and clipboard functions. Default: `navigator` (a test passes a mock). */
  nav?: ShareNavigator
}

const FORMATS: readonly CardFormat[] = ['wide', 'square']

/**
 * The share card of a solved puzzle: a preview, the shape of the card, and Share (system share sheet, with the PNG where the browser
 * can share files). Where there is no share sheet, or it failed, it offers Copy text and Download image instead. The card and the
 * text hold the puzzle number, difficulty, time and hints and never the solution, the names or the clues.
 */
export function SharePanel({ result, meta, nav }: SharePanelProps) {
  const t = SHARE_EN
  const share = useShare(result, meta, nav)
  return (
    <section className="share" data-share aria-labelledby="share-title">
      <h3 id="share-title" className="share__title">{t.title}</h3>
      <img className="share__preview" data-share-preview src={share.previewSrc} width={share.size.width} height={share.size.height} alt={t.preview(share.description)} />
      <div className="share__formats" role="group" aria-label={t.formats.label}>
        {FORMATS.map((format) => (
          <button key={format} type="button" className="share-btn share__format" data-format={format} aria-pressed={share.format === format} onClick={() => share.setFormat(format)}>
            {t.formats[format]}
          </button>
        ))}
      </div>
      <pre className="share__text" data-share-text aria-label={t.textLabel}>{share.text}</pre>
      <div className="share__actions">
        {share.supported ? (
          <button type="button" className="share-btn share-btn--primary" data-action="share" onClick={() => void share.onShare()}>
            {t.share}
          </button>
        ) : null}
        {share.showFallback ? (
          <>
            <button type="button" className="share-btn" data-action="copy" onClick={() => void share.onCopy()}>
              {t.copy}
            </button>
            <button type="button" className="share-btn" data-action="download" onClick={() => void share.onDownload()}>
              {t.download}
            </button>
          </>
        ) : null}
      </div>
      <p className="share__status" data-share-status data-kind={share.status.kind} role="status" aria-live="polite">
        {share.status.kind === 'idle' ? '' : share.status.text}
      </p>
      <p className="share__note">{t.note}</p>
    </section>
  )
}
