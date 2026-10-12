export interface PreparedImageAssets {
  preview: Blob
  upload: Blob
  thumbnail: Blob
  width: number
  height: number
}

function renderBlob(source: ImageBitmap, maxSize: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const scale = Math.min(1, maxSize / Math.max(source.width, source.height))
    const width = Math.max(1, Math.round(source.width * scale))
    const height = Math.max(1, Math.round(source.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      reject(new Error('Canvas 2D context is unavailable'))
      return
    }
    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)
    context.drawImage(source, 0, 0, width, height)
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Image encoding failed'))
    }, 'image/jpeg', quality)
  })
}

/** Decode once, then derive all browser-facing image assets from the bitmap. */
export async function prepareImageAssets(file: File): Promise<PreparedImageAssets> {
  const bitmap = await createImageBitmap(file)
  try {
    const [preview, upload, thumbnail] = await Promise.all([
      renderBlob(bitmap, 1600, 0.88),
      renderBlob(bitmap, 1280, 0.9),
      renderBlob(bitmap, 160, 0.7)
    ])
    return {
      preview,
      upload,
      thumbnail,
      width: bitmap.width,
      height: bitmap.height
    }
  } finally {
    bitmap.close()
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Blob reading failed'))
    reader.readAsDataURL(blob)
  })
}
