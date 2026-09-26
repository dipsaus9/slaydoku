import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PortraitSheetView } from './PortraitSheetView.tsx'

/** The portrait contact sheet as a static HTML document. */
export function renderPortraitSheet(): string {
  return `<!doctype html>${renderToStaticMarkup(createElement(PortraitSheetView))}`
}
