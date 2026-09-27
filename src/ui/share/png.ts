/** The SVG as a `data:` URL: works offline, in an `<img>` and as the source of a canvas, and never taints the canvas. */
export const svgDataUrl = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

/**
 * Draws an SVG card on a canvas of exactly `width` x `height` and returns it as a PNG. Runs in the browser only and needs nothing but
 * the SVG itself: the card has no images and uses system fonts, so there is no request to wait for.
 */
export async function svgToPng(svg: string, { width, height }: { width: number; height: number }): Promise<Blob> {
  const image = new Image(width, height)
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('The card could not be drawn.'))
    image.src = svgDataUrl(svg)
  })
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No canvas available.')
  context.drawImage(image, 0, 0, width, height)
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The PNG could not be made.'))), 'image/png'))
}
