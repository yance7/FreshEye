// 鲜眸 FreshEye · 历史记录 composable
// localStorage 持久化，最多 50 条，缩略图自动压缩。
import { ref } from 'vue'
import { FAVORITES_KEY, HISTORY_KEY, LEGACY_FAVORITES_KEYS, LEGACY_HISTORY_KEYS, MAX_HISTORY } from '@/config'
import type { FreshnessLabel, HistoryRecord, PredictionResult, ProbabilityMap } from '@/types'

/** 全局共享的历史记录列表 */
const history = ref<HistoryRecord[]>([])

/** 从 localStorage 读取历史记录 */
function loadHistory(): HistoryRecord[] {
  for (const key of [HISTORY_KEY, ...LEGACY_HISTORY_KEYS]) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      // 当前键损坏时继续读取兼容键，避免旧记录被遮蔽。
    }
  }
  return []
}

function loadFavoriteIds(): Set<string> {
  const ids = new Set<string>()
  for (const key of [FAVORITES_KEY, ...LEGACY_FAVORITES_KEYS]) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) parsed.forEach((id) => ids.add(String(id)))
    } catch {
      // 某个兼容键损坏时继续读取其他收藏键。
    }
  }
  return ids
}

/** 写入 localStorage */
function saveHistory(list: HistoryRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    /* 存储满或不可用时忽略 */
  }
}

function normalizeLevel(level: unknown, label: unknown, probabilities: ProbabilityMap): FreshnessLabel {
  const numeric = Number(label)
  if (numeric === 0 || numeric === 1 || numeric === 2) return numeric
  if (typeof level === 'string') {
    const value = level.toLowerCase()
    if (value.includes('高度') || value.includes('highly')) return 0
    if (value === '新鲜' || value === 'fresh') return 1
    if (value.includes('不新鲜') || value.includes('not fresh')) return 2
  }
  return ([0, 1, 2] as FreshnessLabel[]).reduce((best, current) =>
    probabilities[current] > probabilities[best] ? current : best, 0 as FreshnessLabel)
}

function normalizeProbabilities(raw: unknown): ProbabilityMap {
  const source = Array.isArray(raw)
    ? { 0: raw[0], 1: raw[1], 2: raw[2] }
    : (raw && typeof raw === 'object' ? raw as Record<string, unknown> : {})
  const value = (input: unknown): number => {
    const numeric = Number(input)
    if (!Number.isFinite(numeric)) return 0
    return Math.max(0, Math.min(1, numeric > 1 ? numeric / 100 : numeric))
  }
  return { 0: value(source[0]), 1: value(source[1]), 2: value(source[2]) }
}

/** 兼容旧版 HTML 前端写入的历史记录字段，避免迁移后历史记录“消失”。 */
function normalizeRecord(raw: unknown): HistoryRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, any>
  const probabilities = normalizeProbabilities(source.prediction?.all_probabilities ?? source.probabilities)
  const level = normalizeLevel(
    source.prediction?.freshness_level ?? source.freshnessLevel,
    source.prediction?.freshness_label ?? source.freshnessLabel,
    probabilities
  )
  const hasPrediction = Boolean(source.prediction) || 'freshnessLevel' in source || 'freshnessLabel' in source || 'confidenceScore' in source
  const prediction: PredictionResult | undefined = hasPrediction
    ? {
        freshness_level: level,
        freshness_label: level,
        confidence_score: Math.max(0, Math.min(1, Number(source.prediction?.confidence_score ?? source.confidenceScore ?? 0) || 0)),
        all_probabilities: probabilities,
        description: source.prediction?.description ?? source.description ?? '',
        model_version: source.prediction?.model_version ?? source.modelVersion ?? 'v2',
        timestamp: source.prediction?.timestamp ?? source.timestamp ?? new Date().toISOString()
      }
    : undefined
  const data = source.data ?? source.thumbnail
  if (typeof data !== 'string' || !data) return null
  return {
    id: String(source.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    data,
    duration: Number(source.duration ?? source.processingTime ?? 0) || 0,
    timestamp: String(source.timestamp ?? prediction?.timestamp ?? new Date().toISOString()),
    favorite: Boolean(source.favorite),
    prediction,
    heatmap: String(source.heatmap ?? source.heatmapThumbnail ?? '')
  }
}

/**
 * 压缩缩略图：将原图绘制到 canvas 并缩放至最大边 160px，输出 JPEG data URL。
 * 失败时回退为原图。
 */
function compressThumbnail(dataUrl: string, maxSize = 160): Promise<string> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(dataUrl)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(dataUrl)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/** 初始化：从 localStorage 载入到响应式列表 */
function initHistory(): void {
  const favoriteIds = loadFavoriteIds()
  history.value = loadHistory()
    .map(normalizeRecord)
    .filter((record): record is HistoryRecord => record !== null)
    .map((record) => ({ ...record, favorite: record.favorite || favoriteIds.has(record.id) }))
    .slice(0, MAX_HISTORY)
}

/**
 * 新增一条历史记录
 * @param data 原图 data URL（会被压缩为缩略图）
 * @param duration 分析耗时（毫秒）
 * @param prediction 预测结果（可选）
 * @param heatmap 热力图 data URL（可选）
 */
async function addHistoryRecord(
  data: string,
  duration: number,
  prediction?: PredictionResult,
  heatmap?: string
): Promise<HistoryRecord> {
  const [thumb, heatThumb] = await Promise.all([
    compressThumbnail(data),
    heatmap ? compressThumbnail(heatmap, 320) : Promise.resolve('')
  ])
  const record: HistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    data: thumb,
    duration,
    timestamp: new Date().toISOString(),
    favorite: false,
    prediction,
    heatmap: heatThumb
  }
  history.value.unshift(record)
  if (history.value.length > MAX_HISTORY) {
    history.value = history.value.slice(0, MAX_HISTORY)
  }
  saveHistory(history.value)
  return record
}

/** 删除指定历史记录 */
function deleteHistory(id: string): void {
  history.value = history.value.filter((r) => r.id !== id)
  saveHistory(history.value)
}

/** 清空全部历史记录 */
function clearAllHistory(): void {
  history.value = []
  saveHistory(history.value)
}

/** 切换收藏状态 */
function toggleFavorite(id: string): void {
  const target = history.value.find((r) => r.id === id)
  if (target) {
    target.favorite = !target.favorite
    saveHistory(history.value)
  }
}

export function useHistory() {
  return {
    history,
    initHistory,
    loadHistory,
    saveHistory,
    addHistoryRecord,
    deleteHistory,
    clearAllHistory,
    toggleFavorite
  }
}
