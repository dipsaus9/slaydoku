import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { DailyResult } from '../../game/daily/results.ts'
import { LocaleProvider } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { ResultOverlay } from '../play/ResultOverlay.tsx'
import { StartScreen } from '../daily/StartScreen.tsx'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { canWebShare, copyCard, copyText, downloadBlob, shareCard } from './actions.ts'
import type { CopyDocument, DownloadEnv, ShareNavigator } from './actions.ts'
import { svgDataUrl } from './png.ts'
import { SharePanel } from './SharePanel.tsx'
import { SHARE_STRINGS } from './strings.ts'

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim()
const result: DailyResult = { n: 43, date: '2026-11-23', tier: 'medium', fp: 'fp', elapsedMs: 252_000, hints: 2, wrongChecks: 0, murdererId: 'p1' }
const meta = { tier: 'medium', size: 9, siteUrl: 'https://slaydoku.vercel.app' } as const
const file = new File(['png'], 'slaydoku-43.png', { type: 'image/png' })
const abort = () => Object.assign(new Error('closed'), { name: 'AbortError' })

describe('shareCard', () => {
  it('shares the PNG together with the text when the browser can share that file', async () => {
    const nav = { share: vi.fn(async () => {}), canShare: vi.fn(() => true) }
    const outcome = await shareCard(nav, { title: 'Slaydoku #43', text: 'the text', file })
    expect(outcome).toEqual({ status: 'shared', withImage: true })
    expect(nav.canShare).toHaveBeenCalledWith(expect.objectContaining({ files: [file] }))
    expect(nav.share).toHaveBeenCalledWith({ title: 'Slaydoku #43', text: 'the text', files: [file] })
  })

  it('shares the text alone when files cannot be shared', async () => {
    const nav = { share: vi.fn(async () => {}), canShare: vi.fn(() => false) }
    expect(await shareCard(nav, { title: 't', text: 'x', file })).toEqual({ status: 'shared', withImage: false })
    expect(nav.share).toHaveBeenCalledWith({ title: 't', text: 'x' })
  })

  it('shares the text alone when there is no canShare or no image yet', async () => {
    const plain = { share: vi.fn(async () => {}) }
    expect(await shareCard(plain, { title: 't', text: 'x', file })).toEqual({ status: 'shared', withImage: false })
    const canShare = vi.fn(() => true)
    const nav = { share: vi.fn(async () => {}), canShare }
    expect(await shareCard(nav, { title: 't', text: 'x', file: null })).toEqual({ status: 'shared', withImage: false })
    expect(canShare).not.toHaveBeenCalled()
  })

  it('reads closing the share sheet as cancelled and any other error as failed', async () => {
    expect(await shareCard({ share: async () => Promise.reject(abort()) }, { title: 't', text: 'x', file: null })).toEqual({ status: 'cancelled' })
    expect(await shareCard({ share: async () => Promise.reject(new Error('nope')) }, { title: 't', text: 'x', file: null })).toEqual({ status: 'failed' })
    expect(await shareCard({}, { title: 't', text: 'x', file: null })).toEqual({ status: 'failed' })
  })

  it('detects the Web Share API', () => {
    expect(canWebShare({ share: async () => {} })).toBe(true)
    expect(canWebShare({})).toBe(false)
    expect(canWebShare(undefined)).toBe(false)
  })
})

/** A textarea and a document that record what the copy fallback does. */
function fakeDocument(copy: boolean | 'throw') {
  const area = { value: '', style: {} as Record<string, string>, attrs: [] as string[], focus: vi.fn(), select: vi.fn(), setSelectionRange: vi.fn(), setAttribute(name: string) { this.attrs.push(name) } }
  const body = { appendChild: vi.fn(), removeChild: vi.fn() }
  const doc = {
    createElement: () => area as unknown as HTMLTextAreaElement,
    body,
    execCommand: vi.fn((command: string) => {
      if (copy === 'throw') throw new Error('not allowed')
      return command === 'copy' && copy
    }),
  } satisfies CopyDocument
  return { area, body, doc }
}

describe('copyCard', () => {
  const file = new File(['png'], 'slaydoku-1-square.png', { type: 'image/png' })
  class FakeItem {
    items: Record<string, Blob>
    constructor(items: Record<string, Blob>) {
      this.items = items
    }
  }
  const Item = FakeItem as unknown as new (items: Record<string, Blob>) => ClipboardItem

  it('writes image and text as one clipboard item when ClipboardItem is supported', async () => {
    const write = vi.fn(async () => {})
    const writeText = vi.fn(async () => {})
    expect(await copyCard({ text: 'hi', file }, { clipboard: { write, writeText } }, undefined, Item)).toBe('image-and-text')
    expect(write).toHaveBeenCalledOnce()
    const item = (write.mock.calls[0] as unknown as [FakeItem[]])[0][0]!
    expect(Object.keys(item.items).sort()).toEqual(['image/png', 'text/plain'])
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copies text only without ClipboardItem or without an image', async () => {
    const writeText = vi.fn(async () => {})
    expect(await copyCard({ text: 'hi', file }, { clipboard: { writeText } }, undefined, undefined)).toBe('text')
    expect(await copyCard({ text: 'hi', file: null }, { clipboard: { write: vi.fn(async () => {}), writeText } }, undefined, Item)).toBe('text')
    expect(writeText).toHaveBeenCalledTimes(2)
  })

  it('falls back to text when the image write is refused, and fails when nothing works', async () => {
    const writeText = vi.fn(async () => {})
    const write = vi.fn(async () => Promise.reject(new Error('denied')))
    expect(await copyCard({ text: 'hi', file }, { clipboard: { write, writeText } }, undefined, Item)).toBe('text')
    expect(await copyCard({ text: 'hi', file }, undefined, undefined, Item)).toBe('failed')
  })
})

describe('copyText', () => {
  it('uses the clipboard API when there is one', async () => {
    const nav: ShareNavigator = { clipboard: { writeText: vi.fn(async () => {}) } }
    const { doc } = fakeDocument(true)
    expect(await copyText('hello', nav, doc)).toBe(true)
    expect(nav.clipboard!.writeText).toHaveBeenCalledWith('hello')
    expect(doc.execCommand).not.toHaveBeenCalled()
  })

  it('falls back to a textarea when the clipboard API is missing', async () => {
    const { area, body, doc } = fakeDocument(true)
    expect(await copyText('hello', {}, doc)).toBe(true)
    expect(area.value).toBe('hello')
    expect(area.select).toHaveBeenCalled()
    expect(doc.execCommand).toHaveBeenCalledWith('copy')
    expect(body.appendChild).toHaveBeenCalledWith(area)
    expect(body.removeChild).toHaveBeenCalledWith(area)
  })

  it('falls back to a textarea when the clipboard API refuses', async () => {
    const nav: ShareNavigator = { clipboard: { writeText: vi.fn(async () => Promise.reject(new Error('denied'))) } }
    const { doc } = fakeDocument(true)
    expect(await copyText('hello', nav, doc)).toBe(true)
    expect(doc.execCommand).toHaveBeenCalledWith('copy')
  })

  it('reports false when every way fails, and always cleans the textarea up', async () => {
    const refused = fakeDocument(false)
    expect(await copyText('hello', undefined, refused.doc)).toBe(false)
    const thrown = fakeDocument('throw')
    expect(await copyText('hello', undefined, thrown.doc)).toBe(false)
    expect(thrown.body.removeChild).toHaveBeenCalledWith(thrown.area)
    expect(await copyText('hello', undefined, undefined)).toBe(false)
  })
})

describe('downloadBlob', () => {
  const env = () => {
    const link = { href: '', download: '', rel: '', click: vi.fn() }
    const body = { appendChild: vi.fn(), removeChild: vi.fn() }
    const url = { createObjectURL: vi.fn(() => 'blob:card'), revokeObjectURL: vi.fn() }
    const later: ((run: () => void) => void) = (run) => run()
    return { link, body, url, env: { document: { createElement: () => link as unknown as HTMLAnchorElement, body }, url, later } satisfies DownloadEnv }
  }

  it('saves the blob under the file name through a link and releases the URL', () => {
    const { link, body, url, env: e } = env()
    expect(downloadBlob(new Blob(['png']), 'slaydoku-43.png', e)).toBe(true)
    expect(link.href).toBe('blob:card')
    expect(link.download).toBe('slaydoku-43.png')
    expect(link.click).toHaveBeenCalledOnce()
    expect(body.appendChild).toHaveBeenCalledWith(link)
    expect(body.removeChild).toHaveBeenCalledWith(link)
    expect(url.revokeObjectURL).toHaveBeenCalledWith('blob:card')
  })

  it('reports false when the browser cannot do it', () => {
    const { link, env: e } = env()
    link.click.mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(downloadBlob(new Blob(['png']), 'x.png', e)).toBe(false)
  })
})

describe.each(['en', 'nl'] as const)('<SharePanel/> (%s)', (locale: Locale) => {
  const t = SHARE_STRINGS[locale]
  const render = (nav: ShareNavigator) =>
    renderToStaticMarkup(
      <LocaleProvider storage={null} browserLanguage={locale === 'nl' ? 'nl-NL' : 'en-US'}>
        <SharePanel result={result} meta={meta} nav={nav} />
      </LocaleProvider>,
    )

  it('shows the card preview, the text and no shape toggle', () => {
    const html = render({ share: async () => {} })
    const text = strip(html)
    expect(html).toContain('data-share-preview')
    expect(html).toContain('src="data:image/svg+xml;charset=utf-8,')
    expect(html).toContain('width="1200" height="1200"')
    expect(html).toContain(`alt="${t.preview('').trim()}`)
    expect(text).toContain(`Slaydoku #43 · ${locale === 'nl' ? 'Gemiddeld' : 'Medium'} · 9x9`)
    expect(text).toContain('⏱ 04:12 · 💡 2 hints')
    expect(text).toContain('slaydoku.vercel.app')
    expect(html).not.toContain('data-format')
    expect(text).toContain(t.note)
  })

  it('offers Share where the browser has a share sheet, and no fallback buttons yet', () => {
    const html = render({ share: async () => {} })
    expect(html).toContain('data-action="share"')
    expect(html).not.toContain('data-action="copy"')
    expect(html).not.toContain('data-action="download"')
  })

  it('offers Copy and Download image where there is no share sheet', () => {
    const html = render({})
    expect(html).not.toContain('data-action="share"')
    expect(html).toContain('data-action="copy"')
    expect(html).toContain(`>${t.copy}<`)
    expect(html).toContain('data-action="download"')
    expect(html).toContain(`>${t.download}<`)
  })

  it('has a polite status line and real buttons only (keyboard reachable)', () => {
    const html = render({})
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-live="polite"')
    expect(html.match(/<button [^>]*type="button"/g)!.length).toBe(html.match(/<button/g)!.length)
    expect(html).not.toMatch(/tabindex="-1"|onclick|<a /i)
  })

  it('puts the card in the data URL, with the same words as the text', () => {
    const html = render({})
    const src = /src="(data:[^"]+)"/.exec(html)![1]!.replaceAll('&#x27;', "'").replaceAll('&amp;', '&')
    const svg = decodeURIComponent(src.slice(src.indexOf(',') + 1))
    expect(svg).toContain(locale === 'nl' ? 'Puzzel van 23 november' : 'Puzzle of 23 November')
    expect(svg).toContain('04:12')
    expect(svgDataUrl(svg)).toBe(src)
  })
})

describe('where the card is', () => {
  const { days } = readSchedule()
  const day = days[3]!
  const solved = { kind: 'solved', result: { ...result, n: day.n, date: day.date, fp: day.fp, murdererId: day.puzzle.people.find((p) => p.kind === 'suspect')!.id } } as const

  it('the share slot of a solved start screen holds a compact Share button, not the panel itself (SLAY-9.13: a reopenable popover instead)', () => {
    const html = renderToStaticMarkup(
      <StartScreen state={{ kind: 'day', day, status: solved, ended: false }} clock={() => Date.parse('2026-10-15T22:00:00Z')} onPlay={() => {}} share={<SharePanel result={solved.result} meta={{ tier: day.tier, size: day.size }} nav={{}} />} />,
    )
    expect(html).toMatch(/data-slot="share"[^>]*><button [^>]*data-action="share"/)
    expect(html).not.toContain('<section class="share"')
  })

  it('leaves the slot empty on a new day', () => {
    const html = renderToStaticMarkup(
      <StartScreen state={{ kind: 'day', day, status: { kind: 'new' }, ended: false }} clock={() => Date.parse('2026-10-15T22:00:00Z')} onPlay={() => {}} share={<p>share</p>} />,
    )
    expect(html).not.toContain('share</p>')
  })

  it('shows the card in the solved dialog and never in the wrong-board dialog', () => {
    const puzzle = day.puzzle
    const id = puzzle.people.find((p) => p.kind === 'suspect')!.id
    const ok = renderToStaticMarkup(<ResultOverlay puzzle={puzzle} result={{ solved: true, murdererId: id, elapsedMs: 5000 } as never} onRestart={() => {}} onDismiss={() => {}} share={<p>the card</p>} />)
    expect(ok).toContain('the card')
    const wrong = renderToStaticMarkup(<ResultOverlay puzzle={puzzle} result={{ solved: false, correctCount: 2, total: 5 } as never} onRestart={() => {}} onDismiss={() => {}} share={<p>the card</p>} />)
    expect(wrong).not.toContain('the card')
    expect(renderToStaticMarkup(<ResultOverlay puzzle={puzzle} result={{ solved: true, murdererId: id, elapsedMs: 5000 } as never} onRestart={() => {}} onDismiss={() => {}} />)).not.toContain('the card')
  })
})
