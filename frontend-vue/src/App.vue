<script setup lang="ts">
// 鲜眸 FreshEye · 根组件
// 深海背景 + 导航栏 + 路由出口（过渡动画）+ 页脚 + Toast + 滚动进度条 + 回到顶部
import { ref, onMounted, onBeforeUnmount } from 'vue'
import DeepBackground from '@/components/DeepBackground.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const scrollProgress = ref(0)
const showBackTop = ref(false)
const progressEl = ref<HTMLElement | null>(null)
let revealObserver: IntersectionObserver | null = null
let revealMutations: MutationObserver | null = null

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
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
}

/** 为路由懒加载后的 .reveal 节点补上原版 initReveal 行为。 */
function observeRevealNodes(): void {
  const nodes = document.querySelectorAll<HTMLElement>('.reveal:not(.revealed)')
  if (!revealObserver) {
    nodes.forEach((node) => node.classList.add('revealed'))
    return
  }
  nodes.forEach((node) => revealObserver?.observe(node))
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          revealObserver?.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
  }
  observeRevealNodes()
  revealMutations = new MutationObserver(observeRevealNodes)
  revealMutations.observe(document.body, { childList: true, subtree: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
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
  <main id="main-content">
    <router-view v-slot="{ Component }">
      <transition name="route-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>

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
