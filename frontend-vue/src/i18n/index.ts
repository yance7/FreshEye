// 鲜眸 FreshEye · 轻量国际化系统（自写，无第三方依赖）
// 通过模块级响应式单例 + provide/inject 提供 t() 翻译函数，语言持久化到 localStorage。
import { ref, computed, type Ref, inject, type App } from 'vue'
import zh from './zh'
import en from './en'
import { LOCALE_KEY } from '@/config'
import type { Locale } from '@/types'

/** 全部语言包映射 */
const messages: Record<Locale, typeof zh> = {
  zh,
  en: en as unknown as typeof zh
}

/** 读取本地存储的初始语言，默认 zh */
function readStoredLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    /* localStorage 不可用时忽略 */
  }
  return 'zh'
}

/** 全局共享的当前语言（模块级单例，所有组件共享同一份状态） */
const locale: Ref<Locale> = ref(readStoredLocale())

/** 当前语言对应的语言包 */
const messagePack = computed(() => messages[locale.value])

/** 设置当前语言并持久化 */
function setLocale(lang: Locale): void {
  locale.value = lang
  try {
    localStorage.setItem(LOCALE_KEY, lang)
  } catch {
    /* 忽略写入失败 */
  }
  // 同步 <html lang> 属性
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }
}

/** 切换中英文 */
function toggleLocale(): void {
  setLocale(locale.value === 'zh' ? 'en' : 'zh')
}

/**
 * 翻译函数：传入点分路径（如 'nav.home'）返回对应文案。
 * 若路径不存在则返回原路径字符串，便于排查缺失项。
 */
function t(key: string): string {
  const parts = key.split('.')
  let cur: unknown = messagePack.value
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  return typeof cur === 'string' ? cur : key
}

/** i18n 上下文：注入给后代组件使用 */
export interface I18nContext {
  locale: Ref<Locale>
  t: (key: string) => string
  setLocale: (lang: Locale) => void
  toggleLocale: () => void
}

export const I18N_KEY = Symbol('fresheye-i18n')

/** 在应用根组件 setup 中调用，向全局注入 i18n 上下文 */
export function provideI18n(app: App): void {
  app.provide(I18N_KEY, { locale, t, setLocale, toggleLocale })
}

/** 在任意组件中获取 i18n 上下文（优先注入，回退到模块单例） */
export function useI18n(): I18nContext {
  const injected = inject<I18nContext>(I18N_KEY, null as unknown as I18nContext)
  if (injected) return injected
  return { locale, t, setLocale, toggleLocale }
}
