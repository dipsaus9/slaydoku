import { useEffect, useMemo, useState } from 'react'
import { CARD_SIZES, cardDescription, cardSvg, emojiText } from '../../share/index.ts'
import type { CardFormat, ShareMeta } from '../../share/index.ts'
import type { DailyResult } from '../../game/daily/results.ts'
import { canWebShare, copyText, downloadBlob, shareCard } from './actions.ts'
import type { ShareNavigator } from './actions.ts'
import { svgDataUrl, svgToPng } from './png.ts'
import { SHARE_EN } from './strings.ts'

export type ShareStatus = { kind: 'idle' } | { kind: 'ok' | 'error'; text: string }

const browserNavigator = (): ShareNavigator | undefined => (typeof navigator === 'undefined' ? undefined : navigator)

/**
 * State and actions of the share panel: the card and the text of the result, the PNG made in advance for the chosen shape (so a tap on
 * Share can start the share sheet at once), and what each button does. Nothing is sent anywhere by this code: only the system share
 * sheet, the clipboard and a saved file, all started by the player.
 */
export function useShare(result: DailyResult, meta: ShareMeta, nav: ShareNavigator | undefined = browserNavigator()) {
  const [format, setFormat] = useState<CardFormat>('wide')
  const [status, setStatus] = useState<ShareStatus>({ kind: 'idle' })
  const [failedShare, setFailedShare] = useState(false)
  const [png, setPng] = useState<{ svg: string; file: File } | null>(null)
  const size = CARD_SIZES[format]
  const filename = `slaydoku-${result.n}${format === 'square' ? '-square' : ''}.png`
  const text = useMemo(() => emojiText(result, meta), [result, meta])
  const svg = useMemo(() => cardSvg(result, meta, size), [result, meta, size])
  const previewSrc = useMemo(() => svgDataUrl(svg), [svg])
  const description = useMemo(() => cardDescription(result, meta), [result, meta])
  const supported = canWebShare(nav)
  const current = png?.svg === svg ? png.file : null

  // The PNG of the shape on screen, made as soon as it is shown.
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
    if (outcome.status === 'shared') say({ kind: 'ok', text: SHARE_EN.status.shared })
    else if (outcome.status === 'failed') {
      setFailedShare(true)
      say({ kind: 'error', text: SHARE_EN.status.shareFailed })
    } else say({ kind: 'idle' })
  }
  const onCopy = async () => {
    const ok = await copyText(text, nav, typeof document === 'undefined' ? undefined : document)
    say(ok ? { kind: 'ok', text: SHARE_EN.status.copied } : { kind: 'error', text: SHARE_EN.status.copyFailed })
  }
  const onDownload = async () => {
    try {
      const file = current ?? new File([await svgToPng(svg, size)], filename, { type: 'image/png' })
      const ok = downloadBlob(file, filename, { document, url: URL })
      say(ok ? { kind: 'ok', text: SHARE_EN.status.downloaded } : { kind: 'error', text: SHARE_EN.status.downloadFailed })
    } catch {
      say({ kind: 'error', text: SHARE_EN.status.downloadFailed })
    }
  }

  return { format, setFormat, status, text, previewSrc, description, size, supported, showFallback: !supported || failedShare, onShare, onCopy, onDownload }
}
