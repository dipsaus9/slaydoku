import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContactSheetView } from './ContactSheetView.tsx'

/** The whole contact sheet as a static HTML document. */
export function renderContactSheet(): string {
  return `<!doctype html>${renderToStaticMarkup(createElement(ContactSheetView))}`
}
