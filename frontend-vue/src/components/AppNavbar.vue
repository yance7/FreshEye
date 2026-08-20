<script setup lang="ts">
// 导航栏：品牌 + 5 个路由链接 + 语言切换 + 移动端汉堡菜单
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/i18n'

const { t, locale, toggleLocale } = useI18n()
const route = useRoute()

const isScrolled = ref(false)
const menuOpen = ref(false)
const toggleBtn = ref<HTMLElement | null>(null)
type FocusTarget = HTMLElement | { $el?: HTMLElement }
const overlayFirstLink = ref<FocusTarget | null>(null)
const lastFocused = ref<HTMLElement | null>(null)
let previousBodyOverflow = ''
let desktopQuery: MediaQueryList | null = null

function focusTarget(target: FocusTarget | null): void {
  const element = target instanceof HTMLElement ? target : target?.$el
  element?.focus()
}

/** 滚动监听：超过 8px 添加 is-scrolled */
function onScroll(): void {
  isScrolled.value = window.scrollY > 8
}

/** 打开/关闭移动端菜单 */
async function toggleMenu(open: boolean, restoreFocus = true): Promise<void> {
  if (open) {
    lastFocused.value = document.activeElement as HTMLElement | null
    previousBodyOverflow = document.body.style.overflow
  }
  menuOpen.value = open
  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    focusTarget(overlayFirstLink.value)
  } else {
    document.body.style.overflow = previousBodyOverflow
    const target = restoreFocus ? (lastFocused.value ?? toggleBtn.value) : null
    lastFocused.value = null
    target?.focus()
  }
}

function onDesktopChange(event: MediaQueryListEvent): void {
  if (event.matches && menuOpen.value) void toggleMenu(false, false)
}

function addDesktopListener(): void {
  if (!desktopQuery) return
  if (typeof desktopQuery.addEventListener === 'function') desktopQuery.addEventListener('change', onDesktopChange)
  else desktopQuery.addListener?.(onDesktopChange)
}

function removeDesktopListener(): void {
  if (!desktopQuery) return
  if (typeof desktopQuery.removeEventListener === 'function') desktopQuery.removeEventListener('change', onDesktopChange)
  else desktopQuery.removeListener?.(onDesktopChange)
  desktopQuery = null
}

watch(() => route.fullPath, () => {
  if (menuOpen.value) void toggleMenu(false)
})

/** 遮罩内键盘处理：Escape 关闭，Tab 在菜单内循环 */
function onOverlayKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    toggleMenu(false)
    return
  }
  if (e.key !== 'Tab') return
  const focusable = Array.from(document.querySelectorAll<HTMLElement>('#navOverlay a, #navOverlay button'))
  if (focusable.length === 0) return
  const index = focusable.indexOf(document.activeElement as HTMLElement)
  if (e.shiftKey && index === 0) {
    e.preventDefault()
    focusable[focusable.length - 1].focus()
  } else if (!e.shiftKey && index === focusable.length - 1) {
    e.preventDefault()
    focusable[0].focus()
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  desktopQuery = window.matchMedia('(min-width: 769px)')
  addDesktopListener()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  removeDesktopListener()
  document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <header class="navbar" :class="{ 'is-scrolled': isScrolled }" role="banner">
    <router-link to="/" class="brand" :aria-label="t('nav.brand_aria')">
      <span class="brand-logo" aria-hidden="true"><span class="brand-eye"></span></span>
      <span class="brand-text">
        <span class="brand-title">FreshEye</span>
        <span class="brand-sub">{{ t('nav.brand_subtitle') }}</span>
      </span>
    </router-link>

    <nav class="nav-links" :aria-label="t('nav.aria')">
      <router-link to="/" exact-active-class="is-current">{{ t('nav.home') }}</router-link>
      <router-link to="/guide.html" active-class="is-current">{{ t('nav.guide') }}</router-link>
      <router-link to="/fish.html" active-class="is-current">{{ t('nav.fish') }}</router-link>
      <router-link to="/about.html" active-class="is-current">{{ t('nav.about') }}</router-link>
      <a href="https://github.com/yance7/FreshEye" target="_blank" rel="noopener noreferrer">{{ t('nav.source') }}</a>
      <button
        class="lang-switch"
        type="button"
        :aria-label="locale === 'zh' ? t('nav.switch_to_en') : t('nav.switch_to_zh')"
        :aria-pressed="locale === 'en'"
        :title="locale === 'zh' ? t('nav.switch_to_en') : t('nav.switch_to_zh')"
        @click="toggleLocale"
      >
        <span class="lang-option" :class="{ active: locale === 'zh' }">中</span>
        <span class="lang-divider" aria-hidden="true">/</span>
        <span class="lang-option" :class="{ active: locale === 'en' }">EN</span>
      </button>
    </nav>

    <button
      class="lang-switch mobile-lang-switch"
      type="button"
      :aria-label="locale === 'zh' ? t('nav.switch_to_en') : t('nav.switch_to_zh')"
      :aria-pressed="locale === 'en'"
      :title="locale === 'zh' ? t('nav.switch_to_en') : t('nav.switch_to_zh')"
      @click="toggleLocale"
    >
      <span class="lang-option" :class="{ active: locale === 'zh' }">中</span>
      <span class="lang-divider" aria-hidden="true">/</span>
      <span class="lang-option" :class="{ active: locale === 'en' }">EN</span>
    </button>

    <button
      ref="toggleBtn"
      class="nav-toggle"
      :class="{ 'is-open': menuOpen }"
      type="button"
      :aria-label="menuOpen ? t('nav.menu_close') : t('nav.menu_open')"
      :aria-expanded="menuOpen"
      aria-controls="navOverlay"
      @click="toggleMenu(!menuOpen)"
    >
      <span class="nav-toggle-bar"></span>
      <span class="nav-toggle-bar"></span>
      <span class="nav-toggle-bar"></span>
    </button>
  </header>

  <!-- 移动端全屏导航遮罩 -->
  <div
    v-if="menuOpen"
    id="navOverlay"
    class="nav-overlay"
    role="dialog"
    aria-modal="true"
    :aria-label="t('nav.mobile_aria')"
    @keydown="onOverlayKeydown"
  >
    <nav class="nav-overlay-links" :aria-label="t('nav.mobile_aria')">
      <router-link ref="overlayFirstLink" to="/" exact-active-class="is-current" @click="toggleMenu(false)">{{ t('nav.home') }}</router-link>
      <router-link to="/guide.html" active-class="is-current" @click="toggleMenu(false)">{{ t('nav.guide') }}</router-link>
      <router-link to="/fish.html" active-class="is-current" @click="toggleMenu(false)">{{ t('nav.fish') }}</router-link>
      <router-link to="/about.html" active-class="is-current" @click="toggleMenu(false)">{{ t('nav.about') }}</router-link>
      <a href="https://github.com/yance7/FreshEye" target="_blank" rel="noopener noreferrer" @click="toggleMenu(false)">{{ t('nav.source') }}</a>
      <button class="lang-switch" type="button" :aria-label="locale === 'zh' ? t('nav.switch_to_en') : t('nav.switch_to_zh')" :aria-pressed="locale === 'en'" :title="locale === 'zh' ? t('nav.switch_to_en') : t('nav.switch_to_zh')" @click="toggleLocale">
        <span class="lang-option" :class="{ active: locale === 'zh' }">中</span>
        <span class="lang-divider" aria-hidden="true">/</span>
        <span class="lang-option" :class="{ active: locale === 'en' }">EN</span>
      </button>
    </nav>
  </div>
</template>
