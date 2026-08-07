// 鲜眸 FreshEye · 历史记录 composable
// localStorage 持久化，最多 50 条，缩略图自动压缩。
import { ref } from 'vue'
import { HISTORY_KEY, MAX_HISTORY } from '@/config'
import type { HistoryRecord, PredictionResult } from '@/types'

/** 全局共享的历史记录列表 */
const history = ref<HistoryRecord[]>([])

/** 从 localStorage 读取历史记录 */
function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 写入 localStorage */
function saveHistory(list: HistoryRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    /* 存储满或不可用时忽略 */
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
  history.value = loadHistory()
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
  const thumb = await compressThumbnail(data)
  const record: HistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    data: thumb,
    duration,
    timestamp: new Date().toISOString(),
    favorite: false,
    prediction,
    heatmap
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
