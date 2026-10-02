import { useEffect, useMemo, useState } from 'react'
import { CARD_SIZE, cardDescription, cardSvg, emojiText, loadDisplayFont } from '../../share/index.ts'
import type { HeadlineFont, ShareMeta } from '../../share/index.ts'
import type { DailyResult } from '../../game/daily/results.ts'
import { useLocale } from '../../locale/index.ts'
import { canWebShare, copyCard, downloadBlob, shareCard } from './actions.ts'
import type { ShareNavigator } from './actions.ts'
import { svgDataUrl, svgToPng } from './png.ts'
import { SHARE_STRINGS } from './strings.ts'

export type ShareStatus = { kind: 'idle' } | { kind: 'ok' | 'error'; text: string }

const browserNavigator = (): ShareNavigator | undefined => (typeof navigator === 'undefined' ? undefined : navigator)

/**
 * State and actions of the share panel: the card and the text of the result, the PNG made in advance (so a tap on
 * Share can start the share sheet at once), and what each button does. Nothing is sent anywhere by this code: only the system share
 * sheet, the clipboard and a saved file, all started by the player.
 */
export function useShare(result: DailyResult, meta: ShareMeta, nav: ShareNavigator | undefined = browserNavigator()) {
  const { locale } = useLocale()
  const t = SHARE_STRINGS[locale]
  const [status, setStatus] = useState<ShareStatus>({ kind: 'idle' })
  const [failedShare, setFailedShare] = useState(false)
  const [png, setPng] = useState<{ svg: string; file: File } | null>(null)
  const [headline, setHeadline] = useState<HeadlineFont>()
  const size = CARD_SIZE
  const filename = `slaydoku-${result.n}-square.png`
  const text = useMemo(() => emojiText(result, meta, locale), [result, meta, locale])
  const svg = useMemo(() => cardSvg(result, meta, size, headline, locale), [result, meta, size, headline, locale])
  const previewSrc = useMemo(() => svgDataUrl(svg), [svg])
  const description = useMemo(() => cardDescription(result, meta, locale), [result, meta, locale])
  const supported = canWebShare(nav)
  const current = png?.svg === svg ? png.file : null

  // The display font, loaded once (FontFace API, timed out to the system stack on a slow or blocked network); once
  // it resolves the card redraws with it, both the preview above and the PNG made below.
  useEffect(() => {
    let alive = true
    loadDisplayFont()
      .then((font) => alive && setHeadline(font))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // The PNG of the card on screen, made as soon as it is shown.
  useEffect(() => {
    let alive = true
    svgToPng(svg, size)
      .then((blob) => alive && setPng({ svg, file: new File([blob], filename, { type: 'image/png' }) }))
      .catch(() => alive && setPng(null))
    return () => {
      alive = false
    }
  }, [svg, size, filename])

  const say = (next: ShareStatus) => setStatus(next)
  const title = `Slaydoku #${result.n}`

  const onShare = async () => {
    if (!nav) return
    const outcome = await shareCard(nav, { title, text, file: current })
    if (outcome.status === 'shared') say({ kind: 'ok', text: t.status.shared })
    else if (outcome.status === 'failed') {
      setFailedShare(true)
      say({ kind: 'error', text: t.status.shareFailed })
    } else say({ kind: 'idle' })
  }
  const onCopy = async () => {
    const Item = typeof ClipboardItem === 'undefined' ? undefined : ClipboardItem
    const outcome = await copyCard({ text, file: current }, nav, typeof document === 'undefined' ? undefined : document, Item)
    if (outcome === 'image-and-text') say({ kind: 'ok', text: t.status.copiedWithImage })
    else say(outcome === 'text' ? { kind: 'ok', text: t.status.copied } : { kind: 'error', text: t.status.copyFailed })
  }
  const onDownload = async () => {
    try {
      const file = current ?? new File([await svgToPng(svg, size)], filename, { type: 'image/png' })
      const ok = downloadBlob(file, filename, { document, url: URL })
      say(ok ? { kind: 'ok', text: t.status.downloaded } : { kind: 'error', text: t.status.downloadFailed })
    } catch {
      say({ kind: 'error', text: t.status.downloadFailed })
    }
  }

  return { status, text, previewSrc, description, size, supported, showFallback: !supported || failedShare, onShare, onCopy, onDownload }
}
