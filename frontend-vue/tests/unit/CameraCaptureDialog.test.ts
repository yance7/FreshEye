import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import CameraCaptureDialog from '@/components/CameraCaptureDialog.vue'

type TestTrack = { stop: ReturnType<typeof vi.fn> }
type TestStream = { getTracks: () => TestTrack[] }

const wrappers: VueWrapper[] = []
const originalMediaDevices = Object.getOwnPropertyDescriptor(Navigator.prototype, 'mediaDevices')
const originalPlay = HTMLMediaElement.prototype.play

function createStream(): { stream: TestStream; track: TestTrack } {
  const track = { stop: vi.fn() }
  const stream = { getTracks: () => [track] }
  return { stream, track }
}

function setMediaDevices(getUserMedia: ReturnType<typeof vi.fn>): void {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia }
  })
}

async function settle(): Promise<void> {
  await nextTick()
  await nextTick()
}

function bodyButton(testId: string): HTMLButtonElement {
  const button = document.body.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)
  if (!button) throw new Error(`Expected camera button ${testId}`)
  return button
}

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  HTMLMediaElement.prototype.play = originalPlay
  if (originalMediaDevices) Object.defineProperty(Navigator.prototype, 'mediaDevices', originalMediaDevices)
  else delete (navigator as Navigator & { mediaDevices?: MediaDevices }).mediaDevices
  vi.restoreAllMocks()
})

describe('CameraCaptureDialog', () => {
  it('starts one stream and stops every track when the dialog closes', async () => {
    const { stream, track } = createStream()
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    setMediaDevices(getUserMedia)
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    document.body.style.overflow = 'clip'

    const wrapper = mount(CameraCaptureDialog, { attachTo: document.body, props: { open: true } })
    wrappers.push(wrapper)
    await settle()

    expect(getUserMedia).toHaveBeenCalledOnce()
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }))

    await wrapper.setProps({ open: false })
    await settle()

    expect(track.stop).toHaveBeenCalledOnce()
    expect(document.body.style.overflow).toBe('clip')
  })

  it('stops a stream that resolves after the dialog has closed', async () => {
    let resolveStream: (stream: TestStream) => void = () => undefined
    const pending = new Promise<TestStream>((resolve) => { resolveStream = resolve })
    const getUserMedia = vi.fn().mockReturnValue(pending)
    setMediaDevices(getUserMedia)
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(CameraCaptureDialog, { attachTo: document.body, props: { open: true } })
    wrappers.push(wrapper)
    await settle()
    await wrapper.setProps({ open: false })

    const { track, stream } = createStream()
    resolveStream(stream)
    await settle()

    expect(track.stop).toHaveBeenCalledOnce()
  })

  it('shows a file fallback after permission failure and emits the fallback action', async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    setMediaDevices(getUserMedia)
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(CameraCaptureDialog, { attachTo: document.body, props: { open: true } })
    wrappers.push(wrapper)
    await settle()

    const fallback = bodyButton('camera-fallback')
    expect(fallback.getAttribute('disabled')).toBeNull()
    fallback.click()
    await settle()

    expect(wrapper.emitted('fallback')).toHaveLength(1)
  })

  it('stops the current stream before replacing it when the camera is flipped', async () => {
    const first = createStream()
    const second = createStream()
    const getUserMedia = vi.fn()
      .mockResolvedValueOnce(first.stream)
      .mockResolvedValueOnce(second.stream)
    setMediaDevices(getUserMedia)
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(CameraCaptureDialog, { attachTo: document.body, props: { open: true } })
    wrappers.push(wrapper)
    await settle()
    bodyButton('camera-flip').click()
    await settle()

    expect(getUserMedia).toHaveBeenCalledTimes(2)
    expect(first.track.stop).toHaveBeenCalledOnce()

    await wrapper.setProps({ open: false })
    await settle()
    expect(second.track.stop).toHaveBeenCalledOnce()
  })

  it('captures a JPEG at the video source resolution', async () => {
    const { stream } = createStream()
    setMediaDevices(vi.fn().mockResolvedValue(stream))
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['jpeg'], { type: 'image/jpeg' }))
    })

    const wrapper = mount(CameraCaptureDialog, { attachTo: document.body, props: { open: true } })
    wrappers.push(wrapper)
    await settle()

    const video = document.body.querySelector('video')
    if (!video) throw new Error('Expected camera video')
    Object.defineProperties(video, {
      videoWidth: { configurable: true, value: 1920 },
      videoHeight: { configurable: true, value: 1080 }
    })

    bodyButton('camera-capture').click()
    await settle()

    const [file] = wrapper.emitted('capture')?.[0] ?? []
    expect(file).toBeInstanceOf(File)
    expect((file as File).type).toBe('image/jpeg')
    expect((file as File).name).toBe('fresheye-camera.jpg')
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1920, 1080)
  })
})
