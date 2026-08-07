<script setup lang="ts">
// 导航栏：品牌 + 5 个路由链接 + 语言切换 + 移动端汉堡菜单
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from '@/i18n'

const { t, locale, toggleLocale } = useI18n()

const isScrolled = ref(false)
const menuOpen = ref(false)
const toggleBtn = ref<HTMLElement | null>(null)
const overlayFirstLink = ref<HTMLElement | null>(null)
const lastFocused = ref<HTMLElement | null>(null)
let previousBodyOverflow = ''

/** 滚动监听：超过 8px 添加 is-scrolled */
function onScroll(): void {
  isScrolled.value = window.scrollY > 8
}

/** 打开/关闭移动端菜单 */
async function toggleMenu(open: boolean): Promise<void> {
  if (open) {
    lastFocused.value = document.activeElement as HTMLElement | null
    previousBodyOverflow = document.body.style.overflow
  }
  menuOpen.value = open
  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    overlayFirstLink.value?.focus()
  } else {
    document.body.style.overflow = previousBodyOverflow
    const target = lastFocused.value ?? toggleBtn.value
    lastFocused.value = null
    target?.focus()
  }
}

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
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.body.style.overflow = ''
})
</script>

<template>
  <header class="navbar" :class="{ 'is-scrolled': isScrolled }" role="banner">
    <router-link to="/" class="brand" aria-label="FreshEye 首页">
      <span class="brand-logo" aria-hidden="true"><span class="brand-eye"></span></span>
      <span class="brand-text">
        <span class="brand-title">FreshEye</span>
        <span class="brand-sub">鲜眸 · 水产品新鲜度智能评估</span>
      </span>
    </router-link>

    <nav class="nav-links" aria-label="主导航">
      <router-link to="/" exact-active-class="is-current">{{ t('nav.home') }}</router-link>
      <router-link to="/guide" active-class="is-current">{{ t('nav.guide') }}</router-link>
      <router-link to="/fish" active-class="is-current">{{ t('nav.fish') }}</router-link>
      <router-link to="/about" active-class="is-current">{{ t('nav.about') }}</router-link>
      <a href="https://github.com/yance7/FreshEye" target="_blank" rel="noopener noreferrer">{{ t('nav.source') }}</a>
      <button
        class="lang-switch"
        type="button"
        :aria-label="locale === 'zh' ? 'Switch to English' : '切换到中文'"
        @click="toggleLocale"
      >
        {{ t('home.lang_switch') }}
      </button>
    </nav>

    <button
      ref="toggleBtn"
      class="nav-toggle"
      :class="{ 'is-open': menuOpen }"
      type="button"
      :aria-label="menuOpen ? '关闭导航菜单' : '打开导航菜单'"
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
    aria-label="移动端导航"
    @keydown="onOverlayKeydown"
  >
    <nav class="nav-overlay-links" aria-label="移动端导航">
      <router-link ref="overlayFirstLink" to="/" exact-active-class="is-current" @click="toggleMenu(false)">{{ t('nav.home') }}</router-link>
      <router-link to="/guide" active-class="is-current" @click="toggleMenu(false)">{{ t('nav.guide') }}</router-link>
      <router-link to="/fish" active-class="is-current" @click="toggleMenu(false)">{{ t('nav.fish') }}</router-link>
      <router-link to="/about" active-class="is-current" @click="toggleMenu(false)">{{ t('nav.about') }}</router-link>
      <a href="https://github.com/yance7/FreshEye" target="_blank" rel="noopener noreferrer" @click="toggleMenu(false)">{{ t('nav.source') }}</a>
      <button class="lang-switch" type="button" @click="toggleLocale">{{ t('home.lang_switch') }}</button>
    </nav>
  </div>
</template>
