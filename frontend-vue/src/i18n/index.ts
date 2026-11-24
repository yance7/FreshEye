// 鲜眸 FreshEye · 轻量国际化系统（自写，无第三方依赖）
// 通过模块级响应式单例 + provide/inject 提供 t() 翻译函数，语言持久化到 localStorage。
import { ref, computed, type Ref, inject, type App } from 'vue'
import zh from './zh'
import { LEGACY_LOCALE_KEYS, LOCALE_KEY } from '@/config'
import type { Locale } from '@/types'

type TranslationShape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? TranslationShape<U>[]
    : T extends object
      ? { [K in keyof T]: TranslationShape<T[K]> }
      : T

type MessagePack = TranslationShape<typeof zh>

let englishMessages: MessagePack | null = null
let englishPromise: Promise<MessagePack> | null = null

/** English is loaded only when the saved or requested locale needs it. */
function loadEnglishMessages(): Promise<MessagePack> {
  if (englishMessages) return Promise.resolve(englishMessages)
  if (!englishPromise) {
    englishPromise = import('./en')
      .then(({ default: pack }) => {
        englishMessages = pack
        return pack
      })
      .finally(() => { englishPromise = null })
  }
  return englishPromise
}

/** 读取本地存储的初始语言，默认 zh */
function readStoredLocale(): Locale {
  try {
    for (const key of [LOCALE_KEY, ...LEGACY_LOCALE_KEYS]) {
      const saved = localStorage.getItem(key)
      if (saved === 'zh' || saved === 'en') return saved
    }
  } catch {
    /* localStorage 不可用时忽略 */
  }
  return 'zh'
}

/** 全局共享的当前语言（模块级单例，所有组件共享同一份状态） */
const locale: Ref<Locale> = ref(readStoredLocale())
let requestedLocale: Locale = locale.value
let localeRequestId = 0

/** 当前语言对应的语言包 */
const messagePack = computed(() => locale.value === 'zh' ? zh : englishMessages ?? zh)

function syncDocumentLocale(lang: Locale): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  document.documentElement.dir = 'ltr'
}

function persistLocale(lang: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, lang)
  } catch {
    /* 忽略写入失败 */
  }
  syncDocumentLocale(lang)
}

/** 在首次挂载前加载本地保存的语言，避免英文偏好短暂显示中文或缺失键名。 */
export async function prepareLocale(): Promise<void> {
  if (locale.value === 'en') {
    try {
      await loadEnglishMessages()
    } catch {
      locale.value = 'zh'
      requestedLocale = 'zh'
    }
  }
  persistLocale(locale.value)
}

/** 设置当前语言并持久化；语言包加载失败时保留当前可用语言。 */
async function setLocale(lang: Locale): Promise<void> {
  requestedLocale = lang
  const requestId = ++localeRequestId
  if (lang === 'en') {
    try {
      await loadEnglishMessages()
    } catch {
      if (requestId === localeRequestId) requestedLocale = locale.value
      return
    }
  }
  if (requestId !== localeRequestId) return
  locale.value = lang
  persistLocale(lang)
}

/** 切换中英文 */
function toggleLocale(): Promise<void> {
  return setLocale(requestedLocale === 'zh' ? 'en' : 'zh')
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

/**
 * 原始消息函数：返回任意类型的语言包值（字符串、数组、对象等）。
 * 用于访问 steps、faqs、species 等数组结构数据。
 */
function tm<T = unknown>(key: string): T {
  const parts = key.split('.')
  let cur: unknown = messagePack.value
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part]
    } else {
      return [] as unknown as T
    }
  }
  return cur as T
}

/** i18n 上下文：注入给后代组件使用 */
export interface I18nContext {
  locale: Ref<Locale>
  t: (key: string) => string
  tm: <T = unknown>(key: string) => T
  setLocale: (lang: Locale) => Promise<void>
  toggleLocale: () => Promise<void>
}

export const I18N_KEY = Symbol('fresheye-i18n')

/** 在应用根组件 setup 中调用，向全局注入 i18n 上下文 */
export function provideI18n(app: App): void {
  app.provide(I18N_KEY, { locale, t, tm, setLocale, toggleLocale })
}

/** 在任意组件中获取 i18n 上下文（优先注入，回退到模块单例） */
export function useI18n(): I18nContext {
  const injected = inject<I18nContext>(I18N_KEY, null as unknown as I18nContext)
  if (injected) return injected
  return { locale, t, tm, setLocale, toggleLocale }
}
