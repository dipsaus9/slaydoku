import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navigate, shouldIntercept } from './router.ts'

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string }

/**
 * A real `<a href>`: right click, "open in new tab" and copy link work. A plain left click is taken
 * over and becomes a `pushState` navigation instead of a page load.
 */
export function Link({ href, onClick, ...rest }: LinkProps) {
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    const anchor = event.currentTarget
    if (!shouldIntercept(event, { target: anchor.target, download: anchor.hasAttribute('download'), origin: anchor.origin }, window.location.origin)) return
    event.preventDefault()
    navigate(href)
  }
  return <a {...rest} href={href} onClick={handle} />
}
