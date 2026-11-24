import type { FreshnessLabel, PredictionResult, ProbabilityMap } from '@/types'

// Temporary display rules, not calibrated food-safety or reliability thresholds.
export function confidenceLevel(score: number): 'high' | 'mid' | 'low' {
  if (score >= 0.8) return 'high'
  if (score >= 0.6) return 'mid'
  return 'low'
}

function readNumber(value: unknown): number {
  return typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : Number.NaN
}

export function clampProbability(value: unknown): number {
  const numeric = readNumber(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(1, numeric > 1 ? numeric / 100 : numeric))
}

const probabilityKeys: Record<FreshnessLabel, string[]> = {
  0: ['0', '高度新鲜', 'Highly Fresh', 'highly_fresh', 'highlyFresh'],
  1: ['1', '新鲜', 'Fresh', 'fresh'],
  2: ['2', '不新鲜', 'Not Fresh', 'not_fresh', 'notFresh']
}

function readProbabilities(raw: unknown): ProbabilityMap {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const valueAt = (index: FreshnessLabel): number =>
    readNumber(probabilityKeys[index].map((key) => source[key]).find((value) => value !== undefined))

  return { 0: valueAt(0), 1: valueAt(1), 2: valueAt(2) }
}

export function normalizeProbabilities(raw: unknown): ProbabilityMap {
  const values = readProbabilities(raw)
  return {
    0: clampProbability(values[0]),
    1: clampProbability(values[1]),
    2: clampProbability(values[2])
  }
}

export function hasPredictionScores(source: Record<string, unknown>): boolean {
  const confidence = readNumber(source.confidence_score ?? source.confidenceScore)
  const probabilities = Object.values(readProbabilities(source.all_probabilities ?? source.probabilityValues))
  const isScore = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100
  return isScore(confidence) && probabilities.every(isScore) && probabilities.some((value) => value > 0)
}

export function normalizeFreshnessLabel(
  level: unknown,
  label: unknown,
  probabilities: ProbabilityMap
): FreshnessLabel {
  for (const candidate of [label, level]) {
    const numeric = typeof candidate === 'number'
      ? candidate
      : typeof candidate === 'string' && candidate.trim() !== ''
        ? Number(candidate)
        : Number.NaN
    if (numeric === 0 || numeric === 1 || numeric === 2) return numeric
  }

  if (typeof level === 'string') {
    const value = level.toLowerCase()
    if (value.includes('高度') || value.includes('highly') || value.includes('very')) return 0
    if (value === '新鲜' || value === 'fresh') return 1
    if (value.includes('不新鲜') || value.includes('not fresh') || value.includes('stale')) return 2
  }

  return ([0, 1, 2] as FreshnessLabel[]).reduce((best, current) =>
    probabilities[current] > probabilities[best] ? current : best, 0 as FreshnessLabel)
}

export function normalizePrediction(
  raw: unknown,
  fallbackModel: 'v1' | 'v2',
  fallbackTimestamp = new Date().toISOString()
): PredictionResult {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const probabilities = normalizeProbabilities(source.all_probabilities ?? source.probabilityValues)
  const model = source.model_version ?? source.modelVersion
  const label = normalizeFreshnessLabel(
    source.freshness_level ?? source.freshnessLevel,
    source.freshness_label ?? source.freshnessLabel,
    probabilities
  )
  return {
    freshness_level: label,
    freshness_label: label,
    confidence_score: clampProbability(source.confidence_score ?? source.confidenceScore),
    all_probabilities: probabilities,
    description: typeof source.description === 'string' ? source.description : '',
    model_version: typeof model === 'string' ? model : fallbackModel,
    timestamp: typeof source.timestamp === 'string' ? source.timestamp : fallbackTimestamp
  }
}
