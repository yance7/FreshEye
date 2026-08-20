import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HomeView from '@/views/HomeView.vue'
import type { GradCAMResult, PredictionResult } from '@/types'

const apiMocks = vi.hoisted(() => ({
  checkApiHealth: vi.fn(),
  callPredictApi: vi.fn()
}))

vi.mock('@/composables/useApi', () => ({
  ApiError: class MockApiError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
  useApi: () => apiMocks
}))

const wrappers: VueWrapper[] = []
const originalImage = globalThis.Image
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL
const originalScrollIntoView = Element.prototype.scrollIntoView

function deferredPrediction(): {
  promise: Promise<GradCAMResult>
  resolve: (value: GradCAMResult) => void
  reject: (reason?: unknown) => void
} {
  let resolve!: (value: GradCAMResult) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<GradCAMResult>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function prediction(level: 0 | 1 | 2, confidence: number): GradCAMResult {
  const result: PredictionResult = {
    freshness_level: level,
    freshness_label: level,
    confidence_score: confidence,
    all_probabilities: { 0: level === 0 ? confidence : 0.1, 1: level === 1 ? confidence : 0.1, 2: level === 2 ? confidence : 0.1 },
    description: 'deterministic test result',
    model_version: 'v2',
    timestamp: '2026-08-20T12:00:00.000Z'
  }
  return { prediction: result, heatmap_image: 'data:image/jpeg;base64,aGVhdG1hcA==' }
}

function testFile(name: string): File {
  return new File(['fish-eye'], name, { type: 'image/jpeg' })
}

async function chooseFile(wrapper: VueWrapper, file: File): Promise<void> {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
  await input.trigger('change')
  await flushPromises()
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
  await nextTick()
  await nextTick()
}

async function clickAnalyze(wrapper: VueWrapper): Promise<void> {
  await wrapper.find('.preview-actions .btn:not(.alt)').trigger('click')
  await nextTick()
}

function mountHome(): VueWrapper {
  const wrapper = mount(HomeView, {
    attachTo: document.body,
    global: {
      stubs: {
        CameraCaptureDialog: { template: '<div data-testid="camera-stub" />' },
        'router-link': { props: { to: { type: String, default: '/' } }, template: '<a :href="to"><slot /></a>' }
      }
    }
  })
  wrappers.push(wrapper)
  return wrapper
}

async function settle(): Promise<void> {
  await nextTick()
  await flushPromises()
  await nextTick()
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('fresheye-onboarded', '1')
  apiMocks.checkApiHealth.mockReset().mockResolvedValue(true)
  apiMocks.callPredictApi.mockReset()

  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn((file: File) => `blob:${file.name}`) })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
  vi.stubGlobal('Image', class TestImage {
    width = 100
    height = 100
    naturalWidth = 100
    naturalHeight = 100
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_value: string) { queueMicrotask(() => this.onload?.()) }
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,dGh1bWI=')
})

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL })
  if (originalScrollIntoView) {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: originalScrollIntoView })
  } else {
    delete (Element.prototype as Partial<Element>).scrollIntoView
  }
  globalThis.Image = originalImage
})

describe('HomeView interaction lifecycle', () => {
  it('uses the accessible guide dialog and restores the trigger focus on dismissal', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    localStorage.removeItem('fresheye-onboarded')
    const wrapper = mountHome()
    await settle()

    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    const dismiss = document.body.querySelector<HTMLButtonElement>('[data-testid="guide-dismiss"]')
    dismiss?.click()
    await settle()

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    expect(wrapper.text()).not.toContain('欢迎使用鲜眸')
  })

  it('closes the low-confidence dialog with Escape and restores focus', async () => {
    apiMocks.callPredictApi.mockResolvedValueOnce(prediction(2, 0.42))
    const wrapper = mountHome()
    await chooseFile(wrapper, testFile('low.jpg'))
    await clickAnalyze(wrapper)
    await settle()

    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog?.textContent).toContain('AI 对这张图片的判断不够确定')
    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await settle()

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })

  it('clears an incomplete preview and exposes a recoverable preprocessing error', async () => {
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      this.onerror?.(new Event('error'))
    })
    const wrapper = mountHome()
    await chooseFile(wrapper, testFile('broken.jpg'))

    expect(wrapper.find('#preview-card').exists()).toBe(false)
    expect(wrapper.text()).toContain('图像读取或处理失败，请重试')
  })

  it('ignores an older analysis response after a newer file analysis starts', async () => {
    const first = deferredPrediction()
    const second = deferredPrediction()
    apiMocks.callPredictApi.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const wrapper = mountHome()

    await chooseFile(wrapper, testFile('first.jpg'))
    void clickAnalyze(wrapper)
    await nextTick()
    await chooseFile(wrapper, testFile('second.jpg'))
    void clickAnalyze(wrapper)
    await nextTick()

    second.resolve(prediction(0, 0.96))
    await settle()
    first.resolve(prediction(2, 0.41))
    await settle()

    await vi.waitFor(() => expect(wrapper.find('#result-section').exists()).toBe(true))
    const resultText = wrapper.find('#result-section').text()
    expect(resultText).toContain('高度新鲜')
    expect(resultText).not.toContain('当前等级: 不新鲜')
  })

  it('does not issue a second analysis request while the current one is busy', async () => {
    const pending = deferredPrediction()
    apiMocks.callPredictApi.mockReturnValueOnce(pending.promise)
    const wrapper = mountHome()
    await chooseFile(wrapper, testFile('repeat.jpg'))

    void clickAnalyze(wrapper)
    await nextTick()
    void clickAnalyze(wrapper)
    await nextTick()

    expect(apiMocks.callPredictApi).toHaveBeenCalledOnce()
    pending.resolve(prediction(1, 0.88))
    await settle()
  })

  it('resets the low-confidence workspace when the user chooses to retake', async () => {
    apiMocks.callPredictApi.mockResolvedValueOnce(prediction(2, 0.42))
    const wrapper = mountHome()
    await chooseFile(wrapper, testFile('retake.jpg'))
    await clickAnalyze(wrapper)
    await settle()

    document.body.querySelector<HTMLButtonElement>('[data-testid="low-confidence-retry"]')?.click()
    await settle()

    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(wrapper.find('#preview-card').exists()).toBe(false)
  })
})
