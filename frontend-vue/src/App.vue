<script setup lang="ts">
// 鲜眸 FreshEye · 根组件
// 深海背景 + 导航栏 + 路由出口（过渡动画）+ 页脚 + Toast + 滚动进度条 + 回到顶部
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DeepBackground from '@/components/DeepBackground.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useI18n } from '@/i18n'
import { useMotionPreference } from '@/composables/useMotionPreference'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { reduceMotion } = useMotionPreference()
const languageAnnouncement = ref('')

const scrollProgress = ref(0)
const showBackTop = ref(false)
const progressEl = ref<HTMLElement | null>(null)
let revealObserver: IntersectionObserver | null = null
let revealMutations: MutationObserver | null = null
let removeAfterEach: (() => void) | null = null
let popstateNavigation = false
let revealReady = false

function syncDocumentMetadata(): void {
  if (typeof document === 'undefined') return
  const key = String(route.meta.metaKey ?? 'home')
  const title = t(`meta.${key}.title`)
  const description = t(`meta.${key}.description`)
  document.title = title
  document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
  const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (descriptionMeta) descriptionMeta.content = description
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    const meta = document.querySelector<HTMLMetaElement>(selector)
    if (meta) meta.content = title
  }
  for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    const meta = document.querySelector<HTMLMetaElement>(selector)
    if (meta) meta.content = description
  }
}

watch([locale, () => route.meta.metaKey], ([nextLocale], [previousLocale]) => {
  syncDocumentMetadata()
  if (previousLocale && nextLocale !== previousLocale) languageAnnouncement.value = t('common.language_changed')
}, { immediate: true })

/** 滚动监听：更新进度条与回到顶部按钮可见性 */
function onScroll(): void {
  const doc = document.documentElement
  const scrollTop = window.scrollY || doc.scrollTop
  const max = doc.scrollHeight - window.innerHeight
  scrollProgress.value = max > 0 ? Math.min(1, scrollTop / max) : 0
  if (progressEl.value) {
    progressEl.value.style.transform = `scaleX(${scrollProgress.value})`
  }
  showBackTop.value = scrollTop > window.innerHeight * 0.6
}

/** 回到顶部 */
function backToTop(): void {
  window.scrollTo({ top: 0, behavior: reduceMotion.value ? 'auto' : 'smooth' })
}

/** 只观察异步或路由内容新增的 reveal 节点，避免无关 DOM 变化触发全页扫描。 */
function observeTree(root: ParentNode): void {
  const nodes: HTMLElement[] = []
  if (root instanceof HTMLElement && root.matches('.reveal:not(.revealed)')) nodes.push(root)
  nodes.push(...Array.from(root.querySelectorAll<HTMLElement>('.reveal:not(.revealed)')))
  if (!revealObserver) {
    nodes.forEach((node) => node.classList.add('revealed'))
    return
  }
  nodes.forEach((node) => revealObserver?.observe(node))
}

function createRevealObserver(): void {
  if (revealObserver || reduceMotion.value || !('IntersectionObserver' in window)) return
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
        revealObserver?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
}

function syncRevealObserver(): void {
  if (!revealReady) return
  if (reduceMotion.value) {
    revealObserver?.disconnect()
    revealObserver = null
  } else {
    createRevealObserver()
  }
  observeTree(document)
}

function onPopState(): void {
  popstateNavigation = true
}

function focusMainAfterRoute(): void {
  const wasPopstate = popstateNavigation
  popstateNavigation = false
  if (wasPopstate) return
  void nextTick(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
  })
}

watch(reduceMotion, syncRevealObserver)

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  revealReady = true
  syncRevealObserver()
  revealMutations = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) observeTree(node)
      })
    })
  })
  revealMutations.observe(document.body, { childList: true, subtree: true })

  window.addEventListener('popstate', onPopState)
  removeAfterEach = router.afterEach((_to, _from, failure) => {
    if (!failure) focusMainAfterRoute()
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('popstate', onPopState)
  removeAfterEach?.()
  removeAfterEach = null
  revealReady = false
  revealObserver?.disconnect()
  revealMutations?.disconnect()
  revealObserver = null
  revealMutations = null
})
</script>

<template>
  <a href="#main-content" class="skip-link">{{ t('common.skip') }}</a>

  <!-- 深海动态背景层 -->
  <DeepBackground />

  <!-- 导航栏（含语言切换） -->
  <AppNavbar />

  <!-- 主内容区 -->
  <main id="main-content" tabindex="-1">
    <router-view v-slot="{ Component }">
      <transition name="route-fade">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>

  <div class="sr-only" aria-live="polite" aria-atomic="true">{{ languageAnnouncement }}</div>

  <!-- 页脚 -->
  <AppFooter />

  <!-- Toast 通知容器 -->
  <ToastContainer />

  <!-- 滚动进度条 -->
  <div ref="progressEl" class="scroll-progress" aria-hidden="true"></div>

  <!-- 回到顶部按钮 -->
  <button
    class="back-to-top"
    :class="{ 'is-visible': showBackTop }"
    type="button"
    :aria-label="t('common.back_top')"
    @click="backToTop"
  >
    ↑
  </button>
</template>
