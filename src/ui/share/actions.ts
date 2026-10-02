/** What the share logic needs of `navigator` (a subset, so a test can pass a mock). */
export interface ShareNavigator {
  share?: (data: ShareData) => Promise<void>
  canShare?: (data?: ShareData) => boolean
  clipboard?: { writeText: (text: string) => Promise<void>; write?: (items: ClipboardItem[]) => Promise<void> }
}

/** What it needs of `document` to copy through a textarea. */
export interface CopyDocument {
  createElement: (tag: 'textarea') => HTMLTextAreaElement
  body: { appendChild: (node: Node) => unknown; removeChild: (node: Node) => unknown }
  execCommand: (command: string) => boolean
}

/** What it needs of `document` and `URL` to save a file. */
export interface DownloadEnv {
  document: { createElement: (tag: 'a') => HTMLAnchorElement; body: { appendChild: (node: Node) => unknown; removeChild: (node: Node) => unknown } }
  url: { createObjectURL: (blob: Blob) => string; revokeObjectURL: (url: string) => void }
  /** Schedules the release of the object URL after the browser started the download. Default `setTimeout`. */
  later?: (run: () => void) => void
}

/** The `ClipboardItem` constructor (a subset, so a test can pass a mock); absent in browsers that cannot copy images. */
export type ClipboardItemCtor = new (items: Record<string, Blob>) => ClipboardItem

export type CopyOutcome = 'image-and-text' | 'text' | 'failed'

export type ShareOutcome = { status: 'shared'; withImage: boolean } | { status: 'cancelled' } | { status: 'failed' }

/** True when the browser has the Web Share API. Without it the panel shows Copy text and Download image. */
export const canWebShare = (nav: ShareNavigator | undefined): boolean => typeof nav?.share === 'function'

const isAbort = (error: unknown): boolean => typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError'

/**
 * Shares through the system share sheet: the PNG together with the text when the browser can share that file (`canShare({ files })`),
 * otherwise the text alone. The user closing the sheet is `cancelled`, not an error. Call it straight from the click handler with an
 * image that is already made: a browser only lets a share start shortly after a tap, so nothing slow may come before it.
 */
export async function shareCard(nav: ShareNavigator, { title, text, file }: { title: string; text: string; file: File | null }): Promise<ShareOutcome> {
  if (typeof nav.share !== 'function') return { status: 'failed' }
  try {
    const withFile: ShareData = { title, text, files: file ? [file] : [] }
    if (file && typeof nav.canShare === 'function' && nav.canShare(withFile)) {
      await nav.share(withFile)
      return { status: 'shared', withImage: true }
    }
    await nav.share({ title, text })
    return { status: 'shared', withImage: false }
  } catch (error) {
    return isAbort(error) ? { status: 'cancelled' } : { status: 'failed' }
  }
}

/** The old way to copy: a textarea, selected, then `execCommand('copy')`. For browsers without the clipboard API or with it blocked. */
function copyThroughTextarea(text: string, doc: CopyDocument): boolean {
  const area = doc.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '-9999px'
  area.style.opacity = '0'
  doc.body.appendChild(area)
  try {
    area.focus()
    area.select()
    area.setSelectionRange(0, text.length)
    return doc.execCommand('copy')
  } catch {
    return false
  } finally {
    doc.body.removeChild(area)
  }
}

/** Copies text: the clipboard API first, the textarea trick when that is missing or refuses. False when both fail. */
export async function copyText(text: string, nav: ShareNavigator | undefined, doc: CopyDocument | undefined): Promise<boolean> {
  if (typeof nav?.clipboard?.writeText === 'function') {
    try {
      await nav.clipboard.writeText(text)
      return true
    } catch {
      // blocked (no permission, not a secure page): try the old way
    }
  }
  return doc ? copyThroughTextarea(text, doc) : false
}

/**
 * Copies the card: the PNG and the text together as one clipboard item where the browser supports `ClipboardItem` (and there is an image),
 * otherwise the text alone (`copyText`). Reports which of the two it did, so the panel can say so.
 */
export async function copyCard(
  { text, file }: { text: string; file: File | null },
  nav: ShareNavigator | undefined,
  doc: CopyDocument | undefined,
  Item: ClipboardItemCtor | undefined,
): Promise<CopyOutcome> {
  if (file && Item && typeof nav?.clipboard?.write === 'function') {
    try {
      await nav.clipboard.write([new Item({ 'image/png': file, 'text/plain': new Blob([text], { type: 'text/plain' }) })])
      return 'image-and-text'
    } catch {
      // not allowed for this type or page: copy the text alone
    }
  }
  return (await copyText(text, nav, doc)) ? 'text' : 'failed'
}

/** Saves a blob as a file through a temporary link. Returns false when the browser could not do it. */
export function downloadBlob(blob: Blob, filename: string, env: DownloadEnv): boolean {
  let href = ''
  try {
    href = env.url.createObjectURL(blob)
    const link = env.document.createElement('a')
    link.href = href
    link.download = filename
    link.rel = 'noopener'
    env.document.body.appendChild(link)
    link.click()
    env.document.body.removeChild(link)
    return true
  } catch {
    return false
  } finally {
    const release = href
    if (release) (env.later ?? ((run) => void setTimeout(run, 4000)))(() => env.url.revokeObjectURL(release))
  }
}
