/** English wording of the share panel. */
export const SHARE_EN = {
  title: 'Share your result',
  preview: (description: string) => `Preview of your result card. ${description}`,
  formats: { label: 'Card shape', wide: 'Wide', square: 'Square' },
  share: 'Share',
  copy: 'Copy text',
  download: 'Download image',
  textLabel: 'Text that is shared',
  status: {
    shared: 'Shared.',
    copied: 'Copied to your clipboard.',
    copyFailed: 'Could not copy. Select the text above and copy it by hand.',
    downloaded: 'Image saved to your device.',
    downloadFailed: 'Could not make the image.',
    shareFailed: 'Sharing did not work here. Copy the text or download the image instead.',
    preparing: 'Preparing the image…',
  },
  note: 'Nothing leaves your device unless you share it.',
} as const
