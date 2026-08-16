// 鲜眸 FreshEye · 全局类型定义

/** 新鲜度等级：0=高度新鲜 1=新鲜 2=不新鲜 */
export type FreshnessLabel = 0 | 1 | 2

/** 各等级概率分布 */
export type ProbabilityMap = Record<FreshnessLabel, number>

/** 模型预测结果 */
export interface PredictionResult {
  /** 新鲜度等级（0=高度新鲜，1=新鲜，2=不新鲜） */
  freshness_level: FreshnessLabel
  /** 新鲜度数字标签（后端契约为 0/1/2） */
  freshness_label: FreshnessLabel
  /** 置信度分数（0-1） */
  confidence_score: number
  /** 三分类完整概率分布 */
  all_probabilities: ProbabilityMap
  /** 等级描述文案 */
  description: string
  /** 模型版本（v1 经典版 / v2 高精度版） */
  model_version: string
  /** 分析时间戳（ISO 字符串） */
  timestamp: string
}

/** Grad-CAM 可视化结果 */
export interface GradCAMResult {
  /** Base64 编码的热力图图片（含 data: 前缀或纯 base64） */
  heatmap_image: string
  /** 内嵌的预测结果 */
  prediction: PredictionResult
}

/** 历史记录单条 */
export interface HistoryRecord {
  /** 唯一标识 */
  id: string
  /** 缩略图 data URL */
  data: string
  /** 分析耗时（毫秒） */
  duration: number
  /** 记录创建时间戳（ISO 字符串） */
  timestamp: string
  /** 是否收藏 */
  favorite: boolean
  /** 关联的预测结果 */
  prediction?: PredictionResult
  /** 关联的热力图 */
  heatmap?: string
}

/** Toast 通知类型 */
export type ToastType = 'error' | 'success' | 'info'

/** Toast 通知项 */
export interface ToastItem {
  id: number
  message: string
  type: ToastType
  duration: number
  leaving: boolean
}

/** 支持的语言 */
export type Locale = 'zh' | 'en'
