import { afterEach, describe, expect, it, vi } from 'vitest'
import { useApi } from '@/composables/useApi'

afterEach(() => vi.unstubAllGlobals())

describe('prediction API adapter', () => {
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
})
