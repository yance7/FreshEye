/** Convert an in-memory data URL to a Blob without issuing a network request. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/i)
  if (!match) throw new Error('Invalid image data URL')

  const mimeType = match[1] || 'application/octet-stream'
  const body = match[3]
  if (!match[2]) return new Blob([decodeURIComponent(body)], { type: mimeType })

  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: mimeType })
}
