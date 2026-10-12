import { describe, expect, it, vi } from 'vitest'
import { prepareImageAssets } from '@/utils/imageAssets'

describe('image asset preparation', () => {
  it('decodes once and returns preview, upload, and thumbnail blobs', async () => {
    const bitmap = { width: 2000, height: 1000, close: vi.fn() }
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))

    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage, fillRect: vi.fn() } as unknown as CanvasRenderingContext2D)
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
    toBlob.mockImplementation(function (this: HTMLCanvasElement, callback: BlobCallback) {
      callback(new Blob([`canvas-${this.width}x${this.height}`], { type: 'image/jpeg' }))
    })

    const result = await prepareImageAssets(new File(['fish-eye'], 'fish-eye.jpg', { type: 'image/jpeg' }))

    expect(result).toMatchObject({ width: 2000, height: 1000 })
    expect(result.preview).toBeInstanceOf(Blob)
    expect(result.upload).toBeInstanceOf(Blob)
    expect(result.thumbnail).toBeInstanceOf(Blob)
    expect(createImageBitmap).toHaveBeenCalledOnce()
    expect(drawImage).toHaveBeenCalledTimes(3)
    expect(bitmap.close).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })
})
