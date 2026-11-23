import { afterEach, describe, expect, it, vi } from 'vitest'
import { useApi } from '@/composables/useApi'

afterEach(() => vi.unstubAllGlobals())

describe('prediction API adapter', () => {
  it('captures request time and response provenance without inventing old-service metadata', async () => {
    const payload = { prediction: { freshness_label: 0, confidence_score: 0.8, all_probabilities: [0.8, 0.1, 0.1], timestamp: '2026-01-01T00:00:00' } }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(payload), { headers: { 'X-FreshEye-Cache': 'hit', 'X-FreshEye-Revision': 'abc123', 'X-FreshEye-Weights-SHA256': 'a'.repeat(64) } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(payload))))
    const api = useApi()
    const current = await api.callPredictApi(new File(['image'], 'image.jpg'))
    expect(current.provenance).toMatchObject({ cacheStatus: 'hit', serviceRevision: 'abc123', weightsSha256: 'a'.repeat(64), resultCreatedAt: '2026-01-01T00:00:00' })
    expect(current.provenance?.requestedAt).toMatch(/Z$/)
    const old = await api.callPredictApi(new File(['image'], 'image.jpg'))
    expect(old.provenance).toMatchObject({ cacheStatus: 'unknown', serviceRevision: '', weightsSha256: '' })
  })
  it('reports model readiness and tolerates old health payloads', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok', models: { v1: { status: 'ready' }, v2: { status: 'unavailable' } } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok' })))
    vi.stubGlobal('fetch', fetchMock)
    const api = useApi()
    await expect(api.checkModelReadiness()).resolves.toEqual({ online: true, v1: 'ready', v2: 'unavailable' })
    await expect(api.checkModelReadiness()).resolves.toEqual({ online: true, v1: 'unknown', v2: 'unknown' })
  })
  it.each([
    {},
    { prediction: { freshness_label: 0, confidence_score: 0.8 } },
    { prediction: { confidence_score: 'invalid', all_probabilities: [0.8, 0.1, 0.1] } },
    { prediction: { confidence_score: 0.8, all_probabilities: [0.8, null, 0.2] } },
    { prediction: { confidence_score: 0, all_probabilities: [0, 0, 0] } }
  ])('rejects incomplete or invalid prediction scores: %j', async (payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))))

    await expect(useApi().callPredictApi(new File(['fish eye'], 'fish-eye.jpg')))
      .rejects.toMatchObject({ name: 'ApiError', code: 'server' })
  })

  it('preserves top-level prediction fields when a nested prediction omits them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        prediction: { freshness_level: 'Fresh' },
        all_probabilities: [5, 90, 5],
        confidence_score: '90',
        description: 'Top-level response description',
        model_version: 'v1',
        timestamp: '2026-08-20T00:00:00.000Z'
      })
    }))

    const result = await useApi().callPredictApi(
      new File(['fish eye'], 'fish-eye.jpg', { type: 'image/jpeg' })
    )

    expect(result.prediction).toEqual({
      freshness_level: 1,
      freshness_label: 1,
      confidence_score: 0.9,
      all_probabilities: { 0: 0.05, 1: 0.9, 2: 0.05 },
      description: 'Top-level response description',
      model_version: 'v1',
      timestamp: '2026-08-20T00:00:00.000Z'
    })
  })

  it('bridges a caller abort into the request timeout contract', async () => {
    const external = new AbortController()
    vi.stubGlobal('fetch', vi.fn((_: RequestInfo | URL, init?: RequestInit) => new Promise<never>((_, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('aborted', 'AbortError'))
      }, { once: true })
    })))

    const request = useApi().callPredictApi(
      new File(['fish eye'], 'fish-eye.jpg', { type: 'image/jpeg' }),
      'v2',
      external.signal
    )
    external.abort()

    await expect(request).rejects.toMatchObject({ name: 'ApiError', code: 'timeout' })
  })
})
