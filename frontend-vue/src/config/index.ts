// 鲜眸 FreshEye · 前端运行配置
// 修改 API 地址或请求超时只需改这里；注意 index.html 中 CSP 的 connect-src 需与 API_BASE_URL 同步更新。

/** AI 推理服务基础地址 */
export const API_BASE_URL = 'https://andreas777-fresheye.hf.space'

/** 请求超时时间（毫秒） */
export const API_TIMEOUT = 60000

/** 历史记录在 localStorage 中的存储键 */
export const HISTORY_KEY = 'fresheye_history'

/** 旧版纯 HTML 前端使用连字符键名，迁移时只读兼容，新的写入统一使用下划线键名。 */
export const LEGACY_HISTORY_KEYS = ['fresheye-history', 'fish-agent-history'] as const

/** 收藏列表在 localStorage 中的存储键（与历史记录合并存储，保留以兼容旧逻辑） */
export const FAVORITES_KEY = 'fresheye_favorites'
export const LEGACY_FAVORITES_KEYS = ['fresheye-favorites', 'fish-agent-favorites'] as const

/** 历史记录最大条数 */
export const MAX_HISTORY = 50

/** 语言偏好存储键 */
export const LOCALE_KEY = 'fresheye_locale'
export const LEGACY_MODEL_KEY = 'fresheye-model'
export const LEGACY_GUIDE_KEY = 'fresheye-onboarded'
