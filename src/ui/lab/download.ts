/** Hands the browser a text file to save. Best effort: a browser without Blob URLs just does nothing. */
export function downloadText(filename: string, text: string, type = 'application/json'): void {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch {
    // nothing to save with
  }
}
