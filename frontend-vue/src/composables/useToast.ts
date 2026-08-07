// 鲜眸 FreshEye · Toast 通知 composable
// 模块级响应式单例：所有组件共享同一份 Toast 列表。
import { ref } from 'vue'
import type { ToastItem, ToastType } from '@/types'

/** 全局共享的 Toast 列表 */
const toasts = ref<ToastItem[]>([])
let seed = 0

/** 移除指定 Toast（带离场动画后再删除） */
function removeToast(id: number): void {
  const target = toasts.value.find((t) => t.id === id)
  if (!target) return
  target.leaving = true
  // 等待离场动画结束后真正移除
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 300)
}

/**
 * 展示一条 Toast 通知
 * @param message 文案
 * @param type 类型：error / success / info
 * @param duration 持续时间（毫秒），默认 3000
 */
function showToast(message: string, type: ToastType = 'error', duration = 3000): void {
  const id = ++seed
  toasts.value.push({ id, message, type, duration, leaving: false })
  if (duration > 0) {
    window.setTimeout(() => removeToast(id), duration)
  }
}

/** 便捷方法 */
const toast = {
  error: (msg: string, duration = 3000) => showToast(msg, 'error', duration),
  success: (msg: string, duration = 3000) => showToast(msg, 'success', duration),
  info: (msg: string, duration = 3000) => showToast(msg, 'info', duration)
}

export function useToast() {
  return { toasts, showToast, removeToast, toast }
}
