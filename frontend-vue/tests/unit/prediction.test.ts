import { describe, expect, it } from 'vitest'
import { clampProbability, normalizePrediction, normalizeProbabilities } from '@/utils/prediction'

describe('prediction normalization', () => {
  it.each([[null, 0], ['', 0], ['82', 0.82], [0.82, 0.82], [140, 1], [-2, 0]])(
    'normalizes %p to %p', (input, expected) => expect(clampProbability(input)).toBe(expected)
  )

  it('normalizes API arrays and historical aliases identically', () => {
    expect(normalizeProbabilities([82, 12, 6])).toEqual({ 0: 0.82, 1: 0.12, 2: 0.06 })
    expect(normalizeProbabilities({ highly_fresh: '82', fresh: '12', not_fresh: '6' }))
      .toEqual({ 0: 0.82, 1: 0.12, 2: 0.06 })
  })

  it('uses the largest probability when labels are malformed', () => {
    expect(normalizePrediction({ all_probabilities: [8, 81, 11] }, 'v2', '2026-08-20T00:00:00.000Z').freshness_label).toBe(1)
  })

  it('normalizes legacy camelCase fields and malformed payloads', () => {
    expect(normalizePrediction({
      freshnessLevel: 'Not Fresh',
      confidenceScore: '61',
      probabilityValues: { highlyFresh: 15, fresh: 24, notFresh: 61 },
      modelVersion: 'v1',
      timestamp: '2026-08-19T23:59:59.000Z'
    }, 'v2', '2026-08-20T00:00:00.000Z')).toMatchObject({
      freshness_level: 2,
      freshness_label: 2,
      confidence_score: 0.61,
      all_probabilities: { 0: 0.15, 1: 0.24, 2: 0.61 },
      model_version: 'v1',
      timestamp: '2026-08-19T23:59:59.000Z'
    })
    expect(normalizePrediction(null, 'v1', '2026-08-20T00:00:00.000Z')).toMatchObject({
      freshness_level: 0,
      confidence_score: 0,
      all_probabilities: { 0: 0, 1: 0, 2: 0 },
      model_version: 'v1',
      timestamp: '2026-08-20T00:00:00.000Z'
    })
  })
})
