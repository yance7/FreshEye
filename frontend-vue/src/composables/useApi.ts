// 鲜眸 FreshEye · API 调用 composable
// 封装健康检查与 /predict_with_gradcam 推理请求，含 AbortController 超时控制。
import { API_BASE_URL, API_TIMEOUT } from '@/config'
import type { GradCAMResult, PredictionResult, FreshnessLabel } from '@/types'

/** 自定义 API 错误，附带可读的错误码便于上层 i18n 提示 */
export class ApiError extends Error {
  code: 'timeout' | 'network' | 'server' | 'format' | 'size'
  constructor(code: ApiError['code'], message: string) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}

/** 创建一个带超时的 AbortController */
function createTimeoutController(timeout = API_TIMEOUT): {
  controller: AbortController
  timer: number
} {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  return { controller, timer }
}

/** 判断响应是否正常，否则抛出对应 ApiError */
async function handleResponse(res: Response): Promise<any> {
  if (res.status === 413) throw new ApiError('size', '图片过大')
  if (res.status === 415) throw new ApiError('format', '图片格式不支持')
  if (!res.ok) throw new ApiError('server', `AI服务暂时不可用 (${res.status})`)
  const data = await res.json()
  return data
}

/** 健康检查：探测 AI 服务是否在线 */
export function useApi() {
  /** 检查 API 健康状态，返回布尔值 */
  async function checkApiHealth(): Promise<boolean> {
    const { controller, timer } = createTimeoutController(8000)
    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      })
      return res.ok
    } catch {
      return false
    } finally {
      window.clearTimeout(timer)
    }
  }

  /**
   * 调用 /predict_with_gradcam 接口进行鱼眼新鲜度分析
   * @param file 图片文件
   * @param modelVersion 模型版本：'v1' 经典版 / 'v2' 高精度版
   * @returns { prediction, heatmap_image }
   */
  async function callPredictApi(
    file: File,
    modelVersion: 'v1' | 'v2' = 'v2'
  ): Promise<GradCAMResult> {
    const { controller, timer } = createTimeoutController()
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('model_version', modelVersion)

      const res = await fetch(`${API_BASE_URL}/predict_with_gradcam`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      const raw = await handleResponse(res)

      // 适配后端返回结构：prediction 字段 + heatmap_image 字段
      const prediction: PredictionResult = {
        freshness_level: (Number(raw.prediction?.freshness_level ?? raw.freshness_level) || 0) as FreshnessLabel,
        freshness_label: raw.prediction?.freshness_label ?? raw.freshness_label ?? '',
        confidence_score: Number(raw.prediction?.confidence_score ?? raw.confidence_score ?? 0),
        all_probabilities: raw.prediction?.all_probabilities ?? raw.all_probabilities ?? { 0: 0, 1: 0, 2: 0 },
        description: raw.prediction?.description ?? raw.description ?? '',
        model_version: raw.prediction?.model_version ?? modelVersion,
        timestamp: new Date().toISOString()
      }

      let heatmap = raw.heatmap_image ?? raw.heatmap ?? ''
      // 补全 data URI 前缀
      if (heatmap && !heatmap.startsWith('data:')) {
        heatmap = `data:image/png;base64,${heatmap}`
      }

      return { prediction, heatmap_image: heatmap }
    } catch (err) {
      if (err instanceof ApiError) throw err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError('timeout', '请求超时，请重试')
      }
      throw new ApiError('network', '网络错误，请检查连接')
    } finally {
      window.clearTimeout(timer)
    }
  }

  return { checkApiHealth, callPredictApi }
}
