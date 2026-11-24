// 鲜眸 FreshEye · 历史记录 composable
// localStorage 持久化，最多 50 条，缩略图自动压缩。
import { ref } from 'vue'
import { FAVORITES_KEY, HISTORY_KEY, LEGACY_FAVORITES_KEYS, LEGACY_HISTORY_KEYS, MAX_HISTORY } from '@/config'
import type { HistoryRecord, PredictionResult, RequestProvenance } from '@/types'
import { normalizePrediction } from '@/utils/prediction'

/** 全局共享的历史记录列表 */
const history = ref<HistoryRecord[]>([])
const storageError = ref(false)

/** 从 localStorage 读取历史记录 */
function loadHistory(): { records: unknown[]; legacy: boolean } {
  for (const key of [HISTORY_KEY, ...LEGACY_HISTORY_KEYS]) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && (key === HISTORY_KEY || parsed.length > 0)) {
        return { records: parsed, legacy: key !== HISTORY_KEY }
      }
    } catch {
      // 当前键损坏时继续读取兼容键，避免旧记录被遮蔽。
      storageError.value = true
    }
  }
  return { records: [], legacy: false }
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
      storageError.value = true
    }
  }
  return ids
}

/** 写入 localStorage */
function saveHistory(list: HistoryRecord[]): boolean {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
    storageError.value = false
    return true
  } catch {
    storageError.value = true
    return false
  }
}

function removeLegacyCopies(): boolean {
  try {
    for (const key of [...LEGACY_HISTORY_KEYS, FAVORITES_KEY, ...LEGACY_FAVORITES_KEYS]) localStorage.removeItem(key)
    return true
  } catch {
    storageError.value = true
    return false
  }
}

/** 兼容旧版 HTML 前端写入的历史记录字段，避免迁移后历史记录“消失”。 */
function normalizeRecord(raw: unknown, favoriteIds: Set<string>, legacy: boolean): HistoryRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  const nestedPrediction = source.prediction && typeof source.prediction === 'object'
    ? source.prediction as Record<string, unknown>
    : {}
  const hasPrediction = Boolean(source.prediction) || 'freshnessLevel' in source || 'freshnessLabel' in source || 'confidenceScore' in source || 'probabilityValues' in source
  const prediction: PredictionResult | undefined = hasPrediction
    ? normalizePrediction({
        freshness_level: nestedPrediction.freshness_level ?? nestedPrediction.freshnessLevel ?? source.freshnessLevel,
        freshness_label: nestedPrediction.freshness_label ?? nestedPrediction.freshnessLabel ?? source.freshnessLabel,
        confidence_score: nestedPrediction.confidence_score ?? nestedPrediction.confidenceScore ?? source.confidenceScore,
        all_probabilities: nestedPrediction.all_probabilities ?? nestedPrediction.probabilityValues ?? source.probabilityValues ?? source.probabilities,
        description: nestedPrediction.description ?? source.description,
        model_version: nestedPrediction.model_version ?? nestedPrediction.modelVersion ?? source.modelVersion,
        timestamp: nestedPrediction.timestamp ?? source.timestamp
      }, 'v2', '')
    : undefined
  const recordedModel = nestedPrediction.model_version ?? nestedPrediction.modelVersion ?? source.modelVersion
  if (prediction && (typeof recordedModel !== 'string' || !recordedModel.trim())) prediction.model_version = ''
  const data = source.data ?? source.thumbnail
  if ((!data || typeof data !== 'string') && !prediction) return null
  const rawProvenance = source.provenance && typeof source.provenance === 'object' ? source.provenance as Record<string, unknown> : null
  const provenance: RequestProvenance | undefined = rawProvenance ? {
    requestedAt: typeof rawProvenance.requestedAt === 'string' ? rawProvenance.requestedAt : '',
    resultCreatedAt: typeof rawProvenance.resultCreatedAt === 'string' ? rawProvenance.resultCreatedAt : '',
    cacheStatus: rawProvenance.cacheStatus === 'hit' || rawProvenance.cacheStatus === 'miss' ? rawProvenance.cacheStatus : 'unknown',
    serviceRevision: typeof rawProvenance.serviceRevision === 'string' ? rawProvenance.serviceRevision : '',
    weightsSha256: typeof rawProvenance.weightsSha256 === 'string' ? rawProvenance.weightsSha256 : ''
  } : undefined
  const id = String(source.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  return {
    id,
    data: typeof data === 'string' ? data : '',
    duration: Number(source.duration ?? source.processingTime ?? 0) || 0,
    timestamp: String(source.timestamp ?? prediction?.timestamp ?? ''),
    favorite: Boolean(source.favorite) || ((legacy || source.favorite == null) && favoriteIds.has(id)),
    prediction,
    heatmap: String(source.heatmap ?? source.heatmapThumbnail ?? ''),
    provenance
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
  storageError.value = false
  const { records, legacy } = loadHistory()
  const favoriteIds = loadFavoriteIds()
  history.value = records
    .map((record) => normalizeRecord(record, favoriteIds, legacy))
    .filter((record): record is HistoryRecord => record !== null)
    .slice(0, MAX_HISTORY)
  if (legacy && saveHistory(history.value)) removeLegacyCopies()
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
  heatmap?: string,
  shouldSave: () => boolean = () => true,
  provenance?: RequestProvenance
): Promise<HistoryRecord | null> {
  const [thumb, heatThumb] = await Promise.all([
    compressThumbnail(data),
    heatmap ? compressThumbnail(heatmap, 320) : Promise.resolve('')
  ])
  if (!shouldSave()) return null
  const record: HistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    data: thumb,
    duration,
    timestamp: new Date().toISOString(),
    favorite: false,
    prediction,
    heatmap: heatThumb,
    provenance
  }
  history.value.unshift(record)
  if (history.value.length > MAX_HISTORY) {
    history.value = history.value.slice(0, MAX_HISTORY)
  }
  saveHistory(history.value)
  return record
}

/** 删除指定历史记录 */
function deleteHistory(id: string): boolean {
  history.value = history.value.filter((r) => r.id !== id)
  return saveHistory(history.value)
}

/** 清空全部历史记录 */
function clearAllHistory(): boolean {
  history.value = []
  if (!saveHistory(history.value)) return false
  return removeLegacyCopies()
}

/** 切换收藏状态 */
function toggleFavorite(id: string): boolean {
  const target = history.value.find((r) => r.id === id)
  if (target) {
    target.favorite = !target.favorite
    return saveHistory(history.value)
  }
  return false
}

export function useHistory() {
  return {
    history,
    storageError,
    initHistory,
    saveHistory,
    addHistoryRecord,
    deleteHistory,
    clearAllHistory,
    toggleFavorite
  }
}
